import { useEffect, useRef, useCallback } from 'react';
import { LayerVisibility, Aircraft, SatelliteData, DensityMode, DisplayMode } from '@/types/globe';
import { CITIES } from '@/data/cities';
import { MILITARY_BASES } from '@/data/militaryBases';
import { CONFLICT_ZONES } from '@/data/conflictZones';
import { SAMPLE_SHIPS } from '@/data/ships';
import { INFRASTRUCTURE } from '@/data/infrastructure';
import { GPS_INTERFERENCE_ZONES } from '@/data/gpsInterference';
import { INTERNET_BLACKOUTS } from '@/data/internetBlackouts';
import { twoline2satrec, propagate, gstime, eciToGeodetic } from 'satellite.js';

declare const Cesium: any;

// ---- SVG Icon Data URIs ----
const mkIcon = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
const ICON_PLANE = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8Z" fill="white"/></svg>');
const ICON_MIL_PLANE = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8Z" fill="#ff8c00"/></svg>');
const ICON_SAT = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><polygon points="6,0 12,6 6,12 0,6" fill="#f59e0b"/></svg>');
const ICON_BASE = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><polygon points="8,0 10,6 16,6 11,10 13,16 8,12 3,16 5,10 0,6 6,6" fill="#39ff14"/></svg>');
const ICON_AIRPORT = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path d="M7 1L9 5L13 7L9 9L7 13L5 9L1 7L5 5Z" fill="#7dd3fc"/></svg>');
const ICON_PORT = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path d="M7 2L12 10L2 10Z" fill="#60a5fa"/></svg>');
const ICON_ENERGY = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path d="M8 1L5 7H9L6 13" stroke="#facc15" fill="none" stroke-width="1.5"/></svg>');
const ICON_TELECOM = mkIcon('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="3" fill="none" stroke="#a78bfa" stroke-width="1"/><circle cx="7" cy="7" r="5.5" fill="none" stroke="#a78bfa" stroke-width="0.7"/><circle cx="7" cy="7" r="1.5" fill="#a78bfa"/></svg>');

const SHIP_COLORS: Record<string, string> = { cargo: '#3b82f6', tanker: '#f59e0b', passenger: '#8b5cf6', fishing: '#10b981', military: '#ef4444' };
function makeShipIcon(type: string) {
  const c = SHIP_COLORS[type] || '#3b82f6';
  return mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path d="M7 2L12 10L2 10Z" fill="${c}"/></svg>`);
}

function getInfraIcon(type: string) {
  if (type === 'airport') return ICON_AIRPORT;
  if (type === 'port') return ICON_PORT;
  if (type === 'radio_tower' || type === 'cell_tower' || type === 'broadcast_tower') return ICON_TELECOM;
  return ICON_ENERGY;
}

// ---- Helpers ----
// Density only used at spawn time for persistent entities
function passDensity(id: string, density: DensityMode): boolean {
  if (density === 'dense') return true;
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
  return (Math.abs(hash) % 100) < (density === 'moderate' ? 50 : 25);
}

function computeOrbitPath(tle1: string, tle2: string, steps = 90): number[] {
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
      coords.push((geo.longitude * 180) / Math.PI, (geo.latitude * 180) / Math.PI, geo.height * 1000);
    }
    return coords;
  } catch { return []; }
}

function interpolateRoad(coords: number[][], t: number): [number, number] {
  if (coords.length < 2) return coords[0] ? [coords[0][0], coords[0][1]] : [0, 0];
  const idx = Math.max(0, Math.min(t, 0.9999)) * (coords.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  return [
    coords[i][0] + f * (coords[i + 1][0] - coords[i][0]),
    coords[i][1] + f * (coords[i + 1][1] - coords[i][1]),
  ];
}

interface GlobeViewProps {
  layers: LayerVisibility;
  aircraft: Aircraft[];
  satellites: SatelliteData[];
  density: DensityMode;
  displayMode: DisplayMode;
  onEntitySelect: (entity: any) => void;
}

export function GlobeView({ layers, aircraft, satellites, density, displayMode, onEntitySelect }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const dsRefs = useRef<Record<string, any>>({});
  const weatherLayerRef = useRef<any>(null);

  // Persistent entity maps — NEVER clear these on update, only on layer disable
  const aircraftEntities = useRef<Map<string, any>>(new Map());
  const aircraftLastSeen = useRef<Map<string, number>>(new Map());
  const aircraftSpawnDensity = useRef<Set<string>>(new Set()); // tracks which passed density at spawn
  const satEntities = useRef<Map<string, any>>(new Map());
  const satSpawnDensity = useRef<Set<string>>(new Set());

  // Traffic refs
  const vehiclesRef = useRef<any[]>([]);
  const lastTrafficTime = useRef(Date.now());
  const trafficFetchedBbox = useRef('');
  const buildingFetchedBbox = useRef('');

  // ========== INIT VIEWER ==========
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    if (typeof Cesium === 'undefined') return;

    Cesium.Ion.defaultAccessToken = undefined;
    const viewer = new Cesium.Viewer(containerRef.current, {
      imageryProvider: false, baseLayerPicker: false, geocoder: false,
      homeButton: false, sceneModePicker: false, navigationHelpButton: false,
      animation: false, timeline: false, fullscreenButton: false,
      vrButton: false, selectionIndicator: false, infoBox: false,
      requestRenderMode: false, maximumRenderTimeChange: Infinity,
    });

    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 18, credit: 'Esri, Maxar, Earthstar Geographics',
      })
    );

    // Globe occlusion & depth testing
    viewer.scene.globe.show = true;
    viewer.scene.globe.baseColor = Cesium.Color.BLACK;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#080812');
    viewer.scene.skyBox = undefined;
    viewer.scene.sun = undefined;
    viewer.scene.moon = undefined;
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.fog.enabled = false;
    viewer.clock.shouldAnimate = true;
    viewer.camera.percentageChanged = 0.05;

    const layerNames = ['aircraft', 'ships', 'satellites', 'orbits', 'bases', 'conflicts', 'cities', 'buildings', 'traffic', 'infrastructure', 'gpsInterference', 'internetBlackouts'];
    layerNames.forEach(name => {
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
        } catch (e) { console.warn('Entity pick error', e); }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(20, 20, 20000000), duration: 0 });

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
      dsRefs.current = {};
    };
  }, []);

  // ========== AIRCRAFT (persistent entities, spawn-only density) ==========
  useEffect(() => {
    const ds = dsRefs.current['aircraft'];
    const viewer = viewerRef.current;
    if (!ds || !viewer) return;
    ds.show = layers.aircraft;

    if (!layers.aircraft) {
      ds.entities.removeAll();
      aircraftEntities.current.clear();
      aircraftLastSeen.current.clear();
      aircraftSpawnDensity.current.clear();
      return;
    }

    const now = Cesium.JulianDate.now();
    const future = Cesium.JulianDate.addSeconds(now, 2, new Cesium.JulianDate());
    const currentIds = new Set<string>();

    aircraft.forEach(a => {
      currentIds.add(a.icao24);
      aircraftLastSeen.current.set(a.icao24, Date.now());

      const existing = aircraftEntities.current.get(a.icao24);
      const isMil = layers.militaryFlights && !!a.militaryClassification;
      const newPos = Cesium.Cartesian3.fromDegrees(a.longitude, a.latitude, Math.max(a.altitude, 500));

      if (existing) {
        // Always update existing entities — never re-check density
        const posProperty = existing.position;
        if (posProperty && posProperty.addSample) {
          posProperty.addSample(future, newPos);
        } else {
          const newProp = new Cesium.SampledPositionProperty();
          newProp.addSample(now, newPos);
          newProp.addSample(future, newPos);
          existing.position = newProp;
        }
        existing.billboard.image = isMil ? ICON_MIL_PLANE : ICON_PLANE;
        existing.billboard.rotation = Cesium.Math.toRadians(-(a.heading || 0));
        existing.properties.entityData = JSON.stringify(a);
      } else {
        // New entity — apply density filter ONLY at spawn
        if (!passDensity(a.icao24, density)) return;
        aircraftSpawnDensity.current.add(a.icao24);

        const posProperty = new Cesium.SampledPositionProperty();
        posProperty.addSample(now, newPos);
        posProperty.addSample(future, newPos);
        const entity = ds.entities.add({
          id: `ac-${a.icao24}`,
          position: posProperty,
          billboard: {
            image: isMil ? ICON_MIL_PLANE : ICON_PLANE,
            width: isMil ? 20 : 14, height: isMil ? 20 : 14,
            rotation: Cesium.Math.toRadians(-(a.heading || 0)),
            alignedAxis: Cesium.Cartesian3.UNIT_Z,
            disableDepthTestDistance: 0,
            scaleByDistance: new Cesium.NearFarScalar(1e5, 1.8, 2e7, 0.4),
          },
          properties: { entityType: 'aircraft', entityData: JSON.stringify(a) },
        });
        aircraftEntities.current.set(a.icao24, entity);
      }
    });

    // Remove stale aircraft (gone for > 60s)
    const staleThreshold = Date.now() - 60000;
    for (const [id, lastSeen] of aircraftLastSeen.current) {
      if (!currentIds.has(id) && lastSeen < staleThreshold) {
        const entity = aircraftEntities.current.get(id);
        if (entity) ds.entities.remove(entity);
        aircraftEntities.current.delete(id);
        aircraftLastSeen.current.delete(id);
        aircraftSpawnDensity.current.delete(id);
      }
    }
  }, [aircraft, layers.aircraft, layers.militaryFlights]);

  // ========== SHIPS ==========
  useEffect(() => {
    const ds = dsRefs.current['ships'];
    if (!ds) return;
    ds.show = layers.ships;
    ds.entities.removeAll();
    if (!layers.ships) return;

    SAMPLE_SHIPS.forEach(s => {
      if (!passDensity(s.mmsi, density)) return;
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, 0),
        billboard: {
          image: makeShipIcon(s.type), width: 14, height: 14,
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.5),
        },
        properties: { entityType: 'ship', entityData: JSON.stringify(s) },
      });
    });
  }, [layers.ships, density]);

  // ========== SATELLITES (persistent entities, spawn-only density) ==========
  useEffect(() => {
    const ds = dsRefs.current['satellites'];
    const viewer = viewerRef.current;
    if (!ds || !viewer) return;
    ds.show = layers.satellites;

    if (!layers.satellites) {
      ds.entities.removeAll();
      satEntities.current.clear();
      satSpawnDensity.current.clear();
      return;
    }

    const now = Cesium.JulianDate.now();
    const future = Cesium.JulianDate.addSeconds(now, 2, new Cesium.JulianDate());
    const currentIds = new Set<string>();

    satellites.forEach(s => {
      const sid = s.noradId || s.name;
      currentIds.add(sid);

      const newPos = Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, s.altitude * 1000);
      const existing = satEntities.current.get(sid);

      if (existing) {
        // Always update — never re-check density
        const posProperty = existing.position;
        if (posProperty && posProperty.addSample) {
          posProperty.addSample(future, newPos);
        } else {
          const newProp = new Cesium.SampledPositionProperty();
          newProp.addSample(now, newPos);
          newProp.addSample(future, newPos);
          existing.position = newProp;
        }
        existing.properties.entityData = JSON.stringify(s);
      } else {
        // New entity — density only at spawn
        if (!passDensity(sid, density)) return;
        satSpawnDensity.current.add(sid);

        const posProperty = new Cesium.SampledPositionProperty();
        posProperty.addSample(now, newPos);
        posProperty.addSample(future, newPos);
        const entity = ds.entities.add({
          id: `sat-${sid}`,
          position: posProperty,
          billboard: {
            image: ICON_SAT, width: 10, height: 10,
            disableDepthTestDistance: 0,
            scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.3),
          },
          properties: { entityType: 'satellite', entityData: JSON.stringify(s) },
        });
        satEntities.current.set(sid, entity);
      }
    });

    // Remove satellites no longer in feed (immediate for sats since TLE updates are infrequent)
    for (const [id] of satEntities.current) {
      if (!currentIds.has(id)) {
        const entity = satEntities.current.get(id);
        if (entity) ds.entities.remove(entity);
        satEntities.current.delete(id);
        satSpawnDensity.current.delete(id);
      }
    }
  }, [satellites, layers.satellites]);

  // ========== ORBIT POLYLINES ==========
  useEffect(() => {
    const ds = dsRefs.current['orbits'];
    if (!ds) return;
    ds.show = layers.satellites && layers.showOrbits;
    ds.entities.removeAll();
    if (!layers.satellites || !layers.showOrbits) return;

    satellites.slice(0, 200).forEach(s => {
      const coords = computeOrbitPath(s.tle1, s.tle2, 90);
      if (coords.length < 6) return;
      ds.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(coords),
          width: 1,
          material: Cesium.Color.fromCssColorString('#f59e0b30'),
          clampToGround: false,
          depthFailMaterial: Cesium.Color.fromCssColorString('#f59e0b10'),
        },
      });
    });
  }, [satellites, layers.satellites, layers.showOrbits]);

  // ========== MILITARY BASES ==========
  useEffect(() => {
    const ds = dsRefs.current['bases'];
    if (!ds) return;
    ds.show = layers.bases;
    ds.entities.removeAll();
    if (!layers.bases) return;

    MILITARY_BASES.forEach(b => {
      if (!passDensity(b.name, density)) return;
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(b.longitude, b.latitude, 0),
        billboard: {
          image: ICON_BASE, width: 16, height: 16,
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.5),
        },
        properties: { entityType: 'base', entityData: JSON.stringify(b) },
      });
    });
  }, [layers.bases, density]);

  // ========== CONFLICT ZONES ==========
  useEffect(() => {
    const ds = dsRefs.current['conflicts'];
    if (!ds) return;
    ds.show = layers.conflicts;
    ds.entities.removeAll();
    if (!layers.conflicts) return;

    CONFLICT_ZONES.forEach(z => {
      if (!passDensity(z.name, density)) return;
      const color = z.severity === 'high' ? '#ff333340' : z.severity === 'medium' ? '#f59e0b30' : '#f59e0b18';
      const outline = z.severity === 'high' ? '#ff3333' : '#f59e0b';
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(z.longitude, z.latitude, 0),
        ellipse: {
          semiMajorAxis: z.radius, semiMinorAxis: z.radius,
          material: Cesium.Color.fromCssColorString(color),
          outline: true, outlineColor: Cesium.Color.fromCssColorString(outline), outlineWidth: 1, height: 0,
        },
        properties: { entityType: 'conflict', entityData: JSON.stringify(z) },
      });
    });
  }, [layers.conflicts, density]);

  // ========== CITIES ==========
  useEffect(() => {
    const ds = dsRefs.current['cities'];
    if (!ds) return;
    ds.show = layers.cities;
    ds.entities.removeAll();
    if (!layers.cities) return;

    CITIES.forEach(c => {
      if (!passDensity(c.name, density)) return;
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
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, pointDist, c.tier === 1 ? 0.5 : 0),
        },
        label: {
          text: c.name, font: '10px Orbitron',
          fillColor: Cesium.Color.fromCssColorString('#e2e8f0'),
          outlineColor: Cesium.Color.BLACK, outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1, labelDist, 0),
          translucencyByDistance: new Cesium.NearFarScalar(1e5, 1, labelDist, 0),
        },
        properties: { entityType: 'city', entityData: JSON.stringify(c) },
      });
    });
  }, [layers.cities, density]);

  // ========== INFRASTRUCTURE ==========
  useEffect(() => {
    const ds = dsRefs.current['infrastructure'];
    if (!ds) return;

    ds.entities.removeAll();
    const showAirports = layers.airports;
    const showPorts = layers.ports;
    const showEnergy = layers.energy;
    const showTelecom = layers.telecom;

    if (!showAirports && !showPorts && !showEnergy && !showTelecom) {
      ds.show = false;
      return;
    }
    ds.show = true;

    INFRASTRUCTURE.forEach(item => {
      const shouldShow =
        (item.category === 'transport' && item.type === 'airport' && showAirports) ||
        (item.category === 'transport' && item.type === 'port' && showPorts) ||
        (item.category === 'energy' && showEnergy) ||
        (item.category === 'telecom' && showTelecom);
      if (!shouldShow) return;
      if (!passDensity(item.id, density)) return;

      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(item.longitude, item.latitude, 0),
        billboard: {
          image: getInfraIcon(item.type), width: 14, height: 14,
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 1e7, 0.4),
        },
        label: {
          text: item.name, font: '9px Orbitron',
          fillColor: Cesium.Color.fromCssColorString('#94a3b8'),
          outlineColor: Cesium.Color.BLACK, outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1, 5e6, 0),
          translucencyByDistance: new Cesium.NearFarScalar(1e5, 1, 5e6, 0),
        },
        properties: { entityType: 'infrastructure', entityData: JSON.stringify(item) },
      });
    });
  }, [layers.airports, layers.ports, layers.energy, layers.telecom, density]);

  // ========== GPS INTERFERENCE ZONES ==========
  useEffect(() => {
    const ds = dsRefs.current['gpsInterference'];
    if (!ds) return;
    ds.show = layers.gpsInterference;
    ds.entities.removeAll();
    if (!layers.gpsInterference) return;

    const getColor = (severity: string) => {
      if (displayMode === 'nvg') return severity === 'high' ? '#39ff1450' : '#39ff1425';
      if (displayMode === 'crt') return severity === 'high' ? '#00ff4050' : '#00ff4025';
      if (displayMode === 'flir') return severity === 'high' ? '#ff440060' : '#ff440030';
      return severity === 'high' ? '#ff440050' : severity === 'medium' ? '#ff880035' : '#ff880020';
    };
    const getOutline = (severity: string) => {
      if (displayMode === 'nvg') return '#39ff14';
      if (displayMode === 'crt') return '#00ff40';
      if (displayMode === 'flir') return '#ff6600';
      return severity === 'high' ? '#ff4400' : '#ff8800';
    };

    GPS_INTERFERENCE_ZONES.forEach(z => {
      if (!passDensity(z.id, density)) return;
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(z.longitude, z.latitude, 0),
        ellipse: {
          semiMajorAxis: z.radius, semiMinorAxis: z.radius,
          material: Cesium.Color.fromCssColorString(getColor(z.severity)),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(getOutline(z.severity)),
          outlineWidth: 1, height: 0,
        },
        properties: { entityType: 'gps_interference', entityData: JSON.stringify(z) },
      });
    });
  }, [layers.gpsInterference, density, displayMode]);

  // ========== INTERNET BLACKOUTS ==========
  useEffect(() => {
    const ds = dsRefs.current['internetBlackouts'];
    if (!ds) return;
    ds.show = layers.internetBlackouts;
    ds.entities.removeAll();
    if (!layers.internetBlackouts) return;

    const getColor = (severity: string) => {
      if (displayMode === 'nvg') return severity === 'critical' ? '#00440060' : '#00440035';
      if (displayMode === 'crt') return severity === 'critical' ? '#00220060' : '#00220035';
      if (displayMode === 'flir') return severity === 'critical' ? '#0000cc50' : '#3333aa30';
      return severity === 'critical' ? '#1a1a1a80' : severity === 'major' ? '#2a2a2a60' : '#3a3a3a40';
    };
    const getOutline = (severity: string) => {
      if (displayMode === 'nvg') return '#00ff00';
      if (displayMode === 'crt') return '#00cc00';
      if (displayMode === 'flir') return '#4444ff';
      return severity === 'critical' ? '#ff3333' : '#ff6633';
    };

    INTERNET_BLACKOUTS.forEach(b => {
      if (!passDensity(b.id, density)) return;
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(b.longitude, b.latitude, 0),
        ellipse: {
          semiMajorAxis: b.radius, semiMinorAxis: b.radius,
          material: Cesium.Color.fromCssColorString(getColor(b.severity)),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(getOutline(b.severity)),
          outlineWidth: 1, height: 0,
        },
        properties: { entityType: 'internet_blackout', entityData: JSON.stringify(b) },
      });
    });
  }, [layers.internetBlackouts, density, displayMode]);

  // ========== WEATHER RADAR ==========
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
          if (weatherLayerRef.current) viewer.imageryLayers.remove(weatherLayerRef.current);
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
    const interval = setInterval(loadRadar, 300000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (weatherLayerRef.current && viewer && !viewer.isDestroyed()) {
        viewer.imageryLayers.remove(weatherLayerRef.current);
        weatherLayerRef.current = null;
      }
    };
  }, [layers.weatherRadar]);

  // ========== 3D BUILDINGS (Overpass, zoom-gated) ==========
  useEffect(() => {
    const viewer = viewerRef.current;
    const ds = dsRefs.current['buildings'];
    if (!viewer || !ds) return;
    ds.show = layers.buildings;
    if (!layers.buildings) { ds.entities.removeAll(); buildingFetchedBbox.current = ''; return; }

    const bColor = displayMode === 'nvg' ? '#39ff1480' : displayMode === 'crt' ? '#00ff4060' : displayMode === 'flir' ? '#ff660060' : '#1a1a2e80';
    const oColor = displayMode === 'nvg' ? '#39ff14' : displayMode === 'crt' ? '#00ff40' : displayMode === 'flir' ? '#ff6600' : '#00ffa340';
    let timeout: any;

    const checkZoom = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const height = viewer.camera.positionCartographic?.height;
        if (!height || height > 50000) { ds.entities.removeAll(); buildingFetchedBbox.current = ''; return; }
        const rect = viewer.camera.computeViewRectangle();
        if (!rect) return;
        const s = Cesium.Math.toDegrees(rect.south), w = Cesium.Math.toDegrees(rect.west);
        const n = Cesium.Math.toDegrees(rect.north), e = Cesium.Math.toDegrees(rect.east);
        if ((n - s) > 0.05 || (e - w) > 0.05) return;
        const bk = `${s.toFixed(4)},${w.toFixed(4)},${n.toFixed(4)},${e.toFixed(4)}`;
        if (bk === buildingFetchedBbox.current) return;
        buildingFetchedBbox.current = bk;
        try {
          const q = `[out:json][timeout:10];way["building"](${s},${w},${n},${e});out geom 300;`;
          const resp = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(q)}` });
          const data = await resp.json();
          ds.entities.removeAll();
          (data.elements || []).forEach((el: any) => {
            if (!el.geometry || el.geometry.length < 3) return;
            const coords = el.geometry.flatMap((nd: any) => [nd.lon, nd.lat]);
            const h = el.tags?.height ? parseFloat(el.tags.height) : el.tags?.['building:levels'] ? parseFloat(el.tags['building:levels']) * 3.5 : 15;
            ds.entities.add({
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(coords),
                extrudedHeight: h + 2, height: 2,
                material: Cesium.Color.fromCssColorString(bColor),
                outline: true, outlineColor: Cesium.Color.fromCssColorString(oColor), outlineWidth: 1,
              },
            });
          });
        } catch (err) { console.warn('Buildings fetch failed:', err); }
      }, 1500);
    };

    viewer.camera.changed.addEventListener(checkZoom);
    checkZoom();
    return () => { clearTimeout(timeout); viewer.camera.changed.removeEventListener(checkZoom); ds.entities.removeAll(); };
  }, [layers.buildings, displayMode]);

  // ========== STREET TRAFFIC (road graph, turning, VEH-IDs) ==========
  useEffect(() => {
    const viewer = viewerRef.current;
    const ds = dsRefs.current['traffic'];
    if (!viewer || !ds) return;
    ds.show = layers.streetTraffic;
    if (!layers.streetTraffic) { ds.entities.removeAll(); vehiclesRef.current = []; trafficFetchedBbox.current = ''; return; }

    let timeout: any;
    lastTrafficTime.current = Date.now();

    const vehColor = displayMode === 'nvg' ? Cesium.Color.LIME :
                     displayMode === 'crt' ? Cesium.Color.fromCssColorString('#00ff40') :
                     displayMode === 'flir' ? Cesium.Color.fromCssColorString('#ff6600') :
                     Cesium.Color.CYAN;

    const onPostRender = () => {
      const now = Date.now();
      const dt = (now - lastTrafficTime.current) / 1000;
      lastTrafficTime.current = now;
      vehiclesRef.current.forEach(v => {
        v.progress += v.speed * v.direction * dt;
        if (v.progress > 1) {
          if (v.nextPaths && v.nextPaths.length > 0) {
            const next = v.nextPaths[Math.floor(Math.random() * v.nextPaths.length)];
            v.coords = next;
            v.progress = 0;
          } else {
            v.progress -= 1;
          }
        }
        if (v.progress < 0) {
          v.progress += 1;
        }
        const [lon, lat] = interpolateRoad(v.coords, Math.abs(v.progress));
        v.entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, 3);
      });
    };
    viewer.scene.postRender.addEventListener(onPostRender);

    const checkZoom = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const height = viewer.camera.positionCartographic?.height;
        if (!height || height > 30000) { ds.entities.removeAll(); vehiclesRef.current = []; trafficFetchedBbox.current = ''; return; }
        const rect = viewer.camera.computeViewRectangle();
        if (!rect) return;
        const s = Cesium.Math.toDegrees(rect.south), w = Cesium.Math.toDegrees(rect.west);
        const n = Cesium.Math.toDegrees(rect.north), e = Cesium.Math.toDegrees(rect.east);
        if ((n - s) > 0.15 || (e - w) > 0.15) return;
        const bk = `${s.toFixed(3)},${w.toFixed(3)},${n.toFixed(3)},${e.toFixed(3)}`;
        if (bk === trafficFetchedBbox.current) return;
        trafficFetchedBbox.current = bk;
        try {
          const q = `[out:json][timeout:10];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"](${s},${w},${n},${e});out geom 100;`;
          const resp = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(q)}` });
          const data = await resp.json();
          ds.entities.removeAll();
          vehiclesRef.current = [];

          const roads: number[][][] = [];
          const nodeToRoads = new Map<string, number[]>();
          (data.elements || []).forEach((way: any, roadIdx: number) => {
            if (!way.geometry || way.geometry.length < 2) return;
            const coords: number[][] = way.geometry.map((nd: any) => [nd.lon, nd.lat]);
            roads.push(coords);
            const startKey = `${coords[0][0].toFixed(5)},${coords[0][1].toFixed(5)}`;
            const endKey = `${coords[coords.length-1][0].toFixed(5)},${coords[coords.length-1][1].toFixed(5)}`;
            [startKey, endKey].forEach(k => {
              if (!nodeToRoads.has(k)) nodeToRoads.set(k, []);
              nodeToRoads.get(k)!.push(roadIdx);
            });
          });

          roads.forEach((coords, roadIdx) => {
            const count = Math.min(Math.max(Math.floor(coords.length / 3), 1), 4);
            const endKey = `${coords[coords.length-1][0].toFixed(5)},${coords[coords.length-1][1].toFixed(5)}`;
            const connectedIdxs = (nodeToRoads.get(endKey) || []).filter(i => i !== roadIdx);
            const nextPaths = connectedIdxs.map(i => roads[i]);

            for (let i = 0; i < count; i++) {
              const vehId = `VEH-${Math.floor(1000 + Math.random() * 8999)}`;
              const speed = 0.01 + Math.random() * 0.03;
              const direction = Math.random() > 0.5 ? 1 : -1;
              const progress = Math.random();
              const [lon, lat] = interpolateRoad(coords, progress);
              const entity = ds.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lon, lat, 3),
                point: {
                  pixelSize: 4, color: vehColor,
                  outlineColor: vehColor.withAlpha(0.3), outlineWidth: 2,
                  disableDepthTestDistance: 0,
                },
                label: {
                  text: vehId, font: '8px JetBrains Mono',
                  fillColor: vehColor, outlineColor: Cesium.Color.BLACK, outlineWidth: 2,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  pixelOffset: new Cesium.Cartesian2(0, -10),
                  disableDepthTestDistance: 0,
                  scaleByDistance: new Cesium.NearFarScalar(100, 1, 15000, 0),
                },
              });
              vehiclesRef.current.push({ entity, coords, progress, speed, direction, nextPaths });
            }
          });
        } catch (err) { console.warn('Traffic fetch failed:', err); }
      }, 2000);
    };

    viewer.camera.changed.addEventListener(checkZoom);
    checkZoom();
    return () => {
      clearTimeout(timeout);
      viewer.scene.postRender.removeEventListener(onPostRender);
      viewer.camera.changed.removeEventListener(checkZoom);
      ds.entities.removeAll();
      vehiclesRef.current = [];
    };
  }, [layers.streetTraffic, displayMode]);

  return <div ref={containerRef} className="w-full h-full" />;
}
