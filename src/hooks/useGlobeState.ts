import { useState, useCallback } from 'react';
import { LayerVisibility, SelectedEntity, DisplayMode, DensityMode } from '@/types/globe';

export function useGlobeState() {
  const [layers, setLayers] = useState<LayerVisibility>({
    aircraft: true,
    militaryFlights: false,
    ships: true,
    satellites: true,
    showOrbits: false, // kept for type compat but unused — orbits shown on click
    streetTraffic: false,
    cities: true,
    airports: false,
    ports: false,
    energy: false,
    telecom: false,
    bases: true,
    buildings: false,
    weatherRadar: false,
    conflicts: true,
    gpsInterference: false,
    internetBlackouts: false,
    airspaceClosures: false,
    liveCameras: false,
    scopeOverlay: false,
  });

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('normal');
  const [density, setDensity] = useState<DensityMode>('dense');

  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const selectEntity = useCallback((entity: SelectedEntity | null) => {
    setSelectedEntity(entity);
  }, []);

  return {
    layers,
    toggleLayer,
    selectedEntity,
    selectEntity,
    displayMode,
    setDisplayMode,
    density,
    setDensity,
  };
}
