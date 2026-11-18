export async function onRequestGet(context) {
  const kv = context.env.MYHBAR_KV;
  const expectedPin = (context.env.DASHBOARD_PIN || '').trim();
  const authHeader = (context.request.headers.get('Authorization') || '').replace('Bearer ', '').trim();

  if (expectedPin && authHeader !== expectedPin) {
    return new Response(JSON.stringify({ ok: false, unauthorized: true }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!kv) {
    return new Response(JSON.stringify({ ok: false, reason: 'KV not bound' }), { status: 200 });
  }

  const raw = await kv.get('dashboard_state');
  return new Response(raw || JSON.stringify({ ok: true, empty: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export async function onRequestPost(context) {
  const kv = context.env.MYHBAR_KV;
  const expectedPin = (context.env.DASHBOARD_PIN || '').trim();
  const authHeader = (context.request.headers.get('Authorization') || '').replace('Bearer ', '').trim();

  if (expectedPin && authHeader !== expectedPin) {
    return new Response(JSON.stringify({ ok: false, unauthorized: true }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!kv) return new Response(JSON.stringify({ ok: false }), { status: 200 });

  const body = await context.request.json();
  const existing = JSON.parse((await kv.get('dashboard_state')) || '{}');

  if (Array.isArray(body.wallets)) {
    const prevMap = new Map((existing.wallets || []).map(w => [w.id, w]));
    existing.wallets = body.wallets.map(w => ({ ...(prevMap.get(w.id) || {}), ...w }));
  }
  if (Array.isArray(body.fiscalLedger) && body.fiscalLedger.length >= (existing.fiscalLedger || []).length) {
    existing.fiscalLedger = body.fiscalLedger;
  }
  if (Array.isArray(body.costBasis) && body.costBasis.length >= (existing.costBasis || []).length) {
    existing.costBasis = body.costBasis;
  }
  if (Array.isArray(body.addressBook) && body.addressBook.length >= (existing.addressBook || []).length) {
    existing.addressBook = body.addressBook;
  }
  if (Array.isArray(body.notifications)) {
    existing.notifications = body.notifications.slice(0, 40);
  }

  await kv.put('dashboard_state', JSON.stringify(existing));
    if (body.prefs && typeof body.prefs === 'object') {
    existing.prefs = { ...(existing.prefs || {}), ...body.prefs };
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
