export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const userAddr = url.searchParams.get('user') || '';
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'MyHbar.io-Dashboard/1.0'
  };

  try {
    const vaultsRes = await fetch('https://bonzo.finance', { headers });
    const vaultsText = await vaultsRes.text();
    let vaultsData = {};
    try { vaultsData = JSON.parse(vaultsText); } catch (e) { vaultsData = { raw: vaultsText }; }

    let userData = null;
    if (userAddr) {
      try {
        const userRes = await fetch(`https://bonzo.finance{encodeURIComponent(userAddr)}`, { headers });
        if (userRes.ok) {
          userData = await userRes.json();
        }
      } catch (e) {}
    }

    const payload = Array.isArray(vaultsData)
      ? { vaults: vaultsData, user: userData }
      : { ...vaultsData, user: userData };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ vaults: [], user: null, error: String(err) }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
