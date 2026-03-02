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
      coords.push(
        (geo.longitude * 180) / Math.PI,
        (geo.latitude * 180) / Math.PI,
        geo.height * 1000
      );
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
  const weatherLayerRef = useRef<any>(null);

  // Initialize viewer once
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    if (typeof Cesium === 'undefined') {
      console.error('Cesium not loaded');
      return;
    }

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

    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 18,
        credit: 'Esri, Maxar, Earthstar Geographics',
      })
    );

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

    const layerNames = ['aircraft', 'ships', 'satellites', 'orbits', 'bases', 'conflicts', 'cities'];
    layerNames.forEach((name) => {
      const ds = new Cesium.CustomDataSource(name);
      viewer.dataSources.add(ds);
      dsRefs.current[name] = ds;
    });

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

  // Aircraft layer
  useEffect(() => {
    const ds = dsRefs.current['aircraft'];
    if (!ds) return;
    ds.show = layers.aircraft;
    ds.entities.removeAll();
    if (!layers.aircraft) return;

    aircraft.forEach((a) => {
      const isMil = layers.militaryFlights && !!a.militaryClassification;
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(a.longitude, a.latitude, a.altitude || 1000),
        point: {
          pixelSize: isMil ? 6 : 4,
          color: isMil
            ? Cesium.Color.fromCssColorString('#ff8c00')
            : Cesium.Color.WHITE,
          outlineColor: isMil
            ? Cesium.Color.fromCssColorString('#ff8c0060')
            : Cesium.Color.fromCssColorString('#ffffff60'),
          outlineWidth: isMil ? 2 : 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.8, 2e7, 0.5),
        },
        properties: {
          entityType: 'aircraft',
          entityData: JSON.stringify(a),
        },
      });
    });
  }, [aircraft, layers.aircraft, layers.militaryFlights]);

  // Ships layer
  useEffect(() => {
    const ds = dsRefs.current['ships'];
    if (!ds) return;
    ds.show = layers.ships;
    ds.entities.removeAll();
    if (!layers.ships) return;

    const shipColors: Record<string, string> = {
      cargo: '#3b82f6', tanker: '#f59e0b', passenger: '#8b5cf6',
      fishing: '#10b981', military: '#ef4444',
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
        properties: { entityType: 'ship', entityData: JSON.stringify(s) },
      });
    });
  }, [layers.ships]);

  // Satellites layer
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
        properties: { entityType: 'satellite', entityData: JSON.stringify(s) },
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
          pixelSize: 7,
          color: Cesium.Color.fromCssColorString('#39ff14'),
          outlineColor: Cesium.Color.fromCssColorString('#39ff1440'),
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.6),
        },
        properties: { entityType: 'base', entityData: JSON.stringify(b) },
      });
    });
  }, [layers.bases]);

  // Conflict zones
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
        properties: { entityType: 'conflict', entityData: JSON.stringify(z) },
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
        properties: { entityType: 'city', entityData: JSON.stringify(c) },
      });
    });
  }, [layers.cities]);

  // Weather radar layer
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (!layers.weatherRadar) {
      if (weatherLayerRef.current) {
        viewer.imageryLayers.remove(weatherLayerRef.current);
        weatherLayerRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const loadRadar = () => {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          if (weatherLayerRef.current) {
            viewer.imageryLayers.remove(weatherLayerRef.current);
          }
          const latest = data.radar.past[data.radar.past.length - 1];
          const provider = new Cesium.UrlTemplateImageryProvider({
            url: `https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/2/1_1.png`,
            maximumLevel: 12,
          });
          const layer = viewer.imageryLayers.addImageryProvider(provider);
          layer.alpha = 0.5;
          weatherLayerRef.current = layer;
        })
        .catch(e => console.warn('Weather radar fetch failed:', e));
    };

    loadRadar();
    const interval = setInterval(loadRadar, 300000); // 5 min

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (weatherLayerRef.current && viewer && !viewer.isDestroyed()) {
        viewer.imageryLayers.remove(weatherLayerRef.current);
        weatherLayerRef.current = null;
      }
    };
  }, [layers.weatherRadar]);

  return <div ref={containerRef} className="w-full h-full" />;
}
