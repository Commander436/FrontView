import { Globe2, Newspaper } from 'lucide-react';

export type AppView = 'global' | 'news';

interface Props {
  view: AppView;
  onChange: (v: AppView) => void;
  /** Absolute x-coordinate (viewport px) to center on. If undefined, centers on viewport. */
  centerX?: number;
  /** When true, the switcher fades out (used mid-transition). */
  transitioning?: boolean;
}

export function ViewSwitcher({ view, onChange, centerX, transitioning }: Props) {
  return (
    <div
      className="pointer-events-none fixed top-4 z-[10001]"
      style={{
        left: centerX != null ? `${centerX}px` : '50%',
        transform: 'translateX(-50%)',
        opacity: transitioning ? 0 : 1,
        transition: 'left 500ms cubic-bezier(0.22,1,0.36,1), opacity 350ms ease-out',
      }}
    >
      <div
        className="
          pointer-events-auto
          flex items-center gap-1
          p-1 rounded-full
          glass-panel bg-card/70
          border border-foreground/15
          shadow-[0_8px_30px_rgba(0,0,0,0.55)]
          backdrop-blur-xl
        "
      >
        {([
          { id: 'global', label: 'Global View', icon: Globe2 },
          { id: 'news',   label: 'News',        icon: Newspaper },
        ] as { id: AppView; label: string; icon: typeof Globe2 }[]).map(
          ({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`
                  flex items-center gap-2
                  px-4 py-1.5 rounded-full
                  text-[11px] font-display tracking-[0.18em] uppercase
                  transition-all duration-300
                  ${
                    active
                      ? 'bg-foreground/15 text-foreground shadow-[0_0_18px_hsl(0_0%_100%/0.25)] border border-foreground/30'
                      : 'text-muted-foreground hover:text-foreground/90 border border-transparent'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
