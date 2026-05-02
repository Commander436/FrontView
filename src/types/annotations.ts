export type AnnotationColor = 'white' | 'red' | 'yellow' | 'cyan' | 'orange' | 'green';

export const ANNOTATION_COLOR_HEX: Record<AnnotationColor, string> = {
  white:  '#ffffff',
  red:    '#ff3b3b',
  yellow: '#ffd400',
  cyan:   '#22d3ee',
  orange: '#ff8c00',
  green:  '#34d399',
};

export type AnnotationKind = 'point' | 'line' | 'square' | 'circle';
export type DrawingTool = AnnotationKind | null;

interface AnnotationBase {
  id: string;
  kind: AnnotationKind;
  color: AnnotationColor;
  createdAt: number;
}

export interface PointAnnotation extends AnnotationBase {
  kind: 'point';
  title: string;
  description: string;
  lon: number;
  lat: number;
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
}

export type Annotation =
  | PointAnnotation
  | LineAnnotation
  | SquareAnnotation
  | CircleAnnotation;