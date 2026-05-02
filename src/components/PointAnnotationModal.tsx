import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';

interface Props {
  lon: number;
  lat: number;
  onSave: (title: string, description: string) => void;
  onCancel: () => void;
}

export function PointAnnotationModal({ lon, lat, onSave, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/40 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-[420px] rounded-2xl glass-panel bg-card/90 border border-foreground/15 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[10px] font-display tracking-[0.18em]">NEW POINT OF INTEREST</span>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="text-[9px] font-mono text-muted-foreground">
            {lat >= 0 ? 'N' : 'S'}{Math.abs(lat).toFixed(4)}° · {lon >= 0 ? 'E' : 'W'}{Math.abs(lon).toFixed(4)}°
          </div>
          <div className="space-y-1">
            <label className="block text-[9px] font-display uppercase tracking-[0.15em] text-muted-foreground">Title</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Forward Operating Base"
              className="w-full bg-secondary/40 border border-foreground/15 rounded-lg px-3 py-2 text-[11px] font-display text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-foreground/30"
              maxLength={64}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[9px] font-display uppercase tracking-[0.15em] text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes…"
              rows={4}
              className="w-full bg-secondary/40 border border-foreground/15 rounded-lg px-3 py-2 text-[11px] font-display text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
              maxLength={500}
            />
          </div>
        </div>
        <div className="px-4 py-3 border-t border-foreground/10 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-[9px] font-display uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(title.trim() || 'Untitled', description.trim())}
            className="px-3 py-1.5 rounded-lg bg-foreground/15 border border-foreground/30 text-foreground text-[9px] font-display uppercase tracking-[0.15em] hover:bg-foreground/25 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}