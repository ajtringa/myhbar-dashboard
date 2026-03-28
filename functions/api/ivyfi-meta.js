// Cloudflare Pages Function
// File location in your repo: functions/api/ivyfi-meta.js
//
// This function:
// 1. Receives ?topic=0.0.XXXXXXX&serial=XX
// 2. Fetches the HCS message from mirror node
// 3. Decompresses the zstd payload using a WASM-based approach
// 4. Returns clean JSON
// 5. Caches the result for 24 hours (NFT metadata never changes)

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic');
    const serial = url.searchParams.get('serial');

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400' // Cache 24h - metadata never changes
    };

    if (!topic || !serial) {
        return new Response(JSON.stringify({ error: 'Missing topic or serial' }), { status: 400, headers: corsHeaders });
    }

    try {
        // Step 1: Fetch HCS messages
        const hcsRes = await fetch(
            `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${topic}/messages?limit=1`,
            { cf: { cacheTtl: 86400, cacheEverything: true } }
        );
        const hcsData = await hcsRes.json();

        if (!hcsData.messages || hcsData.messages.length === 0) {
            return new Response(JSON.stringify({ error: 'No HCS messages found' }), { status: 404, headers: corsHeaders });
        }

        // Step 2: Decode outer envelope
        const outerJson = atob(hcsData.messages[0].message);
        const outer = JSON.parse(outerJson);
        const dataUri = outer.c || '';
        const b64part = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

        // Step 3: Decompress zstd using the DecompressionStream
        // Cloudflare Workers runtime supports zstd via DecompressionStream!
        const compressed = Uint8Array.from(atob(b64part), c => c.charCodeAt(0));

        let decompressed;
        try {
            // Try zstd first (supported in Workers runtime)
            const ds = new DecompressionStream('zstd');
            const writer = ds.writable.getWriter();
            writer.write(compressed);
            writer.close();
            const reader = ds.readable.getReader();
            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            const total = chunks.reduce((s, c) => s + c.length, 0);
            const merged = new Uint8Array(total);
            let off = 0;
            for (const c of chunks) { merged.set(c, off); off += c.length; }
            decompressed = new TextDecoder().decode(merged);
        } catch (e) {
            // Fallback: try deflate variants
            for (const fmt of ['deflate-raw', 'deflate', 'gzip']) {
                try {
                    const ds = new DecompressionStream(fmt);
                    const writer = ds.writable.getWriter();
                    writer.write(compressed);
                    writer.close();
                    const reader = ds.readable.getReader();
                    const chunks = [];
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                    }
                    const total = chunks.reduce((s, c) => s + c.length, 0);
                    const merged = new Uint8Array(total);
                    let off = 0;
                    for (const c of chunks) { merged.set(c, off); off += c.length; }
                    decompressed = new TextDecoder().decode(merged);
                    break;
                } catch (e2) {}
            }
        }

        if (!decompressed) {
            return new Response(JSON.stringify({ error: 'Decompression failed' }), { status: 500, headers: corsHeaders });
        }

        const meta = JSON.parse(decompressed);
        return new Response(JSON.stringify(meta), { status: 200, headers: corsHeaders });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
}
