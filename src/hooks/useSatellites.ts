import { useState, useEffect, useRef, useCallback } from 'react';
import { SatelliteData } from '@/types/globe';
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
} from 'satellite.js';

interface TLERecord {
  name: string;
  tle1: string;
  tle2: string;
}

function propagateSatellite(rec: TLERecord): SatelliteData | null {
  try {
    const satrec = twoline2satrec(rec.tle1, rec.tle2);
    const now = new Date();
    const posVel = propagate(satrec, now);
    if (!posVel.position || typeof posVel.position === 'boolean') return null;
    const gmst = gstime(now);
    const geo = eciToGeodetic(posVel.position, gmst);
    return {
      name: rec.name,
      latitude: (geo.latitude * 180) / Math.PI,
      longitude: (geo.longitude * 180) / Math.PI,
      altitude: geo.height, // km
      tle1: rec.tle1,
      tle2: rec.tle2,
    };
  } catch {
    return null;
  }
}

export function useSatellites(enabled: boolean) {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tleRecords = useRef<TLERecord[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const propagateAll = useCallback(() => {
    const results = tleRecords.current
      .map(propagateSatellite)
      .filter((s): s is SatelliteData => s !== null);
    setSatellites(results);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSatellites([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const fetchTLEs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle'
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const lines = text.trim().split('\n');
        const records: TLERecord[] = [];
        for (let i = 0; i + 2 < lines.length; i += 3) {
          records.push({
            name: lines[i].trim(),
            tle1: lines[i + 1].trim(),
            tle2: lines[i + 2].trim(),
          });
        }
        tleRecords.current = records;
        propagateAll();
      } catch (err: any) {
        setError(err.message);
        console.warn('Satellite fetch failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTLEs();
    intervalRef.current = setInterval(propagateAll, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, propagateAll]);

  return { satellites, loading, error };
}
