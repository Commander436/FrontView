import { useState, useCallback } from 'react';
import { LayerVisibility, SelectedEntity, DisplayMode, DensityMode } from '@/types/globe';

export function useGlobeState() {
  const [layers, setLayers] = useState<LayerVisibility>({
    aircraft: true,
    ships: true,
    satellites: true,
    bases: true,
    conflicts: true,
    cities: true,
    showOrbits: false,
    militaryFlights: false,
    weatherRadar: false,
    streetTraffic: false,
    buildings: false,
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
