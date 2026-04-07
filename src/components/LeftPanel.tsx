import { LayerVisibility, DisplayMode, DensityMode } from '@/types/globe';
import {
  Shield, Wifi, Clock, Plane, Anchor, Satellite,
  Swords, MapPin, Eye, CloudRain, Crosshair,
  ChevronLeft, ChevronRight, Car, Building, Layers,
  Zap, Radio, Ship, Factory, ChevronDown,
  Navigation, Globe, Box, BarChart3,
  WifiOff, SignalZero, Camera, ShieldAlert,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface LeftPanelProps {
  layers: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  displayMode: DisplayMode;
  onSetDisplayMode: (mode: DisplayMode) => void;
  density: DensityMode;
  onSetDensity: (d: DensityMode) => void;
  aircraftCount: number;
  satelliteCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface ToggleItem {
  key: keyof LayerVisibility;
  label: string;
  icon: any;
  color: string;
  subToggles?: ToggleItem[];
}

const TRANSPORT_TOGGLES: ToggleItem[] = [
  { key: 'aircraft', label: 'CIVILIAN AIRCRAFT', icon: Plane, color: 'text-foreground' },
  { key: 'militaryFlights', label: 'MILITARY AIRCRAFT', icon: Crosshair, color: 'text-orange-400' },
  { key: 'ships', label: 'SHIPS', icon: Anchor, color: 'text-neon-blue' },
  { key: 'satellites', label: 'SATELLITES', icon: Satellite, color: 'text-neon-amber' },
  { key: 'streetTraffic', label: 'STREET TRAFFIC', icon: Car, color: 'text-cyan-400' },
];

const INFRA_TOGGLES: ToggleItem[] = [
  { key: 'cities', label: 'CITIES', icon: MapPin, color: 'text-primary' },
  { key: 'airports', label: 'AIRPORTS', icon: Plane, color: 'text-sky-300' },
  { key: 'ports', label: 'PORTS', icon: Ship, color: 'text-blue-400' },
  { key: 'energy', label: 'ENERGY & PIPELINES', icon: Zap, color: 'text-yellow-400' },
  { key: 'telecom', label: 'TELECOM & CABLES', icon: Radio, color: 'text-violet-400' },
  { key: 'bases', label: 'MILITARY BASES', icon: Shield, color: 'text-neon-green' },
];

const EXTRAS_TOGGLES: ToggleItem[] = [
  { key: 'buildings', label: '3D BUILDINGS', icon: Building, color: 'text-purple-400' },
];

const DATA_LAYER_TOGGLES: ToggleItem[] = [
  { key: 'weatherRadar', label: 'WEATHER RADAR', icon: CloudRain, color: 'text-sky-400' },
  { key: 'conflicts', label: 'CONFLICTS', icon: Swords, color: 'text-neon-red' },
  { key: 'gpsInterference', label: 'GPS INTERFERENCE', icon: SignalZero, color: 'text-orange-400' },
  { key: 'internetBlackouts', label: 'INTERNET BLACKOUTS', icon: WifiOff, color: 'text-red-400' },
  { key: 'airspaceClosures', label: 'AIRSPACE CLOSURES', icon: ShieldAlert, color: 'text-rose-400' },
  { key: 'liveCameras', label: 'LIVE CAMERAS', icon: Camera, color: 'text-emerald-400' },
];

const DISPLAY_MODES: { value: DisplayMode; label: string }[] = [
  { value: 'normal', label: 'NORMAL' },
  { value: 'crt', label: 'CRT' },
  { value: 'nvg', label: 'NIGHT VISION' },
  { value: 'flir', label: 'FLIR' },
];

interface CategoryProps {
  title: string;
  icon: any;
  items: ToggleItem[];
  layers: LayerVisibility;
  onToggle: (key: keyof LayerVisibility) => void;
  getCount?: (key: string) => number | undefined;
  defaultOpen?: boolean;
}

function Category({ title, icon: Icon, items, layers, onToggle, getCount, defaultOpen = false }: CategoryProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border/20 overflow-hidden glass-panel bg-secondary/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-[9px] font-display uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-2 pb-2 space-y-0.5">
          {items.map(item => (
            <div key={item.key}>
              <ToggleButton
                item={item}
                active={layers[item.key]}
                onToggle={() => onToggle(item.key)}
                count={getCount?.(item.key)}
              />
              {item.subToggles && layers[item.key] && item.subToggles.map(sub => (
                <ToggleButton
                  key={sub.key}
                  item={sub}
                  active={layers[sub.key]}
                  onToggle={() => onToggle(sub.key)}
                  indent
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleButton({ item, active, onToggle, count, indent }: {
  item: ToggleItem;
  active: boolean;
  onToggle: () => void;
  count?: number;
  indent?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-2 py-1.5 ${indent ? 'pl-7' : ''} rounded-lg text-xs transition-all duration-200 group ${
        active
          ? 'bg-primary/10 text-foreground'
          : 'text-muted-foreground hover:bg-secondary/30'
      }`}
    >
      <Icon className={`w-3.5 h-3.5 transition-all ${active ? item.color : 'opacity-30'}`} />
      <span className="font-display tracking-wider text-[8px]">{item.label}</span>
      {!indent && count !== undefined && active && (
        <span className="ml-auto text-[8px] font-mono text-primary">{count}</span>
      )}
      <span className={`${count !== undefined && active ? '' : 'ml-auto'} w-1.5 h-1.5 rounded-full transition-all duration-300 ${
        active ? 'bg-accent shadow-[0_0_6px_hsl(150_100%_45%)]' : 'bg-muted-foreground/20'
      }`} />
    </button>
  );
}

export function LeftPanel({
  layers, onToggleLayer, displayMode, onSetDisplayMode,
  density, onSetDensity,
  aircraftCount, satelliteCount, collapsed, onToggleCollapse,
}: LeftPanelProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const utc = time.toISOString().slice(11, 19);

  const getCount = (key: string) => {
    if (key === 'aircraft') return aircraftCount;
    if (key === 'satellites') return satelliteCount;
    return undefined;
  };

  return (
    <aside className={`${collapsed ? 'w-12' : 'w-72'} transition-all duration-300 glass-panel bg-card/50 border-r border-border/20 flex flex-col relative z-40 shrink-0`}>
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 w-6 h-6 bg-card/80 glass-panel border border-border/20 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors z-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Header */}
          <div className="pb-3 border-b border-border/20">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-white" />
              <span className="text-[11px] font-display font-bold tracking-[0.12em] text-white">
                FrontView
              </span>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5 text-accent animate-pulse-glow" />
                LIVE
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-primary" />
                {utc}
              </span>
            </div>
          </div>

          {/* Display Mode */}
          <div className="rounded-xl border border-border/20 glass-panel bg-secondary/20 p-3 space-y-2">
            <div className="text-[9px] font-display uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              DISPLAY MODE
            </div>
            <select
              value={displayMode}
              onChange={e => onSetDisplayMode(e.target.value as DisplayMode)}
              className="w-full bg-secondary/60 glass-panel border border-border/20 rounded-lg px-2 py-1.5 text-[10px] font-display tracking-wider text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            >
              {DISPLAY_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Density */}
          <div className="rounded-xl border border-border/20 glass-panel bg-secondary/20 p-3 space-y-2">
            <div className="text-[9px] font-display uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              DENSITY
            </div>
            <select
              value={density}
              onChange={e => onSetDensity(e.target.value as DensityMode)}
              className="w-full bg-secondary/60 glass-panel border border-border/20 rounded-lg px-2 py-1.5 text-[10px] font-display tracking-wider text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            >
              <option value="sparse">SPARSE (25%)</option>
              <option value="moderate">MODERATE (50%)</option>
              <option value="dense">DENSE (100%)</option>
            </select>
          </div>

          {/* Categories */}
          <Category
            title="Transportation & Mobility"
            icon={Navigation}
            items={TRANSPORT_TOGGLES}
            layers={layers}
            onToggle={onToggleLayer}
            getCount={getCount}
            defaultOpen
          />

          <Category
            title="Infrastructure"
            icon={Factory}
            items={INFRA_TOGGLES}
            layers={layers}
            onToggle={onToggleLayer}
          />

          <Category
            title="Extras"
            icon={Box}
            items={EXTRAS_TOGGLES}
            layers={layers}
            onToggle={onToggleLayer}
          />

          <Category
            title="Data Layers"
            icon={BarChart3}
            items={DATA_LAYER_TOGGLES}
            layers={layers}
            onToggle={onToggleLayer}
          />

          {/* System Status */}
          <div className="mt-auto pt-3 border-t border-border/20">
            <div className="text-[8px] text-muted-foreground font-mono space-y-0.5">
              <div>SYS: <span className="text-accent">OPERATIONAL</span></div>
              <div>FEEDS: <span className="text-primary">14 ACTIVE</span></div>
              <div>ENC: <span className="text-accent">AES-256</span></div>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex-1 flex flex-col items-center pt-6 gap-2">
          {[...TRANSPORT_TOGGLES, ...INFRA_TOGGLES, ...DATA_LAYER_TOGGLES].map(({ key, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => onToggleLayer(key)}
              className={`p-1.5 rounded-lg transition-colors ${layers[key] ? color : 'text-muted-foreground/30'}`}
              title={key}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
