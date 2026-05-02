import { useState, useEffect, useRef, useCallback } from 'react';
import { Aircraft } from '@/types/globe';
import { classifyAircraft } from '@/utils/militaryClassification';

// airplanes.live — free, no key, CORS-enabled, ADSBexchange-compatible readsb format.
// NOTE: airplanes.live exposes NO single global JSON endpoint and NO WebSocket
// (verified against api docs at https://airplanes.live/api-guide/). The only way
// to obtain global civilian coverage is to fan out point queries that together
// blanket the planet. /v2/point caps radius at 250nm — anything larger is
// silently truncated, so we use 250 and overlap a 12-cell coverage map.
const COVERAGE_POINTS: Array<{ name: string; lat: number; lon: number }> = [
  { name: 'N.America-W',   lat:  40, lon: -120 },
  { name: 'N.America-E',   lat:  40, lon:  -80 },
  { name: 'Europe',        lat:  48, lon:   10 },
  { name: 'E.Asia',        lat:  35, lon:  120 },
  { name: 'C.Asia',        lat:  40, lon:   70 },
  { name: 'S.Asia',        lat:  20, lon:   78 },
  { name: 'SE.Asia',       lat:   5, lon:  110 },
  { name: 'M.East',        lat:  25, lon:   50 },
  { name: 'Africa',        lat:   0, lon:   25 },
  { name: 'S.America',     lat: -15, lon:  -60 },
  { name: 'Australia',     lat: -25, lon:  135 },
  { name: 'N.Atlantic',    lat:  45, lon:  -30 },
];
const POINT_RADIUS_NM = 250; // hard API cap

function parseAircraft(raw: any[]): Aircraft[] {
  return raw
    .filter((s: any) => s.lat != null && s.lon != null && typeof s.lat === 'number' && typeof s.lon === 'number')
    .map((s: any) => {
      const isMil = !!(s.dbFlags && (s.dbFlags & 1));
      const a: Aircraft = {
        icao24: s.hex || '',
        callsign: (s.flight || '').trim(),
        originCountry: s.cou_name || s.cou_iso || '',
        latitude: s.lat,
        longitude: s.lon,
        altitude: s.alt_baro === 'ground' ? 0 : (s.alt_baro || s.alt_geom || 0) * 0.3048,
        baroAltitude: s.alt_baro === 'ground' ? 0 : s.alt_baro != null ? s.alt_baro * 0.3048 : undefined,
        geoAltitude: s.alt_geom != null ? s.alt_geom * 0.3048 : undefined,
        velocity: (s.gs || 0) * 0.5144,
        heading: s.track || s.true_heading || 0,
        verticalRate: s.baro_rate != null ? s.baro_rate * 0.00508 : (s.geom_rate != null ? s.geom_rate * 0.00508 : 0),
        onGround: s.alt_baro === 'ground' || !!s.ground,
        // s.seen = seconds since last message received. Use directly as lastContact.
        lastContact: s.seen != null ? s.seen : 0,
        squawk: s.squawk || undefined,
        positionSource: s.type || 'adsb_icao',
        airline: s.ownOp || (s.flight && s.flight.length >= 3 ? s.flight.substring(0, 3) : 'Unknown'),
        aircraftType: s.t || 'Unknown',
        model: s.desc || 'Unknown',
        registration: s.r || 'Unknown',
        operator: s.ownOp || 'Unknown',
        emergency: s.emergency || 'none',
        isMilitary: isMil,
        trueAirspeed: s.tas != null ? s.tas * 0.5144 : undefined,
        mach: s.mach || undefined,
        route: s.route || undefined,
      };

      // Classify by callsign/speed/altitude if not already flagged
      if (!isMil) {
        const cls = classifyAircraft(a.callsign, a.velocity, a.altitude);
        if (cls.isMilitary) {
          a.militaryClassification = cls.classification;
          a.isMilitary = true;
        }
      }

      return a;
    });
}

export function useAircraft(civilianEnabled: boolean, militaryEnabled: boolean) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const accumulatedRef = useRef<Map<string, Aircraft>>(new Map());
  const logTimer = useRef<ReturnType<typeof setInterval>>();

  // Aircraft should be fetched if EITHER civilian or military toggle is on
  const enabled = civilianEnabled || militaryEnabled;

  // Single global fetch — no rotation, no per-cycle region selection.
  // Fans out across the full coverage map in parallel each cycle.
  const fetchGlobalAirplanes = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    const requests = COVERAGE_POINTS.map(p =>
      fetch(`https://api.airplanes.live/v2/point/${p.lat}/${p.lon}/${POINT_RADIUS_NM}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          return data.ac || [];
        })
        .catch((err) => {
          console.warn(`[AIRPLANES.LIVE] ${p.name} failed:`, err.message);
          return [];
        })
    );
    // Also pull dedicated military feed (covers MIL outside any point radius)
    requests.push(
      fetch('https://api.airplanes.live/v2/mil')
        .then(async (res) => res.ok ? (await res.json()).ac || [] : [])
        .catch(() => [])
    );

    try {
      const batches = await Promise.all(requests);
      const merged = batches.flat();
      console.log('[AIRPLANES.LIVE] raw aircraft fetched:', merged.length);

      const parsed = parseAircraft(merged);
      // Merge into accumulated map — NEVER clear (incremental update policy)
      for (const a of parsed) {
        accumulatedRef.current.set(a.icao24, a);
      }

      // Remove stale entries (lastContact > 5 minutes = 300 seconds)
      for (const [id, a] of accumulatedRef.current) {
        if (a.lastContact > 300) accumulatedRef.current.delete(id);
      }

      setAircraft(Array.from(accumulatedRef.current.values()));
    } catch (err: any) {
      setError(err.message);
      console.warn('[AIRPLANES.LIVE] global fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Logging every 10s
  useEffect(() => {
    if (!enabled) return;
    logTimer.current = setInterval(() => {
      const all = accumulatedRef.current.size;
      const mil = Array.from(accumulatedRef.current.values()).filter(a => a.isMilitary).length;
      const civ = all - mil;
      console.log(`[ACFT] Total entities: ${all}`);
      console.log(`[ACFT] Visible civilian: ${civ}`);
      console.log(`[ACFT] Visible military: ${mil}`);
      if (all > 0 && civ === 0 && mil === 0) {
        console.error('[ACFT ERROR] Classification/visibility logic hiding all aircraft — fix UI filters, not ingestion.');
      }
    }, 10000);
    return () => { if (logTimer.current) clearInterval(logTimer.current); };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setAircraft([]);
      accumulatedRef.current.clear();
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchGlobalAirplanes();
    intervalRef.current = setInterval(fetchGlobalAirplanes, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchGlobalAirplanes]);

  return { aircraft, loading, error };
}
