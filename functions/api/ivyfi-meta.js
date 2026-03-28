// functions/api/ivyfi-meta.js

// 1. Import the pure JavaScript decompressor we told Cloudflare to download
import { decompress } from 'fzstd';

export async function onRequest(context) {
    // 2. Grab the topic and serial from the URL (e.g., ?topic=0.0.x&serial=y)
    const url = new URL(context.request.url);
    const topic = url.searchParams.get('topic');
    const serial = url.searchParams.get('serial');

    // Setup headers so your website can read the response
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400'
    };

    if (!topic || !serial) {
        return new Response(JSON.stringify({ error: 'Missing topic or serial' }), { status: 400, headers });
    }

    try {
        // 3. Fetch the specific message from the Hedera Mirror Node
        const hcsRes = await fetch(
            `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${topic}/messages?limit=1&reqType=consensus&reqSerialNum=${serial}`
        );
        const hcsData = await hcsRes.json();
        
        if (!hcsData.messages || hcsData.messages.length === 0) {
            return new Response(JSON.stringify({ error: 'No HCS messages found' }), { status: 404, headers });
        }

        // 4. Decode the base64 message from Hedera
        const outer = JSON.parse(atob(hcsData.messages[0].message));
        
        // Hashinals keep data in the "c" property (compressed data URI)
        const dataUri = outer.c || '';
        const b64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

        // Convert the base64 string into a raw binary format
        const binaryStr = atob(b64);
        const compressed = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            compressed[i] = binaryStr.charCodeAt(i);
        }

        // 5. Decompress it using our pure JavaScript tool! (NO WASM ERRORS)
        const decompressed = decompress(compressed);
        
        // 6. Convert the decompressed binary back into readable text (JSON)
        const jsonStr = new TextDecoder().decode(decompressed);
        const meta = JSON.parse(jsonStr);

        // Send the final JSON metadata back to your website
        return new Response(JSON.stringify(meta), { status: 200, headers });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
}
