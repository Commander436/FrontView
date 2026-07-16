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

// =========================================================
//  FAST ML‑STYLE ARTICLE EXTRACTOR (DENSITY + BOILERPLATE)
// =========================================================

// Tags we never want
const DROP_TAGS = [
  "script","style","noscript","iframe","form","svg","aside","nav",
  "header","footer","button","link","meta","video","audio"
];

// Utility: remove garbage nodes fast
function stripBoilerplate(root: HTMLElement) {
  DROP_TAGS.forEach(tag => {
    root.querySelectorAll(tag).forEach(n => n.remove());
  });

  // Remove elements with no text content
  root.querySelectorAll("*").forEach(el => {
    if (!el.textContent?.trim() && el.tagName !== "IMG") el.remove();
  });
}

// =========================================================
//  TEXT‑DENSITY SCORING (ML‑STYLE HEURISTIC)
// =========================================================
// Score = (#text chars) / (#child nodes + 1)
// Higher score = more likely to be the main article body
// =========================================================

function scoreNode(el: Element): number {
  const text = el.textContent?.trim() || "";
  const chars = text.length;
  const kids = el.children.length;
  return chars / (kids + 1);
}

function findBestContentNode(doc: Document): HTMLElement {
  const candidates = [...doc.querySelectorAll("article, main, section, div")];

  let best: HTMLElement = doc.body;
  let bestScore = 0;

  for (const el of candidates) {
    const s = scoreNode(el);
    if (s > bestScore) {
      bestScore = s;
      best = el as HTMLElement;
    }
  }

  return best;
}

// =========================================================
//  READABLE BLOCK EXTRACTOR
// =========================================================
// Keeps only meaningful blocks: p, h1‑h4, li, img, blockquote
// =========================================================

function extractReadableBlocks(root: HTMLElement): string {
  const blocks = [...root.querySelectorAll("p, h1, h2, h3, h4, li, img, blockquote")];

  return blocks
    .map(b => {
      if (b.tagName === "IMG") {
        const src = (b as HTMLImageElement).src || b.getAttribute("data-src");
        return src ? `<img src="${src}" />` : "";
      }
      return b.outerHTML;
    })
    .join("\n");
}

// =========================================================
//  HEADLINE + SUMMARY + BODY CLASSIFIER
// =========================================================
// Headline = first <h1> or <title>
// Summary = first <p> under headline OR first <p> in article
// Body = remaining blocks
// =========================================================

function classifyContent(doc: Document, blocksHtml: string) {
  const headline =
    doc.querySelector("h1")?.textContent?.trim() ||
    doc.querySelector("title")?.textContent?.trim() ||
    "Article";

  const temp = document.createElement("div");
  temp.innerHTML = blocksHtml;

  const paragraphs = [...temp.querySelectorAll("p")];
  const summary = paragraphs[0]?.textContent?.trim() || "";

  return {
    headline,
    summary,
    bodyHtml: blocksHtml
  };
}

// =========================================================
//  MAIN EXTRACTOR
// =========================================================

export async function fetchFullArticle(url: string): Promise<FullArticle> {
  const res = await fetch(`${HTML_PROXY}${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Step 1: Remove boilerplate
  stripBoilerplate(doc.body);

  // Step 2: Find the most content‑dense node
  const bestNode = findBestContentNode(doc);

  // Step 3: Extract readable blocks
  const blocksHtml = extractReadableBlocks(bestNode);

  // Step 4: Classify headline + summary + body
  const { headline, summary, bodyHtml } = classifyContent(doc, blocksHtml);

  // Step 5: Extract OG image if available
  const ogImg =
    doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
    undefined;

  return {
    title: headline,
    summary,
    html: bodyHtml,
    image: ogImg
  };
}

// =========================================================
//  INTELLIGENT LOCATION EXTRACTOR (ML‑STYLE HEURISTICS)
// =========================================================

// 1. Gazetteer — countries, capitals, conflict zones, major cities.
//    Priority: country=5, region/territory=4, capital/major city=3, other city=2.
const WORLD_PLACES: Array<{ name: string; alt?: string[]; type: string; priority: number }> = [
  // Active conflict / high-signal zones
  { name: 'Ukraine',   type: 'country', priority: 5 },
  { name: 'Russia',    alt: ['russian'], type: 'country', priority: 5 },
  { name: 'Israel',    alt: ['israeli'], type: 'country', priority: 5 },
  { name: 'Gaza',      alt: ['gaza strip'], type: 'region', priority: 5 },
  { name: 'Palestine', alt: ['palestinian','west bank'], type: 'region', priority: 5 },
  { name: 'Lebanon',   alt: ['lebanese'], type: 'country', priority: 5 },
  { name: 'Syria',     alt: ['syrian'], type: 'country', priority: 5 },
  { name: 'Iran',      alt: ['iranian'], type: 'country', priority: 5 },
  { name: 'Iraq',      alt: ['iraqi'], type: 'country', priority: 5 },
  { name: 'Yemen',     alt: ['yemeni','houthi'], type: 'country', priority: 5 },
  { name: 'Sudan',     alt: ['sudanese'], type: 'country', priority: 5 },
  { name: 'Somalia',   type: 'country', priority: 4 },
  { name: 'Ethiopia',  alt: ['tigray'], type: 'country', priority: 4 },
  { name: 'Myanmar',   alt: ['burma'], type: 'country', priority: 4 },
  { name: 'Afghanistan', alt: ['afghan','taliban'], type: 'country', priority: 5 },
  { name: 'Venezuela', type: 'country', priority: 4 },
  { name: 'Haiti',     type: 'country', priority: 4 },
  { name: 'Libya',     type: 'country', priority: 4 },
  { name: 'Mali',      type: 'country', priority: 3 },
  { name: 'Niger',     type: 'country', priority: 3 },
  { name: 'Nigeria',   type: 'country', priority: 4 },
  { name: 'Congo',     alt: ['drc','democratic republic of congo'], type: 'country', priority: 4 },
  { name: 'Taiwan',    alt: ['taiwanese'], type: 'country', priority: 5 },
  { name: 'China',     alt: ['chinese','beijing'], type: 'country', priority: 5 },
  { name: 'Korea',     alt: ['north korea','south korea','dprk','pyongyang','seoul'], type: 'country', priority: 5 },
  { name: 'Japan',     alt: ['japanese','tokyo'], type: 'country', priority: 4 },
  { name: 'India',     alt: ['indian','new delhi'], type: 'country', priority: 4 },
  { name: 'Pakistan',  alt: ['pakistani','islamabad'], type: 'country', priority: 4 },
  { name: 'Kashmir',   type: 'region', priority: 4 },
  { name: 'Turkey',    alt: ['turkish','ankara'], type: 'country', priority: 4 },
  { name: 'Armenia',   type: 'country', priority: 4 },
  { name: 'Azerbaijan', alt: ['nagorno-karabakh','karabakh'], type: 'country', priority: 4 },
  { name: 'Georgia',   alt: ['tbilisi'], type: 'country', priority: 3 },
  // Powers & allies
  { name: 'United States', alt: ['us','usa','america','american','washington','pentagon','white house'], type: 'country', priority: 5 },
  { name: 'United Kingdom', alt: ['uk','britain','british','london'], type: 'country', priority: 4 },
  { name: 'France',    alt: ['french','paris'], type: 'country', priority: 4 },
  { name: 'Germany',   alt: ['german','berlin'], type: 'country', priority: 4 },
  { name: 'Italy',     alt: ['italian','rome'], type: 'country', priority: 4 },
  { name: 'Spain',     alt: ['spanish','madrid'], type: 'country', priority: 4 },
  { name: 'Poland',    alt: ['polish','warsaw'], type: 'country', priority: 4 },
  { name: 'Romania',   alt: ['bucharest'], type: 'country', priority: 3 },
  { name: 'Hungary',   alt: ['budapest'], type: 'country', priority: 3 },
  { name: 'Belarus',   alt: ['minsk'], type: 'country', priority: 4 },
  { name: 'Moldova',   type: 'country', priority: 3 },
  { name: 'Sweden',    type: 'country', priority: 3 },
  { name: 'Finland',   type: 'country', priority: 3 },
  { name: 'Norway',    type: 'country', priority: 3 },
  { name: 'Denmark',   type: 'country', priority: 3 },
  { name: 'Netherlands', alt: ['dutch','amsterdam'], type: 'country', priority: 3 },
  { name: 'Belgium',   alt: ['brussels'], type: 'country', priority: 3 },
  { name: 'Greece',    alt: ['athens'], type: 'country', priority: 3 },
  { name: 'Serbia',    alt: ['belgrade'], type: 'country', priority: 3 },
  { name: 'Kosovo',    type: 'country', priority: 3 },
  { name: 'Croatia',   type: 'country', priority: 3 },
  { name: 'Bosnia',    alt: ['sarajevo','herzegovina'], type: 'country', priority: 3 },
  { name: 'Bulgaria',  type: 'country', priority: 3 },
  { name: 'Czech Republic', alt: ['czechia','prague'], type: 'country', priority: 3 },
  { name: 'Slovakia',  type: 'country', priority: 3 },
  { name: 'Austria',   alt: ['vienna'], type: 'country', priority: 3 },
  { name: 'Switzerland', alt: ['geneva','zurich'], type: 'country', priority: 3 },
  { name: 'Portugal',  alt: ['lisbon'], type: 'country', priority: 3 },
  { name: 'Ireland',   alt: ['dublin'], type: 'country', priority: 3 },
  // Americas
  { name: 'Canada',    alt: ['canadian','ottawa'], type: 'country', priority: 4 },
  { name: 'Mexico',    alt: ['mexican','mexico city'], type: 'country', priority: 4 },
  { name: 'Brazil',    alt: ['brazilian','brasilia'], type: 'country', priority: 4 },
  { name: 'Argentina', alt: ['buenos aires'], type: 'country', priority: 3 },
  { name: 'Chile',     alt: ['santiago'], type: 'country', priority: 3 },
  { name: 'Colombia',  alt: ['bogota'], type: 'country', priority: 3 },
  { name: 'Peru',      type: 'country', priority: 3 },
  { name: 'Cuba',      alt: ['havana'], type: 'country', priority: 3 },
  { name: 'Ecuador',   type: 'country', priority: 3 },
  // Middle East / N. Africa
  { name: 'Egypt',     alt: ['egyptian','cairo'], type: 'country', priority: 4 },
  { name: 'Saudi Arabia', alt: ['saudi','riyadh'], type: 'country', priority: 4 },
  { name: 'Qatar',     alt: ['doha'], type: 'country', priority: 3 },
  { name: 'Kuwait',    type: 'country', priority: 3 },
  { name: 'Bahrain',   type: 'country', priority: 3 },
  { name: 'Oman',      type: 'country', priority: 3 },
  { name: 'Jordan',    alt: ['amman'], type: 'country', priority: 3 },
  { name: 'Morocco',   type: 'country', priority: 3 },
  { name: 'Algeria',   type: 'country', priority: 3 },
  { name: 'Tunisia',   type: 'country', priority: 3 },
  { name: 'United Arab Emirates', alt: ['uae','dubai','abu dhabi','emirates'], type: 'country', priority: 4 },
  // Africa
  { name: 'South Africa', alt: ['johannesburg','cape town','pretoria'], type: 'country', priority: 3 },
  { name: 'Kenya',     alt: ['nairobi'], type: 'country', priority: 3 },
  { name: 'Uganda',    type: 'country', priority: 3 },
  { name: 'Rwanda',    type: 'country', priority: 3 },
  { name: 'Ghana',     type: 'country', priority: 3 },
  { name: 'Senegal',   type: 'country', priority: 3 },
  { name: 'Zimbabwe',  type: 'country', priority: 3 },
  { name: 'Mozambique', type: 'country', priority: 3 },
  { name: 'Angola',    type: 'country', priority: 3 },
  { name: 'Cameroon',  type: 'country', priority: 3 },
  { name: 'Chad',      type: 'country', priority: 3 },
  { name: 'Burkina Faso', type: 'country', priority: 3 },
  { name: 'Central African Republic', alt: ['car'], type: 'country', priority: 3 },
  // Asia-Pacific
  { name: 'Australia', alt: ['sydney','canberra'], type: 'country', priority: 4 },
  { name: 'New Zealand', alt: ['wellington','auckland'], type: 'country', priority: 3 },
  { name: 'Indonesia', alt: ['jakarta'], type: 'country', priority: 4 },
  { name: 'Malaysia',  alt: ['kuala lumpur'], type: 'country', priority: 3 },
  { name: 'Singapore', type: 'country', priority: 3 },
  { name: 'Thailand',  alt: ['bangkok'], type: 'country', priority: 3 },
  { name: 'Vietnam',   alt: ['hanoi'], type: 'country', priority: 3 },
  { name: 'Philippines', alt: ['manila'], type: 'country', priority: 4 },
  { name: 'Cambodia',  type: 'country', priority: 3 },
  { name: 'Laos',      type: 'country', priority: 3 },
  { name: 'Bangladesh', alt: ['dhaka'], type: 'country', priority: 3 },
  { name: 'Sri Lanka', alt: ['colombo'], type: 'country', priority: 3 },
  { name: 'Nepal',     type: 'country', priority: 3 },
  { name: 'Mongolia',  type: 'country', priority: 3 },
  { name: 'Kazakhstan', alt: ['astana','nur-sultan'], type: 'country', priority: 3 },
  { name: 'Uzbekistan', type: 'country', priority: 3 },
  // Sub-national conflict zones / major cities
  { name: 'Crimea',    type: 'region', priority: 5 },
  { name: 'Donbas',    alt: ['donetsk','luhansk'], type: 'region', priority: 5 },
  { name: 'Kyiv',      alt: ['kiev'], type: 'city', priority: 4 },
  { name: 'Kharkiv',   type: 'city', priority: 4 },
  { name: 'Odesa',     alt: ['odessa'], type: 'city', priority: 4 },
  { name: 'Mariupol',  type: 'city', priority: 4 },
  { name: 'Moscow',    type: 'city', priority: 4 },
  { name: 'St Petersburg', alt: ['saint petersburg'], type: 'city', priority: 3 },
  { name: 'Jerusalem', type: 'city', priority: 4 },
  { name: 'Tel Aviv',  type: 'city', priority: 4 },
  { name: 'Beirut',    type: 'city', priority: 4 },
  { name: 'Damascus',  type: 'city', priority: 4 },
  { name: 'Aleppo',    type: 'city', priority: 4 },
  { name: 'Tehran',    type: 'city', priority: 4 },
  { name: 'Baghdad',   type: 'city', priority: 4 },
  { name: 'Mosul',     type: 'city', priority: 3 },
  { name: 'Kabul',     type: 'city', priority: 4 },
  { name: 'Sanaa',     type: 'city', priority: 4 },
  { name: 'Khartoum',  type: 'city', priority: 4 },
  { name: 'Rafah',     type: 'city', priority: 4 },
  { name: 'Khan Younis', type: 'city', priority: 4 },
  { name: 'Taipei',    type: 'city', priority: 4 },
  { name: 'Hong Kong', type: 'city', priority: 4 },
  { name: 'Shanghai',  type: 'city', priority: 3 },
  { name: 'New York',  type: 'city', priority: 3 },
  { name: 'Los Angeles', type: 'city', priority: 3 },
  { name: 'Chicago',   type: 'city', priority: 3 },
  { name: 'Miami',     type: 'city', priority: 3 },
  { name: 'Toronto',   type: 'city', priority: 3 },
  { name: 'Istanbul',  type: 'city', priority: 3 },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Build multi-word phrase set for detection of names like "New York" or
// "Saudi Arabia" that tokenization would split apart.
function textContainsPhrase(lowerText: string, phrase: string): boolean {
  const p = phrase.toLowerCase();
  // word-boundary match
  const re = new RegExp(`(^|[^a-z])${p.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}([^a-z]|$)`);
  return re.test(lowerText);
}

// 2. Fuzzy match (Levenshtein-lite)
function fuzzyMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2) return false;

  let mismatches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) mismatches++;
    if (mismatches > 2) return false;
  }
  return true;
}

// 3. ML-style scoring
// Score = (match strength) * (priority) * (context weight)
function scoreLocation(name: string, tokens: string[], entry: any): number {
  let score = 0;

  // direct match
  if (tokens.includes(name.toLowerCase())) score += 5;

  // fuzzy match
  for (const t of tokens) {
    if (fuzzyMatch(t, name.toLowerCase())) score += 3;
  }

  // alt names
  if (entry.alt) {
    for (const alt of entry.alt) {
      if (tokens.includes(alt.toLowerCase())) score += 4;
      for (const t of tokens) {
        if (fuzzyMatch(t, alt.toLowerCase())) score += 2;
      }
    }
  }

  // priority (country > capital > city > region)
  score *= entry.priority;

  return score;
}

// =========================================================
//  MAIN LOCATION EXTRACTOR
// =========================================================

export function extractLocation(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const tokens = tokenize(text);

  let best: string | null = null;
  let bestScore = 0;

  for (const entry of WORLD_PLACES) {
    // Base fuzzy/token scoring
    let s = scoreLocation(entry.name, tokens, entry);

    // Multi-word phrase matches (e.g. "New York", "United States")
    const names = [entry.name, ...(entry.alt || [])];
    for (const n of names) {
      if (n.includes(' ') && textContainsPhrase(lower, n)) {
        s += 8 * entry.priority;
      } else if (!n.includes(' ') && textContainsPhrase(lower, n)) {
        // Weight repeated mentions
        const matches = lower.split(n.toLowerCase()).length - 1;
        s += matches * entry.priority;
      }
    }

    if (s > bestScore) {
      bestScore = s;
      best = entry.name;
    }
  }

  return bestScore > 0 ? best : null;
}

// =========================================================
//  GEOCODING (unchanged)
// =========================================================

export async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "Accept": "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
