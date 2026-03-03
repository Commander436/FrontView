import { LayerVisibility, DisplayMode, DensityMode } from '@/types/globe';
import {
  Shield, Wifi, Clock, Plane, Anchor, Satellite, Building2,
  Swords, MapPin, Orbit, Eye, CloudRain, Crosshair,
  ChevronLeft, ChevronRight, Car, Building, Layers,
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

const LAYER_CONFIG: { key: keyof LayerVisibility; label: string; icon: any; color: string; subToggles?: { key: keyof LayerVisibility; label: string; icon: any; color: string }[] }[] = [
  {
    key: 'aircraft', label: 'AIRCRAFT', icon: Plane, color: 'text-foreground',
    subToggles: [
      { key: 'militaryFlights', label: 'MIL FLIGHTS', icon: Crosshair, color: 'text-orange-400' },
    ],
  },
  { key: 'ships', label: 'SHIPS', icon: Anchor, color: 'text-neon-blue' },
  {
    key: 'satellites', label: 'SATELLITES', icon: Satellite, color: 'text-neon-amber',
    subToggles: [
      { key: 'showOrbits', label: 'SHOW ORBITS', icon: Orbit, color: 'text-neon-amber' },
    ],
  },
  { key: 'bases', label: 'MIL BASES', icon: Shield, color: 'text-neon-green' },
  { key: 'conflicts', label: 'CONFLICTS', icon: Swords, color: 'text-neon-red' },
  {
    key: 'cities', label: 'CITIES', icon: MapPin, color: 'text-primary',
    subToggles: [
      { key: 'streetTraffic', label: 'STREET TRAFFIC', icon: Car, color: 'text-cyan-400' },
      { key: 'buildings', label: '3D BUILDINGS', icon: Building, color: 'text-purple-400' },
    ],
  },
  { key: 'weatherRadar', label: 'WEATHER', icon: CloudRain, color: 'text-sky-400' },
];

const DISPLAY_MODES: { value: DisplayMode; label: string }[] = [
  { value: 'normal', label: 'NORMAL' },
  { value: 'crt', label: 'CRT' },
  { value: 'nvg', label: 'NIGHT VISION' },
  { value: 'flir', label: 'FLIR' },
];

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
    <aside className={`${collapsed ? 'w-12' : 'w-64'} transition-all duration-300 backdrop-blur-xl bg-card/80 border-r border-border/50 flex flex-col relative z-40 shrink-0`}>
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors z-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Header */}
          <div className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-display font-bold tracking-[0.15em] text-primary text-glow-teal">
                GLOBAL INTEL
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
          <div>
            <div className="text-[9px] font-display uppercase tracking-[0.25em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              DISPLAY MODE
            </div>
            <select
              value={displayMode}
              onChange={e => onSetDisplayMode(e.target.value as DisplayMode)}
              className="w-full bg-secondary/80 border border-border/50 rounded px-2 py-1.5 text-[10px] font-display tracking-wider text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            >
              {DISPLAY_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Density */}
          <div>
            <div className="text-[9px] font-display uppercase tracking-[0.25em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              DENSITY
            </div>
            <select
              value={density}
              onChange={e => onSetDensity(e.target.value as DensityMode)}
              className="w-full bg-secondary/80 border border-border/50 rounded px-2 py-1.5 text-[10px] font-display tracking-wider text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            >
              <option value="sparse">SPARSE (25%)</option>
              <option value="moderate">MODERATE (50%)</option>
              <option value="dense">DENSE (100%)</option>
            </select>
          </div>

          {/* Data Layers */}
          <div>
            <div className="text-[9px] font-display uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
              DATA LAYERS
            </div>
            <div className="space-y-0.5">
              {LAYER_CONFIG.map(({ key, label, icon: Icon, color, subToggles }) => (
                <div key={key}>
                  <button
                    onClick={() => onToggleLayer(key)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-200 ${
                      layers[key]
                        ? 'bg-secondary/60 text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/30'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${layers[key] ? color : 'opacity-30'}`} />
                    <span className="font-display tracking-wider text-[9px]">{label}</span>
                    {layers[key] && getCount(key as string) !== undefined && (
                      <span className="ml-auto text-[8px] font-mono text-primary">{getCount(key as string)}</span>
                    )}
                    <span className={`ml-auto w-1.5 h-1.5 rounded-full transition-colors ${layers[key] ? 'bg-accent shadow-[0_0_4px_hsl(150_100%_45%)]' : 'bg-muted-foreground/20'}`} />
                  </button>
                  {subToggles && layers[key] && subToggles.map(sub => (
                    <button
                      key={sub.key}
                      onClick={() => onToggleLayer(sub.key)}
                      className={`w-full flex items-center gap-2 px-2 py-1 pl-8 rounded text-xs transition-all duration-200 ${
                        layers[sub.key]
                          ? sub.color
                          : 'text-muted-foreground hover:bg-secondary/30'
                      }`}
                    >
                      <sub.icon className={`w-3 h-3 ${layers[sub.key] ? '' : 'opacity-30'}`} />
                      <span className="font-display tracking-wider text-[8px]">{sub.label}</span>
                      <span className={`ml-auto w-1.5 h-1.5 rounded-full ${layers[sub.key] ? 'bg-accent' : 'bg-muted-foreground/20'}`} />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="mt-auto pt-3 border-t border-border/50">
            <div className="text-[8px] text-muted-foreground font-mono space-y-0.5">
              <div>SYS: <span className="text-accent">OPERATIONAL</span></div>
              <div>FEEDS: <span className="text-primary">8 ACTIVE</span></div>
              <div>ENC: <span className="text-accent">AES-256</span></div>
              <div className="text-primary/60 font-display text-[7px] tracking-[0.3em] mt-2">CLASSIFIED</div>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex-1 flex flex-col items-center pt-6 gap-2">
          {LAYER_CONFIG.map(({ key, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => onToggleLayer(key)}
              className={`p-1.5 rounded transition-colors ${layers[key] ? color : 'text-muted-foreground/30'}`}
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
