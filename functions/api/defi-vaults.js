export async function onRequestGet(context) {
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'MyHbar.io-Dashboard/1.0'
  };

  try {
    const vaultsRes = await fetch('https://bonzo.finance', { headers });
    const body = await vaultsRes.text();
    return new Response(body, {
      status: vaultsRes.status,
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
