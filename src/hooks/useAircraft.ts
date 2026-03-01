import { useState, useEffect, useRef, useCallback } from 'react';
import { Aircraft } from '@/types/globe';

export function useAircraft(enabled: boolean) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const backoffRef = useRef(15000);

  const fetchAircraft = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('https://opensky-network.org/api/states/all');
      if (res.status === 429) {
        backoffRef.current = Math.min(backoffRef.current * 2, 120000);
        console.warn(`OpenSky 429, backing off to ${backoffRef.current / 1000}s`);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      backoffRef.current = 15000;
      const data = await res.json();
      const states: Aircraft[] = (data.states || [])
        .filter((s: any[]) => s[6] != null && s[5] != null)
        .map((s: any[]) => ({
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
        }));
      setAircraft(states);
    } catch (err: any) {
      setError(err.message);
      console.warn('Aircraft fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setAircraft([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchAircraft();
    intervalRef.current = setInterval(() => fetchAircraft(), 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchAircraft]);

  return { aircraft, loading, error };
}
