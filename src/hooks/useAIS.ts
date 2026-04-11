import { useState, useEffect, useRef, useCallback } from 'react';
import { Ship } from '@/types/globe';

// AISStream.io free WebSocket endpoint
const AIS_WS_URL = 'wss://stream.aisstream.io/v0/stream';

// Fallback: poll a free AIS API if WebSocket fails
const AIS_REST_URL = 'https://meri.digitraffic.fi/api/ais/v1/locations';

function classifyShipType(typeNum: number): Ship['type'] {
  if (typeNum >= 70 && typeNum <= 79) return 'cargo';
  if (typeNum >= 80 && typeNum <= 89) return 'tanker';
  if (typeNum >= 60 && typeNum <= 69) return 'passenger';
  if (typeNum >= 30 && typeNum <= 39) return 'fishing';
  if (typeNum === 35 || typeNum === 55) return 'military';
  return 'cargo';
}

export function useAIS(enabled: boolean) {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shipMapRef = useRef<Map<string, Ship>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const usingWsRef = useRef(false);

  // ---- REST fallback: Finnish AIS (free, no key, CORS-enabled) ----
  const fetchREST = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(AIS_REST_URL);
      if (!res.ok) throw new Error(`AIS HTTP ${res.status}`);
      const data = await res.json();
      const features = data.features || data;
      const now = new Date().toISOString();

      if (Array.isArray(features)) {
        features.forEach((f: any) => {
          const props = f.properties || f;
          const coords = f.geometry?.coordinates;
          if (!coords && !props.lon && !props.longitude) return;
          const lon = coords ? coords[0] : (props.lon || props.longitude);
          const lat = coords ? coords[1] : (props.lat || props.latitude);
          if (lon == null || lat == null) return;
          const mmsi = String(props.mmsi || props.MMSI || '');
          if (!mmsi) return;

          const ship: Ship = {
            mmsi,
            name: props.name || props.shipName || `VESSEL-${mmsi.slice(-4)}`,
            type: classifyShipType(props.shipType || props.type || 0),
            latitude: lat,
            longitude: lon,
            speed: props.sog || props.speed || 0,
            course: props.cog || props.course || 0,
            lastUpdate: props.timestamp || now,
          };
          shipMapRef.current.set(mmsi, ship);
        });
      }

      // Remove stale (> 30 min)
      const stale = Date.now() - 30 * 60 * 1000;
      for (const [mmsi, s] of shipMapRef.current) {
        if (new Date(s.lastUpdate).getTime() < stale) {
          shipMapRef.current.delete(mmsi);
        }
      }

      setShips(Array.from(shipMapRef.current.values()));
    } catch (err: any) {
      setError(err.message);
      console.warn('AIS REST fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // ---- WebSocket attempt ----
  const connectWS = useCallback(() => {
    if (!enabled) return;
    try {
      const ws = new WebSocket(AIS_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        usingWsRef.current = true;
        setError(null);
        // Subscribe to global positions
        ws.send(JSON.stringify({
          APIkey: '',
          BoundingBoxes: [[[-90, -180], [90, 180]]],
          FilterMessageTypes: ['PositionReport'],
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const report = msg.Message?.PositionReport;
          const meta = msg.MetaData;
          if (!report || !meta) return;

          const mmsi = String(meta.MMSI || '');
          if (!mmsi) return;
          const lat = report.Latitude;
          const lon = report.Longitude;
          if (lat == null || lon == null || lat === 91 || lon === 181) return;

          const ship: Ship = {
            mmsi,
            name: (meta.ShipName || '').trim() || `VESSEL-${mmsi.slice(-4)}`,
            type: classifyShipType(meta.ShipType || 0),
            latitude: lat,
            longitude: lon,
            speed: report.Sog || 0,
            course: report.Cog || 0,
            lastUpdate: meta.time_utc || new Date().toISOString(),
          };
          shipMapRef.current.set(mmsi, ship);
        } catch {}
      };

      ws.onerror = () => {
        usingWsRef.current = false;
        ws.close();
      };

      ws.onclose = () => {
        usingWsRef.current = false;
        wsRef.current = null;
        // Fall back to REST
        if (enabled && !intervalRef.current) {
          fetchREST();
          intervalRef.current = setInterval(fetchREST, 30000);
        }
      };
    } catch {
      // WS not available, use REST
      fetchREST();
      intervalRef.current = setInterval(fetchREST, 30000);
    }
  }, [enabled, fetchREST]);

  // Periodic state push from WS map
  useEffect(() => {
    if (!enabled) return;
    const pushInterval = setInterval(() => {
      if (shipMapRef.current.size > 0) {
        setShips(Array.from(shipMapRef.current.values()));
      }
    }, 5000);
    return () => clearInterval(pushInterval);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setShips([]);
      shipMapRef.current.clear();
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = undefined; }
      return;
    }

    // Try WebSocket first, fall back to REST
    connectWS();

    // If WS doesn't connect within 5s, start REST
    const fallbackTimeout = setTimeout(() => {
      if (!usingWsRef.current && !intervalRef.current) {
        fetchREST();
        intervalRef.current = setInterval(fetchREST, 30000);
      }
    }, 5000);

    return () => {
      clearTimeout(fallbackTimeout);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = undefined; }
    };
  }, [enabled, connectWS, fetchREST]);

  return { ships, loading, error };
}
