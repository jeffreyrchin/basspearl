import crypto from 'node:crypto';

// Base64Url helper for JWT signature
function base64url(str: string | Buffer) {
    const buf = typeof str === 'string' ? Buffer.from(str) : str;
    return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Generate Google Sheets OAuth2 access token using Service Account JSON
async function getGoogleSheetsAccessToken(serviceAccountJson: string): Promise<string> {
    const creds = JSON.parse(serviceAccountJson);
    
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
        iss: creds.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
    };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedClaim = base64url(JSON.stringify(claim));
    const signatureInput = `${encodedHeader}.${encodedClaim}`;

    // Sign JWT using node:crypto module (supported in Cloudflare V8 runtime)
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
        throw new Error('Failed to fetch Google API token: ' + await res.text());
    }

    const data = await res.json() as { access_token: string };
    return data.access_token;
}

// Main Request Handler
export async function onRequestPost(context: any) {
    const { request, env } = context;

    try {
        // 1. Verify Configuration variables are set in Cloudflare
        const serviceAccountJson = env.GOOGLE_SERVICE_ACCOUNT;
        const spreadsheetId = env.FEEDBACK_SPREADSHEET_ID;

        if (!serviceAccountJson || !spreadsheetId) {
            console.error('Missing Google Service Account or Spreadsheet ID configuration.');
            return new Response(
                JSON.stringify({
                    error: 'Feedback server is not fully configured. GOOGLE_SERVICE_ACCOUNT or FEEDBACK_SPREADSHEET_ID is missing in environmental variables.'
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // 2. Parse payload from request body
        const payload = await request.json().catch(() => null);
        if (!payload || !payload.message) {
            return new Response(
                JSON.stringify({ error: 'Invalid payload or missing message field.' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const {
            type = 'other',
            email = 'N/A',
            message,
            userId = 'guest',
            userAgent = 'N/A',
            screenSize = 'N/A',
            timestamp = new Date().toISOString()
        } = payload;

        // 3. Authenticate with Google API
        const accessToken = await getGoogleSheetsAccessToken(serviceAccountJson);

        // 4. Send Append request to Google Sheets
        // We append to Sheet1 column range A to G
        const range = 'Sheet1!A:G';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

        const appendBody = {
            values: [
                [
                    timestamp,
                    type.toUpperCase(),
                    email,
                    message,
                    userId,
                    screenSize,
                    userAgent
                ]
            ]
        };

        const appendResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appendBody)
        });

        if (!appendResponse.ok) {
            const errorText = await appendResponse.text();
            console.error('Google Sheets API append failed:', errorText);
            throw new Error(`Google Sheets API write failed: ${appendResponse.statusText}`);
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Feedback submitted successfully.' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error: any) {
        console.error('Feedback Server Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
