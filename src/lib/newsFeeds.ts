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

// 1. A lightweight gazetteer (countries + capitals + major cities + conflict zones)
const WORLD_PLACES: Array<{ name: string; alt?: string[]; type: string; priority: number }> = [];

// Example entry:
// { "name": "Khartoum", "alt": ["Kartum"], "type": "city", "priority": 3 }

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
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
  const tokens = tokenize(text);

  let best = null;
  let bestScore = 0;

  for (const entry of WORLD_PLACES) {
    const s = scoreLocation(entry.name, tokens, entry);
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
