export type AnnotationColor = 'white' | 'red' | 'yellow' | 'cyan' | 'orange' | 'green';

export const ANNOTATION_COLOR_HEX: Record<AnnotationColor, string> = {
  white:  '#ffffff',
  red:    '#ff3b3b',
  yellow: '#ffd400',
  cyan:   '#22d3ee',
  orange: '#ff8c00',
  green:  '#34d399',
};

export type AnnotationKind = 'point' | 'line' | 'square' | 'circle' | 'triangle' | 'custom';
export type DrawingTool = AnnotationKind | null;

export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'arrow';

export type PointIcon =
  | 'dot' | 'plane' | 'helicopter' | 'ship'
  | 'tank' | 'infantry' | 'radar' | 'building';

export const POINT_ICON_OPTIONS: { id: PointIcon; label: string }[] = [
  { id: 'dot',        label: 'Dot' },
  { id: 'plane',      label: 'Plane' },
  { id: 'helicopter', label: 'Helicopter' },
  { id: 'ship',       label: 'Ship' },
  { id: 'tank',       label: 'Tank' },
  { id: 'infantry',   label: 'Infantry' },
  { id: 'radar',      label: 'Radar' },
  { id: 'building',   label: 'Building' },
];

interface AnnotationBase {
  id: string;
  kind: AnnotationKind;
  color: AnnotationColor;
  createdAt: number;
  title?: string;
}

export interface PointAnnotation extends AnnotationBase {
  kind: 'point';
  title: string;
  description: string;
  lon: number;
  lat: number;
  icon?: PointIcon;
}

export interface LineAnnotation extends AnnotationBase {
  kind: 'line';
  // Great-circle endpoints
  start: { lon: number; lat: number };
  end:   { lon: number; lat: number };
  // Live analytics
  crossedTotal: number;
  crossedCivilian: number;
  crossedMilitary: number;
  style?: LineStyle;
}

export interface SquareAnnotation extends AnnotationBase {
  kind: 'square';
  // Two opposite corners (lon/lat). Render as axis-aligned rectangle.
  cornerA: { lon: number; lat: number };
  cornerB: { lon: number; lat: number };
  insideTotal: number;
  enteredTotal: number;
  exitedTotal: number;
  civilianInside: number;
  militaryInside: number;
  style?: LineStyle; // solid|dashed|dotted (arrow ignored)
}

export interface CircleAnnotation extends AnnotationBase {
  kind: 'circle';
  center: { lon: number; lat: number };
  radiusMeters: number;
  insideTotal: number;
  enteredTotal: number;
  exitedTotal: number;
  civilianInside: number;
  militaryInside: number;
  style?: LineStyle;
}

export interface TriangleAnnotation extends AnnotationBase {
  kind: 'triangle';
  vertices: [{ lon: number; lat: number }, { lon: number; lat: number }, { lon: number; lat: number }];
  insideTotal: number;
  enteredTotal: number;
  exitedTotal: number;
  civilianInside: number;
  militaryInside: number;
  style?: LineStyle;
}

// Custom polyline OR polygon (closed if first==last vertex)
export interface CustomAnnotation extends AnnotationBase {
  kind: 'custom';
  vertices: { lon: number; lat: number }[];
  closed: boolean;
  // Shape analytics (only meaningful when closed)
  insideTotal: number;
  enteredTotal: number;
  exitedTotal: number;
  civilianInside: number;
  militaryInside: number;
  // Line analytics (only meaningful when open)
  crossedTotal: number;
  crossedCivilian: number;
  crossedMilitary: number;
  style?: LineStyle;
}

export type Annotation =
  | PointAnnotation
  | LineAnnotation
  | SquareAnnotation
  | CircleAnnotation
  | TriangleAnnotation
  | CustomAnnotation;