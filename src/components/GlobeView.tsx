import { useEffect, useRef } from 'react';
import { LayerVisibility, Aircraft, SatelliteData } from '@/types/globe';
import { CITIES } from '@/data/cities';
import { MILITARY_BASES } from '@/data/militaryBases';
import { CONFLICT_ZONES } from '@/data/conflictZones';
import { SAMPLE_SHIPS } from '@/data/ships';
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
} from 'satellite.js';

declare const Cesium: any;

interface GlobeViewProps {
  layers: LayerVisibility;
  aircraft: Aircraft[];
  satellites: SatelliteData[];
  onEntitySelect: (entity: any) => void;
}

function computeOrbitPath(tle1: string, tle2: string, steps = 120): number[] {
  try {
    const satrec = twoline2satrec(tle1, tle2);
    const now = Date.now();
    const coords: number[] = [];
    for (let i = 0; i < steps; i++) {
      const t = new Date(now + (i - steps / 2) * 60000);
      const pv = propagate(satrec, t);
      if (!pv.position || typeof pv.position === 'boolean') continue;
      const gmst = gstime(t);
      const geo = eciToGeodetic(pv.position, gmst);
      const lat = (geo.latitude * 180) / Math.PI;
      const lon = (geo.longitude * 180) / Math.PI;
      const alt = geo.height * 1000;
      coords.push(lon, lat, alt);
    }
    return coords;
  } catch {
    return [];
  }
}

export function GlobeView({ layers, aircraft, satellites, onEntitySelect }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const dsRefs = useRef<Record<string, any>>({});

  // Initialize viewer once
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    if (typeof Cesium === 'undefined') {
      console.error('Cesium not loaded');
      return;
    }

    // No Ion token needed
    Cesium.Ion.defaultAccessToken = undefined;

    const viewer = new Cesium.Viewer(containerRef.current, {
      imageryProvider: false,
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

    // Remove any default layers and add ESRI free imagery
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 18,
        credit: 'Esri, Maxar, Earthstar Geographics',
      })
    );

    // Globe settings
    viewer.scene.globe.show = true;
    viewer.scene.globe.baseColor = Cesium.Color.BLACK;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#080812');
    viewer.scene.skyBox = undefined;
    viewer.scene.sun = undefined;
    viewer.scene.moon = undefined;
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.fog.enabled = false;

    // Data sources
    const layerNames = ['aircraft', 'ships', 'satellites', 'orbits', 'bases', 'conflicts', 'cities'];
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
        try {
          const entityType = picked.id.properties?.entityType?.getValue();
          const entityDataStr = picked.id.properties?.entityData?.getValue();
          if (entityType && entityDataStr) {
            onEntitySelect({ type: entityType, data: JSON.parse(entityDataStr) });
          }
        } catch (e) {
          console.warn('Entity pick error', e);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;

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

  // Aircraft layer - white plane dots
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
          color: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#ffffff60'),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.8, 2e7, 0.5),
        },
        properties: {
          entityType: 'aircraft',
          entityData: JSON.stringify(a),
        },
      });
    });
  }, [aircraft, layers.aircraft]);

  // Ships layer
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
          pixelSize: 6,
          color: Cesium.Color.fromCssColorString(shipColors[s.type] || '#3b82f6'),
          outlineColor: Cesium.Color.fromCssColorString((shipColors[s.type] || '#3b82f6') + '80'),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.6),
        },
        properties: {
          entityType: 'ship',
          entityData: JSON.stringify(s),
        },
      });
    });
  }, [layers.ships]);

  // Satellites layer - amber dots
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
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.3),
        },
        properties: {
          entityType: 'satellite',
          entityData: JSON.stringify(s),
        },
      });
    });
  }, [satellites, layers.satellites]);

  // Orbit polylines
  useEffect(() => {
    const ds = dsRefs.current['orbits'];
    if (!ds) return;
    ds.show = layers.satellites && layers.showOrbits;
    ds.entities.removeAll();
    if (!layers.satellites || !layers.showOrbits) return;

    // Only draw orbits for first 200 sats to keep it performant
    const subset = satellites.slice(0, 200);
    subset.forEach((s) => {
      const coords = computeOrbitPath(s.tle1, s.tle2, 90);
      if (coords.length < 6) return;
      ds.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(coords),
          width: 1,
          material: Cesium.Color.fromCssColorString('#f59e0b30'),
          clampToGround: false,
        },
      });
    });
  }, [satellites, layers.satellites, layers.showOrbits]);

  // Military bases layer - green
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
          pixelSize: 7,
          color: Cesium.Color.fromCssColorString('#39ff14'),
          outlineColor: Cesium.Color.fromCssColorString('#39ff1440'),
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.6),
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
      const color = z.severity === 'high' ? '#ff333340' : z.severity === 'medium' ? '#f59e0b30' : '#f59e0b18';
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

  // Cities layer - tiered visibility
  useEffect(() => {
    const ds = dsRefs.current['cities'];
    if (!ds) return;
    ds.show = layers.cities;
    ds.entities.removeAll();
    if (!layers.cities) return;

    CITIES.forEach((c) => {
      const size = c.tier === 1 ? 6 : c.tier === 2 ? 4 : 3;
      const labelDist = c.tier === 1 ? 1.2e7 : c.tier === 2 ? 6e6 : 3e6;
      const pointDist = c.tier === 1 ? 2e7 : c.tier === 2 ? 1.2e7 : 6e6;

      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(c.longitude, c.latitude, 0),
        point: {
          pixelSize: size,
          color: Cesium.Color.fromCssColorString('#e2e8f0'),
          outlineColor: Cesium.Color.fromCssColorString('#e2e8f060'),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, pointDist, c.tier === 1 ? 0.5 : 0),
        },
        label: {
          text: c.name,
          font: '10px Orbitron',
          fillColor: Cesium.Color.fromCssColorString('#e2e8f0'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1, labelDist, 0),
          translucencyByDistance: new Cesium.NearFarScalar(1e5, 1, labelDist, 0),
        },
        properties: {
          entityType: 'city',
          entityData: JSON.stringify(c),
        },
      });
    });
  }, [layers.cities]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
