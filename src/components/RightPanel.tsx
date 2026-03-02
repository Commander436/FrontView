import { SelectedEntity } from '@/types/globe';
import { DetailPanel } from './DetailPanel';
import { X } from 'lucide-react';

interface RightPanelProps {
  selectedEntity: SelectedEntity | null;
  onClose: () => void;
}

export function RightPanel({ selectedEntity, onClose }: RightPanelProps) {
  if (!selectedEntity) return null;

  return (
    <aside className="w-80 backdrop-blur-xl bg-card/80 border-l border-border/50 flex flex-col relative z-40 shrink-0 animate-fade-in">
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <h2 className="text-[10px] font-display uppercase tracking-[0.25em] text-primary text-glow-teal">
          INTEL REPORT
        </h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <DetailPanel entity={selectedEntity} onClose={onClose} />
      </div>
    </aside>
  );
}
