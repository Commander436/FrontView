import { useEffect, useRef, useCallback } from 'react';
import { LayerVisibility, Aircraft, SatelliteData, DisplayMode } from '@/types/globe';
import { ThermalAnomaly } from '@/hooks/useFIRMS';
import { Ship } from '@/types/globe';
import { CITIES } from '@/data/cities';
import { MILITARY_BASES } from '@/data/militaryBases';
import { CONFLICT_ZONES } from '@/data/conflictZones';
// SAMPLE_SHIPS removed — using live AIS data
import { INFRASTRUCTURE } from '@/data/infrastructure';
import { GPS_INTERFERENCE_ZONES } from '@/data/gpsInterference';
import { INTERNET_BLACKOUTS } from '@/data/internetBlackouts';
import { AIRSPACE_CLOSURES } from '@/data/airspaceClosures';
import { OIL_PIPELINES } from '@/data/oilPipelines';
import { SUBSEA_CABLES } from '@/data/subseaCables';
import { twoline2satrec, propagate, gstime, eciToGeodetic } from 'satellite.js';

declare const Cesium: any;

// ---- SVG Icon Data URIs ----
const mkIcon = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
//
//  STEALTH‑ANGULAR ISR ICON PACK (Lucide‑Based, Modified)
//  Dual‑Tone Glass‑Edge • Semi‑Detailed • mkIcon‑Ready
//
// =========================
//   CIVILIAN AIRCRAFT (WHITE)
// =========================
const ICON_PLANE = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
  <path fill="#ffffff" fill-opacity="0.92"
        d="M2 16l8-2 2 6h2l2-6 8 2v-2l-8-5V3h-4v6l-8 5z"/>
  <path fill="#ffffff" fill-opacity="0.35"
        d="M4 15l7-4V5h2v6l7 4-7-2-1 4h-1l-1-4z"/>
</svg>
`);


// =========================
//   MILITARY AIRCRAFT (ORANGE, F‑35‑Inspired)
// =========================
const ICON_MIL_PLANE = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
  <path fill="#ff8c1a" fill-opacity="0.92"
        d="M12 2l4 5 6 3v2l-6-1-2 11h-4L8 11l-6 1V10l6-3z"/>
  <path fill="#ff8c1a" fill-opacity="0.45"
        d="M12 4l3 4 5 2-5-1-1 8h-2l-1-8-5 1 5-2z"/>
</svg>
`);


// =========================
//   UNKNOWN AIRCRAFT (GRAY)
// =========================
const ICON_UNKNOWN_PLANE = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
  <path fill="#c0c0c0" fill-opacity="0.92"
        d="M12 3l9 9-9 9-9-9z"/>
  <path fill="#ffffff" fill-opacity="0.25"
        d="M12 6l6 6-6 6-6-6z"/>
</svg>
`);


// =========================
//   SATELLITE (AMBER)
// =========================
const ICON_SAT = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
  <rect x="2" y="9" width="5" height="6" fill="#f59e0b" fill-opacity="0.9"/>
  <rect x="17" y="9" width="5" height="6" fill="#f59e0b" fill-opacity="0.9"/>
  <rect x="9" y="8" width="6" height="8" fill="#fbbf24" fill-opacity="0.9"/>
  <rect x="10" y="9" width="4" height="6" fill="#ffffff" fill-opacity="0.35"/>
</svg>
`);


// =========================
//   CARGO SHIP (CYAN)
// =========================
const ICON_CARGO_SHIP = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
  <path fill="#38bdf8" fill-opacity="0.92"
        d="M3 14l3-6h12l3 6-3 7H6z"/>
  <path fill="#ffffff" fill-opacity="0.35"
        d="M6 14l2-4h8l2 4-2 5H8z"/>
</svg>
`);


// =========================
//   PASSENGER SHIP (WHITE)
// =========================
const ICON_PASSENGER_SHIP = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
  <path fill="#ffffff" fill-opacity="0.92"
        d="M2 15l4-7h12l4 7-3 6H5z"/>
  <path fill="#ffffff" fill-opacity="0.45"
        d="M6 15l2-4h8l2 4-2 4H8z"/>
</svg>
`);


// =========================
//   BASE (GREEN)
// =========================
const ICON_BASE = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
  <path fill="#39ff14" fill-opacity="0.92"
        d="M12 2l10 6v6c0 6-5 10-10 10S2 20 2 14V8z"/>
  <path fill="#ffffff" fill-opacity="0.25"
        d="M12 4l8 5v5c0 5-4 8-8 8s-8-3-8-8V9z"/>
</svg>
`);


// =========================
//   CITY (WHITE)
// =========================
const ICON_CITY = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
  <rect x="3" y="10" width="4" height="11" fill="#ffffff" fill-opacity="0.92"/>
  <rect x="8" y="6" width="5" height="15" fill="#ffffff" fill-opacity="0.92"/>
  <rect x="14" y="8" width="4" height="13" fill="#ffffff" fill-opacity="0.92"/>
  <rect x="4" y="11" width="2" height="9" fill="#ffffff" fill-opacity="0.35"/>
  <rect x="9" y="7" width="3" height="13" fill="#ffffff" fill-opacity="0.35"/>
  <rect x="15" y="9" width="2" height="11" fill="#ffffff" fill-opacity="0.35"/>
</svg>
`);


// =========================
//   AIRPORT (CYAN)
// =========================
const ICON_AIRPORT = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
  <path fill="#7dd3fc" fill-opacity="0.92"
        d="M12 2l4 6h4l-5 5 2 7h-5l-2-5-5 2 2-4-2-6h4z"/>
  <path fill="#ffffff" fill-opacity="0.35"
        d="M12 4l3 5h3l-4 4 1 5h-3l-1-4-4 1 1-3-1-5h3z"/>
</svg>
`);


// =========================
//   PORT (CYAN)
// =========================
const ICON_PORT = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
  <circle cx="12" cy="5" r="3" fill="#38bdf8" fill-opacity="0.92"/>
  <path fill="#38bdf8" fill-opacity="0.92"
        d="M11 7h2v12h-2z"/>
  <path fill="#38bdf8" fill-opacity="0.92"
        d="M6 19c0-4 6-5 6-5s6 1 6 5z"/>
  <circle cx="12" cy="5" r="2" fill="#ffffff" fill-opacity="0.35"/>
</svg>
`);


// =========================
//   ENERGY / TELECOM / LZ
// =========================

// Wind
const ICON_ENERGY_WIND = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
  <path fill="#facc15" fill-opacity="0.92" d="M11 2h2v20h-2z"/>
  <path fill="#facc15" fill-opacity="0.92" d="M12 2l-6 7h3l3-4z"/>
  <path fill="#facc15" fill-opacity="0.92" d="M12 2l6 7h-3l-3-4z"/>
  <path fill="#ffffff" fill-opacity="0.35" d="M12 4l-3 4h2l1-2z"/>
</svg>
`);

// Solar
const ICON_ENERGY_SOLAR = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
  <rect x="3" y="8" width="18" height="12" fill="#facc15" fill-opacity="0.92"/>
  <rect x="4" y="9" width="16" height="10" fill="#ffffff" fill-opacity="0.35"/>
</svg>
`);

// Nuclear
const ICON_ENERGY_NUCLEAR = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="8" fill="none" stroke="#facc15" stroke-width="2" stroke-opacity="0.92"/>
  <circle cx="12" cy="12" r="3" fill="#facc15" fill-opacity="0.92"/>
  <circle cx="12" cy="12" r="2" fill="#ffffff" fill-opacity="0.35"/>
</svg>
`);

// Hydro
const ICON_ENERGY_HYDRO = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
  <rect x="3" y="7" width="18" height="10" fill="#38bdf8" fill-opacity="0.92"/>
  <rect x="4" y="8" width="16" height="8" fill="#ffffff" fill-opacity="0.35"/>
</svg>
`);

// Telecom
const ICON_TELECOM = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
  <rect x="11" y="5" width="2" height="14" fill="#a78bfa" fill-opacity="0.92"/>
  <circle cx="12" cy="5" r="2" fill="#a78bfa" fill-opacity="0.92"/>
  <circle cx="12" cy="5" r="1" fill="#ffffff" fill-opacity="0.35"/>
</svg>
`);

// Landing Zone
const ICON_LANDING = mkIcon(`
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="8" fill="#22d3ee40"/>
  <circle cx="12" cy="12" r="3" fill="#22d3ee"/>
</svg>
`);

// ---- Annotation point icons (military silhouette set) ----
const ANN_ICONS: Record<string, (color: string) => string> = {

  // =========================
  //   DOT (Target Marker)
  // =========================
  dot: (c) => mkIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="5" fill="${c}"/>
  </svg>
  `),

  // =========================
  //   PLANE (Ultra‑Minimal Jet)
  // =========================
  plane: (c) => mkIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <path fill="${c}" d="M12 2 L14 10 L22 13 L22 16 L14 14 L13 22 L11 22 L10 14 L2 16 L2 13 L10 10 Z"/>
  </svg>
  `),

  // =========================
  //   HELICOPTER (ISR Silhouette)
  // =========================
  helicopter: (c) => mkIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <path fill="${c}" d="M3 7 H21 V10 H13 V14 H10 V10 H3 Z"/>
    <rect x="9" y="14" width="6" height="4" fill="${c}"/>
    <rect x="2" y="6" width="20" height="1.5" fill="${c}"/>
  </svg>
  `),

  // =========================
  //   SHIP (Minimal Hull)
  // =========================
  ship: (c) => mkIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <path fill="${c}" d="M12 3 L20 10 H4 Z"/>
    <path fill="${c}" d="M4 11 H20 L18 20 H6 Z"/>
  </svg>
  `),

  // =========================
  //   TANK (Armored Silhouette)
  // =========================
  tank: (c) => mkIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <rect x="3" y="13" width="18" height="6" fill="${c}"/>
    <rect x="7" y="9" width="10" height="4" fill="${c}"/>
    <rect x="14" y="10" width="8" height="2" fill="${c}"/>
  </svg>
  `),

  // =========================
  //   INFANTRY (Minimal Soldier)
  // =========================
  infantry: (c) => mkIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <circle cx="12" cy="5" r="3" fill="${c}"/>
    <path fill="${c}" d="M7 22 V13 L12 9 L17 13 V22 H14 V16 H10 V22 Z"/>
  </svg>
  `),

  // =========================
  //   RADAR (Ultra‑Minimal Sweep)
  // =========================
  radar: (c) => mkIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="2"/>
    <circle cx="12" cy="12" r="5" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M12 12 L21 6" stroke="${c}" stroke-width="2"/>
  </svg>
  `),

  // =========================
  //   BUILDING (Minimal Block)
  // =========================
  building: (c) => mkIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
    <rect x="4" y="4" width="16" height="18" fill="${c}"/>
    <rect x="7" y="7" width="3" height="3" fill="black"/>
    <rect x="14" y="7" width="3" height="3" fill="black"/>
    <rect x="7" y="13" width="3" height="3" fill="black"/>
    <rect x="14" y="13" width="3" height="3" fill="black"/>
  </svg>
  `),
};
function getAnnotationIcon(kind: string, color: string) {
  return (ANN_ICONS[kind] || ANN_ICONS.dot)(color);
}

function annMaterial(color: any, style: string) {
  if (style === 'dashed') return new Cesium.PolylineDashMaterialProperty({ color, dashLength: 16 });
  if (style === 'dotted') return new Cesium.PolylineDashMaterialProperty({ color, dashLength: 6, dashPattern: 255 });
  if (style === 'arrow') return new Cesium.PolylineArrowMaterialProperty(color);
  return color;
}

const SHIP_COLORS: Record<string, string> = {
  cargo: '#3b82f6',     // blue cargo silhouette
  tanker: '#f59e0b',
  passenger: '#ffffff', // white cruise silhouette
  fishing: '#10b981',
  military: '#ef4444',
};
function makeShipIcon(type: string) {
  const c = SHIP_COLORS[type] || '#3b82f6';
  // Distinct silhouettes per class. All face "up" so billboard rotation matches heading.
  if (type === 'passenger') {
    return mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g fill="${c}" stroke="#000" stroke-width="0.6" stroke-linejoin="round"><path d="M20 3 L23 12 L23 22 L31 26 L31 30 L9 30 L9 26 L17 22 L17 12 Z"/><rect x="18" y="14" width="4" height="2"/><rect x="18" y="18" width="4" height="2"/></g></svg>`);
  }
  if (type === 'cargo' || type === 'tanker') {
    return mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g fill="${c}" stroke="#000" stroke-width="0.6" stroke-linejoin="round"><path d="M20 3 L24 14 L32 28 L8 28 L16 14 Z"/><rect x="14" y="18" width="12" height="3"/><rect x="14" y="22" width="12" height="3"/></g></svg>`);
  }
  // generic / fishing / military
  return mkIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g fill="${c}" stroke="#000" stroke-width="0.6" stroke-linejoin="round"><path d="M20 4 L26 16 L32 30 L8 30 L14 16 Z"/></g></svg>`);
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

function altitudeColor(alt: number): string {
  if (alt < 3000) return '#38bdf8';
  if (alt < 8000) return '#22d3ee';
  if (alt < 12000) return '#a3e635';
  return '#f97316';
}

function getAircraftIcon(a: Aircraft): string {
  if (a.isMilitary || a.militaryClassification) return ICON_MIL_PLANE;
  if (!a.callsign && !a.registration) return ICON_UNKNOWN_PLANE;
  return ICON_PLANE;
}

interface GlobeViewProps {
  layers: LayerVisibility;
  aircraft: Aircraft[];
  satellites: SatelliteData[];
  thermalAnomalies: ThermalAnomaly[];
  liveShips: Ship[];
  displayMode: DisplayMode;
  selectedEntity: { type: string; data: any } | null;
  onEntitySelect: (entity: any) => void;
  annotations?: any[];
  drawingTool?: 'point' | 'line' | 'square' | 'circle' | 'triangle' | 'custom' | null;
  onDrawComplete?: (kind: string, payload: any) => void;
}

export function GlobeView({ layers, aircraft, satellites, thermalAnomalies, liveShips, displayMode, selectedEntity, onEntitySelect, annotations = [], drawingTool = null, onDrawComplete }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedEntityRef = useRef(selectedEntity);
  selectedEntityRef.current = selectedEntity;
  const viewerRef = useRef<any>(null);
  const dsRefs = useRef<Record<string, any>>({});
  const weatherLayerRef = useRef<any>(null);

  // Persistent entity maps — NEVER cleared during updates
  const aircraftEntities = useRef<Map<string, any>>(new Map());
  const aircraftLastSeen = useRef<Map<string, number>>(new Map());
  const aircraftTrailHistory = useRef<Map<string, { lon: number; lat: number; alt: number; time: number }[]>>(new Map());

  const satEntities = useRef<Map<string, any>>(new Map());
  const shipEntities = useRef<Map<string, any>>(new Map());
  const shipLastSeen = useRef<Map<string, number>>(new Map());
  const shipTrails = useRef<Map<string, { time: number; lat: number; lon: number }[]>>(new Map());
  const shipTrailEntity = useRef<any>(null);
  const selectedSatOrbit = useRef<string | null>(null);

  const vehiclesRef = useRef<any[]>([]);
  const lastTrafficTime = useRef(Date.now());
  const trafficFetchedBbox = useRef('');
  const buildingFetchedBbox = useRef('');

  // 3D model spawn state (one model at a time)
  const modelEntityRef = useRef<any>(null);
  const modelOwnerRef = useRef<{ kind: 'aircraft' | 'ship' | 'satellite'; id: string } | null>(null);

  // Post-processing stage instances keyed by display mode
  const postStagesRef = useRef<Record<string, any>>({});
  const activeStageRef = useRef<any>(null);

  // -------- 3D model spawn helpers --------
  // Realistic free models (no API key needed)
  const MODEL_URIS: Record<string, string> = {
    'aircraft-civilian': 'https://models.babylonjs.com/CesiumAir/Cesium_Air.glb',
    'aircraft-military': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/F16/glTF/F16.gltf',
    'ship-cargo':        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CargoShip/glTF/CargoShip.gltf',
    'ship-passenger':    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf',
    'satellite':         'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ISS/glTF/ISS.gltf',
  };
  const MODEL_SCALE: Record<string, number> = {
    'aircraft-civilian': 120,
    'aircraft-military': 80,
    'ship-cargo':        200,
    'ship-passenger':    200,
    'satellite':         5000,
  };

  const despawnModel = useCallback(() => {
    const viewer = viewerRef.current;
    const m = modelEntityRef.current;
    if (viewer && m) {
      try { viewer.entities.remove(m); } catch { /* noop */ }
    }
    modelEntityRef.current = null;
    // Restore source billboard visibility
    const owner = modelOwnerRef.current;
    if (owner) {
      const src = owner.kind === 'aircraft'
        ? aircraftEntities.current.get(owner.id)
        : owner.kind === 'ship'
        ? shipEntities.current.get(owner.id)
        : satEntities.current.get(owner.id);
      if (src?.billboard) src.billboard.show = true;
    }
    modelOwnerRef.current = null;
    if (viewer) viewer.trackedEntity = undefined;
  }, []);

  const spawnModelFor = useCallback((kind: 'aircraft' | 'ship' | 'satellite', id: string, data: any, sourceEntity: any) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    despawnModel();

    let uriKey: string;
    if (kind === 'aircraft') {
      uriKey = (data.isMilitary || data.militaryClassification) ? 'aircraft-military' : 'aircraft-civilian';
    } else if (kind === 'ship') {
      uriKey = data.type === 'passenger' ? 'ship-passenger' : 'ship-cargo';
    } else {
      uriKey = 'satellite';
    }
    const uri = MODEL_URIS[uriKey];
    if (!uri) return;

    // Live-updating orientation: always uses the latest heading/track from the source entity.
    const orientation = new Cesium.CallbackProperty(() => {
      const pos = sourceEntity.position?.getValue(viewer.clock.currentTime);
      let live = 0;
      try {
        const raw = sourceEntity.properties?.entityData?.getValue();
        const d = raw ? JSON.parse(raw) : data;
        live = kind === 'aircraft' ? (d.heading ?? d.track ?? 0)
             : kind === 'ship'     ? (d.course  ?? d.heading ?? 0)
             : 0;
      } catch { live = 0; }
      const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(live), 0, 0);
      if (!pos) return Cesium.Transforms.headingPitchRollQuaternion(Cesium.Cartesian3.ZERO, hpr);
      return Cesium.Transforms.headingPitchRollQuaternion(pos, hpr);
    }, false);

    const modelEntity = viewer.entities.add({
      position: sourceEntity.position, // shares SampledPositionProperty
      orientation,
      model: {
        uri,
        minimumPixelSize: 32,
        maximumScale: 20000,
        scale: MODEL_SCALE[uriKey] ?? 1.0,
        runAnimations: false,
        silhouetteColor: kind === 'aircraft' && uriKey === 'aircraft-military'
          ? Cesium.Color.fromCssColorString('#ff8c1a')
          : Cesium.Color.WHITE,
        silhouetteSize: 1.5,
      },
      properties: sourceEntity.properties,
    });
    modelEntityRef.current = modelEntity;
    modelOwnerRef.current = { kind, id };

    // Hide the source 2D icon while model is up
    if (sourceEntity.billboard) sourceEntity.billboard.show = false;

    // Camera: orbit slightly behind & above the model. Distance scales with speed.
    const initialHeading = kind === 'aircraft' ? (data.heading ?? data.track ?? 0)
                         : kind === 'ship'     ? (data.course  ?? data.heading ?? 0)
                         : 0;
    const speed = kind === 'aircraft' ? (data.velocity || 200)
                : kind === 'ship'     ? (data.speed || 10)
                : 100;
    const range = kind === 'aircraft' ? Math.max(1500, Math.min(15000, speed * 30))
                : kind === 'ship'     ? Math.max(400,  Math.min(4000,  speed * 60))
                : 5000000;
    viewer.flyTo(modelEntity, {
      duration: 1.2,
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(initialHeading + 180),
        Cesium.Math.toRadians(-20),
        range,
      ),
    }).then(() => {
      try { viewer.trackedEntity = modelEntity; } catch { /* noop */ }
    }).catch(() => { /* noop */ });
  }, [despawnModel]);

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

    // ---- ATMOSPHERE, LIGHTING, FOG — always on, never disabled ----
    viewer.scene.globe.show = true;
    viewer.scene.globe.baseColor = Cesium.Color.BLACK;
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#080812');
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 2.0e-4;
    if (viewer.scene.sun) viewer.scene.sun.show = true;
    if (viewer.scene.moon) viewer.scene.moon.show = true;
    viewer.clock.shouldAnimate = true;
    viewer.camera.percentageChanged = 0.05;

    const layerNames = ['aircraft', 'aircraftTrails', 'ships', 'satellites', 'orbits', 'bases', 'conflicts', 'thermalAnomalies', 'cities', 'buildings', 'traffic', 'infrastructure', 'gpsInterference', 'internetBlackouts', 'airspaceClosures', 'oilPipelines', 'subseaCables'];
    layerNames.push('annotations');
    layerNames.forEach(name => {
      const ds = new Cesium.CustomDataSource(name);
      viewer.dataSources.add(ds);
      dsRefs.current[name] = ds;
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const picked = viewer.scene.pick(click.position);
      // Click on empty space → despawn any active 3D model
      if (!Cesium.defined(picked) || !picked.id) {
        if (modelEntityRef.current) despawnModel();
      }
      if (Cesium.defined(picked) && picked.id) {
        try {
          const entityType = picked.id.properties?.entityType?.getValue();
          const entityDataStr = picked.id.properties?.entityData?.getValue();
          if (entityType && entityDataStr) {
            const data = JSON.parse(entityDataStr);
            onEntitySelect({ type: entityType, data });

            if (entityType === 'satellite') {
              const sid = data.noradId || data.name;
              const orbitDs = dsRefs.current['orbits'];
              if (orbitDs) {
                orbitDs.entities.removeAll();
                if (selectedSatOrbit.current !== sid && data.tle1 && data.tle2) {
                  const coords = computeOrbitPath(data.tle1, data.tle2, 120);
                  if (coords.length >= 6) {
                    orbitDs.entities.add({
                      polyline: {
                        positions: Cesium.Cartesian3.fromDegreesArrayHeights(coords),
                        width: 1.5,
                        material: Cesium.Color.fromCssColorString('#f59e0b60'),
                        clampToGround: false,
                      },
                    });
                  }
                  selectedSatOrbit.current = sid;
                } else {
                  selectedSatOrbit.current = null;
                }
              }
            } else {
              const orbitDs = dsRefs.current['orbits'];
              if (orbitDs) { orbitDs.entities.removeAll(); selectedSatOrbit.current = null; }
            }
          }
        } catch (e) { console.warn('Entity pick error', e); }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // ---------- DOUBLE-CLICK → spawn 3D model + camera follow ----------
    handler.setInputAction((click: any) => {
      const picked = viewer.scene.pick(click.position);
      if (!Cesium.defined(picked) || !picked.id) return;
      let entityType: string | undefined;
      let data: any;
      try {
        entityType = picked.id.properties?.entityType?.getValue();
        const raw = picked.id.properties?.entityData?.getValue();
        if (raw) data = JSON.parse(raw);
      } catch { return; }
      if (!entityType || !data) return;
    if (entityType !== 'aircraft' && entityType !== 'ship' && entityType !== 'satellite') return;

    const id = entityType === 'aircraft' ? data.icao24
             : entityType === 'ship'     ? data.mmsi
             : (data.noradId ?? data.name);
    spawnModelFor(entityType as 'aircraft' | 'ship' | 'satellite', id, data, picked.id);
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    viewerRef.current = viewer;
    (window as any).__cesiumViewer = viewer;
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(20, 20, 20000000), duration: 0 });

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
      dsRefs.current = {};
    };
  }, []);

// ===============================================================
//  POST-PROCESSING FILTERS (NVG / CRT / FLIR)
//  Cesium 1.119+ compatible (WebGL2 / GLSL 300 ES)
// ===============================================================

useEffect(() => {
  const viewer = viewerRef.current;
  if (!viewer || typeof window === 'undefined' || !(window as any).Cesium) return;

  const CesiumGlobal = (window as any).Cesium as typeof Cesium;
  const stages = viewer.scene.postProcessStages;

  // Remove previous stage
  if (activeStageRef.current) {
    try { stages.remove(activeStageRef.current); } catch {}
    activeStageRef.current = null;
  }

  // Normal mode = no shader
  if (displayMode === 'normal') return;

  // Shared GLSL 300 ES header (Cesium 1.119+ compiles PostProcessStage shaders as GLSL 300 ES).
  const header = `#version 300 es
precision highp float;
uniform sampler2D colorTexture;
uniform float u_intensity;
uniform float u_time;
in vec2 v_textureCoordinates;
out vec4 fragColor;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
`;

  let fragmentShader = '';

  // ===============================================================
  // NVG MODE
  // ===============================================================
  if (displayMode === 'nvg') {
    fragmentShader = `
      ${header}
      void main() {
        vec2 uv = v_textureCoordinates;

        // Slight zoom-in + chromatic aberration
        vec2 c = uv - 0.5;
        uv = 0.5 + c * (1.0 - 0.02 * u_intensity);
        float ca = 0.002 * u_intensity;

        vec3 col;
        col.r = texture(colorTexture, uv + vec2(ca, 0.0)).r;
        col.g = texture(colorTexture, uv).g;
        col.b = texture(colorTexture, uv - vec2(ca, 0.0)).b;

        // Green NVG LUT
        float g = dot(col, vec3(0.299,0.587,0.114));
        g = pow(g, 0.9) * 1.25;
        vec3 nvg = vec3(0.05, 1.0, 0.18) * g;

        // Grain
        float n = (rand(uv * vec2(1024.0,1024.0) + u_time) - 0.5) * 0.12 * u_intensity;
        nvg += n;

        // Circular vignette
        float d = length(uv - 0.5);
        float vig = smoothstep(0.78, 0.32, d);
        nvg *= mix(1.0, vig, u_intensity);

        fragColor = vec4(nvg, 1.0);
      }
    `;
  }

  // ===============================================================
  // CRT MODE
  // ===============================================================
  else if (displayMode === 'crt') {
    fragmentShader = `
      ${header}
      void main() {
        vec2 uv = v_textureCoordinates;

        // Barrel distortion
        vec2 c = uv - 0.5;
        float r2 = dot(c, c);
        uv = 0.5 + c * (1.0 + 0.10 * r2 * u_intensity);

        // Jitter
        uv.x += (rand(vec2(u_time, uv.y)) - 0.5) * 0.0015 * u_intensity;

        // RGB split
        float s = 0.0025 * u_intensity;
        vec3 col;
        col.r = texture(colorTexture, uv + vec2(s, 0.0)).r;
        col.g = texture(colorTexture, uv).g;
        col.b = texture(colorTexture, uv - vec2(s, 0.0)).b;

        // Phosphor tint
        col = mix(col, col * vec3(0.85, 1.05, 0.90), 0.4 * u_intensity);

        // Scanline modulation
        float sl = sin(uv.y * 900.0) * 0.5 + 0.5;
        col *= mix(1.0, mix(0.75, 1.0, sl), u_intensity);

        // Noise
        col += (rand(uv * 800.0 + u_time) - 0.5) * 0.05 * u_intensity;

        // Bloom-ish lift
        col += max(col - 0.7, 0.0) * 0.4;

        // Vignette
        float d = length(uv - 0.5);
        col *= smoothstep(0.95, 0.4, d) * 0.5 + 0.6;

        fragColor = vec4(col, 1.0);
      }
    `;
  }

  // ===============================================================
  // FLIR MODE
  // ===============================================================
  else if (displayMode === 'flir') {
    fragmentShader = `
      ${header}

      vec3 thermal(float t) {
        t = clamp(t, 0.0, 1.0);
        vec3 c1 = vec3(0.0, 0.0, 0.0);
        vec3 c2 = vec3(0.20, 0.0, 0.40);
        vec3 c3 = vec3(0.85, 0.20, 0.0);
        vec3 c4 = vec3(1.0, 0.85, 0.0);
        vec3 c5 = vec3(1.0, 1.0, 1.0);

        if (t < 0.25) return mix(c1, c2, t / 0.25);
        if (t < 0.50) return mix(c2, c3, (t - 0.25) / 0.25);
        if (t < 0.80) return mix(c3, c4, (t - 0.50) / 0.30);
        return mix(c4, c5, (t - 0.80) / 0.20);
      }

      void main() {
        vec2 uv = v_textureCoordinates;
        vec3 col = texture(colorTexture, uv).rgb;

        // Luminance → heat
        float l = dot(col, vec3(0.299, 0.587, 0.114));
        l = clamp((l - 0.1) * 1.6, 0.0, 1.0);

        vec3 t = thermal(l);

        // Noise
        t += (rand(uv * 600.0 + u_time) - 0.5) * 0.04 * u_intensity;

        // Bloom on hot spots
        t += max(t - 0.75, 0.0) * 0.6;

        fragColor = vec4(mix(col, t, u_intensity), 1.0);
      }
    `;
  }

  if (!fragmentShader) return;

  // ===============================================================
  // Crossfade in (0 → 1 over ~350ms)
  // ===============================================================
  let intensity = 0.0;

  const stage = new CesiumGlobal.PostProcessStage({
    fragmentShader,
    uniforms: {
      u_intensity: () => intensity,
      u_time: () => (performance.now() / 1000.0) % 1000.0,
    },
  });

  stages.add(stage);
  activeStageRef.current = stage;

  const start = performance.now();
  let raf = 0;

  const tick = () => {
    const t = Math.min(1, (performance.now() - start) / 350);
    intensity = t;
    viewer.scene.requestRender();
    if (t < 1) raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    try { stages.remove(stage); } catch {}
    if (activeStageRef.current === stage) activeStageRef.current = null;
  };
}, [displayMode]);

  // ========== AIRCRAFT (persistent, incremental, AWACS overlays) ==========
  useEffect(() => {
    const ds = dsRefs.current['aircraft'];
    const trailDs = dsRefs.current['aircraftTrails'];
    const viewer = viewerRef.current;
    if (!ds || !trailDs || !viewer) return;
    // Datasource always shown — visibility is per-entity via billboard.show
    ds.show = true;
    trailDs.show = true;

    const now = Cesium.JulianDate.now();
    const future = Cesium.JulianDate.addSeconds(now, 10, new Cesium.JulianDate());
    const currentIds = new Set<string>();
    const nowMs = Date.now();
    const TRAIL_MAX_AGE = 20 * 60 * 1000; // 20 minutes

    aircraft.forEach(a => {
      // MINIMAL FILTER: only drop if lat/lon missing
      if (a.latitude == null || a.longitude == null) return;
      if (typeof a.latitude !== 'number' || typeof a.longitude !== 'number') return;

      currentIds.add(a.icao24);
      aircraftLastSeen.current.set(a.icao24, nowMs);

      const isMil = !!(a.isMilitary || a.militaryClassification);

      // UI-ONLY visibility: classification never affects ingestion
      const showCivilian = layers.aircraft && !isMil;
      const showMilitary = layers.militaryFlights && isMil;
      const shouldShow = showCivilian || showMilitary;

      // Trail history — only track for the currently selected aircraft
      const selectedAcId = selectedEntityRef.current?.type === 'aircraft' ? (selectedEntityRef.current.data as Aircraft).icao24 : null;
      if (selectedAcId === a.icao24) {
        let trail = aircraftTrailHistory.current.get(a.icao24);
        if (!trail) { trail = []; aircraftTrailHistory.current.set(a.icao24, trail); }
        trail.push({ lon: a.longitude, lat: a.latitude, alt: Math.max(a.altitude || 0, 500), time: nowMs });
        while (trail.length > 0 && (nowMs - trail[0].time) > TRAIL_MAX_AGE) trail.shift();
      }

      const icon = getAircraftIcon(a);
      // Ground clamp: planes on ground must hug the surface, not float at 500m
      const altMeters = a.onGround
        ? 15
        : (a.baroAltitude != null && a.baroAltitude > 0 ? a.baroAltitude
          : a.geoAltitude != null && a.geoAltitude > 0 ? a.geoAltitude
          : a.altitude && a.altitude > 0 ? a.altitude : 15);
      const newPos = Cesium.Cartesian3.fromDegrees(a.longitude, a.latitude, altMeters);
      const existing = aircraftEntities.current.get(a.icao24);

      if (existing) {
        // INCREMENTAL UPDATE — never recreate
        const posProperty = existing.position;
        if (posProperty && posProperty.addSample) {
          posProperty.addSample(future, newPos);
        }
        existing.billboard.image = icon;
        existing.billboard.rotation = Cesium.Math.toRadians(-(a.heading || 0));
        existing.billboard.show = shouldShow;
        existing.properties.entityData = JSON.stringify(a);
      } else {
        // New aircraft — density applied only at spawn
        
        const posProperty = new Cesium.SampledPositionProperty();
        posProperty.setInterpolationOptions({
          interpolationDegree: 1,
          interpolationAlgorithm: Cesium.LinearApproximation,
        });
        posProperty.addSample(now, newPos);
        posProperty.addSample(future, newPos);

        const entity = ds.entities.add({
          id: `ac-${a.icao24}`,
          position: posProperty,
          billboard: {
            image: icon,
            width: isMil ? 22 : 16, height: isMil ? 22 : 16,
            rotation: Cesium.Math.toRadians(-(a.heading || 0)),
            alignedAxis: Cesium.Cartesian3.UNIT_Z,
            disableDepthTestDistance: 0,
            scaleByDistance: new Cesium.NearFarScalar(1e5, 1.8, 2e7, 0.4),
            show: shouldShow,
          },
          properties: { entityType: 'aircraft', entityData: JSON.stringify(a) },
        });
        aircraftEntities.current.set(a.icao24, entity);
      }
    });

    // Remove stale aircraft (gone for > 60 minutes)
    const staleThreshold = nowMs - 60 * 60 * 1000;
    for (const [id, lastSeen] of aircraftLastSeen.current) {
      if (!currentIds.has(id) && lastSeen < staleThreshold) {
        const entity = aircraftEntities.current.get(id);
        if (entity) ds.entities.remove(entity);
        aircraftEntities.current.delete(id);
        aircraftLastSeen.current.delete(id);
        aircraftTrailHistory.current.delete(id);
      }
    }

    // ---- Render trails + predicted paths (only for selected aircraft) ----
    trailDs.entities.removeAll();
    const selectedAcIdForTrail = selectedEntityRef.current?.type === 'aircraft' ? (selectedEntityRef.current.data as Aircraft).icao24 : null;
    // Clean up trail history for non-selected aircraft
    for (const id of aircraftTrailHistory.current.keys()) {
      if (id !== selectedAcIdForTrail) aircraftTrailHistory.current.delete(id);
    }
    for (const [id, trail] of aircraftTrailHistory.current) {
      if (trail.length < 2) continue;
      const trailCoords: number[] = [];
      trail.forEach(p => trailCoords.push(p.lon, p.lat, p.alt));
      const baseColor = altitudeColor(trail[trail.length - 1].alt);

      // Flight trail (solid, fading)
      trailDs.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(trailCoords),
          width: 1.5,
          material: Cesium.Color.fromCssColorString(baseColor).withAlpha(0.5),
          clampToGround: false,
        },
      });

      // Predicted trajectory (dashed)
      const last = trail[trail.length - 1];
      const acData = aircraft.find(a => a.icao24 === id);
      if (acData && acData.velocity > 10) {
        const headingRad = (acData.heading || 0) * Math.PI / 180;
        const speedMs = acData.velocity;
        const vr = acData.verticalRate || 0;
        const predCoords: number[] = [last.lon, last.lat, last.alt];
        for (let m = 1; m <= 5; m++) {
          const dt = m * 60;
          const dLat = (speedMs * dt * Math.cos(headingRad)) / 111320;
          const dLon = (speedMs * dt * Math.sin(headingRad)) / (111320 * Math.cos(last.lat * Math.PI / 180));
          const predAlt = Math.max(100, last.alt + vr * dt);
          predCoords.push(last.lon + dLon, last.lat + dLat, predAlt);
        }
        trailDs.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(predCoords),
            width: 1,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString('#ffffff30'),
              dashLength: 8,
              dashPattern: parseInt('1100110011001100', 2),
            }),
            clampToGround: false,
          },
        });

        // Speed vector (short line showing heading + speed magnitude)
        const svLen = Math.min(speedMs * 30, 50000); // cap length
        const svLat = last.lat + (svLen * Math.cos(headingRad)) / 111320;
        const svLon = last.lon + (svLen * Math.sin(headingRad)) / (111320 * Math.cos(last.lat * Math.PI / 180));
        trailDs.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([last.lon, last.lat, last.alt, svLon, svLat, last.alt]),
            width: 2,
            material: Cesium.Color.fromCssColorString(speedMs > 250 ? '#ef4444' : speedMs > 150 ? '#f59e0b' : '#22d3ee').withAlpha(0.7),
            clampToGround: false,
          },
        });
      }
    }
  }, [aircraft, layers.aircraft, layers.militaryFlights, selectedEntity]);

  // ========== SHIPS (live AIS, persistent, incremental) ==========
  useEffect(() => {
    const ds = dsRefs.current['ships'];
    if (!ds) return;
    ds.show = layers.ships;
    if (!layers.ships) return;

    const nowMs = Date.now();
    const now = Cesium.JulianDate.now();
    const future = Cesium.JulianDate.addSeconds(now, 10, new Cesium.JulianDate());
    const currentIds = new Set<string>();

    liveShips.forEach(s => {
      if (s.latitude == null || s.longitude == null) return;
      currentIds.add(s.mmsi);
      shipLastSeen.current.set(s.mmsi, nowMs);

      // Maintain 20-minute trail history per ship
      const trail = shipTrails.current.get(s.mmsi) || [];
      const last = trail[trail.length - 1];
      if (!last || last.lat !== s.latitude || last.lon !== s.longitude) {
        trail.push({ time: nowMs, lat: s.latitude, lon: s.longitude });
      }
      const cutoff = nowMs - 20 * 60 * 1000;
      while (trail.length && trail[0].time < cutoff) trail.shift();
      shipTrails.current.set(s.mmsi, trail);

      const newPos = Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, 0);
      const existing = shipEntities.current.get(s.mmsi);

      if (existing) {
        const posProperty = existing.position;
        if (posProperty && posProperty.addSample) {
          posProperty.addSample(future, newPos);
        }
        existing.billboard.image = makeShipIcon(s.type);
        existing.billboard.rotation = Cesium.Math.toRadians(-(s.course || 0));
        existing.properties.entityData = JSON.stringify(s);
      } else {
        const posProperty = new Cesium.SampledPositionProperty();
        posProperty.setInterpolationOptions({ interpolationDegree: 1, interpolationAlgorithm: Cesium.LinearApproximation });
        posProperty.addSample(now, newPos);
        posProperty.addSample(future, newPos);

        const entity = ds.entities.add({
          id: `ship-${s.mmsi}`,
          position: posProperty,
          billboard: {
            image: makeShipIcon(s.type), width: 22, height: 22,
            rotation: Cesium.Math.toRadians(-(s.course || 0)),
            alignedAxis: Cesium.Cartesian3.UNIT_Z,
            disableDepthTestDistance: 0,
            scaleByDistance: new Cesium.NearFarScalar(1e5, 1.8, 2e7, 0.45),
          },
          properties: { entityType: 'ship', entityData: JSON.stringify(s) },
        });
        shipEntities.current.set(s.mmsi, entity);
      }
    });

    // Remove stale ships (> 30 min)
    const staleThreshold = nowMs - 30 * 60 * 1000;
    for (const [mmsi, lastSeen] of shipLastSeen.current) {
      if (!currentIds.has(mmsi) && lastSeen < staleThreshold) {
        const entity = shipEntities.current.get(mmsi);
        if (entity) ds.entities.remove(entity);
        shipEntities.current.delete(mmsi);
        shipLastSeen.current.delete(mmsi);
      }
    }
  }, [liveShips, layers.ships]);

  // ========== SHIP TRAIL (only render trail for currently selected ship) ==========
  useEffect(() => {
    const ds = dsRefs.current['ships'];
    if (!ds) return;
    if (shipTrailEntity.current) {
      ds.entities.remove(shipTrailEntity.current);
      shipTrailEntity.current = null;
    }
    if (selectedEntity?.type !== 'ship' || !layers.ships) return;
    const mmsi = (selectedEntity.data as any).mmsi;
    const trail = shipTrails.current.get(mmsi);
    if (!trail || trail.length < 2) return;
    const positions = trail.flatMap(p => [p.lon, p.lat]);
    shipTrailEntity.current = ds.entities.add({
      id: `ship-trail-${mmsi}`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(positions),
        width: 2,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.WHITE.withAlpha(0.8),
          dashLength: 12,
        }),
        clampToGround: false,
      },
    });
  }, [selectedEntity, liveShips, layers.ships]);

  // ========== SATELLITES (persistent, no density filter, no availability) ==========
  useEffect(() => {
    const ds = dsRefs.current['satellites'];
    const viewer = viewerRef.current;
    if (!ds || !viewer) return;
    ds.show = layers.satellites;

    if (!layers.satellites) return;

    const now = Cesium.JulianDate.now();
    const future = Cesium.JulianDate.addSeconds(now, 10, new Cesium.JulianDate());

    satellites.forEach(s => {
      const sid = s.noradId || s.name;
      const newPos = Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, s.altitude * 1000);
      const existing = satEntities.current.get(sid);

      if (existing) {
        const posProperty = existing.position;
        if (posProperty && posProperty.addSample) {
          posProperty.addSample(future, newPos);
        }
        existing.properties.entityData = JSON.stringify(s);
      } else {
        const posProperty = new Cesium.SampledPositionProperty();
        posProperty.setInterpolationOptions({
          interpolationDegree: 1,
          interpolationAlgorithm: Cesium.LinearApproximation,
        });
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
  }, [satellites, layers.satellites]);

  // ========== MILITARY BASES ==========
  useEffect(() => {
    const ds = dsRefs.current['bases'];
    if (!ds) return;
    ds.show = layers.bases;
    ds.entities.removeAll();
    if (!layers.bases) return;

    MILITARY_BASES.forEach(b => {
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
  }, [layers.bases]);

  // ========== CONFLICT ZONES ==========
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
      const evtColor = EVENT_COLORS[z.eventType || 'combat'] || '#ff3333';
      const glowAlpha = z.severity === 'high' ? 0.7 : z.severity === 'medium' ? 0.5 : 0.3;
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
  }, [layers.conflicts]);

  // ========== THERMAL ANOMALIES (NASA FIRMS) ==========
  useEffect(() => {
    const ds = dsRefs.current['thermalAnomalies'];
    if (!ds) return;
    ds.show = layers.conflicts;
    ds.entities.removeAll();
    if (!layers.conflicts || thermalAnomalies.length === 0) return;

    // Only show top 2000 by FRP to avoid performance issues
    const sorted = [...thermalAnomalies].sort((a, b) => b.frp - a.frp).slice(0, 2000);

    sorted.forEach(t => {
      const intensity = Math.min(1, t.frp / 100);
      const size = 3 + intensity * 8;
      const color = t.frp > 50 ? '#ff2200' : t.frp > 10 ? '#ff6600' : '#ff9900';

      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(t.longitude, t.latitude, 50),
        point: {
          pixelSize: size,
          color: Cesium.Color.fromCssColorString(color).withAlpha(0.6 + intensity * 0.3),
          outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.9),
          outlineWidth: 1,
          disableDepthTestDistance: 0,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 2.0, 2e7, 0.3),
        },
        properties: {
          entityType: 'conflict',
          entityData: JSON.stringify({
            name: `Thermal Anomaly`,
            region: `${t.latitude.toFixed(2)}°, ${t.longitude.toFixed(2)}°`,
            countries: [],
            latitude: t.latitude,
            longitude: t.longitude,
            radius: 0,
            severity: t.frp > 50 ? 'high' : t.frp > 10 ? 'medium' : 'low',
            eventType: 'thermal',
            summary: `FRP: ${t.frp.toFixed(1)} MW | Brightness: ${t.brightness.toFixed(0)}K | Confidence: ${t.confidence} | Satellite: ${t.satellite}`,
            timestamp: `${t.acqDate} ${t.acqTime}`,
            source: 'NASA FIRMS (VIIRS)',
          }),
        },
      });
    });
  }, [thermalAnomalies, layers.conflicts]);

  // ========== CITIES ==========
  useEffect(() => {
    const ds = dsRefs.current['cities'];
    if (!ds) return;
    ds.show = layers.cities;
    ds.entities.removeAll();
    if (!layers.cities) return;

    CITIES.forEach(c => {
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
  }, [layers.cities]);

  // ========== INFRASTRUCTURE ==========
  useEffect(() => {
    const ds = dsRefs.current['infrastructure'];
    if (!ds) return;
    ds.entities.removeAll();
    const showAirports = layers.airports;
    const showPorts = layers.ports;
    const showEnergy = layers.energy;
    const showTelecom = layers.telecom;
    if (!showAirports && !showPorts && !showEnergy && !showTelecom) { ds.show = false; return; }
    ds.show = true;

    INFRASTRUCTURE.forEach(item => {
      const shouldShow =
        (item.category === 'transport' && item.type === 'airport' && showAirports) ||
        (item.category === 'transport' && item.type === 'port' && showPorts) ||
        (item.category === 'energy' && showEnergy) ||
        (item.category === 'telecom' && showTelecom);
      if (!shouldShow) return;
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
  }, [layers.airports, layers.ports, layers.energy, layers.telecom]);

  // ========== OIL PIPELINES ==========
  useEffect(() => {
    const ds = dsRefs.current['oilPipelines'];
    if (!ds) return;
    ds.show = layers.energy;
    ds.entities.removeAll();
    if (!layers.energy) return;

    OIL_PIPELINES.forEach(pl => {
      const coords: number[] = [];
      pl.coordinates.forEach(([lon, lat]) => coords.push(lon, lat));
      const color = pl.substance === 'oil' ? '#f59e0b' : pl.substance === 'gas' ? '#3b82f6' : '#8b5cf6';

      ds.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(coords),
          width: 2,
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.7),
          clampToGround: true,
        },
        properties: { entityType: 'infrastructure', entityData: JSON.stringify({ ...pl, type: 'pipeline', category: 'energy', id: pl.id, name: pl.name, country: pl.country }) },
      });
    });
  }, [layers.energy]);

  // ========== SUBSEA CABLES ==========
  useEffect(() => {
    const ds = dsRefs.current['subseaCables'];
    if (!ds) return;
    ds.show = layers.telecom;
    ds.entities.removeAll();
    if (!layers.telecom) return;

    const STATUS_COLORS: Record<string, string> = {
      normal: '#22d3ee', degraded: '#f59e0b', fault: '#ef4444', unknown: '#6b7280',
    };

    SUBSEA_CABLES.forEach(cable => {
      const coords: number[] = [];
      cable.coordinates.forEach(([lon, lat]) => coords.push(lon, lat));
      const color = STATUS_COLORS[cable.status] || '#22d3ee';

      ds.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(coords),
          width: cable.status === 'fault' ? 3 : 1.5,
          material: Cesium.Color.fromCssColorString(color).withAlpha(cable.status === 'normal' ? 0.5 : 0.8),
          clampToGround: true,
        },
        properties: { entityType: 'infrastructure', entityData: JSON.stringify({ ...cable, type: 'subsea_cable', category: 'telecom', id: cable.id, name: cable.name }) },
      });

      if (cable.coordinates.length > 0) {
        const first = cable.coordinates[0];
        const last = cable.coordinates[cable.coordinates.length - 1];
        [first, last].forEach(([lon, lat]) => {
          ds.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
            billboard: {
              image: ICON_LANDING, width: 10, height: 10,
              disableDepthTestDistance: 0,
              scaleByDistance: new Cesium.NearFarScalar(1e5, 1.2, 1e7, 0.3),
            },
          });
        });
      }
    });
  }, [layers.telecom]);

  // ========== GPS INTERFERENCE ==========
  useEffect(() => {
    const ds = dsRefs.current['gpsInterference'];
    if (!ds) return;
    ds.show = layers.gpsInterference;
    ds.entities.removeAll();
    if (!layers.gpsInterference) return;

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

    GPS_INTERFERENCE_ZONES.forEach(z => {
      const score = z.interferenceScore;
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
  }, [layers.gpsInterference, displayMode]);

  // ========== INTERNET BLACKOUTS ==========
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
  }, [layers.internetBlackouts, displayMode]);

  // ========== AIRSPACE CLOSURES ==========
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
          outlineWidth,
          height: 0,
        },
        properties: { entityType: 'airspace_closure', entityData: JSON.stringify(ac) },
      });
    });
  }, [layers.airspaceClosures, displayMode]);

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
            const t = el.tags || {};
            const buildingData = {
              name: t.name || 'Unknown',
              buildingType: t.building && t.building !== 'yes' ? t.building : 'Unknown',
              height: t.height
                ? `${parseFloat(t.height)} m`
                : t['building:levels']
                  ? `${parseFloat(t['building:levels']) * 3} m (est.)`
                  : 'Unknown',
              address: [t['addr:housenumber'], t['addr:street'], t['addr:city'], t['addr:postcode']]
                .filter(Boolean).join(', ') || 'Unknown',
              operator: t.operator || t.owner || 'Unknown',
              constructionYear: t.start_date || 'Unknown',
            };
            ds.entities.add({
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(coords),
                extrudedHeight: h + 2, height: 2,
                material: Cesium.Color.fromCssColorString(bColor),
                outline: true, outlineColor: Cesium.Color.fromCssColorString(oColor), outlineWidth: 1,
              },
              properties: { entityType: 'building', entityData: JSON.stringify(buildingData) },
            });
          });
        } catch (err) { console.warn('Buildings fetch failed:', err); }
      }, 1500);
    };

    viewer.camera.changed.addEventListener(checkZoom);
    checkZoom();
    return () => { clearTimeout(timeout); viewer.camera.changed.removeEventListener(checkZoom); ds.entities.removeAll(); };
  }, [layers.buildings, displayMode]);

// ========== STREET TRAFFIC (REVAMPED) ==========
useEffect(() => {
  const viewer = viewerRef.current;

  // Ensure viewer exists
  if (!viewer) return;

  // Ensure DataSource exists
  if (!dsRefs.current['traffic']) {
    dsRefs.current['traffic'] = viewer.dataSources.add(
      new Cesium.CustomDataSource('traffic')
    );
  }
  const ds = dsRefs.current['traffic'];

  // Toggle visibility
  ds.show = layers.streetTraffic;
  if (!layers.streetTraffic) {
    ds.entities.removeAll();
    vehiclesRef.current = [];
    trafficFetchedBbox.current = '';
    return;
  }

  let timeout: any;
  lastTrafficTime.current = Date.now();

  // Bright orange color
  const vehColor = Cesium.Color.fromCssColorString('#ff7f00');

  // Smooth animation
  const onPostRender = () => {
    const now = Date.now();
    const dt = (now - lastTrafficTime.current) / 1000;
    lastTrafficTime.current = now;

    vehiclesRef.current.forEach((v) => {
      v.progress += v.speed * v.direction * dt;

      if (v.progress > 1) {
        if (v.nextPaths.length > 0) {
          v.coords = v.nextPaths[Math.floor(Math.random() * v.nextPaths.length)];
          v.progress = 0;
        } else {
          v.progress -= 1;
        }
      }
      if (v.progress < 0) v.progress += 1;

      const [lon, lat] = interpolateRoad(v.coords, Math.abs(v.progress));
      if (Number.isFinite(lon) && Number.isFinite(lat)) {
        v.entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, 3);
      }
    });
  };
  viewer.scene.postRender.addEventListener(onPostRender);

  // Overpass fallback endpoints
  const overpassEndpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
  ];

  const fetchRoads = async (s: number, w: number, n: number, e: number) => {
    const q = `[out:json][timeout:10];
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"]
      (${s},${w},${n},${e});
      out geom 100;`;

    for (const url of overpassEndpoints) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          body: `data=${encodeURIComponent(q)}`,
        });
        if (!resp.ok) continue;
        const data = await resp.json();
        if (data?.elements?.length > 0) return data;
      } catch {}
    }
    return null;
  };

  const checkZoom = () => {
    clearTimeout(timeout);

    timeout = setTimeout(async () => {
      const height = viewer.camera.positionCartographic?.height;

      // Allow up to ~150km altitude
      if (!height || height > 150000) {
        ds.entities.removeAll();
        vehiclesRef.current = [];
        trafficFetchedBbox.current = '';
        return;
      }

      const rect = viewer.camera.computeViewRectangle();
      if (!rect) return;

      const s = Cesium.Math.toDegrees(rect.south);
      const w = Cesium.Math.toDegrees(rect.west);
      const n = Cesium.Math.toDegrees(rect.north);
      const e = Cesium.Math.toDegrees(rect.east);

      // Tight bounding box: ~2km around camera
      if (n - s > 0.02 || e - w > 0.02) return;

      const bk = `${s.toFixed(4)},${w.toFixed(4)},${n.toFixed(4)},${e.toFixed(4)}`;

      // Only skip if we already have vehicles
      if (bk === trafficFetchedBbox.current && vehiclesRef.current.length > 0) return;
      trafficFetchedBbox.current = bk;

      const data = await fetchRoads(s, w, n, e);
      if (!data) return;

      ds.entities.removeAll();
      vehiclesRef.current = [];

      const roads: number[][][] = [];
      const nodeToRoads = new Map<string, number[]>();

      (data.elements || []).forEach((way: any, roadIdx: number) => {
        if (!way.geometry || way.geometry.length < 2) return;

        const coords = way.geometry.map((nd: any) => [nd.lon, nd.lat]);
        roads.push(coords);

        const startKey = `${coords[0][0].toFixed(5)},${coords[0][1].toFixed(5)}`;
        const endKey = `${coords.at(-1)![0].toFixed(5)},${coords.at(-1)![1].toFixed(5)}`;

        [startKey, endKey].forEach((k) => {
          if (!nodeToRoads.has(k)) nodeToRoads.set(k, []);
          nodeToRoads.get(k)!.push(roadIdx);
        });
      });

      roads.forEach((coords, roadIdx) => {
        const endKey = `${coords.at(-1)![0].toFixed(5)},${coords.at(-1)![1].toFixed(5)}`;
        const connectedIdxs = (nodeToRoads.get(endKey) || []).filter((i) => i !== roadIdx);
        const nextPaths = connectedIdxs.map((i) => roads[i]);

        // Dense traffic: up to 20 vehicles per road
        const count = Math.min(Math.floor(coords.length / 2), 20);

        for (let i = 0; i < count; i++) {
          const progress = Math.random();
          const [lon, lat] = interpolateRoad(coords, progress);
          if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

          const entity = ds.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 3),
            point: {
              pixelSize: 4,
              color: vehColor,
              outlineColor: vehColor.withAlpha(0.3),
              outlineWidth: 2,
              disableDepthTestDistance: 0,
            },
          });

          vehiclesRef.current.push({
            entity,
            coords,
            progress,
            speed: 0.02 + Math.random() * 0.04,
            direction: Math.random() > 0.5 ? 1 : -1,
            nextPaths,
          });
        }
      });
    }, 200); // fast adaptive updates
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

  // ========== ANNOTATIONS (render + draw) ==========
  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;
  const drawingToolRef = useRef(drawingTool);
  drawingToolRef.current = drawingTool;
  const onDrawCompleteRef = useRef(onDrawComplete);
  onDrawCompleteRef.current = onDrawComplete;
  const drawStateRef = useRef<{ first?: { lon: number; lat: number }; vertices?: { lon: number; lat: number }[]; preview?: any }>({});

  // Render annotations
  useEffect(() => {
    const ds = dsRefs.current['annotations'];
    if (!ds) return;
    ds.entities.removeAll();
    const COLORS: Record<string, string> = {
      white: '#ffffff', red: '#ff3b3b', yellow: '#ffd400',
      cyan: '#22d3ee', orange: '#ff8c00', green: '#34d399',
    };
    annotations.forEach(a => {
      const cssColor = COLORS[a.color] || '#ffffff';
      const c = Cesium.Color.fromCssColorString(cssColor);
      const props = { entityType: 'annotation', entityData: JSON.stringify(a) };
      if (a.kind === 'point') {
        const iconUri = getAnnotationIcon(a.icon || 'dot', cssColor);
        const labelText = a.title || 'POINT';
        ds.entities.add({
          id: `ann-${a.id}`,
          position: Cesium.Cartesian3.fromDegrees(a.lon, a.lat, 0),
          billboard: {
            image: iconUri, width: 22, height: 22,
            disableDepthTestDistance: 0,
            scaleByDistance: new Cesium.NearFarScalar(1e5, 1.4, 2e7, 0.5),
          },
          // Leader line + label callout (string + label)
          label: {
            text: `── ${labelText}`,
            font: 'bold 11px Orbitron, sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            backgroundColor: Cesium.Color.fromCssColorString('#0b0d11cc'),
            showBackground: true,
            backgroundPadding: new Cesium.Cartesian2(8, 4),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(18, -22),
            disableDepthTestDistance: 0,
            translucencyByDistance: new Cesium.NearFarScalar(1e6, 1, 2e7, 0.6),
          },
          properties: props,
        });
      } else if (a.kind === 'line') {
        const style = (a as any).style || 'solid';
        ds.entities.add({
          id: `ann-${a.id}`,
          polyline: { positions: Cesium.Cartesian3.fromDegreesArray([a.start.lon, a.start.lat, a.end.lon, a.end.lat]),
            width: style === 'arrow' ? 6 : 1.8,
            material: annMaterial(c, style),
            arcType: Cesium.ArcType.GEODESIC, clampToGround: false },
          properties: props,
        });
      } else if (a.kind === 'square') {
        const minLat = Math.min(a.cornerA.lat, a.cornerB.lat);
        const maxLat = Math.max(a.cornerA.lat, a.cornerB.lat);
        const minLon = Math.min(a.cornerA.lon, a.cornerB.lon);
        const maxLon = Math.max(a.cornerA.lon, a.cornerB.lon);
        const ring = [minLon, minLat, maxLon, minLat, maxLon, maxLat, minLon, maxLat, minLon, minLat];
        const style = (a as any).style || 'solid';
        const lineMat = style === 'arrow' ? c : annMaterial(c, style);
        ds.entities.add({
          id: `ann-${a.id}`,
          polyline: { positions: Cesium.Cartesian3.fromDegreesArray(ring), width: 1.8, material: lineMat, clampToGround: true },
          properties: props,
        });
      } else if (a.kind === 'circle') {
        // Build circle outline as a polyline so dashed/dotted styles actually apply.
        const style = (a as any).style || 'solid';
        const STEPS = 96;
        const ring: number[] = [];
        const R = 6371000;
        const lat0 = a.center.lat * Math.PI / 180;
        const lon0 = a.center.lon * Math.PI / 180;
        const ang = a.radiusMeters / R;
        for (let i = 0; i <= STEPS; i++) {
          const brng = (i / STEPS) * 2 * Math.PI;
          const lat = Math.asin(Math.sin(lat0) * Math.cos(ang) + Math.cos(lat0) * Math.sin(ang) * Math.cos(brng));
          const lon = lon0 + Math.atan2(Math.sin(brng) * Math.sin(ang) * Math.cos(lat0), Math.cos(ang) - Math.sin(lat0) * Math.sin(lat));
          ring.push((lon * 180) / Math.PI, (lat * 180) / Math.PI);
        }
        ds.entities.add({
          id: `ann-${a.id}`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(ring),
            width: 2,
            material: annMaterial(c, style === 'arrow' ? 'solid' : style),
            clampToGround: true,
          },
          properties: props,
        });
      } else if (a.kind === 'triangle') {
        const style = (a as any).style || 'solid';
        const v = a.vertices;
        const ring = [v[0].lon, v[0].lat, v[1].lon, v[1].lat, v[2].lon, v[2].lat, v[0].lon, v[0].lat];
        ds.entities.add({
          id: `ann-${a.id}`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(ring),
            width: 1.8,
            material: annMaterial(c, style === 'arrow' ? 'solid' : style),
            clampToGround: true,
          },
          properties: props,
        });
      } else if (a.kind === 'custom') {
        const style = (a as any).style || 'solid';
        const verts = a.vertices;
        if (verts.length >= 2) {
          const flat: number[] = [];
          verts.forEach(p => flat.push(p.lon, p.lat));
          if (a.closed && verts.length >= 3) flat.push(verts[0].lon, verts[0].lat);
          ds.entities.add({
            id: `ann-${a.id}`,
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray(flat),
              width: a.closed ? 1.8 : (style === 'arrow' ? 6 : 1.8),
              material: annMaterial(c, a.closed && style === 'arrow' ? 'solid' : style),
              arcType: Cesium.ArcType.GEODESIC,
              clampToGround: a.closed,
            },
            properties: props,
          });
        }
      }
    });
  }, [annotations]);

  // Drawing handlers
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    // Reset multi-click state when tool changes
    drawStateRef.current = {};
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    const pickLonLat = (pos: any): { lon: number; lat: number } | null => {
      const cart = viewer.camera.pickEllipsoid(pos, viewer.scene.globe.ellipsoid);
      if (!cart) return null;
      const c = Cesium.Cartographic.fromCartesian(cart);
      return { lon: Cesium.Math.toDegrees(c.longitude), lat: Cesium.Math.toDegrees(c.latitude) };
    };
    // Snap-radius in screen pixels for closing custom/triangle shapes on the first vertex.
    const SNAP_PX = 14;
    const lonLatToScreen = (ll: { lon: number; lat: number }) => {
      const cart = Cesium.Cartesian3.fromDegrees(ll.lon, ll.lat);
      return viewer.scene.cartesianToCanvasCoordinates(cart);
    };
    const isSnappedToFirst = (cursor: any, first: { lon: number; lat: number }) => {
      const sp = lonLatToScreen(first);
      if (!sp) return false;
      const dx = sp.x - cursor.x, dy = sp.y - cursor.y;
      return Math.hypot(dx, dy) <= SNAP_PX;
    };

    // ---- Ghost preview entity (re-created on demand) ----
    let ghost: any = null;
    let ghostExtras: any[] = [];
    const removeGhost = () => {
      if (ghost) { viewer.entities.remove(ghost); ghost = null; }
      ghostExtras.forEach(e => viewer.entities.remove(e));
      ghostExtras = [];
    };
    const ghostColor = Cesium.Color.WHITE.withAlpha(0.4);

    handler.setInputAction((mv: any) => {
      const tool = drawingToolRef.current;
      if (!tool || tool === 'point') { removeGhost(); return; }
      const ll = pickLonLat(mv.endPosition);
      if (!ll) return;
      removeGhost();
      const first = drawStateRef.current.first;
      const verts = drawStateRef.current.vertices;

      if (tool === 'triangle' || tool === 'custom') {
        if (!verts || verts.length === 0) return;
        // Snap to first vertex when within radius (closing preview)
        const snap = isSnappedToFirst(mv.endPosition, verts[0]);
        const cursor = snap ? verts[0] : ll;
        const flat: number[] = [];
        verts.forEach(v => flat.push(v.lon, v.lat));
        flat.push(cursor.lon, cursor.lat);
        ghost = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(flat),
            width: 1.5,
            material: new Cesium.PolylineDashMaterialProperty({ color: ghostColor, dashLength: 12 }),
            arcType: Cesium.ArcType.GEODESIC,
          },
        });
        // Vertex dots
        verts.forEach((v, i) => {
          ghostExtras.push(viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(v.lon, v.lat, 0),
            point: { pixelSize: i === 0 && snap ? 10 : 6, color: i === 0 && snap ? Cesium.Color.WHITE : ghostColor, outlineColor: Cesium.Color.BLACK, outlineWidth: 1, disableDepthTestDistance: 0 },
          }));
        });
        return;
      }

      if (!first) return;
      if (tool === 'line') {
        ghost = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray([first.lon, first.lat, ll.lon, ll.lat]),
            width: 1.5,
            material: new Cesium.PolylineDashMaterialProperty({ color: ghostColor, dashLength: 12 }),
            arcType: Cesium.ArcType.GEODESIC,
          },
        });
      } else if (tool === 'square') {
        const minLat = Math.min(first.lat, ll.lat), maxLat = Math.max(first.lat, ll.lat);
        const minLon = Math.min(first.lon, ll.lon), maxLon = Math.max(first.lon, ll.lon);
        const ring = [minLon, minLat, maxLon, minLat, maxLon, maxLat, minLon, maxLat, minLon, minLat];
        ghost = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(ring),
            width: 1.5,
            material: new Cesium.PolylineDashMaterialProperty({ color: ghostColor, dashLength: 12 }),
            clampToGround: true,
          },
        });
      } else if (tool === 'circle') {
        const R = 6371000, toRad = (d: number) => d * Math.PI / 180;
        const dLat = toRad(ll.lat - first.lat), dLon = toRad(ll.lon - first.lon);
        const sa = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(first.lat)) * Math.cos(toRad(ll.lat)) * Math.sin(dLon / 2) ** 2;
        const radius = Math.max(1, 2 * R * Math.asin(Math.sqrt(sa)));
        ghost = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(first.lon, first.lat, 0),
          ellipse: {
            semiMajorAxis: radius, semiMinorAxis: radius,
            material: Cesium.Color.WHITE.withAlpha(0.05),
            outline: true, outlineColor: ghostColor, outlineWidth: 2, height: 0,
          },
        });
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction((click: any) => {
      const tool = drawingToolRef.current;
      if (!tool) return;
      const ll = pickLonLat(click.position);
      if (!ll) return;
      if (tool === 'point') {
        onDrawCompleteRef.current?.('point', ll);
      } else if (tool === 'line' || tool === 'square') {
        if (!drawStateRef.current.first) {
          drawStateRef.current.first = ll;
        } else {
          onDrawCompleteRef.current?.(tool, { a: drawStateRef.current.first, b: ll });
          drawStateRef.current.first = undefined;
          removeGhost();
        }
      } else if (tool === 'circle') {
        if (!drawStateRef.current.first) {
          drawStateRef.current.first = ll;
        } else {
          const R = 6371000, toRad = (d: number) => d * Math.PI / 180;
          const a = drawStateRef.current.first;
          const dLat = toRad(ll.lat - a.lat), dLon = toRad(ll.lon - a.lon);
          const sa = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(ll.lat)) * Math.sin(dLon / 2) ** 2;
          const radius = 2 * R * Math.asin(Math.sqrt(sa));
          onDrawCompleteRef.current?.('circle', { center: a, radiusMeters: radius });
          drawStateRef.current.first = undefined;
          removeGhost();
        }
      } else if (tool === 'triangle') {
        const verts = drawStateRef.current.vertices ?? [];
        verts.push(ll);
        drawStateRef.current.vertices = verts;
        if (verts.length >= 3) {
          onDrawCompleteRef.current?.('triangle', { vertices: verts.slice(0, 3) });
          drawStateRef.current.vertices = undefined;
          removeGhost();
        }
      } else if (tool === 'custom') {
        const verts = drawStateRef.current.vertices ?? [];
        // If snapping to first vertex, close as polygon
        if (verts.length >= 2 && isSnappedToFirst(click.position, verts[0])) {
          onDrawCompleteRef.current?.('custom', { vertices: verts, closed: true });
          drawStateRef.current.vertices = undefined;
          removeGhost();
          return;
        }
        verts.push(ll);
        drawStateRef.current.vertices = verts;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Right-click: finish 'custom' as an open line (no closing snap)
    handler.setInputAction(() => {
      const tool = drawingToolRef.current;
      if (tool !== 'custom') return;
      const verts = drawStateRef.current.vertices;
      if (verts && verts.length >= 2) {
        onDrawCompleteRef.current?.('custom', { vertices: verts, closed: false });
      }
      drawStateRef.current.vertices = undefined;
      removeGhost();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    return () => { removeGhost(); handler.destroy(); drawStateRef.current = {}; };
  }, [drawingTool]);

    return <div ref={containerRef} className="w-full h-full" />;
}
