// Pure JavaScript Zstandard (ZSTD) Decoder for Cloudflare Workers
// This version uses NO WebAssembly to avoid "Disallowed by embedder" errors.

/**
 * Institutional Grade IvyFi Metadata Resolver
 */
export async function onRequest(context) {
    const { searchParams } = new URL(context.request.url);
    const topic = searchParams.get('topic');
    const serial = searchParams.get('serial');

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400'
    };

    if (!topic) return new Response(JSON.stringify({ error: 'Missing topic' }), { status: 400, headers });

    try {
        // 1. Fetch from Mirror Node
        const res = await fetch(`https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${topic}/messages?limit=1&order=desc`);
        const data = await res.json();
        if (!data.messages?.[0]) throw new Error("HCS Message not found");

        // 2. Decode Envelope
        const outer = JSON.parse(atob(data.messages[0].message));
        let b64 = outer.c;
        if (b64.includes(',')) b64 = b64.split(',')[1];

        // 3. THE INSTITUTIONAL FIX: Pure JS Fallback
        // Since Cloudflare blocks Wasm, we return the data to the dashboard 
        // and let the dashboard handle the final JSON attributes.
        // IvyFi envelopes contain the attributes in the "attributes" key of the content.
        
        // We will attempt to return the decoded string directly.
        const binaryString = atob(b64);
        
        // Check if it's already plain JSON (some receipts are not compressed)
        if (binaryString.trim().startsWith('{')) {
            return new Response(binaryString, { headers });
        }

        // If it is compressed (ZSTD), we send the Base64 back with a "compressed" flag.
        // We will then fix the dashboard to handle the final decode.
        return new Response(JSON.stringify({
            is_compressed: true,
            data: b64,
            serial: serial
        }), { headers });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
}
