import { useState, useMemo, useEffect, useRef } from 'react';
import { LeftPanel } from '@/components/LeftPanel';
import { RightPanel } from '@/components/RightPanel';
import { GlobeView } from '@/components/GlobeView';
import { ScopeOverlay } from '@/components/ScopeOverlay';
import { useGlobeState } from '@/hooks/useGlobeState';
import { useAircraft } from '@/hooks/useAircraft';
import { useSatellites } from '@/hooks/useSatellites';
import { Search } from 'lucide-react';
import { DisplayMode } from '@/types/globe';

declare const Cesium: any;

function toMGRS(lat: number, lon: number): string {
  const zoneNum = Math.floor((lon + 180) / 6) + 1;
  const letters = 'CDEFGHJKLMNPQRSTUVWX';
  const bandIdx = Math.max(0, Math.min(letters.length - 1, Math.floor((lat + 80) / 8)));
  const band = letters[bandIdx];
  const easting = Math.round(((lon - (zoneNum * 6 - 183)) / 6 + 0.5) * 100000) % 100000;
  const northing = Math.round((lat >= 0 ? lat : lat + 90) / 90 * 10000000) % 100000;
  return `${zoneNum}${band} ${String(easting).padStart(5, '0')} ${String(northing).padStart(5, '0')}`;
}

const DISPLAY_MODES: { value: DisplayMode; label: string }[] = [
  { value: 'normal', label: 'NORMAL' },
  { value: 'crt', label: 'CRT' },
  { value: 'nvg', label: 'NVG' },
  { value: 'flir', label: 'FLIR' },
];

const Index = () => {
  const {
    layers, toggleLayer,
    selectedEntity, selectEntity,
    displayMode, setDisplayMode,
    density, setDensity,
  } = useGlobeState();

  const { aircraft } = useAircraft(layers.aircraft, layers.militaryFlights);
  const { satellites } = useSatellites(layers.satellites);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [cameraCoords, setCameraCoords] = useState({ lat: 0, lon: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  // Camera coordinate tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof Cesium === 'undefined') return;
      const viewer = (window as any).__cesiumViewer;
      if (!viewer || viewer.isDestroyed()) return;
      const carto = viewer.camera.positionCartographic;
      if (carto) {
        setCameraCoords({
          lat: Cesium.Math.toDegrees(carto.latitude),
          lon: Cesium.Math.toDegrees(carto.longitude),
        });
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      if (data.length === 0) {
        setSearchError('Location not found.');
        return;
      }
      const { lat, lon } = data[0];
      const viewer = (window as any).__cesiumViewer;
      if (viewer && !viewer.isDestroyed()) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat), 500000),
          duration: 2,
        });
      }
      setSearchQuery('');
    } catch {
      setSearchError('Search failed.');
    }
  };

  const globeFilter = useMemo(() => {
    switch (displayMode) {
      case 'crt': return 'sepia(1) hue-rotate(80deg) saturate(2) brightness(0.7) contrast(1.3)';
      case 'nvg': return 'sepia(1) hue-rotate(80deg) saturate(3) brightness(0.8) contrast(1.5)';
      case 'flir': return 'saturate(0.3) brightness(0.9) contrast(1.4)';
      default: return 'none';
    }
  }, [displayMode]);

  const showScope = layers.scopeOverlay || displayMode !== 'normal';
  const hudColor = displayMode === 'flir' ? 'text-orange-400/80' : displayMode === 'nvg' || displayMode === 'crt' ? 'text-green-400/80' : 'text-foreground/60';

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      <LeftPanel
        layers={layers}
        onToggleLayer={toggleLayer}
        displayMode={displayMode}
        onSetDisplayMode={setDisplayMode}
        density={density}
        onSetDensity={setDensity}
        aircraftCount={aircraft.length}
        satelliteCount={satellites.length}
        collapsed={leftCollapsed}
        onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
      />
      <main className="flex-1 relative min-w-0">
        <div className="w-full h-full" style={{ filter: globeFilter }}>
          <GlobeView
            layers={layers}
            aircraft={aircraft}
            satellites={satellites}
            density={density}
            displayMode={displayMode}
            onEntitySelect={selectEntity}
          />
        </div>
        {showScope && <ScopeOverlay mode={displayMode === 'normal' ? 'scope-only' : displayMode} />}

        {/* Search bar + display mode switcher — top center */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchError(''); }}
              placeholder="Search location…"
              className="w-72 pl-9 pr-4 py-2 rounded-xl glass-panel bg-card/60 border border-foreground/12 text-[11px] font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/25 transition-all"
            />
            {searchError && (
              <div className="absolute top-full mt-1 left-0 text-[9px] text-destructive font-mono">{searchError}</div>
            )}
          </form>

          {/* Display mode segmented control */}
          <div className="flex rounded-xl glass-panel bg-card/50 border border-foreground/10 overflow-hidden">
            {DISPLAY_MODES.map(m => (
              <button
                key={m.value}
                onClick={() => setDisplayMode(m.value)}
                className={`px-3 py-1.5 text-[9px] font-display tracking-[0.1em] transition-all ${
                  displayMode === m.value
                    ? 'bg-foreground/15 text-foreground'
                    : 'text-muted-foreground hover:text-foreground/70'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coordinate HUD — bottom-left tactical readout */}
        <div className={`absolute bottom-4 left-4 z-30 pointer-events-none font-mono text-[10px] ${hudColor} space-y-0.5`}>
          <div>LAT {cameraCoords.lat >= 0 ? 'N' : 'S'}{Math.abs(cameraCoords.lat).toFixed(4)}°</div>
          <div>LON {cameraCoords.lon >= 0 ? 'E' : 'W'}{Math.abs(cameraCoords.lon).toFixed(4)}°</div>
          <div className="opacity-60">MGRS {toMGRS(cameraCoords.lat, cameraCoords.lon)}</div>
        </div>
      </main>
      <RightPanel
        selectedEntity={selectedEntity}
        onClose={() => selectEntity(null)}
      />
    </div>
  );
};

export default Index;
