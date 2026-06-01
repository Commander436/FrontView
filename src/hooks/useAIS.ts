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
  const zeroShipTicks = useRef(0);

  const connect = useCallback(() => {
    if (!enabled) return;
    setLoading(true);

    try {
      const ws = new WebSocket(AIS_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setError(null);
        setLoading(false);
        zeroShipTicks.current = 0;
        console.log('[AIS] Connected to free community stream');
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
        console.warn('[AIS ERROR] WebSocket error');
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        console.warn('[AIS] Connection closed — retrying in 5 seconds');
        if (enabled) {
          reconnectTimer.current = setTimeout(connect, 5000);
        }
      };
    } catch {
      setWsConnected(false);
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
      const connected = wsRef.current?.readyState === WebSocket.OPEN;
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
