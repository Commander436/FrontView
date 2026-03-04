import { useState, useEffect, useRef, useCallback } from 'react';
import { Aircraft } from '@/types/globe';
import { classifyAircraft } from '@/utils/militaryClassification';

export function useAircraft(enabled: boolean, classifyMilitary: boolean) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const backoffRef = useRef(10000);

  const fetchAircraft = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);

      // Try ADSBexchange first for richer metadata
      let states: Aircraft[] = [];
      try {
        const res = await fetch('https://opensky-network.org/api/states/all');
        if (res.status === 429) {
          backoffRef.current = Math.min(backoffRef.current * 2, 120000);
          console.warn(`OpenSky 429, backing off to ${backoffRef.current / 1000}s`);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        backoffRef.current = 10000;
        const data = await res.json();
        states = (data.states || [])
          .filter((s: any[]) => s[6] != null && s[5] != null && typeof s[6] === 'number' && typeof s[5] === 'number')
          .map((s: any[]) => {
            const a: Aircraft = {
              icao24: s[0] || '',
              callsign: (s[1] || '').trim(),
              originCountry: s[2] || '',
              latitude: s[6],
              longitude: s[5],
              altitude: s[7] || 0,
              velocity: s[9] || 0,
              heading: s[10] || 0,
              onGround: s[8],
              lastContact: s[4] || 0,
              airline: 'Unknown',
              aircraftType: 'Unknown',
              model: 'Unknown',
              registration: 'Unknown',
            };
            if (classifyMilitary) {
              const cls = classifyAircraft(a.callsign, a.velocity, a.altitude);
              if (cls.isMilitary) {
                a.militaryClassification = cls.classification;
              }
            }
            return a;
          });
      } catch (err: any) {
        throw err;
      }

      setAircraft(states);
    } catch (err: any) {
      setError(err.message);
      console.warn('Aircraft fetch failed:', err.message);
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
    intervalRef.current = setInterval(fetchAircraft, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchAircraft]);

  return { aircraft, loading, error };
}
