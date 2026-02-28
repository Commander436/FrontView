import { useEffect, useRef, useCallback } from 'react';
import { LayerVisibility, Aircraft, SatelliteData, SelectedEntity } from '@/types/globe';
import { CITIES } from '@/data/cities';
import { MILITARY_BASES } from '@/data/militaryBases';
import { CONFLICT_ZONES } from '@/data/conflictZones';
import { SAMPLE_SHIPS } from '@/data/ships';

declare const Cesium: any;

interface GlobeViewProps {
  layers: LayerVisibility;
  aircraft: Aircraft[];
  satellites: SatelliteData[];
  onEntitySelect: (entity: SelectedEntity) => void;
  trackingEntity: { type: string; id: string } | null;
}

export function GlobeView({ layers, aircraft, satellites, onEntitySelect, trackingEntity }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const dsRefs = useRef<Record<string, any>>({});

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    if (typeof Cesium === 'undefined') {
      console.error('Cesium not loaded');
      return;
    }

    Cesium.Ion.defaultAccessToken = undefined;

    const viewer = new Cesium.Viewer(containerRef.current, {
      imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        credit: 'CartoDB',
      }),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      selectionIndicator: false,
      infoBox: false,
      requestRenderMode: false,
      maximumRenderTimeChange: Infinity,
    });

    // Dark globe styling
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#080812');
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.skyBox = undefined;
    viewer.scene.sun = undefined;
    viewer.scene.moon = undefined;
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.fog.enabled = false;

    // Globe base color
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0a14');

    // Create data sources for each layer
    const layerNames = ['aircraft', 'ships', 'satellites', 'bases', 'conflicts', 'cities'];
    layerNames.forEach((name) => {
      const ds = new Cesium.CustomDataSource(name);
      viewer.dataSources.add(ds);
      dsRefs.current[name] = ds;
    });

    // Click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id) {
        const entity = picked.id;
        try {
          const entityType = entity.properties?.entityType?.getValue();
          const entityDataStr = entity.properties?.entityData?.getValue();
          if (entityType && entityDataStr) {
            const data = JSON.parse(entityDataStr);
            onEntitySelect({ type: entityType, data });
          }
        } catch (e) {
          console.warn('Entity pick error', e);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;

    // Initial camera position
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(20, 20, 20000000),
      duration: 0,
    });

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
      dsRefs.current = {};
    };
  }, []);

  // Update aircraft layer
  useEffect(() => {
    const ds = dsRefs.current['aircraft'];
    if (!ds) return;
    ds.show = layers.aircraft;
    ds.entities.removeAll();
    if (!layers.aircraft) return;

    aircraft.forEach((a) => {
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(a.longitude, a.latitude, a.altitude),
        point: {
          pixelSize: 4,
          color: Cesium.Color.fromCssColorString('#00ffd5'),
          outlineColor: Cesium.Color.fromCssColorString('#00ffd580'),
          outlineWidth: 1,
        },
        properties: {
          entityType: 'aircraft',
          entityData: JSON.stringify(a),
        },
      });
    });
  }, [aircraft, layers.aircraft]);

  // Update ships layer
  useEffect(() => {
    const ds = dsRefs.current['ships'];
    if (!ds) return;
    ds.show = layers.ships;
    ds.entities.removeAll();
    if (!layers.ships) return;

    const shipColors: Record<string, string> = {
      cargo: '#3b82f6',
      tanker: '#f59e0b',
      passenger: '#8b5cf6',
      fishing: '#10b981',
      military: '#ef4444',
    };

    SAMPLE_SHIPS.forEach((s) => {
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, 0),
        point: {
          pixelSize: 5,
          color: Cesium.Color.fromCssColorString(shipColors[s.type] || '#3b82f6'),
          outlineColor: Cesium.Color.fromCssColorString(shipColors[s.type] + '80' || '#3b82f680'),
          outlineWidth: 2,
        },
        properties: {
          entityType: 'ship',
          entityData: JSON.stringify(s),
        },
      });
    });
  }, [layers.ships]);

  // Update satellites layer
  useEffect(() => {
    const ds = dsRefs.current['satellites'];
    if (!ds) return;
    ds.show = layers.satellites;
    ds.entities.removeAll();
    if (!layers.satellites) return;

    satellites.forEach((s) => {
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, s.altitude * 1000),
        point: {
          pixelSize: 3,
          color: Cesium.Color.fromCssColorString('#f59e0b'),
          outlineColor: Cesium.Color.fromCssColorString('#f59e0b60'),
          outlineWidth: 1,
        },
        properties: {
          entityType: 'satellite',
          entityData: JSON.stringify(s),
        },
      });
    });
  }, [satellites, layers.satellites]);

  // Military bases layer
  useEffect(() => {
    const ds = dsRefs.current['bases'];
    if (!ds) return;
    ds.show = layers.bases;
    ds.entities.removeAll();
    if (!layers.bases) return;

    MILITARY_BASES.forEach((b) => {
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(b.longitude, b.latitude, 0),
        point: {
          pixelSize: 6,
          color: Cesium.Color.fromCssColorString('#39ff14'),
          outlineColor: Cesium.Color.fromCssColorString('#39ff1440'),
          outlineWidth: 3,
        },
        properties: {
          entityType: 'base',
          entityData: JSON.stringify(b),
        },
      });
    });
  }, [layers.bases]);

  // Conflict zones layer
  useEffect(() => {
    const ds = dsRefs.current['conflicts'];
    if (!ds) return;
    ds.show = layers.conflicts;
    ds.entities.removeAll();
    if (!layers.conflicts) return;

    CONFLICT_ZONES.forEach((z) => {
      const color = z.severity === 'high' ? '#ff333340' : '#f59e0b30';
      const outlineColor = z.severity === 'high' ? '#ff3333' : '#f59e0b';
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(z.longitude, z.latitude, 0),
        ellipse: {
          semiMajorAxis: z.radius,
          semiMinorAxis: z.radius,
          material: Cesium.Color.fromCssColorString(color),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(outlineColor),
          outlineWidth: 1,
          height: 0,
        },
        properties: {
          entityType: 'conflict',
          entityData: JSON.stringify(z),
        },
      });
    });
  }, [layers.conflicts]);

  // Cities layer
  useEffect(() => {
    const ds = dsRefs.current['cities'];
    if (!ds) return;
    ds.show = layers.cities;
    ds.entities.removeAll();
    if (!layers.cities) return;

    CITIES.forEach((c) => {
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(c.longitude, c.latitude, 0),
        point: {
          pixelSize: 4,
          color: Cesium.Color.fromCssColorString('#e2e8f0'),
          outlineColor: Cesium.Color.fromCssColorString('#e2e8f060'),
          outlineWidth: 1,
        },
        label: {
          text: c.name,
          font: '10px Orbitron',
          fillColor: Cesium.Color.fromCssColorString('#e2e8f0'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          scaleByDistance: new Cesium.NearFarScalar(1e6, 1, 1e7, 0),
          translucencyByDistance: new Cesium.NearFarScalar(1e6, 1, 8e6, 0),
        },
        properties: {
          entityType: 'city',
          entityData: JSON.stringify(c),
        },
      });
    });
  }, [layers.cities]);

  // Track entity
  useEffect(() => {
    if (!trackingEntity || !viewerRef.current) return;
    const ds = dsRefs.current[trackingEntity.type === 'base' ? 'bases' : trackingEntity.type === 'conflict' ? 'conflicts' : trackingEntity.type + 's'];
    // Simple fly-to for now
  }, [trackingEntity]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
