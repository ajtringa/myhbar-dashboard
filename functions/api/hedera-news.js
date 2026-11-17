export async function onRequestGet() {
  const statusUrl = 'https://status.' + 'hedera' + '.com/api/v2/summary.json';
  const blogUrl = 'https://' + 'hedera' + '.com/blog/feed';
  const hbarFdnUrl = 'https://hbarfoundation.' + 'org/blog/rss.xml';

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
    { source: 'HBAR Foundation', tag: 'ECOSYSTEM', url: hbarFdnUrl }
  ];

  await Promise.all(feeds.map(async (f) => {
    try {
      const res = await fetch(f.url, { headers: { 'User-Agent': 'MyHbar.io-News/1.0', 'Accept': 'application/rss+xml, application/xml, text/xml' } });
      if (!res.ok) return;
      const xml = await res.text();
      const blocks = xml.split('<item>').slice(1, 12);
      for (const b of blocks) {
        const titleMatch = b.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = b.match(/<link>([\s\S]*?)<\/link>/);
        const dateMatch = b.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const title = stripHtml(titleMatch ? titleMatch.at(1) : '');
        const link = stripHtml(linkMatch ? linkMatch.at(1) : '');
        const pubDate = stripHtml(dateMatch ? dateMatch.at(1) : '');
        if (!title || 25 > title.length) continue;
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
      'Cache-Control': 'public, max-age=300'
    }
  });
}
