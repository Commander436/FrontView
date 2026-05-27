import { useEffect, useRef, useState, useCallback } from 'react';

type Phase = 'boot' | 'logo' | 'postlogo' | 'done';

interface Line {
  text: string;
  done: boolean;
}

// ---------- Audio (Web Audio API, no assets) ----------
let _ctx: AudioContext | null = null;
function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return _ctx;
}
function click() {
  try {
    const c = ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.value = 1800 + Math.random() * 400;
    g.gain.setValueAtTime(0.04, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.025);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.03);
  } catch {}
}
function bootChime() {
  try {
    const c = ctx();
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.value = f;
      const t = c.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.2);
    });
  } catch {}
}

// ---------- Helpers ----------
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const MODULES = [
  '/core/authentication',
  '/net/packet_sniffer',
  '/osint/scraper',
  '/geo/telemetry',
  '/stream/ingest',
  '/net/handshake',
  '/sys/entropy',
  '/sat/tle_resolver',
  '/ais/decoder',
  '/adsb/ingest',
  '/intel/aggregator',
  '/crypto/keystore',
  '/mesh/router',
  '/dns/resolver',
  '/cache/lru',
  '/proc/scheduler',
];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

interface Props {
  onComplete: () => void;
}

export const TerminalIntro = ({ onComplete }: Props) => {
  const [phase, setPhase] = useState<Phase>('boot');
  const [lines, setLines] = useState<Line[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const cancelledRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  // Type a single line char-by-char
  const typeLine = useCallback(async (text: string, speed = 18) => {
    setLines((prev) => [...prev, { text: '', done: false }]);
    for (let i = 1; i <= text.length; i++) {
      if (cancelledRef.current) return;
      setLines((prev) => {
        const next = [...prev];
        next[next.length - 1] = { text: text.slice(0, i), done: false };
        return next;
      });
      if (text[i - 1] !== ' ') click();
      await sleep(speed + Math.random() * 12);
    }
    setLines((prev) => {
      const next = [...prev];
      next[next.length - 1] = { text, done: true };
      return next;
    });
  }, []);

  const addInstant = useCallback((text: string) => {
    setLines((prev) => [...prev, { text, done: true }]);
  }, []);

  // ===== Boot sequence =====
  useEffect(() => {
    if (phase !== 'boot') return;
    (async () => {
      await sleep(700);
      await typeLine('FRONTVIEW SYSTEM BOOT v1.0', 35);
      await sleep(600);
      addInstant('');

      const checks = [
        '> Checking memory........ OK',
        '> Checking kernel........ OK',
        '> Checking I/O bus....... OK',
        '> Checking network....... OK',
        '> Checking display....... OK',
      ];
      for (const c of checks) {
        await typeLine(c, 14);
        await sleep(220);
      }
      addInstant('');

      // Hacking loop ~6s
      const end = Date.now() + 6000;
      while (Date.now() < end && !cancelledRef.current) {
        const mod = pick(MODULES);
        await typeLine(`> Loading module: ${mod}`, 6);
        if (Math.random() < 0.18) {
          await sleep(150);
          await typeLine('> Retrying...', 8);
          await sleep(180);
        }
        await sleep(60 + Math.random() * 120);
        addInstant(`> Loading module: ${mod}  [OK]`);
        if (Math.random() < 0.12) {
          addInstant('  ' + '▓▒░'.repeat(8 + Math.floor(Math.random() * 10)));
        }
        await sleep(40);
      }

      addInstant('');
      await typeLine('SYSTEM STATUS: ONLINE', 22);
      await sleep(900);

      // Clear & reveal logo
      setLines([]);
      await sleep(300);
      setPhase('logo');
    })();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ===== Logo phase =====
  const [glitch, setGlitch] = useState(true);
  useEffect(() => {
    if (phase !== 'logo') return;
    bootChime();
    const t1 = setTimeout(() => setGlitch(false), 500);
    const t2 = setTimeout(() => setPhase('postlogo'), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  // ===== Post-logo sequence =====
  const [postStage, setPostStage] = useState<
    'box-h' | 'box-v' | 'welcome-in' | 'welcome-hold' | 'welcome-out' | 'warning' | 'prompt'
  >('box-h');

  useEffect(() => {
    if (phase !== 'postlogo') return;
    let cancelled = false;
    (async () => {
      setPostStage('box-h');
      await sleep(700);
      if (cancelled) return;
      setPostStage('box-v');
      await sleep(700);
      if (cancelled) return;
      setPostStage('welcome-in');
      await sleep(400);
      if (cancelled) return;
      setPostStage('welcome-hold');
      await sleep(3000);
      if (cancelled) return;
      setPostStage('welcome-out');
      await sleep(400);
      if (cancelled) return;
      setPostStage('warning');
      await sleep(1500);
      if (cancelled) return;
      setPostStage('prompt');
    })();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  // Enter key handler (only on prompt stage)
  useEffect(() => {
    if (phase !== 'postlogo' || postStage !== 'prompt') return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        setPhase('done');
        onComplete();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase, postStage, onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black text-white overflow-hidden"
      style={{
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        fontSize: '14px',
        lineHeight: 1.45,
      }}
      onClick={() => {
        // Unlock audio on first interaction (some browsers)
        try { ctx().resume(); } catch {}
      }}
    >
      {/* CRT-ish scanlines for subtle vintage feel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 3px)',
        }}
      />

      {phase === 'boot' && (
        <div ref={scrollRef} className="absolute inset-0 overflow-hidden px-6 py-5">
          {lines.map((l, i) => (
            <div key={i} className="whitespace-pre">
              {l.text}
              {i === lines.length - 1 && !l.done && (
                <span style={{ opacity: cursorVisible ? 1 : 0 }}>▌</span>
              )}
            </div>
          ))}
          {lines.length > 0 && lines[lines.length - 1].done && (
            <div>
              <span style={{ opacity: cursorVisible ? 1 : 0 }}>▌</span>
            </div>
          )}
        </div>
      )}

      {phase === 'logo' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <LogoGlitch glitching={glitch} />
          <div className="mt-6 tracking-[0.4em] text-sm">REALITY. IN REAL TIME.</div>
        </div>
      )}

      {phase === 'postlogo' && (
        <PostLogo stage={postStage} cursorVisible={cursorVisible} />
      )}
    </div>
  );
};

// ---------- Logo with full-block glitch ----------
const LOGO_LINES = [
  '███████╗██████╗  ██████╗ ███╗   ██╗████████╗██╗   ██╗██╗███████╗██╗    ██╗',
  '██╔════╝██╔══██╗██╔═══██╗████╗  ██║╚══██╔══╝██║   ██║██║██╔════╝██║    ██║',
  '█████╗  ██████╔╝██║   ██║██╔██╗ ██║   ██║   ██║   ██║██║█████╗  ██║ █╗ ██║',
  '██╔══╝  ██╔══██╗██║   ██║██║╚██╗██║   ██║   ╚██╗ ██╔╝██║██╔══╝  ██║███╗██║',
  '██║     ██║  ██║╚██████╔╝██║ ╚████║   ██║    ╚████╔╝ ██║███████╗╚███╔███╔╝',
  '╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝     ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝ ',
];

const LogoGlitch = ({ glitching }: { glitching: boolean }) => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!glitching) return;
    const id = setInterval(() => setFrame((f) => f + 1), 60);
    return () => clearInterval(id);
  }, [glitching]);

  const block = (
    <pre
      className="leading-[1.05] text-[10px] sm:text-[12px] md:text-[14px] whitespace-pre m-0"
    >
      {LOGO_LINES.join('\n')}
    </pre>
  );

  if (!glitching) return <div>{block}</div>;

  const shiftX = (Math.random() - 0.5) * 14;
  const sliceTop = Math.floor(Math.random() * 60);
  const sliceHeight = 10 + Math.floor(Math.random() * 20);
  const sliceShift = (Math.random() - 0.5) * 24;
  const showBars = frame % 3 === 0;

  return (
    <div className="relative" style={{ transform: `translateX(${shiftX}px)` }}>
      {/* Ghost layer 1 */}
      <div className="absolute inset-0 opacity-50" style={{ transform: 'translate(-3px,0)' }}>
        {block}
      </div>
      {/* Ghost layer 2 */}
      <div className="absolute inset-0 opacity-30" style={{ transform: 'translate(2px,1px)' }}>
        {block}
      </div>
      {/* Main */}
      <div className="relative">{block}</div>
      {/* Misaligned slice */}
      <div
        className="absolute left-0 right-0 overflow-hidden bg-black"
        style={{
          top: `${sliceTop}%`,
          height: `${sliceHeight}%`,
          transform: `translateX(${sliceShift}px)`,
        }}
      >
        <div style={{ transform: `translateY(-${sliceTop}%)` }}>{block}</div>
      </div>
      {/* Static bars */}
      {showBars && (
        <>
          <div className="absolute left-0 right-0 bg-white/80" style={{ top: '20%', height: '2px' }} />
          <div className="absolute left-0 right-0 bg-white/40" style={{ top: '70%', height: '1px' }} />
        </>
      )}
    </div>
  );
};

// ---------- Post-logo box + welcome + warning ----------
const WARNING_TEXT = `WARNING!

FrontView operates on live, volatile data streams. Street-level traffic indicators may appear distorted, delayed, or incomplete due to environmental interference, signal degradation, or third-party limitations. Interpret all movement data as approximate.

DISCLAIMER!

Accessing or operating FrontView for any of the following purposes is strictly forbidden and will be treated as a breach of system policy:

• Mass surveillance or population monitoring.
• Military planning, targeting, or strategic operations.

Any attempt to repurpose FrontView beyond its intended civilian intelligence visualization may trigger the notification of proper authorities.

FrontView is an active, evolving system. Unexpected behavior, visual anomalies, or data desynchronization may occur without warning.

Session integrity is not guaranteed.

© FRONTIER STUDIOS GAMES — ALL RIGHTS RESERVED

Unauthorized duplication, modification, or extraction of system components is prohibited.`;

const PostLogo = ({
  stage,
  cursorVisible,
}: {
  stage: 'box-h' | 'box-v' | 'welcome-in' | 'welcome-hold' | 'welcome-out' | 'warning' | 'prompt';
  cursorVisible: boolean;
}) => {
  const boxOpen = stage !== 'box-h' && stage !== 'box-v' ? true : stage === 'box-v';
  const showBox = stage !== 'warning' && stage !== 'prompt';
  const welcomeOpacity =
    stage === 'welcome-in' || stage === 'welcome-hold' ? 1 : 0;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {showBox && (
        <div
          className="relative border border-white transition-all duration-[600ms] ease-out"
          style={{
            width: stage === 'box-h' ? '12px' : '70%',
            height: boxOpen ? '60%' : '12px',
            maxWidth: '900px',
            maxHeight: '500px',
          }}
        >
          <div
            className="absolute left-0 right-0 top-6 text-center transition-opacity duration-300"
            style={{ opacity: welcomeOpacity }}
          >
            WELCOME, USER.
          </div>
        </div>
      )}

      {(stage === 'warning' || stage === 'prompt') && (
        <div className="px-6 max-w-[760px] w-full text-center whitespace-pre-wrap">
          {WARNING_TEXT}
          {stage === 'prompt' && (
            <div className="mt-8">
              Press Enter to continue
              <span style={{ opacity: cursorVisible ? 1 : 0 }}>_</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TerminalIntro;