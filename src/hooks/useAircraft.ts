import { useState, useEffect, useRef, useCallback } from 'react';
import { Aircraft } from '@/types/globe';
import { classifyAircraft } from '@/utils/militaryClassification';

// ADSBexchange global feed — free, no key, no signup
const ADSB_URL = 'https://opensky-network.org/api/states/all';

export function useAircraft(enabled: boolean, classifyMilitary: boolean) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const backoffRef = useRef(5000);
  const retryCountRef = useRef(0);

  const fetchAircraft = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(ADSB_URL);
      if (res.status === 429) {
        backoffRef.current = Math.min(backoffRef.current * 2, 120000);
        retryCountRef.current++;
        console.warn(`ADS-B 429, backing off to ${backoffRef.current / 1000}s (retry #${retryCountRef.current})`);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      backoffRef.current = 10000;
      retryCountRef.current = 0;
      const data = await res.json();
      
      // MINIMAL FILTER: only drop if lat or lon is missing
      const states: Aircraft[] = (data.states || [])
        .filter((s: any[]) => s[6] != null && s[5] != null && typeof s[6] === 'number' && typeof s[5] === 'number')
        .map((s: any[]) => {
          const a: Aircraft = {
            icao24: s[0] || '',
            callsign: (s[1] || '').trim(),
            originCountry: s[2] || '',
            latitude: s[6],
            longitude: s[5],
            altitude: s[7] || 0,
            baroAltitude: s[7] || undefined,
            geoAltitude: s[13] || undefined,
            velocity: s[9] || 0,
            heading: s[10] || 0,
            verticalRate: s[11] || 0,
            onGround: s[8] || false,
            lastContact: s[4] || 0,
            squawk: s[14] || undefined,
            positionSource: s[16] === 0 ? 'ADS-B' : s[16] === 1 ? 'ASTERIX' : s[16] === 2 ? 'MLAT' : s[16] === 3 ? 'FLARM' : 'Unknown',
            airline: 'Unknown',
            aircraftType: 'Unknown',
            model: 'Unknown',
            registration: 'Unknown',
            operator: 'Unknown',
            emergency: 'none',
            isMilitary: false,
          };

          // Infer airline from callsign prefix (ICAO airline designator = first 3 chars)
          if (a.callsign && a.callsign.length >= 3) {
            a.airline = a.callsign.substring(0, 3);
          }

          if (classifyMilitary) {
            const cls = classifyAircraft(a.callsign, a.velocity, a.altitude);
            if (cls.isMilitary) {
              a.militaryClassification = cls.classification;
              a.isMilitary = true;
            }
          }

          return a;
        });

      if (states.length === 0 && (data.states || []).length > 0) {
        console.warn('ADS-B: All aircraft filtered out — check filter logic');
      }

      setAircraft(states);
    } catch (err: any) {
      setError(err.message);
      console.warn('Aircraft fetch failed:', err.message);
      // Retry with backoff
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
