import { useState, useEffect, useRef, useCallback } from 'react';
import { ConflictZone } from '@/types/globe';

// Live OSINT feeds — free, no key, public APIs
const GDACS_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?limit=80&from=2024-01-01';
const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50';

interface OSINTEvent {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  severity: 'high' | 'medium' | 'low';
  eventType: 'combat' | 'strike' | 'humanitarian' | 'standoff' | 'thermal';
  summary: string;
  source: string;
  timestamp: string;
}

function mapGDACSType(alertlevel: string): 'high' | 'medium' | 'low' {
  if (alertlevel === 'Red' || alertlevel === 'Orange') return 'high';
  if (alertlevel === 'Yellow') return 'medium';
  return 'low';
}

function mapGDACSEventType(eventtype: string): ConflictZone['eventType'] {
  if (eventtype === 'EQ') return 'strike';
  if (eventtype === 'TC') return 'combat';
  if (eventtype === 'FL') return 'humanitarian';
  if (eventtype === 'VO') return 'thermal';
  if (eventtype === 'WF') return 'thermal';
  return 'standoff';
}

function mapEONETEventType(category: string): ConflictZone['eventType'] {
  if (category.includes('Wildfire') || category.includes('fire')) return 'thermal';
  if (category.includes('Volcano')) return 'thermal';
  if (category.includes('Earthquake') || category.includes('quake')) return 'strike';
  if (category.includes('Storm') || category.includes('Cyclone')) return 'combat';
  if (category.includes('Flood')) return 'humanitarian';
  return 'standoff';
}

export function useOSINT(enabled: boolean) {
  const [events, setEvents] = useState<ConflictZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventsMap = useRef<Map<string, ConflictZone>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchOSINT = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch GDACS + EONET in parallel
      const results = await Promise.allSettled([
        fetch(GDACS_URL).then(r => {
          if (!r.ok) throw new Error(`GDACS HTTP ${r.status}`);
          return r.json();
        }),
        fetch(EONET_URL).then(r => {
          if (!r.ok) throw new Error(`EONET HTTP ${r.status}`);
          return r.json();
        }),
      ]);

      let newEvents = 0;

      // Parse GDACS
      if (results[0].status === 'fulfilled') {
        const gdacs = results[0].value;
        const features = gdacs?.features || [];
        features.forEach((f: any) => {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates;
          if (!coords || coords.length < 2) return;
          const id = `gdacs-${props.eventid || props.glide || Math.random()}`;
          const event: ConflictZone = {
            name: props.name || props.eventname || 'GDACS Event',
            region: props.country || 'Unknown',
            countries: props.country ? [props.country] : [],
            latitude: coords[1],
            longitude: coords[0],
            radius: 0,
            severity: mapGDACSType(props.alertlevel),
            eventType: mapGDACSEventType(props.eventtype),
            summary: props.description || props.htmldescription || `${props.eventtype} event`,
            source: 'GDACS',
            timestamp: props.fromdate || new Date().toISOString(),
          };
          eventsMap.current.set(id, event);
          newEvents++;
        });
        console.log(`[OSINT] GDACS: ${features.length} events ingested`);
      } else {
        console.warn('[OSINT] GDACS fetch failed:', results[0].reason);
      }

      // Parse EONET (NASA)
      if (results[1].status === 'fulfilled') {
        const eonet = results[1].value;
        const events = eonet?.events || [];
        events.forEach((e: any) => {
          const geo = e.geometry?.[e.geometry.length - 1];
          if (!geo?.coordinates || geo.coordinates.length < 2) return;
          const catName = e.categories?.[0]?.title || 'Unknown';
          const id = `eonet-${e.id}`;
          const event: ConflictZone = {
            name: e.title || 'NASA EONET Event',
            region: '',
            countries: [],
            latitude: geo.coordinates[1],
            longitude: geo.coordinates[0],
            radius: 0,
            severity: 'medium',
            eventType: mapEONETEventType(catName),
            summary: `${catName} — ${e.title}`,
            source: 'NASA EONET',
            timestamp: geo.date || new Date().toISOString(),
          };
          eventsMap.current.set(id, event);
          newEvents++;
        });
        console.log(`[OSINT] EONET: ${events.length} events ingested`);
      } else {
        console.warn('[OSINT] EONET fetch failed:', results[1].reason);
      }

      // Prune events older than 72 hours
      const cutoff = Date.now() - 72 * 60 * 60 * 1000;
      for (const [id, evt] of eventsMap.current) {
        if (evt.timestamp && new Date(evt.timestamp).getTime() < cutoff) {
          eventsMap.current.delete(id);
        }
      }

      const allEvents = Array.from(eventsMap.current.values());
      console.log(`[OSINT] Total active events: ${allEvents.length}`);

      if (allEvents.length === 0 && results.every(r => r.status === 'rejected')) {
        setError('OSINT feed temporarily unavailable');
      }

      setEvents(allEvents);
    } catch (err: any) {
      console.warn('[OSINT ERROR]', err.message);
      setError('OSINT feed temporarily unavailable');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      return;
    }

    fetchOSINT();
    intervalRef.current = setInterval(fetchOSINT, 10 * 60 * 1000); // 10 min

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchOSINT]);

  return { events, loading, error };
}
