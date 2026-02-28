import { LayerVisibility, SelectedEntity } from '@/types/globe';
import { DetailPanel } from './DetailPanel';
import {
  Plane, Anchor, Satellite, Building2, Swords, MapPin,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface IntelSidebarProps {
  layers: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  selectedEntity: SelectedEntity | null;
  onCloseDetail: () => void;
  onTrack: () => void;
  aircraftCount: number;
  satelliteCount: number;
}

const LAYER_CONFIG: { key: keyof LayerVisibility; label: string; icon: any; color: string }[] = [
  { key: 'aircraft', label: 'AIRCRAFT', icon: Plane, color: 'text-primary' },
  { key: 'ships', label: 'SHIPS', icon: Anchor, color: 'text-neon-blue' },
  { key: 'satellites', label: 'SATELLITES', icon: Satellite, color: 'text-neon-amber' },
  { key: 'bases', label: 'MIL BASES', icon: Building2, color: 'text-neon-green' },
  { key: 'conflicts', label: 'CONFLICTS', icon: Swords, color: 'text-neon-red' },
  { key: 'cities', label: 'CITIES', icon: MapPin, color: 'text-foreground' },
];

export function IntelSidebar({
  layers, onToggleLayer, selectedEntity, onCloseDetail, onTrack,
  aircraftCount, satelliteCount,
}: IntelSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const getCount = (key: string) => {
    if (key === 'aircraft') return aircraftCount;
    if (key === 'satellites') return satelliteCount;
    return undefined;
  };

  return (
    <aside
      className={`${collapsed ? 'w-12' : 'w-72'} transition-all duration-300 bg-card border-r border-border flex flex-col relative z-40 shrink-0`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-4 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors z-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scanline">
          {/* Layers */}
          <div>
            <h2 className="text-[10px] font-display uppercase tracking-[0.25em] text-muted-foreground mb-2">
              DATA LAYERS
            </h2>
            <div className="space-y-1">
              {LAYER_CONFIG.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => onToggleLayer(key)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                    layers[key]
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${layers[key] ? color : 'opacity-40'}`} />
                  <span className="font-display tracking-wider text-[10px]">{label}</span>
                  {layers[key] && getCount(key) !== undefined && (
                    <span className="ml-auto text-[9px] font-mono text-primary">{getCount(key)}</span>
                  )}
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full ${layers[key] ? 'bg-accent' : 'bg-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Selected entity detail */}
          {selectedEntity && (
            <div>
              <h2 className="text-[10px] font-display uppercase tracking-[0.25em] text-muted-foreground mb-2">
                INTEL REPORT
              </h2>
              <DetailPanel
                entity={selectedEntity}
                onClose={onCloseDetail}
                onTrack={onTrack}
              />
            </div>
          )}

          {/* Status */}
          <div className="mt-auto pt-4 border-t border-border">
            <div className="text-[9px] text-muted-foreground font-mono space-y-1">
              <div>SYS STATUS: <span className="text-accent">OPERATIONAL</span></div>
              <div>FEEDS: <span className="text-primary">6 ACTIVE</span></div>
              <div>ENCRYPTION: <span className="text-accent">AES-256</span></div>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex-1 flex flex-col items-center pt-6 gap-3">
          {LAYER_CONFIG.map(({ key, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => onToggleLayer(key)}
              className={`p-1.5 rounded transition-colors ${
                layers[key] ? color : 'text-muted-foreground/40'
              }`}
              title={key}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
