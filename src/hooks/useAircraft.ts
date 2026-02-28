import { useState, useEffect, useRef } from 'react';
import { Aircraft } from '@/types/globe';

export function useAircraft(enabled: boolean) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!enabled) {
      setAircraft([]);
      return;
    }

    const fetchAircraft = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('https://opensky-network.org/api/states/all');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const states: Aircraft[] = (data.states || [])
          .map((s: any[]) => ({
            icao24: s[0],
            callsign: (s[1] || '').trim(),
            originCountry: s[2],
            latitude: s[6],
            longitude: s[5],
            altitude: s[7] || 0,
            velocity: s[9] || 0,
            heading: s[10] || 0,
            onGround: s[8],
            lastContact: s[4],
          }))
          .filter((a: Aircraft) => a.latitude != null && a.longitude != null && !a.onGround);
        setAircraft(states);
        setLastUpdate(new Date());
      } catch (err: any) {
        setError(err.message);
        console.warn('Aircraft fetch failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAircraft();
    intervalRef.current = setInterval(fetchAircraft, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);

  return { aircraft, loading, error, lastUpdate };
}
