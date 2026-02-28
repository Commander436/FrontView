import { SelectedEntity, Aircraft, SatelliteData, City, MilitaryBase, ConflictZone, Ship } from '@/types/globe';
import { X, Plane, Satellite, Building2, Swords, Anchor, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DetailPanelProps {
  entity: SelectedEntity;
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-center py-1 border-b border-border/50">
      <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</span>
      <span className="text-foreground text-xs font-mono">{value}</span>
    </div>
  );
}

function WeatherInfo({ lat, lon }: { lat: number; lon: number }) {
  const [weather, setWeather] = useState<any>(null);
  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
      .then(r => r.json())
      .then(d => setWeather(d.current_weather))
      .catch(() => {});
  }, [lat, lon]);
  if (!weather) return <div className="text-muted-foreground text-[10px]">Loading weather…</div>;
  return (
    <>
      <InfoRow label="Temperature" value={`${weather.temperature}°C`} />
      <InfoRow label="Wind Speed" value={`${weather.windspeed} km/h`} />
      <InfoRow label="Wind Dir" value={`${weather.winddirection}°`} />
    </>
  );
}

function getIcon(type: string) {
  switch (type) {
    case 'aircraft': return <Plane className="w-4 h-4" />;
    case 'satellite': return <Satellite className="w-4 h-4" />;
    case 'city': return <MapPin className="w-4 h-4" />;
    case 'base': return <Building2 className="w-4 h-4" />;
    case 'conflict': return <Swords className="w-4 h-4" />;
    case 'ship': return <Anchor className="w-4 h-4" />;
    default: return null;
  }
}

function getTitle(entity: SelectedEntity): string {
  const d = entity.data;
  switch (entity.type) {
    case 'aircraft': return (d as Aircraft).callsign || (d as Aircraft).icao24;
    case 'satellite': return (d as SatelliteData).name;
    case 'city': return (d as City).name;
    case 'base': return (d as MilitaryBase).name;
    case 'conflict': return (d as ConflictZone).name;
    case 'ship': return (d as Ship).name;
    default: return 'Unknown';
  }
}

function renderDetails(entity: SelectedEntity) {
  const d = entity.data;
  switch (entity.type) {
    case 'aircraft': {
      const a = d as Aircraft;
      return (
        <>
          <InfoRow label="Callsign" value={a.callsign} />
          <InfoRow label="ICAO24" value={a.icao24} />
          <InfoRow label="Country" value={a.originCountry} />
          <InfoRow label="Altitude" value={`${Math.round(a.altitude)} m`} />
          <InfoRow label="Speed" value={`${Math.round(a.velocity)} m/s`} />
          <InfoRow label="Heading" value={`${Math.round(a.heading)}°`} />
          <InfoRow label="Last Contact" value={new Date(a.lastContact * 1000).toUTCString()} />
        </>
      );
    }
    case 'satellite': {
      const s = d as SatelliteData;
      return (
        <>
          <InfoRow label="Name" value={s.name} />
          <InfoRow label="Altitude" value={`${Math.round(s.altitude)} km`} />
          <InfoRow label="Lat" value={s.latitude.toFixed(4)} />
          <InfoRow label="Lon" value={s.longitude.toFixed(4)} />
        </>
      );
    }
    case 'city': {
      const c = d as City;
      const localTime = new Date().toLocaleTimeString('en-US', { timeZone: c.timezone, hour12: false });
      return (
        <>
          <InfoRow label="Country" value={c.country} />
          <InfoRow label="Population" value={c.population.toLocaleString()} />
          <InfoRow label="Timezone" value={c.timezone} />
          <InfoRow label="Local Time" value={localTime} />
          <p className="text-muted-foreground text-[10px] mt-2">{c.description}</p>
          <div className="mt-2 border-t border-border pt-2">
            <span className="text-[10px] text-primary uppercase tracking-wider">Weather</span>
            <WeatherInfo lat={c.latitude} lon={c.longitude} />
          </div>
        </>
      );
    }
    case 'base': {
      const b = d as MilitaryBase;
      return (
        <>
          <InfoRow label="Country" value={b.country} />
          <InfoRow label="Branch" value={b.branch} />
          <p className="text-muted-foreground text-[10px] mt-2">{b.description}</p>
        </>
      );
    }
    case 'conflict': {
      const z = d as ConflictZone;
      return (
        <>
          <InfoRow label="Region" value={z.region} />
          <InfoRow label="Severity" value={z.severity.toUpperCase()} />
          <p className="text-muted-foreground text-[10px] mt-2">{z.summary}</p>
        </>
      );
    }
    case 'ship': {
      const sh = d as Ship;
      return (
        <>
          <InfoRow label="MMSI" value={sh.mmsi} />
          <InfoRow label="Type" value={sh.type.toUpperCase()} />
          <InfoRow label="Speed" value={`${sh.speed} kn`} />
          <InfoRow label="Course" value={`${sh.course}°`} />
          <InfoRow label="Last Update" value={new Date(sh.lastUpdate).toUTCString()} />
        </>
      );
    }
  }
}

export function DetailPanel({ entity, onClose }: DetailPanelProps) {
  const severityColor = entity.type === 'conflict'
    ? (entity.data as ConflictZone).severity === 'high' ? 'text-neon-red' : 'text-neon-amber'
    : 'text-primary';

  return (
    <div className="animate-fade-in border border-border rounded bg-card p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={severityColor}>{getIcon(entity.type)}</span>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{entity.type}</div>
            <div className="text-sm font-display font-semibold text-foreground">{getTitle(entity)}</div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-0.5">{renderDetails(entity)}</div>
    </div>
  );
}
