// Cloudflare Pages Function
// Location in repo: functions/api/ivyfi-meta.js
//
// Fetches HCS metadata for an IvyFi Stake Receipt NFT and decompresses zstd.
// Uses fzstd (pure JS zstd decoder, no WASM needed).

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
        const hcsRes = await fetch(
            `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${topic}/messages?limit=1`
        );
        const hcsData = await hcsRes.json();

        if (!hcsData.messages || hcsData.messages.length === 0) {
            return new Response(JSON.stringify({ error: 'No HCS messages' }), { status: 404, headers });
        }

        const outer = JSON.parse(atob(hcsData.messages[0].message));
        const dataUri = outer.c || '';
        const b64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

        const binaryStr = atob(b64);
        const compressed = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            compressed[i] = binaryStr.charCodeAt(i);
        }

        // fzstd decompress (pure JS, works in Workers runtime)
        const decompressed = decompress(compressed);
        const jsonStr = new TextDecoder().decode(decompressed);
        const meta = JSON.parse(jsonStr);

        return new Response(JSON.stringify(meta), { status: 200, headers });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
}
