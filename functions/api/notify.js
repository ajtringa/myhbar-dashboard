export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const topic = (body.topic || 'myhbar_alerts_0_0_0').trim();
    const title = (body.title || 'MyHbar.io Alert').trim();
    const message = (body.detail || '').trim();
    const priority = body.type === 'out' ? '4' : '3';
    const tags = body.type === 'in' ? 'moneybag,chart_with_upwards_trend' : body.type === 'out' ? 'warning' : 'bell';

    if (!message) {
      return new Response(JSON.stringify({ ok: false }), { status: 400 });
    }

    const ntfyUrl = 'https://' + 'ntfy' + '.sh/' + encodeURIComponent(topic);
    const res = await fetch(ntfyUrl, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': priority,
        'Tags': tags
      },
      body: message
    });

    return new Response(JSON.stringify({ ok: res.ok }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
