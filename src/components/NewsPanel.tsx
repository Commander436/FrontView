import { useEffect, useRef, useState } from 'react';
import { useNews } from '@/hooks/useNews';
import { fetchFullArticle, extractLocation, geocode } from '@/lib/newsFeeds';
import type { NewsArticle, FullArticle } from '@/types/news';
import { ArrowLeft, MapPin, RefreshCw, Loader2, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

declare const Cesium: any;

interface Props {
  active: boolean;
  onRequestGlobal: () => void;
}

function timeAgo(ts: number) {
  const d = Math.max(0, Date.now() - ts) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export function NewsPanel({ active, onRequestGlobal }: Props) {
  const { articles, loading, error, reload } = useNews(active);
  const [selected, setSelected] = useState<NewsArticle | null>(null);
  const [full, setFull] = useState<FullArticle | null>(null);
  const [fullLoading, setFullLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // animation lifecycle
  const [phase, setPhase] = useState<'closed' | 'enter' | 'open' | 'exit'>('closed');
  const phaseRef = useRef(phase);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => {
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);

    if (active) {
      setPhase(prev => prev === 'open' ? 'open' : 'enter');
      openTimerRef.current = window.setTimeout(() => setPhase('open'), 1100);
      return;
    }

    if (phaseRef.current === 'closed') return;
    setPhase('exit');
    // Clear any open article so the modal doesn't linger during exit and
    // block pointer events on the globe when we return to Global View.
    setSelected(null);
    setFull(null);
    closeTimerRef.current = window.setTimeout(() => setPhase('closed'), 520);
  }, [active]);

  useEffect(() => () => {
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  if (phase === 'closed') return null;

  const rootPointer = phase === 'exit' ? 'pointer-events-none' : '';

  const openArticle = async (a: NewsArticle) => {
    setSelected(a);
    setFull(null);
    setFullLoading(true);
    try {
      const data = await fetchFullArticle(a.link);
      setFull(data);
    } catch {
      setFull({ title: a.title, html: `<p>${a.summary}</p><p><em>Full article could not be loaded.</em></p>`, image: a.image });
    } finally {
      setFullLoading(false);
    }
  };

  const locate = async (a: NewsArticle) => {
    setLocating(true);
    try {
      let article = full;
      if (!article && !fullLoading) {
        try {
          article = await fetchFullArticle(a.link);
          setFull(article);
        } catch {
          article = null;
        }
      }
      const text = [
        a.title,
        a.summary,
        article?.title || '',
        article?.summary || '',
        article?.html ? article.html.replace(/<[^>]+>/g,' ') : '',
      ].join(' ');
      const place = extractLocation(text);
      if (!place) { toast.error('No recognizable location found in article'); return; }
      const geo = await geocode(place);
      if (!geo) { toast.error(`Could not geocode "${place}"`); return; }
      toast.success(`Locating ${place} on globe`);
      onRequestGlobal();
      // wait for News panel to fully unmount + view swap animation before flying
      setTimeout(() => {
        const viewer = (window as any).__cesiumViewer;
        if (!viewer || viewer.isDestroyed() || typeof Cesium === 'undefined') return;
        if (viewer.scene?.canvas) viewer.scene.canvas.style.pointerEvents = 'auto';
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(geo.lon, geo.lat, 2500000),
          duration: 2.5,
        });
        const id = `news-marker-${Date.now()}`;
        const ent = viewer.entities.add({
          id,
          position: Cesium.Cartesian3.fromDegrees(geo.lon, geo.lat),
          point: { pixelSize: 14, color: Cesium.Color.RED.withAlpha(0.9), outlineColor: Cesium.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
          label: { text: place, font: '12px Orbitron', fillColor: Cesium.Color.WHITE, showBackground: true, backgroundColor: Cesium.Color.BLACK.withAlpha(0.6), pixelOffset: new Cesium.Cartesian2(0, -22), disableDepthTestDistance: Number.POSITIVE_INFINITY },
        });
        setTimeout(() => { try { viewer.entities.removeById(id); } catch {} }, 30000);
      }, 1100);
    } finally {
      setLocating(false);
    }
  };

  const halvesEntering = phase === 'enter';
  const halvesExiting  = phase === 'exit';
  const contentPointer = phase === 'exit' ? 'pointer-events-none' : 'pointer-events-auto';

  return (
    <div className={`fixed inset-0 z-[9999] ${rootPointer}`}>
      {/* Two halves slide in, then merge & expand */}
      <div className={`absolute inset-0 flex ${contentPointer}`}>
        <div
          className={`flex-1 h-full ${halvesEntering ? 'news-half-left-in' : ''} ${halvesExiting ? 'news-half-left-out' : ''}`}
          style={{
            background: 'linear-gradient(to right, hsl(0 0% 6% / 0.78), hsl(0 0% 4% / 0.85))',
            backdropFilter: 'blur(22px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
            borderRight: '1px solid hsl(0 0% 100% / 0.08)',
          }}
        />
        <div
          className={`flex-1 h-full ${halvesEntering ? 'news-half-right-in' : ''} ${halvesExiting ? 'news-half-right-out' : ''}`}
          style={{
            background: 'linear-gradient(to left, hsl(0 0% 6% / 0.78), hsl(0 0% 4% / 0.85))',
            backdropFilter: 'blur(22px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
          }}
        />
      </div>

      {/* Content panel (fills screen after halves meet) */}
      {phase !== 'exit' && (
        <div className="absolute inset-0 pointer-events-auto flex flex-col">
          <div className="news-list-fade flex-1 overflow-hidden flex flex-col pt-20 px-6 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-display tracking-[0.25em] text-foreground">GLOBAL INTELLIGENCE FEED</h1>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 tracking-wider">
                  {articles.length} ARTICLES · GEOPOLITICS · MILITARY · DIPLOMACY
                </p>
              </div>
              <button
                onClick={() => reload()}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel bg-secondary/40 border border-foreground/15 text-[10px] font-display tracking-widest text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                REFRESH
              </button>
            </div>

            {error && (
              <div className="text-destructive text-[11px] font-mono mb-3">{error}</div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
              {loading && articles.length === 0 && (
                <div className="col-span-full flex items-center justify-center text-muted-foreground gap-2 py-20">
                  <Loader2 className="w-4 h-4 animate-spin" /> <span className="font-mono text-xs">Receiving signal…</span>
                </div>
              )}
              {articles.map(a => (
                <button
                  key={a.id}
                  onClick={() => openArticle(a)}
                  className="text-left rounded-xl border border-foreground/10 bg-card/60 hover:bg-foreground/5 hover:border-foreground/30 transition-all overflow-hidden glass-panel group"
                >
                  {a.image && (
                    <div className="aspect-video overflow-hidden bg-secondary/30">
                      <img src={a.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                  )}
                  <div className="p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-display tracking-[0.2em] text-foreground/90 uppercase">{a.source}</span>
                      <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {timeAgo(a.publishedAt)}
                      </span>
                    </div>
                    <h3 className="text-[13px] font-display text-foreground leading-snug mb-2 line-clamp-3">{a.title}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">{a.summary}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full-article modal */}
      {selected && (
        <div className="absolute inset-0 z-50 pointer-events-auto bg-black/40 backdrop-blur-sm flex items-stretch">
          <div className="w-full h-full glass-panel bg-card/85 border-l border-foreground/15 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-foreground/10">
              <button
                onClick={() => { setSelected(null); setFull(null); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 border border-foreground/15 text-[11px] font-display tracking-widest text-foreground/90 hover:bg-foreground/10"
              >
                <ArrowLeft className="w-4 h-4" /> BACK
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-display tracking-widest text-muted-foreground">{selected.source} · {timeAgo(selected.publishedAt)}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
              <h1 className="text-3xl font-display text-foreground leading-tight mb-4">{full?.title || selected.title}</h1>
              {(full?.image || selected.image) && (
                <img src={full?.image || selected.image} alt="" className="w-full max-h-[420px] object-cover rounded-xl mb-6 border border-foreground/10" />
              )}
              {fullLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-12">
                  <Loader2 className="w-4 h-4 animate-spin" /> <span className="font-mono text-xs">Extracting article…</span>
                </div>
              ) : (
                <div
                  className="prose prose-invert prose-sm max-w-none text-foreground/90 leading-relaxed
                    [&_p]:mb-4 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h2]:mt-6 [&_h3]:mt-5
                    [&_img]:rounded-lg [&_img]:my-4 [&_img]:max-h-[360px] [&_img]:w-auto
                    [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/30"
                  dangerouslySetInnerHTML={{ __html: full?.html || `<p>${selected.summary}</p>` }}
                />
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => locate(selected)}
                  disabled={locating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground/10 border border-foreground/30 text-[11px] font-display tracking-widest text-foreground hover:bg-foreground/20 transition-colors disabled:opacity-50"
                >
                  {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                  LOCATE ON GLOBE
                </button>
                <a
                  href={selected.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/40 border border-foreground/15 text-[11px] font-display tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> SOURCE
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}