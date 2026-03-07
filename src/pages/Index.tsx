import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { LeftPanel } from '@/components/LeftPanel';
import { RightPanel } from '@/components/RightPanel';
import { GlobeView } from '@/components/GlobeView';
import { ScopeOverlay } from '@/components/ScopeOverlay';
import { useGlobeState } from '@/hooks/useGlobeState';
import { useAircraft } from '@/hooks/useAircraft';
import { useSatellites } from '@/hooks/useSatellites';

declare const Cesium: any;

// Lat/Lon → MGRS approximation (simplified for HUD display)
function toMGRS(lat: number, lon: number): string {
  const zoneNum = Math.floor((lon + 180) / 6) + 1;
  const letters = 'CDEFGHJKLMNPQRSTUVWX';
  const bandIdx = Math.max(0, Math.min(letters.length - 1, Math.floor((lat + 80) / 8)));
  const band = letters[bandIdx];
  const easting = Math.round(((lon - (zoneNum * 6 - 183)) / 6 + 0.5) * 100000) % 100000;
  const northing = Math.round((lat >= 0 ? lat : lat + 90) / 90 * 10000000) % 100000;
  return `${zoneNum}${band} ${String(easting).padStart(5, '0')} ${String(northing).padStart(5, '0')}`;
}

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
  const globeViewRef = useRef<{ getViewer: () => any } | null>(null);

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

  const globeFilter = useMemo(() => {
    switch (displayMode) {
      case 'crt': return 'sepia(1) hue-rotate(80deg) saturate(2) brightness(0.7) contrast(1.3)';
      case 'nvg': return 'sepia(1) hue-rotate(80deg) saturate(3) brightness(0.8) contrast(1.5)';
      case 'flir': return 'saturate(0.3) brightness(0.9) contrast(1.4)';
      default: return 'none';
    }
  }, [displayMode]);

  const showScope = layers.scopeOverlay || displayMode !== 'normal';
  const hudColor = displayMode === 'flir' ? 'text-orange-400/80' : displayMode === 'nvg' || displayMode === 'crt' ? 'text-green-400/80' : 'text-primary/80';

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
