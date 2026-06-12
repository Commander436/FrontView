// Web worker: parses Overpass JSON into Cesium-ready building geometry.
// Returns array of { positions: number[] (lon,lat pairs), height: number, tags: any }.

self.onmessage = (e: MessageEvent) => {
  const { tileKey, data } = e.data as { tileKey: string; data: any };
  const nodes = new Map<number, [number, number]>();
  const out: Array<{ positions: number[]; height: number; tags: any }> = [];
  for (const el of data?.elements || []) {
    if (el.type === 'node') nodes.set(el.id, [el.lon, el.lat]);
  }
  for (const el of data?.elements || []) {
    if (el.type !== 'way' || !el.nodes || !el.tags || !el.tags.building) continue;
    const positions: number[] = [];
    for (const nid of el.nodes) {
      const n = nodes.get(nid);
      if (n) positions.push(n[0], n[1]);
    }
    if (positions.length < 6) continue;
    const t = el.tags;
    let h = 10;
    if (t.height) {
      const v = parseFloat(t.height);
      if (!isNaN(v)) h = v;
    } else if (t['building:levels']) {
      const v = parseFloat(t['building:levels']);
      if (!isNaN(v)) h = v * 3;
    }
    out.push({ positions, height: h, tags: t });
  }
  (self as any).postMessage({ tileKey, buildings: out });
};
export {};