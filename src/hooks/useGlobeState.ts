import { useState, useCallback } from 'react';
import { LayerVisibility, SelectedEntity } from '@/types/globe';

export function useGlobeState() {
  const [layers, setLayers] = useState<LayerVisibility>({
    aircraft: true,
    ships: true,
    satellites: true,
    bases: true,
    conflicts: true,
    cities: true,
  });

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [trackingEntity, setTrackingEntity] = useState<{ type: string; id: string } | null>(null);

  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const selectEntity = useCallback((entity: SelectedEntity | null) => {
    setSelectedEntity(entity);
  }, []);

  const trackEntity = useCallback((type: string, id: string) => {
    setTrackingEntity({ type, id });
  }, []);

  const stopTracking = useCallback(() => {
    setTrackingEntity(null);
  }, []);

  return {
    layers,
    toggleLayer,
    selectedEntity,
    selectEntity,
    trackingEntity,
    trackEntity,
    stopTracking,
  };
}
