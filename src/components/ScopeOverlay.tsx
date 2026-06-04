import { DisplayMode } from '@/types/globe';
import { useEffect, useState } from 'react';

type ScopeMode = DisplayMode | 'scope-only';

interface ScopeOverlayProps {
  mode: ScopeMode;
}

export function ScopeOverlay({ mode }: ScopeOverlayProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, [mode]);

  // No overlay in normal mode
  if (mode === 'normal') return null;

  const isScopeOnly = mode === 'scope-only';

  const modeLabel =
    isScopeOnly
      ? 'SCOPE'
      : mode === 'nvg'
      ? 'NVG MODE'
      : mode === 'crt'
      ? 'CRT MODE'
      : 'FLIR MODE';

  const textColor =
    mode === 'flir'
      ? 'text-orange-400/80'
      : isScopeOnly
      ? 'text-primary/80'
      : 'text-green-400/80';

  const dimTextColor =
    mode === 'flir'
      ? 'text-orange-400/50'
      : isScopeOnly
      ? 'text-primary/50'
      : 'text-green-400/50';

  const lineColor =
    mode === 'flir'
      ? 'bg-orange-500/20'
      : isScopeOnly
      ? 'bg-primary/15'
      : 'bg-green-500/20';

  const borderColor =
    mode === 'flir'
      ? 'border-orange-500/30'
      : isScopeOnly
      ? 'border-primary/20'
      : 'border-green-500/30';

  const utc = time.toISOString().slice(11, 19);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">

      {/* Circular vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center,
            transparent 30%,
            rgba(0,0,0,${isScopeOnly ? '0.15' : '0.3'}) 55%,
            rgba(0,0,0,${isScopeOnly ? '0.5' : '0.85'}) 75%,
            rgba(0,0,0,${isScopeOnly ? '0.7' : '0.98'}) 90%
          )`,
        }}
      />

      {/* Scope rings */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: '70vmin', height: '70vmin' }}
      >
        <div className={`w-full h-full rounded-full border ${borderColor}`} />
      </div>

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: '71vmin', height: '71vmin' }}
      >
        <div className={`w-full h-full rounded-full border ${borderColor} opacity-50`} />
      </div>

      {/* Crosshair lines */}
      <div className={`absolute top-1/2 left-[15%] right-[15%] h-px ${lineColor}`} />
      <div className={`absolute left-1/2 top-[15%] bottom-[15%] w-px ${lineColor}`} />

      {/* Center reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className={`w-8 h-8 rounded-full border ${borderColor}`} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className={`w-2 h-2 rounded-full border ${borderColor}`} />
      </div>

      {/* Tick marks */}
      {[0, 90, 180, 270].map((deg) => (
        <div
          key={deg}
          className={`absolute top-1/2 left-1/2 h-px w-3 ${lineColor}`}
          style={{
            transform: `translate(-50%, -50%) rotate(${deg}deg) translateX(${35 * 0.7}vmin)`,
            transformOrigin: '0 0',
          }}
        />
      ))}

      {/* HUD Text */}
      {!isScopeOnly && (
        <>
          <div className={`absolute top-6 left-6 font-mono text-[11px] ${textColor} space-y-1`}>
            <div className="font-bold tracking-widest">{modeLabel}</div>
            <div className="text-[9px] opacity-70">UTC {utc}</div>
          </div>

          <div className={`absolute top-6 right-6 font-mono text-[10px] ${dimTextColor} text-right space-y-1`}>
            <div>GPS SYNC</div>
            <div>COORD LOCK</div>
          </div>

          <div className={`absolute bottom-6 left-6 font-mono text-[9px] ${dimTextColor}`}>
            <div>FEED: ACTIVE</div>
            <div>RES: 1080p</div>
          </div>

          <div className={`absolute bottom-6 right-6 font-mono text-[9px] ${dimTextColor} text-right`}>
            <div>AES-256</div>
            <div>ENCRYPTED</div>
          </div>
        </>
      )}
    </div>
  );
}
