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
        // REVERTED: Back to your exact original logic! 
        // Just grabbing the newest message on the topic instead of looking for message #53
        const mirrorNodeUrl = `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${topic}/messages?limit=1`;
        
        const hcsRes = await fetch(mirrorNodeUrl);
        
        if (!hcsRes.ok) {
            return new Response(JSON.stringify({ error: `Mirror node error: ${hcsRes.status}` }), { status: 500, headers });
        }

        const hcsData = await hcsRes.json();
        
        if (!hcsData.messages || hcsData.messages.length === 0) {
            return new Response(JSON.stringify({ error: `No HCS messages found for topic ${topic}` }), { status: 404, headers });
        }

        // Decode the base64 message from Hedera
        const outer = JSON.parse(atob(hcsData.messages[0].message));
        
        // Extract the compressed data URI
        const dataUri = outer.c || '';
        const b64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

        // Convert the base64 string into a raw binary format
        const binaryStr = atob(b64);
        const compressed = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            compressed[i] = binaryStr.charCodeAt(i);
        }

        // Decompress using the pure JS tool (No WASM errors!)
        const decompressed = decompress(compressed);
        
        // Convert the decompressed binary back into readable text (JSON)
        const jsonStr = new TextDecoder().decode(decompressed);
        const meta = JSON.parse(jsonStr);

        return new Response(JSON.stringify(meta), { status: 200, headers });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
}
