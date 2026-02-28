import { TopBar } from '@/components/TopBar';
import { IntelSidebar } from '@/components/IntelSidebar';
import { GlobeView } from '@/components/GlobeView';
import { useGlobeState } from '@/hooks/useGlobeState';
import { useAircraft } from '@/hooks/useAircraft';
import { useSatellites } from '@/hooks/useSatellites';

const Index = () => {
  const {
    layers, toggleLayer,
    selectedEntity, selectEntity,
    trackingEntity, trackEntity, stopTracking,
  } = useGlobeState();

  const { aircraft } = useAircraft(layers.aircraft);
  const { satellites } = useSatellites(layers.satellites);

  const handleTrack = () => {
    if (!selectedEntity) return;
    const d = selectedEntity.data as any;
    const id = d.icao24 || d.name || d.mmsi || '';
    trackEntity(selectedEntity.type, id);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <IntelSidebar
          layers={layers}
          onToggleLayer={toggleLayer}
          selectedEntity={selectedEntity}
          onCloseDetail={() => selectEntity(null)}
          onTrack={handleTrack}
          aircraftCount={aircraft.length}
          satelliteCount={satellites.length}
        />
        <main className="flex-1 relative">
          <GlobeView
            layers={layers}
            aircraft={aircraft}
            satellites={satellites}
            onEntitySelect={selectEntity}
            trackingEntity={trackingEntity}
          />
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none scanline opacity-30" />
        </main>
      </div>
    </div>
  );
};

export default Index;
