export async function onRequestGet() {
  const endpoints = [
    'https://saucerswap.finance',
    'https://saucerswap.finance'
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MyHbar.io-Dashboard/1.0'
        }
      });
      if (res.ok) {
        const body = await res.text();
        return new Response(body, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60'
          }
        });
      }
    } catch (e) {}
  }

  return new Response(JSON.stringify({ error: 'SaucerSwap vaults unavailable' }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' }
  });
}
