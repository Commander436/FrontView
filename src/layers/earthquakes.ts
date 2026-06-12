// Live earthquakes layer — USGS GeoJSON feed, refreshes every 60s.
// Uses BillboardGraphics with glass-edge SVG (yellow/orange/red by magnitude).

declare const Cesium: any;

const FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
const REFRESH_MS = 60_000;
const MAX_ENTITIES = 500;
const MIN_MAG = 1.0;

interface Ctx {
  viewer: any;
  ds: any;
  interval: any;
  active: boolean;
}

let ctx: Ctx | null = null;

function colorFor(mag: number): { core: string; glow: string } {
  if (mag < 2.5) return { core: '#facc15', glow: '#fde047' };
  if (mag <= 5.0) return { core: '#fb923c', glow: '#fdba74' };
  return { core: '#ef4444', glow: '#fca5a5' };
}

function glassSvg(mag: number): string {
  const { core, glow } = colorFor(mag);
  const r = Math.max(10, Math.min(40, mag * 6));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="1"/>
        <stop offset="55%" stop-color="${core}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${core}" stop-opacity="0"/>
      </radialGradient>
      <filter id="b" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3"/>
      </filter>
    </defs>
    <circle cx="48" cy="48" r="${r + 6}" fill="${core}" opacity="0.25" filter="url(#b)"/>
    <circle cx="48" cy="48" r="${r}" fill="url(#g)"/>
    <circle cx="48" cy="48" r="${r}" fill="none" stroke="${core}" stroke-width="1.5" opacity="0.9"/>
    <circle cx="48" cy="48" r="${Math.max(2, r * 0.35)}" fill="#ffffff" opacity="0.85"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

async function refresh() {
  if (!ctx?.active) return;
  try {
    const resp = await fetch(FEED);
    if (!resp.ok) return;
    const data = await resp.json();
    if (!ctx?.active) return;
    const ds = ctx.ds;
    ds.entities.removeAll();
    const features = (data.features || [])
      .filter((f: any) => (f.properties?.mag ?? 0) >= MIN_MAG)
      .sort((a: any, b: any) => (b.properties.time ?? 0) - (a.properties.time ?? 0))
      .slice(0, MAX_ENTITIES);

    for (const f of features) {
      const [lon, lat, depth] = f.geometry?.coordinates || [];
      if (typeof lon !== 'number' || typeof lat !== 'number') continue;
      const mag = f.properties?.mag ?? 0;
      const place = f.properties?.place || 'Unknown location';
      const time = f.properties?.time;
      const image = glassSvg(mag);

      const scale = mag > 5
        ? new Cesium.CallbackProperty(() => {
            const t = (Date.now() % 1500) / 1500;
            return 1 + 0.35 * Math.sin(t * Math.PI * 2);
          }, false)
        : 1.0;

      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        billboard: {
          image,
          scale,
          disableDepthTestDistance: 0,
          eyeOffset: new Cesium.Cartesian3(0, 0, -10),
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 20_000_000.0),
        },
        description: `M ${mag} — ${place} — Depth ${depth ?? '?'} km`,
        // PropertyBag for direct intel-panel access
        properties: new Cesium.PropertyBag({
          entityType: 'earthquake',
          entityData: JSON.stringify({ mag, place, depth, time }),
          mag,
          place,
          depth,
          time,
        }),
      });
    }
  } catch (e) {
    console.warn('Earthquake fetch failed:', e);
  }
}

export function enableEarthquakes(viewer: any) {
  if (ctx?.active) return;
  const existing = viewer.dataSources.getByName('earthquakes')[0];
  const ds = existing || (() => {
    const created = new Cesium.CustomDataSource('earthquakes');
    viewer.dataSources.add(created);
    return created;
  })();
  ds.show = true;
  ctx = { viewer, ds, interval: null, active: true };
  refresh();
  ctx.interval = setInterval(refresh, REFRESH_MS);
}

export function disableEarthquakes(viewer: any) {
  if (!ctx) return;
  ctx.active = false;
  clearInterval(ctx.interval);
  if (ctx.ds) {
    ctx.ds.entities.removeAll();
    ctx.ds.show = false;
  }
  ctx = null;
}