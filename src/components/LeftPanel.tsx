import { LayerVisibility, DisplayMode } from '@/types/globe';
import {
  Shield, Clock, Plane, Anchor, Satellite,
  Swords, MapPin, Eye, CloudRain, Crosshair,
  ChevronLeft, ChevronRight, Car, Building,
  Zap, Radio, Ship, Factory, ChevronDown,
  Navigation, Globe, Box, BarChart3,
  WifiOff, SignalZero, ShieldAlert,
  Pencil, Minus, Square, Circle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DrawingTool } from '@/types/annotations';

interface LeftPanelProps {
  layers: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  displayMode: DisplayMode;
  onSetDisplayMode: (mode: DisplayMode) => void;
  aircraftCount: number;
  satelliteCount: number;
  shipCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  drawingTool: DrawingTool;
  onSetDrawingTool: (tool: DrawingTool) => void;
  annotationCount: number;
}

interface ToggleItem {
  key: keyof LayerVisibility;
  label: string;
  icon: any;
}

const TRANSPORT_TOGGLES: ToggleItem[] = [
  { key: 'aircraft', label: 'CIVILIAN AIRCRAFT', icon: Plane },
  { key: 'militaryFlights', label: 'MILITARY AIRCRAFT', icon: Crosshair },
  { key: 'ships', label: 'SHIPS', icon: Anchor },
  { key: 'satellites', label: 'SATELLITES', icon: Satellite },
  { key: 'streetTraffic', label: 'STREET TRAFFIC', icon: Car },
];

const INFRA_TOGGLES: ToggleItem[] = [
  { key: 'cities', label: 'CITIES', icon: MapPin },
  { key: 'airports', label: 'AIRPORTS', icon: Plane },
  { key: 'ports', label: 'PORTS', icon: Ship },
  { key: 'energy', label: 'ENERGY & PIPELINES', icon: Zap },
  { key: 'telecom', label: 'TELECOM & CABLES', icon: Radio },
  { key: 'bases', label: 'MILITARY BASES', icon: Shield },
];

const EXTRAS_TOGGLES: ToggleItem[] = [
  { key: 'buildings', label: '3D BUILDINGS', icon: Building },
];

const DATA_LAYER_TOGGLES: ToggleItem[] = [
  { key: 'weatherRadar', label: 'WEATHER RADAR', icon: CloudRain },
  { key: 'conflicts', label: 'CONFLICTS', icon: Swords },
  { key: 'gpsInterference', label: 'GPS INTERFERENCE', icon: SignalZero },
  { key: 'internetBlackouts', label: 'INTERNET BLACKOUTS', icon: WifiOff },
  { key: 'airspaceClosures', label: 'AIRSPACE CLOSURES', icon: ShieldAlert },
];

function ToggleButton({ item, active, onToggle, count }: {
  item: ToggleItem;
  active: boolean;
  onToggle: () => void;
  count?: number;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-200 group ${
        active
          ? 'bg-foreground/5 border border-foreground/15 text-foreground'
          : 'text-muted-foreground hover:bg-secondary/40 border border-transparent'
      }`}
    >
      <Icon className={`w-3.5 h-3.5 transition-all duration-300 ${active ? 'text-foreground' : 'opacity-25'}`} />
      <span className="font-display tracking-[0.12em] text-[8px] flex-1 text-left">{item.label}</span>
      {count !== undefined && active && (
        <span className="text-[8px] font-mono text-foreground/70 tabular-nums">{count.toLocaleString()}</span>
      )}
      <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
        active ? 'bg-foreground shadow-[0_0_6px_hsl(0_0%_90%/0.4)]' : 'bg-muted-foreground/15'
      }`} />
    </button>
  );
}

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
  const activeCount = items.filter(i => layers[i.key]).length;

  return (
    <div className="rounded-2xl border border-foreground/8 overflow-hidden glass-panel bg-card/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-[9px] font-display uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-foreground/60" />
        <span className="flex-1 text-left">{title}</span>
        {activeCount > 0 && (
          <span className="text-[8px] font-mono text-foreground bg-foreground/10 px-1.5 py-0.5 rounded-full">{activeCount}</span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ease-out overflow-hidden ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-2 pb-2 space-y-0.5">
          {items.map(item => (
            <ToggleButton
              key={item.key}
              item={item}
              active={layers[item.key]}
              onToggle={() => onToggle(item.key)}
              count={getCount?.(item.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LeftPanel({
  layers, onToggleLayer, displayMode, onSetDisplayMode,
  aircraftCount, satelliteCount, shipCount, collapsed, onToggleCollapse,
  drawingTool, onSetDrawingTool, annotationCount,
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
    if (key === 'ships') return shipCount;
    return undefined;
  };

  return (
    <aside className={`${collapsed ? 'w-12' : 'w-72'} transition-all duration-300 glass-panel bg-card/40 border-r border-foreground/8 flex flex-col relative z-40 shrink-0`}>
      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 w-6 h-6 bg-card/80 glass-panel border border-foreground/15 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-50 hover:shadow-[0_0_12px_hsl(0_0%_90%/0.2)]"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Header */}
          <div className="pb-3 border-b border-foreground/8">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1 rounded-lg bg-foreground/10">
                <Globe className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-[12px] font-display font-bold tracking-[0.1em] text-foreground text-glow-white">
                FrontView
              </span>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-glow" />
                LIVE
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-foreground/60" />
                {utc}Z
              </span>
            </div>
          </div>

          {/* Categories */}
          <Category title="Aviation & Maritime" icon={Navigation} items={TRANSPORT_TOGGLES} layers={layers} onToggle={onToggleLayer} getCount={getCount} defaultOpen />
          <Category title="Infrastructure" icon={Factory} items={INFRA_TOGGLES} layers={layers} onToggle={onToggleLayer} />
          <Category title="Extras" icon={Box} items={EXTRAS_TOGGLES} layers={layers} onToggle={onToggleLayer} />
          <Category title="Threat Intelligence" icon={BarChart3} items={DATA_LAYER_TOGGLES} layers={layers} onToggle={onToggleLayer} />

          {/* Lines & Shapes — annotation drawing tools */}
          <div className="rounded-2xl border border-foreground/8 overflow-hidden glass-panel bg-card/30">
            <div className="px-4 py-3 flex items-center gap-2.5 text-[9px] font-display uppercase tracking-[0.18em] text-muted-foreground">
              <Pencil className="w-3.5 h-3.5 text-foreground/60" />
              <span className="flex-1">Lines &amp; Shapes</span>
              {annotationCount > 0 && (
                <span className="text-[8px] font-mono text-foreground bg-foreground/10 px-1.5 py-0.5 rounded-full">{annotationCount}</span>
              )}
            </div>
            <div className="px-2 pb-2 grid grid-cols-2 gap-1">
              {([
                { tool: 'point' as const,  label: 'POINT',  Icon: MapPin },
                { tool: 'line' as const,   label: 'LINE',   Icon: Minus },
                { tool: 'square' as const, label: 'SQUARE', Icon: Square },
                { tool: 'circle' as const, label: 'CIRCLE', Icon: Circle },
              ]).map(({ tool, label, Icon }) => {
                const active = drawingTool === tool;
                return (
                  <button
                    key={tool}
                    onClick={() => onSetDrawingTool(active ? null : tool)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all duration-200 ${
                      active
                        ? 'bg-foreground/15 border border-foreground/30 text-foreground shadow-[0_0_8px_hsl(0_0%_100%/0.15)]'
                        : 'text-muted-foreground border border-transparent hover:bg-secondary/40 hover:text-foreground/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-display tracking-[0.12em] text-[8px]">{label}</span>
                  </button>
                );
              })}
            </div>
            {drawingTool && (
              <div className="px-3 pb-3 text-[9px] font-mono text-foreground/60 border-t border-foreground/8 pt-2">
                {drawingTool === 'point' && '· Click on globe to place point'}
                {drawingTool === 'line' && '· Click start, then click end'}
                {drawingTool === 'square' && '· Click two opposite corners'}
                {drawingTool === 'circle' && '· Click center, drag to set radius'}
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="mt-auto pt-3 border-t border-foreground/8">
            <div className="text-[8px] text-muted-foreground font-mono space-y-1">
              <div className="flex justify-between">
                <span>SYS</span>
                <span className="text-green-400">OPERATIONAL</span>
              </div>
              <div className="flex justify-between">
                <span>FEEDS</span>
                <span className="text-foreground/70">14 ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span>ENC</span>
                <span className="text-green-400">AES-256</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex-1 flex flex-col items-center pt-6 gap-1.5">
          {[...TRANSPORT_TOGGLES, ...INFRA_TOGGLES, ...DATA_LAYER_TOGGLES].map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onToggleLayer(key)}
              className={`p-1.5 rounded-lg transition-all ${layers[key] ? 'text-foreground bg-foreground/5' : 'text-muted-foreground/20'}`}
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
