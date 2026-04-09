import { useState, useEffect, useRef, useCallback } from 'react';
import { Aircraft } from '@/types/globe';
import { classifyAircraft } from '@/utils/militaryClassification';

// adsb.lol — free, no key, no signup, CORS-enabled, ADSBexchange-compatible format
const ADSB_URL = 'https://api.adsb.lol/v2/all';

export function useAircraft(enabled: boolean, classifyMilitary: boolean) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const backoffRef = useRef(5000);

  const fetchAircraft = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(ADSB_URL);
      if (res.status === 429) {
        backoffRef.current = Math.min(backoffRef.current * 2, 120000);
        console.warn(`ADS-B 429, backing off to ${backoffRef.current / 1000}s`);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      backoffRef.current = 10000;
      const data = await res.json();

      // adsb.lol returns { ac: [...], msg: "...", now: ..., total: ... }
      const raw: any[] = data.ac || [];

      // MINIMAL FILTER: only drop if lat or lon is missing
      const states: Aircraft[] = raw
        .filter((s: any) => s.lat != null && s.lon != null && typeof s.lat === 'number' && typeof s.lon === 'number')
        .map((s: any) => {
          const isMil = !!(s.dbFlags && (s.dbFlags & 1));
          const a: Aircraft = {
            icao24: s.hex || '',
            callsign: (s.flight || '').trim(),
            originCountry: s.cou_name || s.cou_iso || '',
            latitude: s.lat,
            longitude: s.lon,
            altitude: s.alt_baro === 'ground' ? 0 : (s.alt_baro || s.alt_geom || 0) * 0.3048, // ft to m
            baroAltitude: s.alt_baro === 'ground' ? 0 : s.alt_baro != null ? s.alt_baro * 0.3048 : undefined,
            geoAltitude: s.alt_geom != null ? s.alt_geom * 0.3048 : undefined,
            velocity: (s.gs || 0) * 0.5144, // knots to m/s
            heading: s.track || s.true_heading || 0,
            verticalRate: s.baro_rate != null ? s.baro_rate * 0.00508 : (s.geom_rate != null ? s.geom_rate * 0.00508 : 0), // ft/min to m/s
            onGround: s.alt_baro === 'ground' || !!s.ground,
            lastContact: s.seen != null ? Math.floor(Date.now() / 1000) - s.seen : 0,
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

          if (classifyMilitary && !isMil) {
            const cls = classifyAircraft(a.callsign, a.velocity, a.altitude);
            if (cls.isMilitary) {
              a.militaryClassification = cls.classification;
              a.isMilitary = true;
            }
          }

          return a;
        });

      if (states.length === 0 && raw.length > 0) {
        console.warn('ADS-B: All aircraft filtered out — check filter logic');
      }

      setAircraft(states);
    } catch (err: any) {
      setError(err.message);
      console.warn('Aircraft fetch failed:', err.message);
      backoffRef.current = Math.min(backoffRef.current * 1.5, 60000);
    } finally {
      setLoading(false);
    }
  }, [enabled, classifyMilitary]);

  useEffect(() => {
    if (!enabled) {
      setAircraft([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchAircraft();
    intervalRef.current = setInterval(fetchAircraft, backoffRef.current);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchAircraft]);

  return { aircraft, loading, error };
}
