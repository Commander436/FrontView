import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Annotation,
  AnnotationColor,
  DrawingTool,
  LineAnnotation,
  SquareAnnotation,
  CircleAnnotation,
  PointAnnotation,
  LineStyle,
  PointIcon,
} from '@/types/annotations';
import { Aircraft } from '@/types/globe';

// ---- Geo helpers ----
const R_EARTH = 6371000; // meters
function toRad(d: number) { return (d * Math.PI) / 180; }
function haversine(a: { lon: number; lat: number }, b: { lon: number; lat: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sa = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(sa));
}
function isInsideSquare(p: { lon: number; lat: number }, sq: SquareAnnotation): boolean {
  const minLat = Math.min(sq.cornerA.lat, sq.cornerB.lat);
  const maxLat = Math.max(sq.cornerA.lat, sq.cornerB.lat);
  const minLon = Math.min(sq.cornerA.lon, sq.cornerB.lon);
  const maxLon = Math.max(sq.cornerA.lon, sq.cornerB.lon);
  return p.lat >= minLat && p.lat <= maxLat && p.lon >= minLon && p.lon <= maxLon;
}
function isInsideCircle(p: { lon: number; lat: number }, c: CircleAnnotation): boolean {
  return haversine(p, c.center) <= c.radiusMeters;
}
// Segment-segment intersection on a 2D plane (good enough at globe scales here).
function segmentsCross(
  p1: { lon: number; lat: number }, p2: { lon: number; lat: number },
  p3: { lon: number; lat: number }, p4: { lon: number; lat: number },
): boolean {
  const d = (p4.lat - p3.lat) * (p2.lon - p1.lon) - (p4.lon - p3.lon) * (p2.lat - p1.lat);
  if (d === 0) return false;
  const ua = ((p4.lon - p3.lon) * (p1.lat - p3.lat) - (p4.lat - p3.lat) * (p1.lon - p3.lon)) / d;
  const ub = ((p2.lon - p1.lon) * (p1.lat - p3.lat) - (p2.lat - p1.lat) * (p1.lon - p3.lon)) / d;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

const STORAGE_KEY = 'frontview.annotations.v1';

function loadAnnotations(): Annotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}
function saveAnnotations(list: Annotation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

function uid() { return Math.random().toString(36).slice(2, 11); }

export function useAnnotations(aircraft: Aircraft[]) {
  const [annotations, setAnnotations] = useState<Annotation[]>(() => loadAnnotations());
  const [drawingTool, setDrawingTool] = useState<DrawingTool>(null);
  const [pendingPoint, setPendingPoint] = useState<{ lon: number; lat: number } | null>(null);

  // Per-aircraft per-shape last-known-inside state (for entered/exited tracking)
  const insideStateRef = useRef<Map<string, Set<string>>>(new Map()); // shapeId -> set of icao24
  // Last-known position per aircraft for line-crossing detection
  const lastPosRef = useRef<Map<string, { lon: number; lat: number; isMilitary: boolean }>>(new Map());

  useEffect(() => { saveAnnotations(annotations); }, [annotations]);

  // Recompute analytics whenever aircraft positions change
  useEffect(() => {
    if (annotations.length === 0) return;
    let mutated = false;
    const updated = annotations.map(ann => {
      if (ann.kind === 'point') return ann;

      if (ann.kind === 'square' || ann.kind === 'circle') {
        const prevInside = insideStateRef.current.get(ann.id) ?? new Set<string>();
        const nowInside = new Set<string>();
        let civInside = 0, milInside = 0;
        for (const a of aircraft) {
          if (a.latitude == null || a.longitude == null) continue;
          const p = { lon: a.longitude, lat: a.latitude };
          const inside = ann.kind === 'square' ? isInsideSquare(p, ann) : isInsideCircle(p, ann);
          if (inside) {
            nowInside.add(a.icao24);
            if (a.isMilitary) milInside++; else civInside++;
          }
        }
        let entered = ann.enteredTotal;
        let exited = ann.exitedTotal;
        for (const id of nowInside) if (!prevInside.has(id)) entered++;
        for (const id of prevInside) if (!nowInside.has(id)) exited++;
        insideStateRef.current.set(ann.id, nowInside);
        const next: SquareAnnotation | CircleAnnotation = {
          ...ann,
          insideTotal: nowInside.size,
          enteredTotal: entered,
          exitedTotal: exited,
          civilianInside: civInside,
          militaryInside: milInside,
        } as SquareAnnotation | CircleAnnotation;
        if (
          next.insideTotal !== ann.insideTotal ||
          next.enteredTotal !== ann.enteredTotal ||
          next.exitedTotal !== ann.exitedTotal ||
          next.civilianInside !== ann.civilianInside ||
          next.militaryInside !== ann.militaryInside
        ) mutated = true;
        return next;
      }

      if (ann.kind === 'line') {
        let crossed = ann.crossedTotal;
        let civ = ann.crossedCivilian;
        let mil = ann.crossedMilitary;
        for (const a of aircraft) {
          if (a.latitude == null || a.longitude == null) continue;
          const cur = { lon: a.longitude, lat: a.latitude, isMilitary: !!a.isMilitary };
          const prev = lastPosRef.current.get(a.icao24);
          if (prev && segmentsCross(prev, cur, ann.start, ann.end)) {
            crossed++;
            if (cur.isMilitary) mil++; else civ++;
          }
        }
        const next: LineAnnotation = {
          ...ann,
          crossedTotal: crossed,
          crossedCivilian: civ,
          crossedMilitary: mil,
        };
        if (
          next.crossedTotal !== ann.crossedTotal ||
          next.crossedCivilian !== ann.crossedCivilian ||
          next.crossedMilitary !== ann.crossedMilitary
        ) mutated = true;
        return next;
      }
      return ann;
    });
    // Update last-known positions AFTER processing crossings
    for (const a of aircraft) {
      if (a.latitude == null || a.longitude == null) continue;
      lastPosRef.current.set(a.icao24, { lon: a.longitude, lat: a.latitude, isMilitary: !!a.isMilitary });
    }
    if (mutated) setAnnotations(updated);
  }, [aircraft]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- CRUD ----
  const addPoint = useCallback((lon: number, lat: number, title: string, description: string, icon: PointIcon = 'dot') => {
    const ann: PointAnnotation = {
      id: uid(), kind: 'point' as const, color: 'white' as AnnotationColor,
      createdAt: Date.now(), title, description, lon, lat, icon,
    };
    setAnnotations(prev => [...prev, ann]);
    return ann;
  }, []);

  const addLine = useCallback((start: { lon: number; lat: number }, end: { lon: number; lat: number }) => {
    const ann: LineAnnotation = {
      id: uid(), kind: 'line', color: 'white', createdAt: Date.now(),
      title: 'Line',
      start, end, crossedTotal: 0, crossedCivilian: 0, crossedMilitary: 0, style: 'solid',
    };
    setAnnotations(prev => [...prev, ann]);
    return ann;
  }, []);

  const addSquare = useCallback((cornerA: { lon: number; lat: number }, cornerB: { lon: number; lat: number }) => {
    const ann: SquareAnnotation = {
      id: uid(), kind: 'square', color: 'white', createdAt: Date.now(),
      title: 'Square',
      cornerA, cornerB, style: 'solid',
      insideTotal: 0, enteredTotal: 0, exitedTotal: 0, civilianInside: 0, militaryInside: 0,
    };
    setAnnotations(prev => [...prev, ann]);
    return ann;
  }, []);

  const addCircle = useCallback((center: { lon: number; lat: number }, radiusMeters: number) => {
    const ann: CircleAnnotation = {
      id: uid(), kind: 'circle', color: 'white', createdAt: Date.now(),
      title: 'Circle',
      center, radiusMeters: Math.max(1, radiusMeters), style: 'solid',
      insideTotal: 0, enteredTotal: 0, exitedTotal: 0, civilianInside: 0, militaryInside: 0,
    };
    setAnnotations(prev => [...prev, ann]);
    return ann;
  }, []);

  const updateColor = useCallback((id: string, color: AnnotationColor) => {
    setAnnotations(prev => prev.map(a => a.id === id ? ({ ...a, color } as Annotation) : a));
  }, []);

  const updateTitle = useCallback((id: string, title: string) => {
    setAnnotations(prev => prev.map(a => a.id === id ? ({ ...a, title } as Annotation) : a));
  }, []);

  const updateStyle = useCallback((id: string, style: LineStyle) => {
    setAnnotations(prev => prev.map(a => a.id === id ? ({ ...a, style } as Annotation) : a));
  }, []);

  const updateIcon = useCallback((id: string, icon: PointIcon) => {
    setAnnotations(prev => prev.map(a => a.id === id && a.kind === 'point' ? ({ ...a, icon } as Annotation) : a));
  }, []);

  const remove = useCallback((id: string) => {
    insideStateRef.current.delete(id);
    setAnnotations(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    annotations,
    drawingTool, setDrawingTool,
    pendingPoint, setPendingPoint,
    addPoint, addLine, addSquare, addCircle,
    updateColor, updateTitle, updateStyle, updateIcon, remove,
  };
}