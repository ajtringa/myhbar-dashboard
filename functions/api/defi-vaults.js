export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const userAddr = url.searchParams.get('user') || '';
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'MyHbar.io-Dashboard/1.0'
  };

  try {
    const requests = [
      fetch('https://bonzo.finance', { headers })
    ];

    if (userAddr) {
      requests.push(
        fetch(`https://bonzo.finance{userAddr}`, { headers })
      );
    }

    const [vaultsRes, userRes] = await Promise.all(requests);
    const vaultsData = vaultsRes.ok ? await vaultsRes.json() : { vaults: [] };
    const userData = userRes && userRes.ok ? await userRes.json() : null;

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
    return new Response(JSON.stringify({ error: 'Failed to fetch Bonzo data' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

