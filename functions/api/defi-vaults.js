export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const userAddr = url.searchParams.get('user') || '';
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://bonzo.finance',
    'Referer': 'https://bonzo.finance/'
  };

  try {
    const vaultsRes = await fetch('https://bonzo.finance', { headers });
    const vaultsText = await vaultsRes.text();
    let vaultsData = {};
    try { vaultsData = JSON.parse(vaultsText); } catch (e) { vaultsData = { vaults: [] }; }

    let userData = null;
    if (userAddr) {
      for (const path of [`/v1/api/users/${userAddr}`, `/v1/api/users/${userAddr}/positions`]) {
        try {
          const uRes = await fetch(`https://bonzo.finance${path}`, { headers });
          if (uRes.ok) {
            const txt = await uRes.text();
            userData = JSON.parse(txt);
            break;
          }
        } catch (e) {}
      }
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
    return new Response(JSON.stringify({ vaults: [], user: null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

