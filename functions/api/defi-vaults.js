export async function onRequestGet() {
  try {
    const res = await fetch('https://mainnet-single-asset.bonzo.finance/v1/api/vaults', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MyHbar.io-Dashboard/1.0'
      }
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch vaults' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
