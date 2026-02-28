import { Shield, Wifi, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export function TopBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const utc = time.toISOString().slice(11, 19);

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-card border-b border-border relative z-50">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-sm font-display font-bold tracking-[0.2em] text-primary text-glow-teal">
          GLOBAL INTEL DASHBOARD
        </h1>
      </div>
      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-accent animate-pulse-glow" />
          LIVE
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-primary" />
          UTC {utc}
        </span>
        <span className="text-primary font-display text-[10px] tracking-widest">
          CLASSIFIED
        </span>
      </div>
    </header>
  );
}
