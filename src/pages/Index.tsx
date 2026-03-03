import { useState, useMemo } from 'react';
import { LeftPanel } from '@/components/LeftPanel';
import { RightPanel } from '@/components/RightPanel';
import { GlobeView } from '@/components/GlobeView';
import { ScopeOverlay } from '@/components/ScopeOverlay';
import { useGlobeState } from '@/hooks/useGlobeState';
import { useAircraft } from '@/hooks/useAircraft';
import { useSatellites } from '@/hooks/useSatellites';

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

  const globeFilter = useMemo(() => {
    switch (displayMode) {
      case 'crt': return 'sepia(1) hue-rotate(80deg) saturate(2) brightness(0.7) contrast(1.3)';
      case 'nvg': return 'sepia(1) hue-rotate(80deg) saturate(3) brightness(0.8) contrast(1.5)';
      case 'flir': return 'saturate(0.3) brightness(0.9) contrast(1.4)';
      default: return 'none';
    }
  }, [displayMode]);

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
        <ScopeOverlay mode={displayMode} />
      </main>
      <RightPanel
        selectedEntity={selectedEntity}
        onClose={() => selectEntity(null)}
      />
    </div>
  );
};

export default Index;
