import type { NewsArticle, FullArticle } from '@/types/news';

// Free, no-key RSS→JSON proxy. Cached per-feed to avoid spam.
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';
// Free, no-key HTML proxy for full-article fetch.
const HTML_PROXY = 'https://api.allorigins.win/raw?url=';

interface FeedDef { url: string; source: string; }

const FEEDS: FeedDef[] = [
  { url: 'https://www.reutersagency.com/feed/?best-topics=world&post_type=best', source: 'Reuters' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',                          source: 'BBC' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml',                            source: 'Al Jazeera' },
  { url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',               source: 'UN News' },
  { url: 'https://www.globalsecurity.org/military/world/rss.xml',                source: 'GlobalSecurity' },
  { url: 'https://defence-blog.com/feed/',                                       source: 'Defence Blog' },
  { url: 'https://apnews.com/hub/ap-top-news?format=xml',                        source: 'AP News' },
];

const KEYWORDS = [
  'war','conflict','military','army','navy','air force','missile','drone','strike',
  'troop','soldier','weapon','defense','defence','nato','un ','sanction','treaty',
  'diplomat','embassy','minister','president','government','election','intelligence',
  'spy','espionage','nuclear','cyber','attack','protest','border','geopolit',
  'russia','ukraine','china','iran','israel','gaza','syria','korea','taiwan',
  'crisis','security','airstrike','occupation','rebel','militant','insurgent',
];

const TTL = 5 * 60 * 1000;
interface CacheEntry { ts: number; items: NewsArticle[]; }
const feedCache = new Map<string, CacheEntry>();
let aggCache: CacheEntry | null = null;

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

function extractImage(item: any): string | undefined {
  if (item.thumbnail) return item.thumbnail;
  if (item.enclosure?.link) return item.enclosure.link;
  const m = (item.description || item.content || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : undefined;
}

function relevant(a: NewsArticle): boolean {
  const t = (a.title + ' ' + a.summary).toLowerCase();
  return KEYWORDS.some(k => t.includes(k));
}

async function fetchFeed(def: FeedDef): Promise<NewsArticle[]> {
  const cached = feedCache.get(def.url);
  if (cached && Date.now() - cached.ts < TTL) return cached.items;
  try {
    const res = await fetch(`${RSS2JSON}${encodeURIComponent(def.url)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('bad payload');
    const items: NewsArticle[] = data.items.map((it: any, i: number) => ({
      id: `${def.source}-${it.guid || it.link || i}`,
      title: stripHtml(it.title || 'Untitled'),
      link: it.link || '',
      source: def.source,
      publishedAt: it.pubDate ? Date.parse(it.pubDate) : Date.now(),
      summary: stripHtml(it.description || it.content || '').slice(0, 280),
      image: extractImage(it),
    }));
    feedCache.set(def.url, { ts: Date.now(), items });
    return items;
  } catch (e) {
    console.warn(`[news] feed failed: ${def.source}`, e);
    return cached?.items ?? [];
  }
}

export async function fetchAggregatedNews(force = false): Promise<NewsArticle[]> {
  if (!force && aggCache && Date.now() - aggCache.ts < TTL) return aggCache.items;
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const flat = results.flat();
  const seen = new Set<string>();
  const merged = flat.filter(a => {
    const key = a.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).filter(relevant).sort((a, b) => b.publishedAt - a.publishedAt);
  aggCache = { ts: Date.now(), items: merged };
  return merged;
}

// ---- Full article fetching + sanitization ----

const DROP_TAGS = ['script','style','noscript','iframe','form','svg','aside','nav','header','footer','button','link','meta'];

function sanitizeHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  DROP_TAGS.forEach(tag => doc.querySelectorAll(tag).forEach(n => n.remove()));
  // strip class attribs/ids/event handlers
  doc.querySelectorAll<HTMLElement>('*').forEach(el => {
    [...el.attributes].forEach(a => {
      const n = a.name.toLowerCase();
      if (n.startsWith('on')) el.removeAttribute(a.name);
      else if (['class','id','style','data-src','srcset','sizes'].includes(n)) el.removeAttribute(a.name);
    });
  });
  const article = doc.querySelector('article') || doc.querySelector('main') || doc.body;
  if (!article) return '';
  // Keep only allowed tags
  const allowed = new Set(['ARTICLE','P','H1','H2','H3','H4','IMG','UL','OL','LI','BLOCKQUOTE','STRONG','EM','BR','FIGURE','FIGCAPTION','DIV','SPAN','A']);
  const walk = (root: Element) => {
    [...root.children].forEach(c => {
      if (!allowed.has(c.tagName)) { c.remove(); return; }
      walk(c);
    });
  };
  walk(article);
  return article.innerHTML;
}

export async function fetchFullArticle(url: string): Promise<FullArticle> {
  const res = await fetch(`${HTML_PROXY}${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const title = doc.querySelector('h1')?.textContent?.trim()
    || doc.querySelector('title')?.textContent?.trim()
    || 'Article';
  const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined;
  return { title, html: sanitizeHtml(html), image: ogImg };
}

// ---- Location extraction + geocoding (Nominatim, no key) ----

const PLACES = [
  'Ukraine','Russia','Moscow','Kyiv','Kiev','China','Beijing','Taiwan','Taipei','Japan','Tokyo',
  'United States','Washington','New York','Iran','Tehran','Israel','Tel Aviv','Jerusalem','Gaza',
  'Lebanon','Beirut','Syria','Damascus','Iraq','Baghdad','Turkey','Ankara','Istanbul','India',
  'New Delhi','Pakistan','Islamabad','North Korea','Pyongyang','South Korea','Seoul','Germany',
  'Berlin','France','Paris','United Kingdom','London','Poland','Warsaw','Sudan','Khartoum',
  'Yemen','Sanaa','Saudi Arabia','Riyadh','Egypt','Cairo','Libya','Tripoli','Afghanistan','Kabul',
  'Venezuela','Caracas','Mexico','Brazil','Brasilia','Argentina','Canada','Ottawa','Australia',
  'Spain','Madrid','Italy','Rome','Greece','Athens','Hungary','Romania','Bulgaria','Belarus',
  'Minsk','Georgia','Tbilisi','Armenia','Azerbaijan','Baku','Kazakhstan','NATO','European Union',
  'Crimea','Donetsk','Luhansk','Mariupol','Kharkiv','Odesa','Kherson','West Bank','Rafah','Khan Younis',
];

export function extractLocation(text: string): string | null {
  const lower = text.toLowerCase();
  for (const p of PLACES) {
    const re = new RegExp(`\\b${p.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`);
    if (re.test(lower)) return p;
  }
  return null;
}

export async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}