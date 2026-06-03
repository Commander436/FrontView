import { useState, useEffect, useRef, useCallback } from 'react';
import { Ship } from '@/types/globe';

// AIS data is now proxied through our backend (Express + SSE).
// The browser never sees the AISStream API key.
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

export function useAIS(enabled: boolean) {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const shipMapRef = useRef<Map<string, Ship>>(new Map());
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const logTimer = useRef<ReturnType<typeof setInterval>>();
  const zeroShipTicks = useRef(0);

  const connect = useCallback(() => {
    if (!enabled) return;
    setLoading(true);

    try {
      const es = new EventSource(AIS_SSE_URL);
      esRef.current = es;

      es.onopen = () => {
        setWsConnected(true);
        setError(null);
        setLoading(false);
        zeroShipTicks.current = 0;
        console.log('[AIS] Connected to backend SSE:', AIS_SSE_URL);
      };

      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const meta = msg.MetaData;
          if (!meta) return;
          const mmsi = String(meta.MMSI || '');
          if (!mmsi) return;

          // Static data updates (destination, ship name/type)
          const staticData = msg.Message?.ShipStaticData;
          if (staticData) {
            const existing = shipMapRef.current.get(mmsi);
            const dest = (staticData.Destination || '').trim();
            if (existing) {
              if (dest) existing.destination = dest;
              if (staticData.Type) existing.type = classifyShipType(staticData.Type);
              if (staticData.Name) existing.name = staticData.Name.trim() || existing.name;
            }
            return;
          }

          const report = msg.Message?.PositionReport;
          if (!report || !meta) return;
          const lat = report.Latitude;
          const lon = report.Longitude;
          if (lat == null || lon == null || lat === 91 || lon === 181) return;

          const prev = shipMapRef.current.get(mmsi);
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
          shipMapRef.current.set(mmsi, ship);
        } catch { /* skip malformed */ }
      };

      es.onerror = () => {
        console.warn('[AIS ERROR] SSE connection error — retrying in 5s');
        setWsConnected(false);
        setError('AIS backend unreachable. Check AIS proxy server.');
        try { es.close(); } catch { /* noop */ }
        esRef.current = null;
        if (enabled) {
          reconnectTimer.current = setTimeout(connect, 5000);
        }
      };
    } catch {
      setWsConnected(false);
      setError('AIS backend connection failed');
      if (enabled) reconnectTimer.current = setTimeout(connect, 5000);
    }
  }, [enabled]);

  // Push accumulated ships to state every 5s
  useEffect(() => {
    if (!enabled) return;
    const pushInterval = setInterval(() => {
      const stale = Date.now() - 30 * 60 * 1000;
      for (const [mmsi, s] of shipMapRef.current) {
        if (new Date(s.lastUpdate).getTime() < stale) {
          shipMapRef.current.delete(mmsi);
        }
      }
      setShips(Array.from(shipMapRef.current.values()));
    }, 5000);
    return () => clearInterval(pushInterval);
  }, [enabled]);

  // Debug logging every 10s
  useEffect(() => {
    if (!enabled) return;
    logTimer.current = setInterval(() => {
      const connected = esRef.current?.readyState === EventSource.OPEN;
      const count = shipMapRef.current.size;
      console.log(`[AIS] Live ships: ${count} (connected: ${connected})`);

      if (connected && count === 0) {
        zeroShipTicks.current++;
        if (zeroShipTicks.current >= 3) {
          console.error('[AIS ERROR] Connected but no ships — check parsing, not endpoint');
        }
      } else {
        zeroShipTicks.current = 0;
      }
    }, 10000);
    return () => { if (logTimer.current) clearInterval(logTimer.current); };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setShips([]);
      shipMapRef.current.clear();
      setWsConnected(false);
      zeroShipTicks.current = 0;
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      return;
    }

    connect();

    return () => {
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [enabled, connect]);

  return { ships, loading, error, wsConnected };
}
