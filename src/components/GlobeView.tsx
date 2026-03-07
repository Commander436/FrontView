import { useEffect, useRef, useCallback } from 'react';
import { LayerVisibility, Aircraft, SatelliteData, DensityMode, DisplayMode } from '@/types/globe';
import { CITIES } from '@/data/cities';
import { MILITARY_BASES } from '@/data/militaryBases';
import { CONFLICT_ZONES } from '@/data/conflictZones';
import { SAMPLE_SHIPS } from '@/data/ships';
import { INFRASTRUCTURE } from '@/data/infrastructure';
import { GPS_INTERFERENCE_ZONES } from '@/data/gpsInterference';
import { INTERNET_BLACKOUTS } from '@/data/internetBlackouts';
import { AIRSPACE_CLOSURES } from '@/data/airspaceClosures';
import { LIVE_CAMERAS } from '@/data/liveCameras';
import { twoline2satrec, propagate, gstime, eciToGeodetic } from 'satellite.js';

declare const Cesium: any;

// ---- Improved SVG Icon Data URIs ----
const mkIcon = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

// Civil aircraft — sleek airliner silhouette
const ICON_PLANE = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="white" stroke="white" stroke-width="0.3"><path d="M12 2L14 8H20L14.5 12L16 20H12L10 15L4 17L6 12L4 7H10Z"/></g></svg>`);

// Military aircraft — angular fighter silhouette
const ICON_MIL_PLANE = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="#ff8c00" stroke="#ff6600" stroke-width="0.5"><path d="M12 1L15 9H22L15 13L17 22H12L10 16L2 18L5 12L2 6H10Z"/></g></svg>`);

// Satellite — solar panel silhouette
const ICON_SAT = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="#f59e0b" stroke="#d97706" stroke-width="0.3"><rect x="1" y="6" width="5" height="4" rx="0.5"/><rect x="10" y="6" width="5" height="4" rx="0.5"/><rect x="6" y="5" width="4" height="6" rx="1" fill="#fbbf24"/><circle cx="8" cy="8" r="1.5" fill="#d97706"/></g></svg>`);

// Military base — shield + star
const ICON_BASE = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path d="M9 1L16 5V10C16 14 12.5 17 9 17C5.5 17 2 14 2 10V5Z" fill="#39ff1440" stroke="#39ff14" stroke-width="1"/><polygon points="9,5 10.2,7.5 13,7.8 11,9.7 11.5,12.5 9,11.2 6.5,12.5 7,9.7 5,7.8 7.8,7.5" fill="#39ff14"/></svg>`);

// City — skyline silhouette
const ICON_CITY = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.3"><rect x="2" y="8" width="3" height="7"/><rect x="6" y="4" width="4" height="11"/><rect x="11" y="6" width="3" height="9"/><rect x="7" y="1" width="2" height="3" fill="#94a3b8"/></g></svg>`);

// Airport — runway icon
const ICON_AIRPORT = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="#7dd3fc" stroke="#38bdf8" stroke-width="0.4"><path d="M8 1L11 6H14L10 10L12 15H8L6 11L2 13L4 9L2 5H6Z"/></g></svg>`);

// Port — anchor / crane icon
const ICON_PORT = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="none" stroke="#60a5fa" stroke-width="1.2"><circle cx="8" cy="4" r="2"/><line x1="8" y1="6" x2="8" y2="14"/><path d="M4 14C4 11 8 10 8 10C8 10 12 11 12 14"/><line x1="5" y1="9" x2="11" y2="9"/></g></svg>`);

// Energy — lightning bolt
const ICON_ENERGY_WIND = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="none" stroke="#facc15" stroke-width="1"><line x1="8" y1="2" x2="8" y2="14"/><line x1="8" y1="2" x2="3" y2="8"/><line x1="8" y1="2" x2="13" y2="8"/><line x1="8" y1="2" x2="8" y2="8" stroke-dasharray="1 1"/></g></svg>`);
const ICON_ENERGY_SOLAR = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="#facc15" stroke="#eab308" stroke-width="0.4"><rect x="2" y="6" width="12" height="8" rx="1"/><line x1="2" y1="10" x2="14" y2="10" stroke="#eab308" stroke-width="0.5"/><line x1="6" y1="6" x2="6" y2="14" stroke="#eab308" stroke-width="0.5"/><line x1="10" y1="6" x2="10" y2="14" stroke="#eab308" stroke-width="0.5"/></g></svg>`);
const ICON_ENERGY_NUCLEAR = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="none" stroke="#facc15" stroke-width="1"><circle cx="8" cy="8" r="2"/><circle cx="8" cy="8" r="5"/><path d="M8 3L10 6H6Z" fill="#facc15"/><path d="M12 11L9 9L11 7Z" fill="#facc15"/><path d="M4 11L7 9L5 7Z" fill="#facc15"/></g></svg>`);
const ICON_ENERGY_HYDRO = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="#38bdf8" stroke="#0ea5e9" stroke-width="0.5"><path d="M2 4L14 4L14 12L2 12Z" fill="#38bdf820"/><path d="M4 8Q6 5 8 8Q10 11 12 8" stroke="#38bdf8" stroke-width="1.2" fill="none"/></g></svg>`);

// Telecom — tower with signal waves
const ICON_TELECOM = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="none" stroke="#a78bfa" stroke-width="0.8"><line x1="8" y1="4" x2="8" y2="14"/><line x1="6" y1="14" x2="10" y2="14"/><line x1="5" y1="11" x2="11" y2="11"/><path d="M4 6C5.5 3 10.5 3 12 6" stroke-width="1"/><path d="M5 8C6 6 10 6 11 8" stroke-width="0.8"/><circle cx="8" cy="4" r="1.2" fill="#a78bfa"/></g></svg>`);

// Camera icon
const ICON_CAMERA = mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="#34d399" stroke="#10b981" stroke-width="0.5"><rect x="2" y="4" width="12" height="9" rx="1.5"/><circle cx="8" cy="8.5" r="2.5" fill="none" stroke-width="1"/><circle cx="8" cy="8.5" r="1" fill="#34d399"/><rect x="6" y="2" width="4" height="2" rx="0.5"/></g></svg>`);

const SHIP_COLORS: Record<string, string> = { cargo: '#3b82f6', tanker: '#f59e0b', passenger: '#8b5cf6', fishing: '#10b981', military: '#ef4444' };
function makeShipIcon(type: string) {
  const c = SHIP_COLORS[type] || '#3b82f6';
  return mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M8 2L13 10H3Z" fill="${c}" stroke="${c}" stroke-width="0.3"/><line x1="8" y1="10" x2="8" y2="14" stroke="${c}" stroke-width="1"/></svg>`);
}

function getInfraIcon(type: string) {
  if (type === 'airport') return ICON_AIRPORT;
  if (type === 'port') return ICON_PORT;
  if (type === 'wind_farm') return ICON_ENERGY_WIND;
  if (type === 'solar_farm') return ICON_ENERGY_SOLAR;
  if (type === 'nuclear') return ICON_ENERGY_NUCLEAR;
  if (type === 'hydro') return ICON_ENERGY_HYDRO;
  if (type === 'radio_tower' || type === 'cell_tower' || type === 'broadcast_tower') return ICON_TELECOM;
  return ICON_ENERGY_WIND;
}

// ---- Helpers ----
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

  // Persistent entity maps
  const aircraftEntities = useRef<Map<string, any>>(new Map());
  const aircraftLastSeen = useRef<Map<string, number>>(new Map());
  const aircraftSpawnDensity = useRef<Set<string>>(new Set());
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

    const layerNames = ['aircraft', 'ships', 'satellites', 'orbits', 'bases', 'conflicts', 'cities', 'buildings', 'traffic', 'infrastructure', 'gpsInterference', 'internetBlackouts', 'airspaceClosures', 'liveCameras'];
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

  // ========== AIRCRAFT (persistent entities, spawn-only density, permanent availability) ==========
  useEffect(() => {
    const ds = dsRefs.current['aircraft'];
    const viewer = viewerRef.current;
    if (!ds || !viewer) return;
    ds.show = layers.aircraft;

    if (!layers.aircraft) {
      // Only hide when layer is fully disabled
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
        // Update existing — never re-check density, never recreate
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
        // New entity — density filter at spawn only; never filter military
        if (isMil ? false : !passDensity(a.icao24, density)) return;
        aircraftSpawnDensity.current.add(a.icao24);

        const posProperty = new Cesium.SampledPositionProperty();
        posProperty.addSample(now, newPos);
        posProperty.addSample(future, newPos);
        const entity = ds.entities.add({
          id: `ac-${a.icao24}`,
          position: posProperty,
          // No availability set = permanent (avoids the 1-second vanish bug)
          billboard: {
            image: isMil ? ICON_MIL_PLANE : ICON_PLANE,
            width: isMil ? 22 : 16, height: isMil ? 22 : 16,
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
          image: makeShipIcon(s.type), width: 16, height: 16,
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.5),
        },
        properties: { entityType: 'ship', entityData: JSON.stringify(s) },
      });
    });
  }, [layers.ships, density]);

  // ========== SATELLITES (persistent entities, spawn-only density, permanent availability) ==========
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
        if (!passDensity(sid, density)) return;
        satSpawnDensity.current.add(sid);

        const posProperty = new Cesium.SampledPositionProperty();
        posProperty.addSample(now, newPos);
        posProperty.addSample(future, newPos);
        const entity = ds.entities.add({
          id: `sat-${sid}`,
          position: posProperty,
          billboard: {
            image: ICON_SAT, width: 14, height: 14,
            disableDepthTestDistance: 0,
            scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.3),
          },
          properties: { entityType: 'satellite', entityData: JSON.stringify(s) },
        });
        satEntities.current.set(sid, entity);
      }
    });

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
          image: ICON_BASE, width: 18, height: 18,
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.5),
        },
        properties: { entityType: 'base', entityData: JSON.stringify(b) },
      });
    });
  }, [layers.bases, density]);

  // ========== CONFLICT ZONES (point events, no circles) ==========
  useEffect(() => {
    const ds = dsRefs.current['conflicts'];
    if (!ds) return;
    ds.show = layers.conflicts;
    ds.entities.removeAll();
    if (!layers.conflicts) return;

    const EVENT_COLORS: Record<string, string> = {
      combat: '#ff3333', strike: '#ff6600', humanitarian: '#ff9900',
      standoff: '#ffcc00', thermal: '#ff4400',
    };

    CONFLICT_ZONES.forEach(z => {
      if (!passDensity(z.name, density)) return;
      const evtColor = EVENT_COLORS[z.eventType || 'combat'] || '#ff3333';
      const glowAlpha = z.severity === 'high' ? 0.7 : z.severity === 'medium' ? 0.5 : 0.3;
      // Recency fading: newer = brighter
      const age = z.timestamp ? (Date.now() - new Date(z.timestamp).getTime()) / 86400000 : 1;
      const recencyFade = Math.max(0.3, 1 - age * 0.1);

      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(z.longitude, z.latitude, 100),
        point: {
          pixelSize: z.severity === 'high' ? 10 : z.severity === 'medium' ? 7 : 5,
          color: Cesium.Color.fromCssColorString(evtColor).withAlpha(glowAlpha * recencyFade),
          outlineColor: Cesium.Color.fromCssColorString(evtColor).withAlpha(0.9 * recencyFade),
          outlineWidth: 2,
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 2.0, 2e7, 0.5),
        },
        label: {
          text: z.name, font: '9px Orbitron',
          fillColor: Cesium.Color.fromCssColorString(evtColor).withAlpha(recencyFade),
          outlineColor: Cesium.Color.BLACK, outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1, 8e6, 0),
          translucencyByDistance: new Cesium.NearFarScalar(1e5, 1, 8e6, 0),
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
        billboard: {
          image: ICON_CITY, width: size * 2.5, height: size * 2.5,
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
          image: getInfraIcon(item.type), width: 16, height: 16,
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

  // ========== GPS INTERFERENCE (hex-grid style, score-based coloring) ==========
  useEffect(() => {
    const ds = dsRefs.current['gpsInterference'];
    if (!ds) return;
    ds.show = layers.gpsInterference;
    ds.entities.removeAll();
    if (!layers.gpsInterference) return;

    // Score-based color: yellow(0.3) → orange(0.6) → red(0.9+)
    const scoreColor = (score: number) => {
      if (displayMode === 'nvg') return `rgba(57,255,20,${score * 0.6})`;
      if (displayMode === 'crt') return `rgba(0,255,64,${score * 0.5})`;
      if (displayMode === 'flir') return `rgba(255,${Math.round(200 - score * 180)},0,${score * 0.6})`;
      const r = Math.min(255, Math.round(255 * score));
      const g = Math.round(200 * (1 - score));
      return `rgba(${r},${g},0,${score * 0.5})`;
    };
    const scoreOutline = (score: number) => {
      if (displayMode === 'nvg') return '#39ff14';
      if (displayMode === 'crt') return '#00ff40';
      if (displayMode === 'flir') return '#ff6600';
      const r = Math.min(255, Math.round(255 * score));
      const g = Math.round(180 * (1 - score));
      return `rgb(${r},${g},0)`;
    };

    // Render each zone as a hexagonal polygon approximation
    GPS_INTERFERENCE_ZONES.forEach(z => {
      if (!passDensity(z.id, density)) return;
      const score = z.interferenceScore;
      
      // Create hex vertices around center
      const hexCoords: number[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const dLat = (z.radius / 111000) * Math.cos(angle);
        const dLon = (z.radius / (111000 * Math.cos(z.latitude * Math.PI / 180))) * Math.sin(angle);
        hexCoords.push(z.longitude + dLon, z.latitude + dLat);
      }

      ds.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(hexCoords),
          material: Cesium.Color.fromCssColorString(scoreColor(score)),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(scoreOutline(score)),
          outlineWidth: score > 0.7 ? 2 : 1,
          height: 0,
        },
        properties: { entityType: 'gps_interference', entityData: JSON.stringify(z) },
      });
    });
  }, [layers.gpsInterference, density, displayMode]);

  // ========== INTERNET BLACKOUTS (country/region polygons) ==========
  useEffect(() => {
    const ds = dsRefs.current['internetBlackouts'];
    if (!ds) return;
    ds.show = layers.internetBlackouts;
    ds.entities.removeAll();
    if (!layers.internetBlackouts) return;

    const getFill = (severity: string) => {
      if (displayMode === 'nvg') return severity === 'critical' ? '#00440060' : '#00440035';
      if (displayMode === 'crt') return severity === 'critical' ? '#00220060' : '#00220035';
      if (displayMode === 'flir') return severity === 'critical' ? '#0000cc50' : '#3333aa30';
      return severity === 'critical' ? '#1a000080' : severity === 'major' ? '#2a000060' : '#3a000040';
    };
    const getOutline = (severity: string) => {
      if (displayMode === 'nvg') return '#00ff00';
      if (displayMode === 'crt') return '#00cc00';
      if (displayMode === 'flir') return '#4444ff';
      return severity === 'critical' ? '#ff3333' : '#ff6633';
    };

    INTERNET_BLACKOUTS.forEach(b => {
      if (!passDensity(b.id, density)) return;
      if (!b.polygon || b.polygon.length < 3) return;

      const coords = b.polygon.flatMap(([lon, lat]) => [lon, lat]);
      ds.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(coords),
          material: Cesium.Color.fromCssColorString(getFill(b.severity)),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(getOutline(b.severity)),
          outlineWidth: b.severity === 'critical' ? 2 : 1,
          height: 0,
        },
        properties: { entityType: 'internet_blackout', entityData: JSON.stringify(b) },
      });
    });
  }, [layers.internetBlackouts, density, displayMode]);

  // ========== AIRSPACE CLOSURES (polygon borders with live status styling) ==========
  useEffect(() => {
    const ds = dsRefs.current['airspaceClosures'];
    if (!ds) return;
    ds.show = layers.airspaceClosures;
    ds.entities.removeAll();
    if (!layers.airspaceClosures) return;

    AIRSPACE_CLOSURES.forEach(ac => {
      const coords = ac.polygon.flatMap(([lon, lat]) => [lon, lat]);

      let fillColor: string, outlineColor: string, outlineWidth: number;
      if (ac.status === 'active') {
        if (displayMode === 'nvg') { fillColor = '#39ff1430'; outlineColor = '#39ff14'; }
        else if (displayMode === 'crt') { fillColor = '#00ff4030'; outlineColor = '#00ff40'; }
        else if (displayMode === 'flir') { fillColor = '#ff440040'; outlineColor = '#ff6600'; }
        else { fillColor = '#ff333340'; outlineColor = '#ff4444'; }
        outlineWidth = 2;
      } else if (ac.status === 'inactive') {
        fillColor = '#00000000';
        outlineColor = displayMode === 'nvg' ? '#39ff1440' : displayMode === 'crt' ? '#00ff4040' : '#88888850';
        outlineWidth = 1;
      } else {
        fillColor = '#ffaa0015';
        outlineColor = displayMode === 'nvg' ? '#39ff1480' : displayMode === 'crt' ? '#00ff4080' : '#ffaa00';
        outlineWidth = 1;
      }

      ds.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(coords),
          material: Cesium.Color.fromCssColorString(fillColor),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(outlineColor),
          outlineWidth: outlineWidth,
          height: 0,
        },
        properties: { entityType: 'airspace_closure', entityData: JSON.stringify(ac) },
      });
    });
  }, [layers.airspaceClosures, displayMode]);

  // ========== LIVE CAMERAS (zoom-gated) ==========
  useEffect(() => {
    const ds = dsRefs.current['liveCameras'];
    const viewer = viewerRef.current;
    if (!ds || !viewer) return;
    ds.show = layers.liveCameras;
    ds.entities.removeAll();
    if (!layers.liveCameras) return;

    // Initial load of all cameras — visibility controlled by scaleByDistance
    LIVE_CAMERAS.forEach(cam => {
      if (!passDensity(cam.id, density)) return;
      
      const statusDot = cam.status === 'online' ? '●' : '○';
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(cam.longitude, cam.latitude, 50),
        billboard: {
          image: ICON_CAMERA, width: 16, height: 16,
          disableDepthTestDistance: 0,
          // Only show when zoomed to city level (~500km)
          scaleByDistance: new Cesium.NearFarScalar(1e4, 1.5, 5e5, 0),
        },
        label: {
          text: `${statusDot} ${cam.name}`, font: '9px Orbitron',
          fillColor: Cesium.Color.fromCssColorString(cam.status === 'online' ? '#34d399' : '#888888'),
          outlineColor: Cesium.Color.BLACK, outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e4, 1, 3e5, 0),
          translucencyByDistance: new Cesium.NearFarScalar(1e4, 1, 3e5, 0),
        },
        properties: { entityType: 'live_camera', entityData: JSON.stringify(cam) },
      });
    });
  }, [layers.liveCameras, density]);

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

  // ========== STREET TRAFFIC ==========
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
        if (v.progress < 0) { v.progress += 1; }
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
