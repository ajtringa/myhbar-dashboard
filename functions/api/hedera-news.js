export async function onRequestGet() {
  const statusUrl = 'https://status.' + 'hedera' + '.com/api/v2/summary.json';
  const blogUrl = 'https://' + 'hedera' + '.com/blog/feed';
  const ctUrl = 'https://cointelegraph.' + 'com/rss/tag/hedera';
  const gNewsUrl = 'https://news.' + 'google' + '.com/rss/search?q=Hedera+HBAR&hl=en-US&gl=US&ceid=US:en';

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
  const seenTitles = new Set();
  const minTs = Date.now() - (180 * 86400 * 1000);
  const feeds = [
    { source: 'Hedera Official', tag: 'NETWORK', url: blogUrl },
    { source: 'CoinTelegraph', tag: 'CATALYST', url: ctUrl },
    { source: 'Market Catalyst', tag: 'CATALYST', url: gNewsUrl }
  ];

  const catalystWords = [
    'etf', 'blackrock', 'coinbase', 'institutional', 'surge', 'rally', 'soar',
    'breakout', 'listing', 'sec', 'canary', 'grayscale', 'partnership', 'council',
    'billion', 'treasury', 'stablecoin', 'mainnet', 'upgrade', 'tokenization',
    'integration', 'launch', 'enterprise', 'defi', 'hedera foundation', 'hedera', 'SaucerSwap', 'Bonzo Finance', 'DEX',
    'Hbar Bull','Hbar', 'exchanges', 'exchange', 'token', 'retail', 'rwa', 'hashpack'
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
        let title = stripHtml(titleMatch ? titleMatch.at(1) : '');
        const link = stripHtml(linkMatch ? linkMatch.at(1) : '');
        const pubDate = stripHtml(dateMatch ? dateMatch.at(1) : '');

        if (f.tag === 'CATALYST') title = title.replace(/\s+-\s+[^-]+$/, '').trim();
        const lower = title.toLowerCase();
        if (!title || 25 > title.length || lower.includes('price prediction') || lower.includes('will hbar')) continue;
        if (f.tag === 'CATALYST' && !catalystWords.some(w => lower.includes(w))) continue;

        const ts = pubDate ? Date.parse(pubDate) || Date.now() : Date.now();
        if (minTs > ts) continue;

        const key = lower.slice(0, 42);
        if (seenTitles.has(key)) continue;
        seenTitles.add(key);

        items.push({
          source: f.source,
          tag: f.tag,
          title: title.length > 180 ? title.slice(0, 177) + '...' : title,
          link,
          ts
        });
      }
    } catch (e) {}
  }));

  items.sort((a, b) => b.ts - a.ts);

  return new Response(JSON.stringify({ status: statusSummary, items: items.slice(0, 20) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
  });
}
