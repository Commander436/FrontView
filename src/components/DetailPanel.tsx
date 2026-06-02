import { SelectedEntity, Aircraft, SatelliteData, City, MilitaryBase, ConflictZone, Ship, InfrastructureItem, GPSInterferenceZone, InternetBlackout, AirspaceClosure } from '@/types/globe';
import { Plane, Satellite, Building2, Swords, Anchor, MapPin, Zap, SignalZero, WifiOff, ShieldAlert, Shield, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnnotationDetail } from './AnnotationDetail';
import { Annotation, AnnotationColor, LineStyle, PointIcon } from '@/types/annotations';

interface DetailPanelProps {
  entity: SelectedEntity;
  onClose: () => void;
  onAnnotationColor?: (id: string, color: AnnotationColor) => void;
  onAnnotationRename?: (id: string, title: string) => void;
  onAnnotationStyle?: (id: string, style: LineStyle) => void;
  onAnnotationIcon?: (id: string, icon: PointIcon) => void;
  onAnnotationDelete?: (id: string) => void;
}

function InfoRow({ label, value, highlight }: { label: string; value: string | number | undefined; highlight?: boolean }) {
  if (value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/10">
      <span className="text-muted-foreground text-[9px] uppercase tracking-wider font-display">{label}</span>
      <span className={`text-[10px] font-mono ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-display uppercase tracking-wider border ${color}`}>
      {text}
    </span>
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
  if (!weather) return <div className="text-muted-foreground text-[9px] animate-pulse">Loading weather…</div>;
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
    case 'building': return <Building2 className={cls} />;
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
    case 'building': return (d as any).name || 'Building';
    default: return 'Unknown';
  }
}

function SectionHeader({ label, color = 'text-foreground/70' }: { label: string; color?: string }) {
  return (
    <div className="mt-3 mb-1 border-t border-foreground/10 pt-2">
      <span className={`text-[9px] ${color} uppercase tracking-[0.15em] font-display`}>{label}</span>
    </div>
  );
}

function renderDetails(entity: SelectedEntity) {
  const d = entity.data;
  switch (entity.type) {
    case 'aircraft': {
      const a = d as Aircraft;
      return (
        <>
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {a.isMilitary && <Badge text="MIL" color="border-orange-500/50 text-orange-400 bg-orange-500/10" />}
            {a.onGround && <Badge text="ON GROUND" color="border-muted-foreground/30 text-muted-foreground bg-muted/20" />}
            {a.emergency && a.emergency !== 'none' && (
              <Badge text={`EMERGENCY: ${a.emergency}`} color="border-destructive/50 text-destructive bg-destructive/10" />
            )}
            <Badge
              text={a.positionSource || 'ADS-B'}
              color="border-foreground/20 text-foreground/70 bg-foreground/5"
            />
          </div>

          <SectionHeader label="Identity" />
          <InfoRow label="Callsign" value={a.callsign || 'N/A'} highlight />
          <InfoRow label="ICAO24" value={a.icao24} />
          <InfoRow label="Registration" value={a.registration} />
          <InfoRow label="Airline / Operator" value={a.operator !== 'Unknown' ? a.operator : a.airline} />
          <InfoRow label="Aircraft Type" value={a.aircraftType} />
          <InfoRow label="Model" value={a.model} />
          <InfoRow label="Country" value={a.originCountry} />

          <SectionHeader label="Flight Data" />
          <InfoRow label="Altitude (Baro)" value={a.baroAltitude != null ? `${Math.round(a.baroAltitude)} m` : 'Unknown'} />
          <InfoRow label="Altitude (Geo)" value={a.geoAltitude != null ? `${Math.round(a.geoAltitude)} m` : 'Unknown'} />
          <InfoRow label="Ground Speed" value={`${Math.round(a.velocity)} m/s (${Math.round(a.velocity * 1.944)} kts)`} />
          <InfoRow label="Vertical Rate" value={a.verticalRate != null ? `${a.verticalRate > 0 ? '+' : ''}${Math.round(a.verticalRate)} m/s` : 'Unknown'} />
          <InfoRow label="True Airspeed" value={a.trueAirspeed != null ? `${Math.round(a.trueAirspeed)} m/s` : 'Unknown'} />
          <InfoRow label="Mach" value={a.mach != null ? a.mach.toFixed(3) : 'Unknown'} />
          <InfoRow label="Heading" value={`${Math.round(a.heading)}°`} />
          <InfoRow label="Squawk" value={a.squawk || 'Unknown'} />

          <SectionHeader label="Position" />
          <InfoRow label="Latitude" value={a.latitude.toFixed(5)} />
          <InfoRow label="Longitude" value={a.longitude.toFixed(5)} />
          <InfoRow label="On Ground" value={a.onGround ? 'Yes' : 'No'} />
          <InfoRow label="Position Source" value={a.positionSource || 'Unknown'} />

          <SectionHeader label="Route" />
          <InfoRow label="Destination" value={a.route || 'Unknown'} />

          {a.militaryClassification && (
            <>
              <SectionHeader label="Military Intelligence" color="text-orange-400" />
              <InfoRow label="Classification" value={a.militaryClassification.toUpperCase()} highlight />
            </>
          )}
        </>
      );
    }
    case 'satellite': {
      const s = d as SatelliteData;
      return (
        <>
          <InfoRow label="Name" value={s.name} highlight />
          <InfoRow label="NORAD ID" value={s.noradId} />
          <InfoRow label="Altitude" value={`${Math.round(s.altitude)} km`} />
          <InfoRow label="Latitude" value={s.latitude.toFixed(4)} />
          <InfoRow label="Longitude" value={s.longitude.toFixed(4)} />
          <SectionHeader label="TLE Data" />
          <div className="text-[8px] font-mono text-muted-foreground break-all leading-relaxed">
            <div>{s.tle1}</div>
            <div>{s.tle2}</div>
          </div>
        </>
      );
    }
    case 'city': {
      const c = d as City;
      let localTime = '';
      try { localTime = new Date().toLocaleTimeString('en-US', { timeZone: c.timezone, hour12: false }); } catch { localTime = 'N/A'; }
      return (
        <>
          <InfoRow label="Country" value={c.country} />
          <InfoRow label="Population" value={c.population.toLocaleString()} highlight />
          <InfoRow label="Tier" value={`Tier ${c.tier}`} />
          <InfoRow label="Timezone" value={c.timezone} />
          <InfoRow label="Local Time" value={localTime} />
          <SectionHeader label="Intel Summary" />
          <p className="text-muted-foreground text-[9px] leading-relaxed whitespace-pre-line">{c.description}</p>
          <SectionHeader label="Weather" />
          <WeatherInfo lat={c.latitude} lon={c.longitude} />
        </>
      );
    }
    case 'base': {
      const b = d as MilitaryBase;
      return (
        <>
          <InfoRow label="Country" value={b.country} />
          <InfoRow label="Branch" value={b.branch} highlight />
          <SectionHeader label="Intel Briefing" color="text-accent" />
          <p className="text-muted-foreground text-[9px] leading-relaxed whitespace-pre-line">{b.description}</p>
        </>
      );
    }
    case 'conflict': {
      const z = d as ConflictZone;
      return (
        <>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Badge text={z.severity} color={z.severity === 'high' ? 'border-destructive/50 text-destructive bg-destructive/10' : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'} />
            <Badge text={z.eventType} color="border-orange-500/30 text-orange-400 bg-orange-500/5" />
          </div>
          <InfoRow label="Region" value={z.region} />
          <InfoRow label="Countries" value={z.countries.join(', ')} />
          {z.source && <InfoRow label="Source" value={z.source} />}
          {z.timestamp && <InfoRow label="Timestamp" value={new Date(z.timestamp).toUTCString()} />}
          <SectionHeader label="Situation Report" color="text-destructive" />
          <p className="text-muted-foreground text-[9px] leading-relaxed">{z.summary}</p>
          {z.recentDevelopments && (
            <>
              <SectionHeader label="Recent Intel" color="text-destructive" />
              <p className="text-muted-foreground text-[9px] leading-relaxed">{z.recentDevelopments}</p>
            </>
          )}
        </>
      );
    }
    case 'ship': {
      const sh = d as Ship;
      return (
        <>
          <InfoRow label="Name" value={sh.name} highlight />
          <InfoRow label="MMSI" value={sh.mmsi} />
          <InfoRow label="Type" value={sh.type.toUpperCase()} highlight />
          {sh.destination && <InfoRow label="Destination" value={sh.destination} />}
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
          <InfoRow label="Type" value={inf.type.replace(/_/g, ' ').toUpperCase()} highlight />
          <InfoRow label="Category" value={inf.category.toUpperCase()} />
          <InfoRow label="Country" value={inf.country} />
          <SectionHeader label="Intel Dossier" />
          <p className="text-muted-foreground text-[9px] leading-relaxed whitespace-pre-line">{inf.description}</p>
        </>
      );
    }
    case 'gps_interference': {
      const g = d as GPSInterferenceZone;
      return (
        <>
          <Badge text={`${(g.interferenceScore * 100).toFixed(0)}% interference`} color="border-orange-500/50 text-orange-400 bg-orange-500/10" />
          <InfoRow label="Region" value={g.region} />
          <InfoRow label="Severity" value={g.severity.toUpperCase()} highlight />
          <InfoRow label="Type" value={g.type.toUpperCase()} />
          <InfoRow label="Source" value={g.source} />
          <InfoRow label="Last Updated" value={g.lastUpdated} />
          <SectionHeader label="SIGINT Analysis" color="text-orange-400" />
          <p className="text-muted-foreground text-[9px] leading-relaxed whitespace-pre-line">{g.description}</p>
        </>
      );
    }
    case 'internet_blackout': {
      const ib = d as InternetBlackout;
      return (
        <>
          <Badge text={ib.severity} color="border-destructive/50 text-destructive bg-destructive/10" />
          <InfoRow label="Country" value={ib.country} />
          <InfoRow label="Region" value={ib.region} />
          <InfoRow label="Connectivity Drop" value={`${ib.connectivityDrop}%`} highlight />
          <InfoRow label="Source" value={ib.source} />
          <InfoRow label="Duration" value={ib.duration} />
          <InfoRow label="Last Updated" value={ib.lastUpdated} />
          <SectionHeader label="Cyber Intel" color="text-destructive" />
          <p className="text-muted-foreground text-[9px] leading-relaxed whitespace-pre-line">{ib.description}</p>
        </>
      );
    }
    case 'airspace_closure': {
      const ac = d as AirspaceClosure;
      return (
        <>
          <Badge
            text={ac.status}
            color={ac.status === 'active' ? 'border-destructive/50 text-destructive bg-destructive/10' : ac.status === 'inactive' ? 'border-accent/50 text-accent bg-accent/10' : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'}
          />
          <InfoRow label="Type" value={ac.type.toUpperCase()} />
          <InfoRow label="Lower Limit" value={ac.lowerLimit} />
          <InfoRow label="Upper Limit" value={ac.upperLimit} />
          {ac.validFrom && <InfoRow label="Valid From" value={new Date(ac.validFrom).toUTCString()} />}
          {ac.validTo && <InfoRow label="Valid To" value={new Date(ac.validTo).toUTCString()} />}
          <InfoRow label="Source" value={ac.source} />
          <SectionHeader label="Airspace Intel" color="text-rose-400" />
          <p className="text-muted-foreground text-[9px] leading-relaxed whitespace-pre-line">{ac.description}</p>
        </>
      );
    }
    case 'building': {
      const b = d as { name: string; buildingType: string; height: string; address: string; operator: string; constructionYear: string };
      return (
        <>
          <SectionHeader label="Building Intelligence" />
          <InfoRow label="Name" value={b.name} highlight />
          <InfoRow label="Building Type" value={b.buildingType} />
          <InfoRow label="Height" value={b.height} />
          <InfoRow label="Address" value={b.address} />
          <InfoRow label="Operator / Owner" value={b.operator} />
          <InfoRow label="Construction Year" value={b.constructionYear} />
        </>
      );
    }
  }
}

export function DetailPanel({ entity, onClose, onAnnotationColor, onAnnotationRename, onAnnotationStyle, onAnnotationIcon, onAnnotationDelete }: DetailPanelProps) {
  // Annotations have their own dedicated layout (no shared header).
  if (entity.type === 'annotation') {
    return (
      <AnnotationDetail
        annotation={entity.data as Annotation}
        onChangeColor={(id, c) => onAnnotationColor?.(id, c)}
        onRename={(id, t) => onAnnotationRename?.(id, t)}
        onChangeStyle={(id, s) => onAnnotationStyle?.(id, s)}
        onChangeIcon={(id, i) => onAnnotationIcon?.(id, i)}
        onDelete={(id) => onAnnotationDelete?.(id)}
      />
    );
  }

  const severityColor =
    entity.type === 'conflict' ? ((entity.data as ConflictZone).severity === 'high' ? 'text-destructive' : 'text-yellow-400')
    : entity.type === 'aircraft' && (entity.data as Aircraft).isMilitary ? 'text-orange-400'
    : entity.type === 'gps_interference' ? 'text-orange-400'
    : entity.type === 'internet_blackout' ? 'text-destructive'
    : entity.type === 'airspace_closure' ? 'text-rose-400'
    : 'text-foreground';

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`p-1.5 rounded-lg bg-secondary/50 ${severityColor}`}>
          {getIcon(entity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground font-display">{entity.type.replace(/_/g, ' ')}</div>
          <div className="text-xs font-display font-semibold text-foreground truncate">{getTitle(entity)}</div>
        </div>
      </div>
      {renderDetails(entity)}
    </div>
  );
}
