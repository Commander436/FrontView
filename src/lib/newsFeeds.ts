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
//  RESILIENT ARTICLE EXTRACTOR (READER API + READABILITY FALLBACK)
// =========================================================

const JINA_READER = 'https://r.jina.ai/http://';
const ARTICLE_TTL = 15 * 60 * 1000;
const articleCache = new Map<string, { ts: number; article: FullArticle }>();

interface ExtractedArticle extends FullArticle { wordCount: number; }

const DROP_TAGS = [
  'script','style','noscript','iframe','form','svg','aside','nav','header','footer',
  'button','link','meta','video','audio','canvas','template'
];

const BAD_TEXT_RE = /\b(cookie|cookies|subscribe|newsletter|advertisement|sponsored|sign up|sign in|log in|read more|share this|all rights reserved|privacy policy|terms of use|enable javascript|follow us|related stories|more on this story)\b/i;

function decodeEntities(s: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = s;
  return el.value;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
}

function wordsInText(text: string): number {
  return (text.trim().match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu) || []).length;
}

function wordsInHtml(html: string): number {
  return wordsInText(stripHtml(html));
}

function cleanText(text: string): string {
  return decodeEntities(text).replace(/\s+/g, ' ').trim();
}

function fetchTextWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { signal: ctrl.signal, headers: { Accept: 'text/html,text/plain,application/xhtml+xml' } })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .finally(() => window.clearTimeout(timer));
}

function absolutizeUrl(raw: string, baseUrl: string): string | null {
  try { return new URL(raw, baseUrl).href; } catch { return null; }
}

function stripArticleBoilerplate(root: HTMLElement) {
  DROP_TAGS.forEach(tag => root.querySelectorAll(tag).forEach(n => n.remove()));
  root.querySelectorAll('[class],[id],[role]').forEach(el => {
    const signature = `${el.getAttribute('class') || ''} ${el.getAttribute('id') || ''} ${el.getAttribute('role') || ''}`.toLowerCase();
    if (/\b(ad|advert|promo|newsletter|subscribe|cookie|consent|share|social|sidebar|related|recommend|caption|byline|toolbar|breadcrumb|comment)\b/.test(signature)) {
      el.remove();
    }
  });
}

function linkDensity(el: Element): number {
  const textLen = cleanText(el.textContent || '').length || 1;
  const linkLen = [...el.querySelectorAll('a')].reduce((sum, a) => sum + cleanText(a.textContent || '').length, 0);
  return linkLen / textLen;
}

function scoreArticleNode(el: Element): number {
  const text = cleanText(el.textContent || '');
  const wordCount = wordsInText(text);
  if (wordCount < 25) return 0;
  const paragraphCount = [...el.querySelectorAll('p')].filter(p => wordsInText(p.textContent || '') >= 12).length;
  const punctuation = (text.match(/[.!?]/g) || []).length;
  const semanticBoost = /^(ARTICLE|MAIN)$/i.test(el.tagName) ? 900 : 0;
  const classBoost = /article|story|body|content|post|entry|main/i.test(`${el.getAttribute('class') || ''} ${el.getAttribute('id') || ''}`) ? 600 : 0;
  const densityPenalty = Math.max(0.2, 1 - linkDensity(el) * 1.6);
  return (wordCount * 18 + paragraphCount * 180 + punctuation * 16 + semanticBoost + classBoost) * densityPenalty;
}

function sanitizeBlockHtml(el: Element, baseUrl: string): string {
  const tag = el.tagName.toLowerCase();
  if (tag === 'img') {
    const src = (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src || el.getAttribute('data-src') || el.getAttribute('src');
    const abs = src ? absolutizeUrl(src, baseUrl) : null;
    const alt = escapeHtml((el as HTMLImageElement).alt || 'Article image');
    return abs ? `<img src="${escapeHtml(abs)}" alt="${alt}" loading="lazy" />` : '';
  }
  const text = cleanText(el.textContent || '');
  if (tag === 'p' && (wordsInText(text) < 8 || BAD_TEXT_RE.test(text))) return '';
  if ((tag === 'li' || tag === 'blockquote') && wordsInText(text) < 5) return '';
  if (/^h[1-4]$/.test(tag) && (wordsInText(text) < 2 || BAD_TEXT_RE.test(text))) return '';
  if (tag === 'blockquote') return `<blockquote>${escapeHtml(text)}</blockquote>`;
  if (tag === 'li') return `<p>${escapeHtml(text)}</p>`;
  if (/^h[1-4]$/.test(tag)) return `<${tag}>${escapeHtml(text)}</${tag}>`;
  return `<p>${escapeHtml(text)}</p>`;
}

function extractBlocksFromNode(root: HTMLElement, baseUrl: string): string[] {
  const blocks: string[] = [];
  const seen = new Set<string>();
  for (const block of [...root.querySelectorAll('h1,h2,h3,h4,p,blockquote,li,img')]) {
    const text = cleanText(block.textContent || '');
    const key = text.toLowerCase().slice(0, 220);
    if (text && seen.has(key)) continue;
    const html = sanitizeBlockHtml(block, baseUrl);
    if (!html) continue;
    if (text) seen.add(key);
    blocks.push(html);
  }
  return blocks;
}

function extractHtmlArticle(rawHtml: string, baseUrl: string): ExtractedArticle | null {
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  if (!doc?.body) return null;
  const title = cleanText(
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('h1')?.textContent ||
    doc.querySelector('title')?.textContent ||
    'Article'
  );
  const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined;
  stripArticleBoilerplate(doc.body);

  const selectors = 'article,[itemprop="articleBody"],[class*="article" i],[class*="story" i],[class*="body" i],[class*="content" i],main,section,div';
  const candidates = [...doc.querySelectorAll(selectors)]
    .map(el => ({ el: el as HTMLElement, score: scoreArticleNode(el) }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const primary = candidates[0]?.el || doc.body;
  let blocks = extractBlocksFromNode(primary, baseUrl);

  if (wordsInHtml(blocks.join('\n')) < 120) {
    blocks = extractBlocksFromNode(doc.body, baseUrl);
  }

  const html = blocks.join('\n');
  const paragraphs = blocks.map(stripHtml).filter(t => wordsInText(t) >= 8);
  const summary = paragraphs[0] || '';
  const wordCount = wordsInHtml(html);
  return wordCount > 0 ? { title, summary, html, image, wordCount } : null;
}

function markdownLineToHtml(line: string): string {
  const clean = cleanText(line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').replace(/\*\*/g, ''));
  if (!clean || BAD_TEXT_RE.test(clean)) return '';
  if (clean.startsWith('# ')) return `<h2>${escapeHtml(clean.slice(2))}</h2>`;
  if (clean.startsWith('## ')) return `<h3>${escapeHtml(clean.slice(3))}</h3>`;
  return wordsInText(clean) >= 8 ? `<p>${escapeHtml(clean)}</p>` : '';
}

function extractReaderArticle(markdown: string): ExtractedArticle | null {
  const title = cleanText(markdown.match(/^Title:\s*(.+)$/m)?.[1] || 'Article');
  const image = markdown.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/)?.[1];
  const content = (markdown.split(/Markdown Content:\s*/i)[1] || markdown)
    .replace(/^Title:.*$/gmi, '')
    .replace(/^URL Source:.*$/gmi, '')
    .replace(/^Published Time:.*$/gmi, '')
    .replace(/^Warning:.*$/gmi, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .trim();

  const blocks: string[] = [];
  const seen = new Set<string>();
  for (const chunk of content.split(/\n{2,}/)) {
    const joined = chunk.split('\n').map(l => l.trim()).filter(Boolean).join(' ');
    const key = cleanText(joined).toLowerCase().slice(0, 220);
    if (!key || seen.has(key)) continue;
    const html = markdownLineToHtml(joined);
    if (!html) continue;
    seen.add(key);
    blocks.push(html);
  }

  const html = blocks.join('\n');
  const summary = blocks.map(stripHtml).find(t => wordsInText(t) >= 8) || '';
  const wordCount = wordsInHtml(html);
  return wordCount > 0 ? { title, summary, html, image, wordCount } : null;
}

export async function fetchFullArticle(url: string): Promise<FullArticle> {
  const cached = articleCache.get(url);
  if (cached && Date.now() - cached.ts < ARTICLE_TTL) return cached.article;

  const readerUrl = `${JINA_READER}${url}`;
  const htmlUrl = `${HTML_PROXY}${encodeURIComponent(url)}`;
  const results = await Promise.allSettled([
    fetchTextWithTimeout(readerUrl, 9000).then(extractReaderArticle),
    fetchTextWithTimeout(htmlUrl, 9000).then(html => extractHtmlArticle(html, url)),
  ]);

  const extracted = results
    .flatMap(r => r.status === 'fulfilled' && r.value ? [r.value] : [])
    .sort((a, b) => b.wordCount - a.wordCount);

  const best = extracted[0];
  if (!best) throw new Error('Article extraction failed');

  const article: FullArticle = {
    title: best.title,
    summary: best.summary,
    html: best.html || `<p>${escapeHtml(best.summary || best.title)}</p>`,
    image: best.image,
  };
  articleCache.set(url, { ts: Date.now(), article });
  return article;
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
  const idx = lowerText.indexOf(p);
  if (idx < 0) return false;
  const before = idx === 0 ? '' : lowerText[idx - 1];
  const after = lowerText[idx + p.length] || '';
  const isBoundary = (c: string) => c === '' || !/[a-z0-9]/.test(c);
  return isBoundary(before) && isBoundary(after);
}

function countPhraseMatches(lowerText: string, phrase: string): number {
  const p = phrase.toLowerCase();
  if (!p) return 0;
  let count = 0;
  let idx = lowerText.indexOf(p);
  while (idx >= 0) {
    const before = idx === 0 ? '' : lowerText[idx - 1];
    const after = lowerText[idx + p.length] || '';
    if ((before === '' || !/[a-z0-9]/.test(before)) && (after === '' || !/[a-z0-9]/.test(after))) count++;
    idx = lowerText.indexOf(p, idx + p.length);
  }
  return count;
}

function phraseFirstIndex(lowerText: string, phrase: string): number {
  const p = phrase.toLowerCase();
  let idx = lowerText.indexOf(p);
  while (idx >= 0) {
    const before = idx === 0 ? '' : lowerText[idx - 1];
    const after = lowerText[idx + p.length] || '';
    if ((before === '' || !/[a-z0-9]/.test(before)) && (after === '' || !/[a-z0-9]/.test(after))) return idx;
    idx = lowerText.indexOf(p, idx + p.length);
  }
  return -1;
}

function isAmbiguousAlias(alias: string): boolean {
  const a = alias.toLowerCase();
  return a.length <= 3 || ['american','british','french','german','chinese','indian','russian','israeli','iranian','turkish','saudi'].includes(a);
}

function locationContextBoost(lowerText: string, phrase: string): number {
  const first = phraseFirstIndex(lowerText, phrase);
  if (first < 0) return 0;
  const before = lowerText.slice(Math.max(0, first - 42), first);
  const after = lowerText.slice(first + phrase.length, first + phrase.length + 42);
  let boost = 0;
  if (/\b(in|inside|near|around|across|throughout|over|from|into|toward|bordering|crisis in|war in|conflict in|fighting in|strike in|attack in)\s+$/.test(before)) boost += 90;
  if (/^\s+(border|capital|province|region|city|territory|front|coast|airspace)\b/.test(after)) boost += 28;
  if (/^\s+(said|says|announced|warned|urged|officials|government|minister|president|secretary|spokesperson|embassy)\b/.test(after)) boost -= 85;
  if (/\b(president|minister|secretary|officials|government|embassy|forces from)\s+$/.test(before)) boost -= 45;
  return boost;
}

// =========================================================
//  MAIN LOCATION EXTRACTOR
// =========================================================

export function extractLocation(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const headlineZone = lower.slice(0, 420);

  let best: string | null = null;
  let bestScore = 0;
  let bestFirstIndex = Number.POSITIVE_INFINITY;

  for (const entry of WORLD_PLACES) {
    let s = 0;
    let firstIndex = Number.POSITIVE_INFINITY;
    const canonicalMatches = countPhraseMatches(lower, entry.name);
    if (canonicalMatches > 0) {
      const first = phraseFirstIndex(lower, entry.name);
      firstIndex = Math.min(firstIndex, first);
      const earlyBoost = first >= 0 && first < 160 ? 70 : first >= 0 && first < 420 ? 36 : first >= 0 && first < 1200 ? 14 : 0;
      const headlineBoost = textContainsPhrase(headlineZone, entry.name) ? 54 : 0;
      s += 82 + canonicalMatches * 18 + earlyBoost + headlineBoost + locationContextBoost(lower, entry.name) + entry.priority * 12;
    }

    for (const alias of entry.alt || []) {
      const matches = countPhraseMatches(lower, alias);
      if (matches === 0) continue;
      const ambiguous = isAmbiguousAlias(alias);
      const first = phraseFirstIndex(lower, alias);
      firstIndex = Math.min(firstIndex, first);
      const earlyBoost = first >= 0 && first < 420 ? (ambiguous ? 4 : 24) : 0;
      const aliasBase = ambiguous ? 5 : 26;
      s += aliasBase + matches * (ambiguous ? 3 : 10) + earlyBoost + (ambiguous ? 0 : locationContextBoost(lower, alias)) + entry.priority * (ambiguous ? 1 : 6);
    }

    if (s > bestScore || (s > 0 && Math.abs(s - bestScore) <= 24 && firstIndex < bestFirstIndex)) {
      bestScore = s;
      best = entry.name;
      bestFirstIndex = firstIndex;
    }
  }

  return bestScore >= 45 ? best : null;
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
