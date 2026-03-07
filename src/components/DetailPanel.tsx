import { SelectedEntity, Aircraft, SatelliteData, City, MilitaryBase, ConflictZone, Ship, InfrastructureItem, GPSInterferenceZone, InternetBlackout, AirspaceClosure, LiveCamera } from '@/types/globe';
import { Plane, Satellite, Building2, Swords, Anchor, MapPin, Zap, Radio, SignalZero, WifiOff, ShieldAlert, Camera, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DetailPanelProps {
  entity: SelectedEntity;
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-center py-1 border-b border-border/20">
      <span className="text-muted-foreground text-[9px] uppercase tracking-wider">{label}</span>
      <span className="text-foreground text-[10px] font-mono">{value}</span>
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
  if (!weather) return <div className="text-muted-foreground text-[9px]">Loading weather…</div>;
  return (
    <>
      <InfoRow label="Temp" value={`${weather.temperature}°C`} />
      <InfoRow label="Wind" value={`${weather.windspeed} km/h`} />
      <InfoRow label="Dir" value={`${weather.winddirection}°`} />
    </>
  );
}

function getIcon(type: string) {
  const cls = "w-4 h-4";
  switch (type) {
    case 'aircraft': return <Plane className={cls} />;
    case 'satellite': return <Satellite className={cls} />;
    case 'city': return <MapPin className={cls} />;
    case 'base': return <Building2 className={cls} />;
    case 'conflict': return <Swords className={cls} />;
    case 'ship': return <Anchor className={cls} />;
    case 'infrastructure': return <Zap className={cls} />;
    case 'gps_interference': return <SignalZero className={cls} />;
    case 'internet_blackout': return <WifiOff className={cls} />;
    case 'airspace_closure': return <ShieldAlert className={cls} />;
    case 'live_camera': return <Camera className={cls} />;
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
    case 'infrastructure': return (d as InfrastructureItem).name;
    case 'gps_interference': return (d as GPSInterferenceZone).name;
    case 'internet_blackout': return `${(d as InternetBlackout).country} Blackout`;
    case 'airspace_closure': return (d as AirspaceClosure).name;
    case 'live_camera': return (d as LiveCamera).name;
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
          <InfoRow label="Callsign" value={a.callsign || 'N/A'} />
          <InfoRow label="ICAO24" value={a.icao24} />
          <InfoRow label="Country" value={a.originCountry} />
          <InfoRow label="Airline" value={a.airline || 'Unknown'} />
          <InfoRow label="Type" value={a.aircraftType || 'Unknown'} />
          <InfoRow label="Model" value={a.model || 'Unknown'} />
          <InfoRow label="Registration" value={a.registration || 'Unknown'} />
          <InfoRow label="Altitude" value={`${Math.round(a.altitude)} m`} />
          <InfoRow label="Speed" value={`${Math.round(a.velocity)} m/s`} />
          <InfoRow label="Heading" value={`${Math.round(a.heading)}°`} />
          {a.militaryClassification && (
            <div className="mt-2 border-t border-border/20 pt-2">
              <span className="text-[9px] text-orange-400 uppercase tracking-wider font-display">Military Intel</span>
              <InfoRow label="Classification" value={a.militaryClassification.toUpperCase()} />
            </div>
          )}
          <InfoRow label="Last Contact" value={new Date(a.lastContact * 1000).toUTCString()} />
        </>
      );
    }
    case 'satellite': {
      const s = d as SatelliteData;
      return (
        <>
          <InfoRow label="Name" value={s.name} />
          <InfoRow label="NORAD" value={s.noradId} />
          <InfoRow label="Altitude" value={`${Math.round(s.altitude)} km`} />
          <InfoRow label="Lat" value={s.latitude.toFixed(4)} />
          <InfoRow label="Lon" value={s.longitude.toFixed(4)} />
        </>
      );
    }
    case 'city': {
      const c = d as City;
      let localTime = '';
      try {
        localTime = new Date().toLocaleTimeString('en-US', { timeZone: c.timezone, hour12: false });
      } catch { localTime = 'N/A'; }
      return (
        <>
          <InfoRow label="Country" value={c.country} />
          <InfoRow label="Population" value={c.population.toLocaleString()} />
          <InfoRow label="Tier" value={`Tier ${c.tier}`} />
          <InfoRow label="Timezone" value={c.timezone} />
          <InfoRow label="Local Time" value={localTime} />
          <div className="mt-2 border-t border-border/20 pt-2">
            <span className="text-[9px] text-primary uppercase tracking-wider font-display">Intel Summary</span>
            <p className="text-muted-foreground text-[9px] mt-1 leading-relaxed whitespace-pre-line">{c.description}</p>
          </div>
          <div className="mt-2 border-t border-border/20 pt-2">
            <span className="text-[9px] text-primary uppercase tracking-wider font-display">Weather</span>
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
          <div className="mt-2 border-t border-border/20 pt-2">
            <span className="text-[9px] text-neon-green uppercase tracking-wider font-display">Intel Briefing</span>
            <p className="text-muted-foreground text-[9px] mt-1 leading-relaxed whitespace-pre-line">{b.description}</p>
          </div>
        </>
      );
    }
    case 'conflict': {
      const z = d as ConflictZone;
      return (
        <>
          <InfoRow label="Region" value={z.region} />
          <InfoRow label="Severity" value={z.severity.toUpperCase()} />
          <InfoRow label="Event Type" value={(z.eventType || 'combat').toUpperCase()} />
          <InfoRow label="Countries" value={z.countries.join(', ')} />
          {z.source && <InfoRow label="Source" value={z.source} />}
          {z.timestamp && <InfoRow label="Timestamp" value={new Date(z.timestamp).toUTCString()} />}
          <p className="text-muted-foreground text-[9px] mt-2 leading-relaxed">{z.summary}</p>
          {z.recentDevelopments && (
            <div className="mt-2 border-t border-border/20 pt-2">
              <span className="text-[9px] text-destructive uppercase tracking-wider font-display">Recent Intel</span>
              <p className="text-muted-foreground text-[9px] mt-1 leading-relaxed">{z.recentDevelopments}</p>
            </div>
          )}
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
    case 'infrastructure': {
      const inf = d as InfrastructureItem;
      return (
        <>
          <InfoRow label="Type" value={inf.type.replace(/_/g, ' ').toUpperCase()} />
          <InfoRow label="Category" value={inf.category.toUpperCase()} />
          <InfoRow label="Country" value={inf.country} />
          <div className="mt-2 border-t border-border/20 pt-2">
            <span className="text-[9px] text-primary uppercase tracking-wider font-display">Intel Dossier</span>
            <p className="text-muted-foreground text-[9px] mt-1 leading-relaxed whitespace-pre-line">{inf.description}</p>
          </div>
        </>
      );
    }
    case 'gps_interference': {
      const g = d as GPSInterferenceZone;
      return (
        <>
          <InfoRow label="Region" value={g.region} />
          <InfoRow label="Severity" value={g.severity.toUpperCase()} />
          <InfoRow label="Type" value={g.type.toUpperCase()} />
          <InfoRow label="Score" value={`${(g.interferenceScore * 100).toFixed(0)}%`} />
          <InfoRow label="Source" value={g.source} />
          <InfoRow label="Last Updated" value={g.lastUpdated} />
          <div className="mt-2 border-t border-border/20 pt-2">
            <span className="text-[9px] text-orange-400 uppercase tracking-wider font-display">SIGINT Analysis</span>
            <p className="text-muted-foreground text-[9px] mt-1 leading-relaxed whitespace-pre-line">{g.description}</p>
          </div>
        </>
      );
    }
    case 'internet_blackout': {
      const ib = d as InternetBlackout;
      return (
        <>
          <InfoRow label="Country" value={ib.country} />
          <InfoRow label="Region" value={ib.region} />
          <InfoRow label="Connectivity Drop" value={`${ib.connectivityDrop}%`} />
          <InfoRow label="Severity" value={ib.severity.toUpperCase()} />
          <InfoRow label="Source" value={ib.source} />
          <InfoRow label="Duration" value={ib.duration} />
          <InfoRow label="Last Updated" value={ib.lastUpdated} />
          <div className="mt-2 border-t border-border/20 pt-2">
            <span className="text-[9px] text-red-400 uppercase tracking-wider font-display">Cyber Intel</span>
            <p className="text-muted-foreground text-[9px] mt-1 leading-relaxed whitespace-pre-line">{ib.description}</p>
          </div>
        </>
      );
    }
    case 'airspace_closure': {
      const ac = d as AirspaceClosure;
      const statusColor = ac.status === 'active' ? 'text-red-400' : ac.status === 'inactive' ? 'text-green-400' : 'text-yellow-400';
      return (
        <>
          <InfoRow label="Airspace ID" value={ac.name} />
          <InfoRow label="Type" value={ac.type.toUpperCase()} />
          <InfoRow label="Lower Limit" value={ac.lowerLimit} />
          <InfoRow label="Upper Limit" value={ac.upperLimit} />
          <div className="flex justify-between items-center py-1 border-b border-border/20">
            <span className="text-muted-foreground text-[9px] uppercase tracking-wider">Status</span>
            <span className={`text-[10px] font-mono font-bold ${statusColor}`}>{ac.status.toUpperCase()}</span>
          </div>
          {ac.validFrom && <InfoRow label="Valid From" value={new Date(ac.validFrom).toUTCString()} />}
          {ac.validTo && <InfoRow label="Valid To" value={new Date(ac.validTo).toUTCString()} />}
          <InfoRow label="Source" value={ac.source} />
          <div className="mt-2 border-t border-border/20 pt-2">
            <span className="text-[9px] text-rose-400 uppercase tracking-wider font-display">Airspace Intel</span>
            <p className="text-muted-foreground text-[9px] mt-1 leading-relaxed whitespace-pre-line">{ac.description}</p>
          </div>
        </>
      );
    }
    case 'live_camera': {
      const cam = d as LiveCamera;
      const statusColor = cam.status === 'online' ? 'text-green-400' : 'text-red-400';
      return (
        <>
          <InfoRow label="Type" value={cam.type.toUpperCase()} />
          <InfoRow label="Location" value={`${cam.city}, ${cam.country}`} />
          <InfoRow label="Provider" value={cam.provider} />
          <div className="flex justify-between items-center py-1 border-b border-border/20">
            <span className="text-muted-foreground text-[9px] uppercase tracking-wider">Status</span>
            <span className={`text-[10px] font-mono font-bold ${statusColor}`}>
              {cam.status === 'online' ? '● ONLINE' : '○ OFFLINE'}
            </span>
          </div>
          <div className="mt-2 border-t border-border/20 pt-2">
            <span className="text-[9px] text-emerald-400 uppercase tracking-wider font-display">Camera Intel</span>
            <p className="text-muted-foreground text-[9px] mt-1 leading-relaxed whitespace-pre-line">{cam.description}</p>
          </div>
          {cam.status === 'online' && (
            <a
              href={cam.streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-display uppercase tracking-wider hover:bg-emerald-500/30 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open Live Feed
            </a>
          )}
        </>
      );
    }
  }
}

export function DetailPanel({ entity, onClose }: DetailPanelProps) {
  const severityColor = entity.type === 'conflict'
    ? (entity.data as ConflictZone).severity === 'high' ? 'text-destructive' : 'text-neon-amber'
    : entity.type === 'aircraft' && (entity.data as Aircraft).militaryClassification
      ? 'text-orange-400'
      : entity.type === 'gps_interference'
        ? 'text-orange-400'
        : entity.type === 'internet_blackout'
          ? 'text-red-400'
          : entity.type === 'airspace_closure'
            ? 'text-rose-400'
            : entity.type === 'live_camera'
              ? 'text-emerald-400'
              : 'text-primary';

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2 mb-3">
        <span className={severityColor}>{getIcon(entity.type)}</span>
        <div>
          <div className="text-[8px] uppercase tracking-wider text-muted-foreground">{entity.type.replace(/_/g, ' ')}</div>
          <div className="text-xs font-display font-semibold text-foreground">{getTitle(entity)}</div>
        </div>
      </div>
      {renderDetails(entity)}
    </div>
  );
}
