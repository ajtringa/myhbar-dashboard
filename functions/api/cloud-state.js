export async function onRequestGet(context) {
  const kv = context.env.MYHBAR_KV;
  if (!kv) {
    return new Response(JSON.stringify({ ok: false, reason: 'KV not bound' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const raw = await kv.get('dashboard_state');
  return new Response(raw || JSON.stringify({ ok: true, empty: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

export async function onRequestPost(context) {
  const kv = context.env.MYHBAR_KV;
  if (!kv) return new Response(JSON.stringify({ ok: false }), { status: 200 });

  const body = await context.request.json();
  const existing = JSON.parse((await kv.get('dashboard_state')) || '{}');

  if (Array.isArray(body.wallets)) {
    existing.wallets = body.wallets.map(w => ({ id: w.id, nickname: w.nickname }));
  }
  if (Array.isArray(body.fiscalLedger) && body.fiscalLedger.length > (existing.fiscalLedger || []).length) {
    existing.fiscalLedger = body.fiscalLedger;
  }

  await kv.put('dashboard_state', JSON.stringify(existing));
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
