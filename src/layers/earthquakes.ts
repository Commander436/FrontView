// Live earthquakes layer powered by USGS GeoJSON feed.

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

function colorFor(mag: number) {
  if (mag < 2.5) return Cesium.Color.fromCssColorString('#facc15'); // yellow
  if (mag <= 5.0) return Cesium.Color.fromCssColorString('#fb923c'); // orange
  return Cesium.Color.fromCssColorString('#ef4444'); // red
}

function sizeFor(mag: number) {
  return Math.max(6, Math.min(28, mag * 4));
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
      const color = colorFor(mag);
      const size = sizeFor(mag);

      const pixelSize = mag > 5
        ? new Cesium.CallbackProperty(() => {
            const t = (Date.now() % 1500) / 1500;
            return size * (1 + 0.4 * Math.sin(t * Math.PI * 2));
          }, false)
        : size;

      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        point: {
          pixelSize,
          color,
          outlineColor: Cesium.Color.BLACK.withAlpha(0.6),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `M ${mag} — ${place} — Depth ${depth ?? '?'} km`,
        properties: {
          entityType: 'earthquake',
          entityData: JSON.stringify({ mag, place, depth, time: f.properties?.time }),
        },
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