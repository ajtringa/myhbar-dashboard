export async function onRequestGet() {
  try {
    const res = await fetch('https://bonzo.finance', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MyHbar.io-Dashboard/1.0'
      }
    });
    const body = await res.text();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ vaults: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

