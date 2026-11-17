export async function onRequestGet() {
  const statusUrl = 'https://status.' + 'hedera' + '.com/api/v2/summary.json';
  const blogUrl = 'https://' + 'hedera' + '.com/blog/feed';
  const gNewsUrl = 'https://news.' + 'google' + '.com/rss/search?q=Hedera+HBAR+when:7d&hl=en-US&gl=US&ceid=US:en';

  const stripHtml = (s) => (s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#8217;/g, "'").replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, ' ').trim();

  let statusSummary = null;
  try {
    const sRes = await fetch(statusUrl, { headers: { 'Accept': 'application/json' } });
    if (sRes.ok) statusSummary = await sRes.json();
  } catch (e) {}

  const items = [];
  const feeds = [
    { source: 'Hedera Official', tag: 'NETWORK', url: blogUrl },
    { source: 'Hedera Ecosystem', tag: 'NEWS', url: gNewsUrl }
  ];

  await Promise.all(feeds.map(async (f) => {
    try {
      const res = await fetch(f.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyHbarBot/1.0)', 'Accept': '*/*' } });
      if (!res.ok) return;
      const xml = await res.text();
      const blocks = xml.includes('<item>') ? xml.split('<item>').slice(1, 15) : xml.split('<entry>').slice(1, 15);
      for (const b of blocks) {
        const titleMatch = b.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const linkMatch = b.match(/<link[^>]*href=["']([^"']+)["']/) || b.match(/<link>([\s\S]*?)<\/link>/);
        const dateMatch = b.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || b.match(/<updated>([\s\S]*?)<\/updated>/);
        const title = stripHtml(titleMatch ? titleMatch.at(1) : '');
        const link = stripHtml(linkMatch ? linkMatch.at(1) : '');
        const pubDate = stripHtml(dateMatch ? dateMatch.at(1) : '');
        if (!title || 20 > title.length) continue;
        items.push({
          source: f.source,
          tag: f.tag,
          title: title.length > 180 ? title.slice(0, 177) + '...' : title,
          link,
          ts: pubDate ? Date.parse(pubDate) || Date.now() : Date.now()
        });
      }
    } catch (e) {}
  }));

  items.sort((a, b) => b.ts - a.ts);

  return new Response(JSON.stringify({ status: statusSummary, items: items.slice(0, 20) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  });
}
