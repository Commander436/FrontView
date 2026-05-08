import { useState, useEffect, useRef, useCallback } from 'react';
import { Ship } from '@/types/globe';

const AIS_WS_URL = 'wss://stream.aisstream.io/v0/stream';

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
  const [wsConnected, setWsConnected] = useState(false);
  const shipMapRef = useRef<Map<string, Ship>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const logTimer = useRef<ReturnType<typeof setInterval>>();
  const failCount = useRef(0);
  const zeroShipTicks = useRef(0);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (failCount.current >= 3) {
      setError('AIS disabled (no working AIS endpoint configured).');
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const ws = new WebSocket(AIS_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setError(null);
        setLoading(false);
        failCount.current = 0;
        zeroShipTicks.current = 0;
        console.log('[AIS] WebSocket connected: true');
        // Try connecting without a key — AISStream may accept or reject
        ws.send(JSON.stringify({
          APIKey: "",
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
        } catch { /* skip malformed */ }
      };

      ws.onerror = () => {
        console.warn('[AIS] WebSocket error');
        setWsConnected(false);
        ws.close();
      };

      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        failCount.current++;
        console.log('[AIS] WebSocket connected: false');

        if (failCount.current >= 3) {
          setError('AIS disabled (no working AIS endpoint configured).');
          setLoading(false);
        } else if (enabled) {
          const delay = 10000 * Math.pow(2, failCount.current - 1);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };
    } catch {
      setWsConnected(false);
      failCount.current++;
      setError('AIS disabled (no working AIS endpoint configured).');
      setLoading(false);
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
      const connected = wsRef.current?.readyState === WebSocket.OPEN;
      const count = shipMapRef.current.size;
      console.log(`[AIS] Connected: ${connected}`);
      console.log(`[AIS] Live ship count: ${count}`);

      if (connected && count === 0) {
        zeroShipTicks.current++;
        if (zeroShipTicks.current >= 3) {
          console.error('[AIS ERROR] Connected but no ships — check parsing/filtering, do not assume "no traffic".');
        }
      } else {
        zeroShipTicks.current = 0;
      }

      if (count > 0 && count < 50) {
        console.warn('[AIS ERROR] Demo AIS detected — remove all fallback sources.');
      }
    }, 10000);
    return () => { if (logTimer.current) clearInterval(logTimer.current); };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setShips([]);
      shipMapRef.current.clear();
      setWsConnected(false);
      failCount.current = 0;
      zeroShipTicks.current = 0;
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      return;
    }

    connect();

    return () => {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [enabled, connect]);

  return { ships, loading, error, wsConnected };
}
