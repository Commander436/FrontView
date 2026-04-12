import { useState, useEffect, useRef } from 'react';

export interface RadioStation {
  id: string;
  name: string;
  url: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  tags: string;
  bitrate: number;
  favicon: string;
}

const API_BASE = 'https://de1.api.radio-browser.info/json';

export function useRadioStations(enabled: boolean) {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setStations([]);
      fetchedRef.current = false;
      return;
    }
    if (fetchedRef.current) return;

    const fetchStations = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch top-voted stations with geo coordinates, limit to 2000 for performance
        const res = await fetch(`${API_BASE}/stations/search?has_geo_info=true&order=votes&reverse=true&limit=2000&hidebroken=true`, {
          headers: { 'User-Agent': 'FrontView/1.0' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        const parsed: RadioStation[] = data
          .filter((s: any) => s.geo_lat && s.geo_long && s.url_resolved)
          .map((s: any) => ({
            id: s.stationuuid,
            name: s.name?.trim() || 'Unknown Station',
            url: s.url_resolved,
            country: s.country || '',
            countryCode: s.countrycode || '',
            latitude: s.geo_lat,
            longitude: s.geo_long,
            tags: s.tags || '',
            bitrate: s.bitrate || 0,
            favicon: s.favicon || '',
          }));

        setStations(parsed);
        fetchedRef.current = true;
        console.log(`[RADIO] Loaded ${parsed.length} global stations`);
      } catch (err: any) {
        console.warn('[RADIO] Fetch failed:', err.message);
        setError('Radio stations unavailable.');
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [enabled]);

  return { stations, loading, error };
}
