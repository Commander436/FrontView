import { useState, useEffect, useRef, useCallback } from 'react';

export interface ThermalAnomaly {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number;
  frp: number; // fire radiative power
  confidence: string;
  acqDate: string;
  acqTime: string;
  satellite: string;
  daynight: string;
}

const FIRMS_URL = 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J2_VIIRS_C2_Global_24h.csv';

function parseCSV(text: string): ThermalAnomaly[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  const results: ThermalAnomaly[] = [];
  // Only take high-confidence detections to reduce noise
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 13) continue;
    const lat = parseFloat(cols[0]);
    const lon = parseFloat(cols[1]);
    const brightness = parseFloat(cols[2]);
    const confidence = cols[8];
    const frp = parseFloat(cols[11]);
    
    if (isNaN(lat) || isNaN(lon)) continue;
    // Only keep nominal+ confidence and significant FRP
    if (confidence === 'low' && frp < 5) continue;
    
    results.push({
      id: `firms-${i}-${lat.toFixed(3)}-${lon.toFixed(3)}`,
      latitude: lat,
      longitude: lon,
      brightness,
      frp: isNaN(frp) ? 0 : frp,
      confidence,
      acqDate: cols[5],
      acqTime: cols[6],
      satellite: cols[7],
      daynight: cols[12],
    });
  }
  return results;
}

export function useFIRMS(enabled: boolean) {
  const [anomalies, setAnomalies] = useState<ThermalAnomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchFIRMS = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(FIRMS_URL);
      if (!res.ok) throw new Error(`FIRMS HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseCSV(text);
      setAnomalies(parsed);
    } catch (err: any) {
      setError(err.message);
      console.warn('FIRMS fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setAnomalies([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchFIRMS();
    // Refresh every 10 minutes
    intervalRef.current = setInterval(fetchFIRMS, 10 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchFIRMS]);

  return { anomalies, loading, error };
}
