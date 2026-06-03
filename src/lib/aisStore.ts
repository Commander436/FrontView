import type { Ship } from '@/types/globe';

// Global, app-wide AIS store. Starts streaming as soon as this module is imported
// (e.g. during the terminal intro), and keeps a persistent cache so toggling the
// Ships layer OFF/ON never loses already-fetched vessels.

const AIS_BACKEND_BASE: string =
  (import.meta.env.VITE_AIS_BACKEND_URL as string) ||
  'https://frontview-l8t7.onrender.com';
const AIS_SSE_URL = `${AIS_BACKEND_BASE.replace(/\/$/, '')}/api/ais`;

function classifyShipType(typeNum: number): Ship['type'] {
  if (typeNum >= 70 && typeNum <= 79) return 'cargo';
  if (typeNum >= 80 && typeNum <= 89) return 'tanker';
  if (typeNum >= 60 && typeNum <= 69) return 'passenger';
  if (typeNum >= 35 && typeNum <= 38) return 'military';
  if (typeNum >= 30 && typeNum <= 39) return 'fishing';
  return 'cargo';
}

type Listener = (ships: Ship[]) => void;

class AISStore {
  private cache = new Map<string, Ship>();
  private listeners = new Set<Listener>();
  private es: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private started = false;
  connected = false;
  error: string | null = null;

  start() {
    if (this.started) return;
    this.started = true;
    this.connect();
    // Flush cache → listeners every 5 s (and prune entries older than 30 min).
    this.flushTimer = setInterval(() => {
      const stale = Date.now() - 30 * 60 * 1000;
      for (const [mmsi, s] of this.cache) {
        if (new Date(s.lastUpdate).getTime() < stale) this.cache.delete(mmsi);
      }
      this.emit();
    }, 5000);
  }

  private connect = () => {
    try {
      const es = new EventSource(AIS_SSE_URL);
      this.es = es;
      es.onopen = () => {
        this.connected = true;
        this.error = null;
        console.log('[AIS] Preload stream connected:', AIS_SSE_URL);
      };
      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const meta = msg.MetaData;
          if (!meta) return;
          const mmsi = String(meta.MMSI || '');
          if (!mmsi) return;

          const staticData = msg.Message?.ShipStaticData;
          if (staticData) {
            const existing = this.cache.get(mmsi);
            const dest = (staticData.Destination || '').trim();
            if (existing) {
              if (dest) existing.destination = dest;
              if (staticData.Type) existing.type = classifyShipType(staticData.Type);
              if (staticData.Name) existing.name = staticData.Name.trim() || existing.name;
            }
            return;
          }

          const report = msg.Message?.PositionReport;
          if (!report) return;
          const lat = report.Latitude;
          const lon = report.Longitude;
          if (lat == null || lon == null || lat === 91 || lon === 181) return;

          const prev = this.cache.get(mmsi);
          const ship: Ship = {
            mmsi,
            name: (meta.ShipName || '').trim() || `VESSEL-${mmsi.slice(-4)}`,
            type: classifyShipType(meta.ShipType || 0),
            latitude: lat,
            longitude: lon,
            speed: report.Sog || 0,
            course: report.Cog || 0,
            lastUpdate: meta.time_utc || new Date().toISOString(),
            destination: prev?.destination,
          };
          this.cache.set(mmsi, ship);
        } catch { /* skip */ }
      };
      es.onerror = () => {
        this.connected = false;
        this.error = 'AIS backend unreachable. Check AIS proxy server.';
        try { es.close(); } catch { /* noop */ }
        this.es = null;
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 5000);
        }
      };
    } catch {
      this.connected = false;
      this.error = 'AIS backend connection failed';
      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, 5000);
      }
    }
  };

  private emit() {
    const arr = Array.from(this.cache.values());
    this.listeners.forEach(l => l(arr));
  }

  getSnapshot(): Ship[] {
    return Array.from(this.cache.values());
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    // Immediately hydrate the new subscriber with whatever is already cached.
    if (this.cache.size > 0) l(this.getSnapshot());
    return () => { this.listeners.delete(l); };
  }
}

export const aisStore = new AISStore();

// Kick off the stream as soon as this module is imported (during intro).
if (typeof window !== 'undefined') aisStore.start();