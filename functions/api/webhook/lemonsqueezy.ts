import crypto from 'node:crypto';

// ── Helpers for Firebase Auth via REST ───────────────────────────────────────
function base64url(str: string | Buffer) {
    const buf = typeof str === 'string' ? Buffer.from(str) : str;
    return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getFirebaseAccessToken(serviceAccountJson: string): Promise<{ token: string, projectId: string }> {
    const creds = JSON.parse(serviceAccountJson);
    
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
        iss: creds.client_email,
        scope: 'https://www.googleapis.com/auth/datastore', // Datastore scope covers Firestore
        aud: 'https://oauth2.googleapis.com/token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
    };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedClaim = base64url(JSON.stringify(claim));
    const signatureInput = `${encodedHeader}.${encodedClaim}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(creds.private_key, 'base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwt = `${signatureInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        }).toString()
    });

    if (!res.ok) {
        throw new Error('Failed to fetch access token: ' + await res.text());
    }

    const data = await res.json() as { access_token: string };
    return { token: data.access_token, projectId: creds.project_id };
}

async function updateFirestoreUser(uid: string, projectId: string, accessToken: string) {
    // We use the updateMask so we only touch isPro and don't overwrite other user fields
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=isPro`;
    
    const payload = {
        name: `projects/${projectId}/databases/(default)/documents/users/${uid}`,
        fields: {
            isPro: { booleanValue: true }
        }
    };

    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error('Failed to update Firestore: ' + await res.text());
    }
}

// ── Webhook Handler ──────────────────────────────────────────────────────────
// This is a Cloudflare Pages Function
export async function onRequestPost(context: any) {
    const { request, env } = context;

    try {
        // 1. Get the raw body for signature verification
        const rawBody = await request.clone().text();
        const signature = request.headers.get('x-signature');
        const secret = env.LEMON_SQUEEZY_WEBHOOK_SECRET;

        if (!signature || !secret) {
            return new Response('Missing signature or secret', { status: 400 });
        }

        // 2. Verify Signature using Node's native crypto
        const hmac = crypto.createHmac('sha256', secret);
        const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
        const signatureBuffer = Buffer.from(signature, 'utf8');

        if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
            return new Response('Invalid signature', { status: 403 });
        }

        // 3. Parse payload
        const payload = await request.json();
        
        // We only care about order_created
        if (payload.meta.event_name !== 'order_created') {
            return new Response('Event ignored', { status: 200 });
        }

        const customData = payload.meta.custom_data;
        const uid = customData?.uid;

        if (!uid) {
            console.error('No UID found in custom_data', customData);
            return new Response('No user ID provided', { status: 400 });
        }

        // 4. Authenticate with Firebase REST API
        if (!env.FIREBASE_SERVICE_ACCOUNT) {
             return new Response('Firebase Service Account missing', { status: 500 });
        }
        
        const { token, projectId } = await getFirebaseAccessToken(env.FIREBASE_SERVICE_ACCOUNT);

        // 5. Update Firestore securely
        await updateFirestoreUser(uid, projectId, token);

        return new Response('Webhook processed successfully', { status: 200 });
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
