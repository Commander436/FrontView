import { Globe2, Newspaper } from 'lucide-react';

export type AppView = 'global' | 'news';

interface Props {
  view: AppView;
  onChange: (v: AppView) => void;
}

export function ViewSwitcher({ view, onChange }: Props) {
  return (
    <div className="pointer-events-none absolute top-4 left-0 w-full flex justify-center z-50">
      {/* This inner wrapper centers relative to the globe area */}
      <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-full glass-panel bg-card/70 border border-foreground/15 shadow-[0_8px_30px_rgba(0,0,0,0.55)] backdrop-blur-xl max-w-[calc(100vw-340px)]">
        {([
          { id: 'global', label: 'Global View', icon: Globe2 },
          { id: 'news',   label: 'News',        icon: Newspaper },
        ] as { id: AppView; label: string; icon: typeof Globe2 }[]).map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-display tracking-[0.18em] uppercase transition-all duration-300 ${
                active
                  ? 'bg-foreground/15 text-foreground shadow-[0_0_18px_hsl(0_0%_100%/0.25)] border border-foreground/30'
                  : 'text-muted-foreground hover:text-foreground/90 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
