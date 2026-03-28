// functions/api/ivyfi-meta.js
import { decompress } from 'fzstd';

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const topic = url.searchParams.get('topic');
    const serial = url.searchParams.get('serial');

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400'
    };

    if (!topic || !serial) {
        return new Response(JSON.stringify({ error: 'Missing topic or serial' }), { status: 400, headers });
    }

    try {
        // FIXED URL: The correct Hedera query parameter is "sequencenumber"
        const mirrorNodeUrl = `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${topic}/messages?sequencenumber=${serial}`;
        
        const hcsRes = await fetch(mirrorNodeUrl);
        
        // Added error checking to immediately catch Mirror Node URL issues
        if (!hcsRes.ok) {
            return new Response(JSON.stringify({ error: `Mirror node rejected request: ${hcsRes.status}` }), { status: 500, headers });
        }

        const hcsData = await hcsRes.json();
        
        if (!hcsData.messages || hcsData.messages.length === 0) {
            return new Response(JSON.stringify({ error: `No HCS message found for serial ${serial}` }), { status: 404, headers });
        }

        // Decode the base64 message from Hedera
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

        // Decompress using fzstd
        const decompressed = decompress(compressed);
        
        // Convert the decompressed binary back into readable text (JSON)
        const jsonStr = new TextDecoder().decode(decompressed);
        const meta = JSON.parse(jsonStr);

        return new Response(JSON.stringify(meta), { status: 200, headers });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
}
