// Street traffic via Overpass highway data, enlarged-bbox + cached.

declare const Cesium: any;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
];

const MAX_ALT = 150_000;
const BBOX_SIZE_DEG = 0.1; // ~10 km
const DEBOUNCE_MS = 250;
const MIN_CAMERA_MOVE_KM = 1; // re-fetch threshold
const MAX_VEHICLES_PER_ROAD = 10;

// Cache of parsed roads per bbox key.
const roadCache = new Map<string, number[][][]>();

function bboxKey(s: number, w: number, n: number, e: number) {
  return `${s.toFixed(3)},${w.toFixed(3)},${n.toFixed(3)},${e.toFixed(3)}`;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function fetchOverpass(body: string): Promise<any | null> {
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12_000);
      const resp = await fetch(url, {
        method: 'POST',
        body: `data=${encodeURIComponent(body)}`,
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!resp.ok) continue;
      const data = await resp.json();
      if (data?.elements?.length) return data;
    } catch { /* try next */ }
  }
  return null;
}

function interp(coords: number[][], t: number): [number, number] {
  if (coords.length < 2) return coords[0] ? [coords[0][0], coords[0][1]] : [0, 0];
  const idx = Math.max(0, Math.min(t, 0.9999)) * (coords.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  return [
    coords[i][0] + f * (coords[i + 1][0] - coords[i][0]),
    coords[i][1] + f * (coords[i + 1][1] - coords[i][1]),
  ];
}

interface Vehicle {
  entity: any;
  coords: number[][];
  progress: number;
  speed: number;
  direction: 1 | -1;
  nextPaths: number[][][];
}

interface Ctx {
  viewer: any;
  ds: any;
  vehicles: Vehicle[];
  lastTime: number;
  lastCenter?: { lat: number; lon: number };
  debounce?: any;
  removeCam?: () => void;
  removeRender?: () => void;
  active: boolean;
}

let ctx: Ctx | null = null;

function spawnVehicles(roads: number[][][]) {
  if (!ctx) return;
  const ds = ctx.ds;
  const color = Cesium.Color.fromCssColorString('#ff7f00');
  ds.entities.removeAll();
  ctx.vehicles = [];

  const nodeToRoads = new Map<string, number[]>();
  roads.forEach((coords, idx) => {
    const sKey = `${coords[0][0].toFixed(5)},${coords[0][1].toFixed(5)}`;
    const eKey = `${coords.at(-1)![0].toFixed(5)},${coords.at(-1)![1].toFixed(5)}`;
    for (const k of [sKey, eKey]) {
      if (!nodeToRoads.has(k)) nodeToRoads.set(k, []);
      nodeToRoads.get(k)!.push(idx);
    }
  });

  roads.forEach((coords, idx) => {
    const eKey = `${coords.at(-1)![0].toFixed(5)},${coords.at(-1)![1].toFixed(5)}`;
    const connected = (nodeToRoads.get(eKey) || []).filter((i) => i !== idx);
    const nextPaths = connected.map((i) => roads[i]);
    const count = Math.min(Math.max(1, Math.floor(coords.length / 3)), MAX_VEHICLES_PER_ROAD);
    for (let i = 0; i < count; i++) {
      const p = Math.random();
      const [lon, lat] = interp(coords, p);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
      const entity = ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 3),
        point: {
          pixelSize: 4,
          color,
          outlineColor: color.withAlpha(0.3),
          outlineWidth: 2,
          disableDepthTestDistance: 0,
        },
      });
      ctx!.vehicles.push({
        entity,
        coords,
        progress: p,
        speed: 0.02 + Math.random() * 0.04,
        direction: Math.random() > 0.5 ? 1 : -1,
        nextPaths,
      });
    }
  });
}

async function updateForCamera() {
  if (!ctx || !ctx.active) return;
  const viewer = ctx.viewer;
  const h = viewer.camera.positionCartographic?.height;
  if (!h || h > MAX_ALT) {
    ctx.ds.entities.removeAll();
    ctx.vehicles = [];
    return;
  }
  const carto = viewer.camera.positionCartographic;
  const lat = Cesium.Math.toDegrees(carto.latitude);
  const lon = Cesium.Math.toDegrees(carto.longitude);

  if (ctx.lastCenter && haversineKm(ctx.lastCenter.lat, ctx.lastCenter.lon, lat, lon) < MIN_CAMERA_MOVE_KM && ctx.vehicles.length) {
    return;
  }

  const half = BBOX_SIZE_DEG / 2;
  const s = lat - half, n = lat + half, w = lon - half, e = lon + half;
  const key = bboxKey(s, w, n, e);

  ctx.lastCenter = { lat, lon };

  const cached = roadCache.get(key);
  if (cached) {
    spawnVehicles(cached);
    return;
  }

  const q = `[out:json][timeout:10];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"](${s},${w},${n},${e});out geom;`;
  const data = await fetchOverpass(q);
  if (!ctx || !ctx.active || !data) return;
  const roads: number[][][] = [];
  for (const way of data.elements || []) {
    if (!way.geometry || way.geometry.length < 2) continue;
    roads.push(way.geometry.map((nd: any) => [nd.lon, nd.lat]));
  }
  roadCache.set(key, roads);
  spawnVehicles(roads);
}

function scheduleUpdate() {
  if (!ctx) return;
  clearTimeout(ctx.debounce);
  ctx.debounce = setTimeout(updateForCamera, DEBOUNCE_MS);
}

export function enableTraffic(viewer: any) {
  if (ctx?.active) return;
  const ds = viewer.dataSources.getByName('traffic')[0]
    || (() => {
      const created = new Cesium.CustomDataSource('traffic');
      viewer.dataSources.add(created);
      return created;
    })();
  ds.show = true;

  ctx = { viewer, ds, vehicles: [], lastTime: Date.now(), active: true };

  const onRender = () => {
    if (!ctx) return;
    const now = Date.now();
    const dt = (now - ctx.lastTime) / 1000;
    ctx.lastTime = now;
    for (const v of ctx.vehicles) {
      v.progress += v.speed * v.direction * dt;
      if (v.progress > 1) {
        if (v.nextPaths.length) {
          v.coords = v.nextPaths[Math.floor(Math.random() * v.nextPaths.length)];
          v.progress = 0;
        } else {
          v.progress -= 1;
        }
      }
      if (v.progress < 0) v.progress += 1;
      const [lon, lat] = interp(v.coords, Math.abs(v.progress));
      if (Number.isFinite(lon) && Number.isFinite(lat)) {
        v.entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, 3);
      }
    }
  };
  viewer.scene.postRender.addEventListener(onRender);
  ctx.removeRender = () => viewer.scene.postRender.removeEventListener(onRender);

  const onCam = () => scheduleUpdate();
  viewer.camera.changed.addEventListener(onCam);
  ctx.removeCam = () => viewer.camera.changed.removeEventListener(onCam);

  scheduleUpdate();
}

export function disableTraffic(viewer: any) {
  if (!ctx) return;
  ctx.active = false;
  clearTimeout(ctx.debounce);
  ctx.removeCam?.();
  ctx.removeRender?.();
  if (ctx.ds) {
    ctx.ds.entities.removeAll();
    ctx.ds.show = false;
  }
  ctx = null;
}