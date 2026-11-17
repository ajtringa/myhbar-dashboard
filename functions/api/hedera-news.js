export async function onRequestGet() {
  const feeds = [
    { source: 'Hedera Official', tag: 'NETWORK', url: 'https://hedera.com' },
    { source: '@hedera', tag: 'NETWORK', url: 'https://nitter.net' },
    { source: '@HBAR_foundation', tag: 'ECOSYSTEM', url: 'https://nitter.net' },
    { source: '@SaucerSwapLabs', tag: 'DEFI / LARI', url: 'https://nitter.net' },
    { source: '@Bonzo_Finance', tag: 'DEFI', url: 'https://nitter.net' }
  ];

  const items = [];
  const stripHtml = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

  await Promise.all(feeds.map(async (f) => {
    try {
      const res = await fetch(f.url, { headers: { 'User-Agent': 'MyHbar.io-News/1.0' } });
      if (!res.ok) return;
      const xml = await res.text();
      const blocks = xml.split('<item>').slice(1, 8);
      for (const b of blocks) {
        const title = stripHtml((b.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || b.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
        const link = stripHtml((b.match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
        const pubDate = stripHtml((b.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]);
        if (!title || title.startsWith('RT @') || title.startsWith('@') || 55 > title.length) continue;
        items.push({
          source: f.source,
          tag: f.tag,
          title: title.length > 200 ? title.slice(0, 197) + '...' : title,
          link: link.replace('nitter.net', 'x.com'),
          ts: pubDate ? Date.parse(pubDate) || Date.now() : Date.now()
        });
      }
    } catch (e) {}
  }));

  items.sort((a, b) => b.ts - a.ts);

  return new Response(JSON.stringify({ items: items.slice(0, 25) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=600'
    }
  });
}
