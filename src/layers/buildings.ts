// Tile-based, cached, debounced Overpass building loader using a Web Worker
// for OSM → geometry parsing. No Cesium ion. No OSM Buildings.

declare const Cesium: any;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
];

const TILE_ZOOM = 15;
const MAX_ALT = 50_000;
const DEBOUNCE_MS = 300;
const MAX_TILES_PER_PASS = 12;

type TileStatus = 'loading' | 'ready' | 'error';
interface TileState {
  status: TileStatus;
  entityIds: string[];
  buildings?: Array<{ positions: number[]; height: number; tags: any }>;
}

// Forever cache. Never re-fetch.
const tileCache = new Map<string, TileState>();

function lon2tile(lon: number, z: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, z));
}
function lat2tile(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z),
  );
}
function tile2lon(x: number, z: number) {
  return (x / Math.pow(2, z)) * 360 - 180;
}
function tile2lat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
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
      return await resp.json();
    } catch {
      // try next endpoint
    }
  }
  return null;
}

interface Ctx {
  viewer: any;
  ds: any;
  worker: Worker;
  removeListener?: () => void;
  debounceTimer?: any;
  active: boolean;
}

let ctx: Ctx | null = null;

const FILL = '#ffffff';
const FILL_ALPHA = 0.85;

function attachBuildingsToScene(
  tileKey: string,
  buildings: Array<{ positions: number[]; height: number; tags: any }>,
) {
  if (!ctx) return;
  const ds = ctx.ds;
  const ids: string[] = [];
  const fill = Cesium.Color.fromCssColorString(FILL).withAlpha(FILL_ALPHA);
  const outline = Cesium.Color.fromCssColorString('#ffffff55');
  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    const t = b.tags || {};
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
    const id = `bld-${tileKey}-${i}`;
    ds.entities.add({
      id,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(b.positions),
        extrudedHeight: b.height + 1,
        height: 0,
        material: fill,
        outline: true,
        outlineColor: outline,
        outlineWidth: 1,
      },
      properties: { entityType: 'building', entityData: JSON.stringify(buildingData) },
    });
    ids.push(id);
  }
  const state = tileCache.get(tileKey);
  if (state) {
    state.status = 'ready';
    state.entityIds = ids;
    state.buildings = buildings;
  }
}

function computeVisibleTiles(viewer: any): string[] {
  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return [];
  const s = Cesium.Math.toDegrees(rect.south);
  const w = Cesium.Math.toDegrees(rect.west);
  const n = Cesium.Math.toDegrees(rect.north);
  const e = Cesium.Math.toDegrees(rect.east);
  const z = TILE_ZOOM;
  const xMin = lon2tile(w, z);
  const xMax = lon2tile(e, z);
  const yMin = lat2tile(n, z);
  const yMax = lat2tile(s, z);
  const keys: string[] = [];
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      keys.push(`${z}/${x}/${y}`);
    }
  }
  return keys;
}

async function loadTile(tileKey: string) {
  if (!ctx) return;
  const [zS, xS, yS] = tileKey.split('/');
  const z = +zS, x = +xS, y = +yS;
  const west = tile2lon(x, z);
  const east = tile2lon(x + 1, z);
  const north = tile2lat(y, z);
  const south = tile2lat(y + 1, z);
  const q = `[out:json][timeout:10];(way["building"](${south},${west},${north},${east});relation["building"](${south},${west},${north},${east}););out body;>;out skel qt;`;
  const data = await fetchOverpass(q);
  if (!ctx || !ctx.active) return;
  if (!data) {
    const state = tileCache.get(tileKey);
    if (state) state.status = 'error';
    return;
  }
  // Hand off parsing to the worker.
  ctx.worker.postMessage({ tileKey, data });
}

function scheduleUpdate() {
  if (!ctx) return;
  clearTimeout(ctx.debounceTimer);
  ctx.debounceTimer = setTimeout(() => {
    if (!ctx || !ctx.active) return;
    const viewer = ctx.viewer;
    const h = viewer.camera.positionCartographic?.height;
    if (!h || h > MAX_ALT) return;
    const tiles = computeVisibleTiles(viewer);
    let started = 0;
    for (const key of tiles) {
      const s = tileCache.get(key);
      if (!s) {
        if (started >= MAX_TILES_PER_PASS) continue;
        tileCache.set(key, { status: 'loading', entityIds: [] });
        started++;
        loadTile(key);
      } else if (s.status === 'ready' && s.entityIds.length === 0 && s.buildings) {
        // Re-attach instantly from cache after a previous disable.
        attachBuildingsToScene(key, s.buildings);
      }
    }
  }, DEBOUNCE_MS);
}

export function enableBuildings(viewer: any) {
  if (ctx?.active) return;
  const ds = viewer.dataSources.getByName('buildings')[0]
    || (() => {
      const created = new Cesium.CustomDataSource('buildings');
      viewer.dataSources.add(created);
      return created;
    })();
  ds.show = true;

  const worker = new Worker(
    new URL('../workers/buildingsParser.worker.ts', import.meta.url),
    { type: 'module' },
  );
  worker.onmessage = (e: MessageEvent) => {
    const { tileKey, buildings } = e.data as { tileKey: string; buildings: any[] };
    if (!ctx || !ctx.active) return;
    attachBuildingsToScene(tileKey, buildings);
  };

  ctx = { viewer, ds, worker, active: true };

  const onChanged = () => scheduleUpdate();
  viewer.camera.changed.addEventListener(onChanged);
  ctx.removeListener = () => viewer.camera.changed.removeEventListener(onChanged);
  scheduleUpdate();
}

export function disableBuildings(viewer: any) {
  if (!ctx) return;
  ctx.active = false;
  clearTimeout(ctx.debounceTimer);
  ctx.removeListener?.();
  try { ctx.worker.terminate(); } catch { /* noop */ }
  const ds = ctx.ds;
  if (ds) {
    ds.entities.removeAll();
    ds.show = false;
  }
  // Cached parsed buildings remain in tileCache; entityIds cleared so re-enable re-attaches instantly.
  for (const state of tileCache.values()) {
    state.entityIds = [];
  }
  ctx = null;
}