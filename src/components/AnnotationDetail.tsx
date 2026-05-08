import { Annotation, AnnotationColor, ANNOTATION_COLOR_HEX, LineStyle, PointIcon, POINT_ICON_OPTIONS } from '@/types/annotations';
import { MapPin, Minus, Square, Circle, Triangle, Spline, Trash2, Palette, Pencil, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AnnotationDetailProps {
  annotation: Annotation;
  onChangeColor: (id: string, color: AnnotationColor) => void;
  onRename: (id: string, title: string) => void;
  onChangeStyle: (id: string, style: LineStyle) => void;
  onChangeIcon: (id: string, icon: PointIcon) => void;
  onDelete: (id: string) => void;
}

const COLORS: AnnotationColor[] = ['white', 'red', 'yellow', 'cyan', 'orange', 'green'];
const STYLES: LineStyle[] = ['solid', 'dashed', 'dotted', 'arrow'];

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-foreground/8">
      <span className="text-muted-foreground text-[9px] uppercase tracking-wider font-display">{label}</span>
      <span className="text-[10px] font-mono text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function TitleBar({ annotation, onRename }: { annotation: Annotation; onRename: (id: string, t: string) => void }) {
  const map = {
    point:  { icon: <MapPin className="w-4 h-4" />,  label: 'POINT OF INTEREST' },
    line:   { icon: <Minus className="w-4 h-4" />,   label: 'TACTICAL LINE' },
    square: { icon: <Square className="w-4 h-4" />,  label: 'TACTICAL SQUARE' },
    circle: { icon: <Circle className="w-4 h-4" />,  label: 'TACTICAL CIRCLE' },
    triangle: { icon: <Triangle className="w-4 h-4" />, label: 'TACTICAL TRIANGLE' },
    custom:  { icon: <Spline className="w-4 h-4" />,    label: 'CUSTOM ANNOTATION' },
  } as const;
  const { icon, label } = map[annotation.kind];
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(annotation.title || label);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setVal(annotation.title || label); }, [annotation.id]); // eslint-disable-line
  const commit = () => { onRename(annotation.id, val.trim() || label); setEditing(false); };
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="p-1.5 rounded-lg bg-secondary/50 text-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[8px] font-display tracking-[0.18em] text-muted-foreground">{label}</div>
        {editing ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <input
              ref={inputRef}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
              className="flex-1 bg-secondary/40 border border-foreground/20 rounded-md px-2 py-1 text-[11px] font-display text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
              maxLength={64}
            />
            <button onClick={commit} className="p-1 rounded-md text-foreground hover:bg-foreground/10"><Check className="w-3 h-3" /></button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 mt-0.5 text-[12px] font-display text-foreground hover:text-foreground/80 truncate group">
            <span className="truncate">{annotation.title || label}</span>
            <Pencil className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}

export function AnnotationDetail({ annotation, onChangeColor, onRename, onChangeStyle, onChangeIcon, onDelete }: AnnotationDetailProps) {
  return (
    <div className="space-y-0.5">
      <TitleBar annotation={annotation} onRename={onRename} />

      {annotation.kind === 'point' && (
        <>
          <Row label="Latitude" value={annotation.lat.toFixed(4) + '°'} />
          <Row label="Longitude" value={annotation.lon.toFixed(4) + '°'} />
          {annotation.description && (
            <div className="mt-3 px-2.5 py-2 rounded-lg bg-secondary/30 text-[10px] text-foreground/80 leading-relaxed whitespace-pre-line">
              {annotation.description}
            </div>
          )}
          <div className="mt-4">
            <div className="mb-1.5 text-muted-foreground text-[9px] uppercase tracking-wider font-display">Icon</div>
            <div className="grid grid-cols-4 gap-1">
              {POINT_ICON_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => onChangeIcon(annotation.id, opt.id)}
                  className={`px-1.5 py-1 rounded-md text-[8px] font-display uppercase tracking-[0.1em] border transition-all ${
                    annotation.icon === opt.id
                      ? 'bg-foreground/15 border-foreground/40 text-foreground'
                      : 'border-foreground/10 text-muted-foreground hover:text-foreground/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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

      {(annotation.kind === 'square' || annotation.kind === 'circle' || annotation.kind === 'triangle') && (
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

      {annotation.kind === 'custom' && (
        <>
          <Row label="Vertices" value={annotation.vertices.length} />
          <Row label="Type" value={annotation.closed ? 'Polygon' : 'Polyline'} />
          {annotation.closed ? (
            <>
              <Row label="Inside" value={annotation.insideTotal} />
              <Row label="Entered" value={annotation.enteredTotal} />
              <Row label="Exited" value={annotation.exitedTotal} />
              <Row label="Civilian Inside" value={annotation.civilianInside} />
              <Row label="Military Inside" value={annotation.militaryInside} />
            </>
          ) : (
            <>
              <Row label="Entities Crossed" value={annotation.crossedTotal} />
              <Row label="Civilian" value={annotation.crossedCivilian} />
              <Row label="Military" value={annotation.crossedMilitary} />
            </>
          )}
        </>
      )}

      {/* Style picker (lines & shapes) */}
      {annotation.kind !== 'point' && (
        <div className="mt-4">
          <div className="mb-1.5 text-muted-foreground text-[9px] uppercase tracking-wider font-display">Stroke</div>
          <div className="grid grid-cols-4 gap-1">
            {STYLES.filter(s => annotation.kind === 'line' || (annotation.kind === 'custom' && !annotation.closed) || s !== 'arrow').map(s => {
              const active = ((annotation as any).style || 'solid') === s;
              return (
                <button
                  key={s}
                  onClick={() => onChangeStyle(annotation.id, s)}
                  className={`px-1.5 py-1 rounded-md text-[8px] font-display uppercase tracking-[0.1em] border transition-all ${
                    active ? 'bg-foreground/15 border-foreground/40 text-foreground' : 'border-foreground/10 text-muted-foreground hover:text-foreground/80'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
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