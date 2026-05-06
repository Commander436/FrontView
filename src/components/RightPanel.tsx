import { SelectedEntity } from '@/types/globe';
import { DetailPanel } from './DetailPanel';
import { X } from 'lucide-react';
import { AnnotationColor, LineStyle, PointIcon } from '@/types/annotations';

interface RightPanelProps {
  selectedEntity: SelectedEntity | null;
  onClose: () => void;
  onAnnotationColor?: (id: string, color: AnnotationColor) => void;
  onAnnotationRename?: (id: string, title: string) => void;
  onAnnotationStyle?: (id: string, style: LineStyle) => void;
  onAnnotationIcon?: (id: string, icon: PointIcon) => void;
  onAnnotationDelete?: (id: string) => void;
}

export function RightPanel({ selectedEntity, onClose, onAnnotationColor, onAnnotationRename, onAnnotationStyle, onAnnotationIcon, onAnnotationDelete }: RightPanelProps) {
  if (!selectedEntity) return null;

  return (
    <aside className="w-80 glass-panel bg-card/60 border-l border-foreground/8 flex flex-col relative z-40 shrink-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/8">
        <h2 className="text-[10px] font-display uppercase tracking-[0.2em] text-foreground text-glow-white">
          INTEL REPORT
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <DetailPanel
          entity={selectedEntity}
          onClose={onClose}
          onAnnotationColor={onAnnotationColor}
          onAnnotationRename={onAnnotationRename}
          onAnnotationStyle={onAnnotationStyle}
          onAnnotationIcon={onAnnotationIcon}
          onAnnotationDelete={onAnnotationDelete}
        />
      </div>
      {/* Footer status */}
      <div className="px-4 py-2 border-t border-foreground/8">
        <div className="text-[8px] font-mono text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-glow" />
          LIVE DATA FEED
        </div>
      </div>
    </aside>
  );
}
