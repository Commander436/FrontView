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
  noradId: string;
}

const TLE_GROUPS = [
  'stations',
  'active',
  'starlink',
  'gnss',
  'weather',
  'resource',
  'science',
  'geo',
];

function extractNoradId(tle2: string): string {
  return tle2.substring(2, 7).trim();
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
      altitude: geo.height,
      tle1: rec.tle1,
      tle2: rec.tle2,
      noradId: rec.noradId,
    };
  } catch {
    return null;
  }
}

async function fetchTLEGroup(group: string): Promise<TLERecord[]> {
  try {
    const res = await fetch(
      `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`
    );
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.trim().split('\n');
    const records: TLERecord[] = [];
    for (let i = 0; i + 2 < lines.length; i += 3) {
      const tle2 = lines[i + 2].trim();
      records.push({
        name: lines[i].trim(),
        tle1: lines[i + 1].trim(),
        tle2,
        noradId: extractNoradId(tle2),
      });
    }
    return records;
  } catch {
    return [];
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

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const allGroups = await Promise.all(TLE_GROUPS.map(fetchTLEGroup));
        const allRecords = allGroups.flat();
        // Deduplicate by NORAD ID
        const seen = new Set<string>();
        const unique: TLERecord[] = [];
        for (const rec of allRecords) {
          if (!seen.has(rec.noradId)) {
            seen.add(rec.noradId);
            unique.push(rec);
          }
        }
        tleRecords.current = unique;
        propagateAll();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    intervalRef.current = setInterval(propagateAll, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, propagateAll]);

  return { satellites, loading, error };
}
