import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'node:crypto';

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

        // 2. Verify Signature
        const hmac = crypto.createHmac('sha256', secret);
        const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
        const signatureBuffer = Buffer.from(signature, 'utf8');

        if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
            return new Response('Invalid signature', { status: 403 });
        }

        // 3. Parse payload
        const payload = await request.json();
        
        // We only care about order_created or subscription_created
        if (payload.meta.event_name !== 'order_created') {
            return new Response('Event ignored', { status: 200 });
        }

        const customData = payload.meta.custom_data;
        const uid = customData?.uid;

        if (!uid) {
            console.error('No UID found in custom_data', customData);
            return new Response('No user ID provided', { status: 400 });
        }

        // 4. Initialize Firebase Admin
        if (!getApps().length) {
            const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
            initializeApp({
                credential: cert(serviceAccount)
            });
        }

        // 5. Update Firestore securely
        const db = getFirestore();
        await db.collection('users').doc(uid).set({ isPro: true }, { merge: true });

        return new Response('Webhook processed successfully', { status: 200 });
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
