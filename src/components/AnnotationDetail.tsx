import { Annotation, AnnotationColor, ANNOTATION_COLOR_HEX } from '@/types/annotations';
import { MapPin, Minus, Square, Circle, Trash2, Palette } from 'lucide-react';

interface AnnotationDetailProps {
  annotation: Annotation;
  onChangeColor: (id: string, color: AnnotationColor) => void;
  onDelete: (id: string) => void;
}

const COLORS: AnnotationColor[] = ['white', 'red', 'yellow', 'cyan', 'orange', 'green'];

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-foreground/8">
      <span className="text-muted-foreground text-[9px] uppercase tracking-wider font-display">{label}</span>
      <span className="text-[10px] font-mono text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function Title({ kind }: { kind: Annotation['kind'] }) {
  const map = {
    point:  { icon: <MapPin className="w-4 h-4" />,  label: 'POINT OF INTEREST' },
    line:   { icon: <Minus className="w-4 h-4" />,   label: 'TACTICAL LINE' },
    square: { icon: <Square className="w-4 h-4" />,  label: 'TACTICAL SQUARE' },
    circle: { icon: <Circle className="w-4 h-4" />,  label: 'TACTICAL CIRCLE' },
  } as const;
  const { icon, label } = map[kind];
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="p-1.5 rounded-lg bg-secondary/50 text-foreground">{icon}</div>
      <div className="text-[10px] font-display tracking-[0.18em] text-foreground">{label}</div>
    </div>
  );
}

export function AnnotationDetail({ annotation, onChangeColor, onDelete }: AnnotationDetailProps) {
  return (
    <div className="space-y-0.5">
      <Title kind={annotation.kind} />

      {annotation.kind === 'point' && (
        <>
          <Row label="Title" value={annotation.title || '—'} />
          <Row label="Latitude" value={annotation.lat.toFixed(4) + '°'} />
          <Row label="Longitude" value={annotation.lon.toFixed(4) + '°'} />
          {annotation.description && (
            <div className="mt-3 px-2.5 py-2 rounded-lg bg-secondary/30 text-[10px] text-foreground/80 leading-relaxed whitespace-pre-line">
              {annotation.description}
            </div>
          )}
        </>
      )}

      {annotation.kind === 'line' && (
        <>
          <Row label="Entities Crossed" value={annotation.crossedTotal} />
          <Row label="Civilian" value={annotation.crossedCivilian} />
          <Row label="Military" value={annotation.crossedMilitary} />
          <Row label="Length" value={`${(haversineKm(annotation.start, annotation.end)).toFixed(0)} km`} />
        </>
      )}

      {(annotation.kind === 'square' || annotation.kind === 'circle') && (
        <>
          <Row label="Inside" value={annotation.insideTotal} />
          <Row label="Entered" value={annotation.enteredTotal} />
          <Row label="Exited" value={annotation.exitedTotal} />
          <Row label="Civilian Inside" value={annotation.civilianInside} />
          <Row label="Military Inside" value={annotation.militaryInside} />
          {annotation.kind === 'circle' && (
            <Row label="Radius" value={`${(annotation.radiusMeters / 1000).toFixed(1)} km`} />
          )}
        </>
      )}

      {/* Color picker */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground text-[9px] uppercase tracking-wider font-display">
          <Palette className="w-3 h-3" /> Change Color
        </div>
        <div className="flex gap-1.5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => onChangeColor(annotation.id, c)}
              aria-label={c}
              className={`w-6 h-6 rounded-full border transition-all ${
                annotation.color === c
                  ? 'border-foreground scale-110 shadow-[0_0_8px_hsl(0_0%_100%/0.4)]'
                  : 'border-foreground/20 hover:border-foreground/60'
              }`}
              style={{ backgroundColor: ANNOTATION_COLOR_HEX[c] }}
            />
          ))}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(annotation.id)}
        className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-display uppercase tracking-wider hover:bg-destructive/20 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Delete {annotation.kind}
      </button>
    </div>
  );
}

function haversineKm(a: { lon: number; lat: number }, b: { lon: number; lat: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sa = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}