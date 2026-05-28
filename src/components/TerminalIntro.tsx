import { useCallback, useEffect, useRef, useState } from "react";

type Line = { text: string; key: number };

const MODULES = [
  "/core/authentication","/net/packet_sniffer","/osint/scraper","/geo/telemetry",
  "/stream/ingest","/net/handshake","/sys/entropy","/crypto/keyvault","/proc/daemon",
  "/intel/feed","/sat/uplink","/dns/resolver","/mem/swap","/audio/decoder",
  "/sig/intercept","/db/index","/proxy/relay","/cache/purge","/bin/shell",
  "/sys/kernel_patch","/net/tcp_reassemble","/net/dns_spoof","/intel/darknet_crawl",
  "/sat/iridium_link","/crypto/aes_unwrap","/crypto/rsa_factor","/sys/microcode",
  "/sys/ring0_patch","/sig/freq_scan","/sig/burst_decoder","/geo/triangulate",
  "/geo/sat_overlay","/osint/social_graph","/osint/face_match","/proc/ghost_thread",
  "/proc/rootkit_inject","/mem/dump_raw","/mem/cold_boot","/db/shard_replica",
  "/db/index_rebuild","/audio/voiceprint","/audio/ssb_demod","/proxy/onion_relay",
  "/proxy/multihop","/cache/l2_purge","/bin/payload_drop","/bin/exfil_pipe",
  "/kernel/syscall_hook","/net/arp_table","/net/route_flush","/net/socket_pool",
  "/sys/clock_sync","/sys/thermal_probe","/sys/power_mgmt","/intel/keyword_match",
  "/intel/threat_score","/intel/source_rank","/crypto/sha3_chain","/crypto/curve25519",
  "/crypto/zero_knowledge","/sat/orbital_calc","/sat/downlink_buffer","/sig/spectrum_sweep",
  "/sig/morse_decode","/geo/grid_lookup","/geo/altitude_map","/osint/handle_link",
  "/osint/breach_index","/proc/scheduler","/proc/watchdog","/mem/page_table",
  "/mem/heap_compact","/db/journal_replay","/db/btree_walk","/audio/spectro",
  "/audio/loudness","/proxy/socks5","/proxy/dns_tunnel","/cache/warm_load",
  "/bin/loader","/bin/init",
];

const NOISE = [
  "0x7FFE  3A 9B C1 04 EE 12 88 7A   FF 00 21 4D 9E B7 0C 11",
  "0x7FFF  91 04 22 BC 8E 19 33 7C   1A FE 09 8B 4D 02 7F C3",
  "0x8000  D2 71 4A 6F 0B C9 5E 38   2A 84 17 EC 6B 90 F1 22",
  "[ 0.483921] tty1: registered character device",
  "[ 0.512004] eth0: link up, 1000 Mbps full-duplex",
  "[ 0.617772] random: crng init done",
  "[ 0.802113] crypto: self-tests passed",
  "[ 1.124007] sat: uplink locked @ 1.6GHz",
  "::: handshake ack 0x4f1c :::",
  "::: handshake ack 0x9a02 :::",
  "//// stream sync 88.1% ////",
  "//// stream sync 97.4% ////",
  ".... entropy pool: 4096 bits ....",
  ">>> packet drop 0.02% <<<",
  ">>> route via 10.13.37.4 <<<",
];

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const audio = { start() {}, key() {}, slash() {} };

type Phase = "intro" | "boot" | "loop" | "ready" | "reveal" | "warning" | "done";

interface Props { onComplete: () => void; }

export const TerminalIntro = ({ onComplete }: Props) => {
  const [lines, setLines] = useState<Line[]>([]);
  const [current, setCurrent] = useState("");
  const [phase, setPhase] = useState<Phase>("intro");
  const keyRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const pushLine = useCallback((text: string) => {
    setLines((prev) => {
      const next = [...prev, { text, key: keyRef.current++ }];
      return next.length > 300 ? next.slice(next.length - 300) : next;
    });
  }, []);

  const typeLine = useCallback(
    async (text: string, charDelay = 18, sound = true) => {
      for (let i = 1; i <= text.length; i++) {
        setCurrent(text.slice(0, i));
        if (sound && text[i - 1] !== " ") audio.key();
        await sleep(charDelay + Math.random() * 12);
      }
      setCurrent("");
      pushLine(text);
    },
    [pushLine]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (phase === "intro") { audio.start(); setPhase("boot"); }
    };
    const onClick = () => {
      if (phase === "intro") { audio.start(); setPhase("boot"); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "boot") return;
    let cancelled = false;
    (async () => {
      await sleep(400); if (cancelled) return;
      await typeLine("FRONTVIEW SYSTEM BOOT v1.0", 45);
      await sleep(500); pushLine("");
      const checks = [
        "> Checking memory........ OK",
        "> Checking kernel........ OK",
        "> Checking I/O bus....... OK",
        "> Checking network....... OK",
        "> Checking display....... OK",
      ];
      for (const c of checks) {
        if (cancelled) return;
        await typeLine(c, 16);
        await sleep(180);
      }
      pushLine("");
      await typeLine("> Initializing module loader...", 20);
      pushLine("");
      await sleep(300);
      if (!cancelled) setPhase("loop");
    })();
    return () => { cancelled = true; };
  }, [phase, pushLine, typeLine]);

  useEffect(() => {
    if (phase !== "loop") return;
    let cancelled = false;
    const start = Date.now();
    const DURATION = 9000;
    (async () => {
      let cycles = 0;
      while (!cancelled && Date.now() - start < DURATION) {
        const mod = rand(MODULES);
        const roll = Math.random();
        if (roll < 0.1) {
          pushLine(`> Loading module: ${mod}  [FAILED]`);
          await sleep(20 + Math.random() * 30);
          if (cancelled) return;
          pushLine(`> Retrying...`);
          await sleep(25 + Math.random() * 40);
          pushLine(`> Loading module: ${mod}  [OK]`);
        } else if (roll < 0.25) {
          pushLine(rand(NOISE));
          await sleep(4 + Math.random() * 15);
          pushLine(`> Loading module: ${mod}  [OK]`);
        } else if (roll < 0.4) {
          const burst = 5 + Math.floor(Math.random() * 6);
          for (let i = 0; i < burst; i++) {
            pushLine(`> Loading module: ${rand(MODULES)}  [OK]`);
          }
        } else {
          pushLine(`> Loading module: ${mod}  [OK]`);
        }
        if (Math.random() < 0.08) pushLine("");
        await sleep(3 + Math.random() * 15);
        cycles++;
        if (cycles > 0 && cycles % 40 === 0) {
          pushLine("> _");
          await sleep(500);
          if (cancelled) return;
        }
      }
      if (cancelled) return;
      pushLine("");
      await typeLine("SYSTEM STATUS: ONLINE", 30);
      await sleep(1000);
      if (!cancelled) setPhase("ready");
    })();
    return () => { cancelled = true; };
  }, [phase, pushLine, typeLine]);

  useEffect(() => {
    if (phase !== "ready") return;
    let cancelled = false;
    (async () => {
      await sleep(500); if (cancelled) return;
      setLines([]); setCurrent("");
      await sleep(450);
      if (!cancelled) setPhase("reveal");
    })();
    return () => { cancelled = true; };
  }, [phase]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, current]);

  const containerClass =
    "fixed inset-0 z-[9999] bg-black text-white font-mono crt-scanlines crt-vignette overflow-hidden";
  const fontStyle = {
    fontFamily: '"Courier New", "Lucida Console", Monaco, monospace',
    textShadow: "0 0 1px rgba(255,255,255,0.4)",
  } as const;

  if (phase === "done") return null;

  if (phase === "intro") {
    return (
      <main className={containerClass} style={fontStyle}>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="text-base sm:text-xl tracking-wide">Welcome to FrontView.</div>
          <div className="mt-4 text-sm sm:text-lg">
            Press Enter to continue<span className="cursor-blink-inline" />
          </div>
        </div>
      </main>
    );
  }

  if (phase === "reveal") {
    return (
      <main className={containerClass} style={fontStyle}>
        <RevealScreen onDone={() => setPhase("warning")} />
      </main>
    );
  }

  if (phase === "warning") {
    return (
      <main className={containerClass} style={fontStyle}>
        <WarningScreen onDone={() => { setPhase("done"); onComplete(); }} />
      </main>
    );
  }

  return (
    <main className={containerClass} style={fontStyle}>
      <div
        ref={containerRef}
        className="h-screen overflow-hidden p-4 sm:p-8 text-[13px] sm:text-[15px] leading-[1.5]"
      >
        {lines.map((l) => (
          <div key={l.key} className="whitespace-pre-wrap break-words">
            {l.text || "\u00A0"}
          </div>
        ))}
        {current && (
          <div className="whitespace-pre-wrap break-words">
            {current}
            <span className="cursor-blink-inline" />
          </div>
        )}
        {!current && (
          <div><span className="cursor-blink-inline" /></div>
        )}
      </div>
    </main>
  );
};

const CLEAN_LOGO = String.raw`
 ███████╗██████╗  ██████╗ ███╗   ██╗████████╗██╗   ██╗██╗███████╗██╗    ██╗
 ██╔════╝██╔══██╗██╔═══██╗████╗  ██║╚══██╔══╝██║   ██║██║██╔════╝██║    ██║
 █████╗  ██████╔╝██║   ██║██╔██╗ ██║   ██║   ██║   ██║██║█████╗  ██║ █╗ ██║
 ██╔══╝  ██╔══██╗██║   ██║██║╚██╗██║   ██║   ╚██╗ ██╔╝██║██╔══╝  ██║███╗██║
 ██║     ██║  ██║╚██████╔╝██║ ╚████║   ██║    ╚████╔╝ ██║███████╗╚███╔███╔╝
 ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝     ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝ 
`;

const RevealScreen = ({ onDone }: { onDone: () => void }) => {
  const [tagline, setTagline] = useState("");
  const [frame, setFrame] = useState(0);
  const [stable, setStable] = useState(false);
  const full = "REALITY. IN REAL TIME.";

  useEffect(() => {
    const totalDuration = 500;
    const tickMs = 35;
    const startTime = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= totalDuration) {
        clearInterval(id);
        setStable(true);
        return;
      }
      setFrame((f) => f + 1);
    }, tickMs);
    const t = setTimeout(() => {
      let i = 0;
      const id2 = setInterval(() => {
        i++;
        setTagline(full.slice(0, i));
        if (i >= full.length) {
          clearInterval(id2);
          setTimeout(() => onDone(), 2000);
        }
      }, 70);
    }, 650);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [onDone]);

  const r = Math.random;
  const showGhosts = !stable && r() < 0.85;
  const showGhost3 = !stable && r() < 0.5;
  const ghost1X = (r() * 28 - 14).toFixed(1);
  const ghost2X = (r() * 28 - 14).toFixed(1);
  const ghost3X = (r() * 36 - 18).toFixed(1);
  const mainX = !stable ? (r() * 18 - 9).toFixed(1) : "0";
  const sliceActive = !stable && r() < 0.85;
  const sliceTop = Math.floor(r() * 70);
  const sliceHeight = 6 + Math.floor(r() * 22);
  const sliceShift = (r() * 60 - 30).toFixed(1);
  const slice2Active = !stable && r() < 0.7;
  const slice2Top = Math.floor(r() * 70);
  const slice2Height = 4 + Math.floor(r() * 18);
  const slice2Shift = (r() * 50 - 25).toFixed(1);
  const slice3Active = !stable && r() < 0.55;
  const slice3Top = Math.floor(r() * 70);
  const slice3Height = 3 + Math.floor(r() * 14);
  const slice3Shift = (r() * 44 - 22).toFixed(1);
  const fragmentActive = !stable && r() < 0.5;
  const fragmentTop = Math.floor(r() * 80);
  const fragmentHeight = 3 + Math.floor(r() * 10);
  const whiteFlashActive = !stable && r() < 0.35;
  const whiteFlashTop = Math.floor(r() * 80);
  const whiteFlashHeight = 2 + Math.floor(r() * 8);
  const staticBarActive = !stable && r() < 0.55;
  const staticBarTop = Math.floor(r() * 90);
  const staticBarHeight = 2 + Math.floor(r() * 8);
  const staticBar2Active = !stable && r() < 0.4;
  const staticBar2Top = Math.floor(r() * 90);
  const staticBar2Height = 2 + Math.floor(r() * 6);

  const logoPre = (extraStyle: React.CSSProperties = {}) => (
    <pre
      className="text-white text-[10px] sm:text-base md:text-lg leading-tight select-none m-0"
      style={{ textShadow: "0 0 2px rgba(255,255,255,0.5)", ...extraStyle }}
      aria-label="FRONTVIEW"
    >{CLEAN_LOGO}</pre>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div key={frame} className="relative inline-block" style={{ transform: `translateX(${mainX}px)` }}>
        {showGhosts && (
          <>
            <div className="absolute inset-0 pointer-events-none" style={{ transform: `translateX(${ghost1X}px)`, opacity: 0.55 }} aria-hidden="true">{logoPre()}</div>
            <div className="absolute inset-0 pointer-events-none" style={{ transform: `translateX(${ghost2X}px)`, opacity: 0.45 }} aria-hidden="true">{logoPre()}</div>
          </>
        )}
        {showGhost3 && (
          <div className="absolute inset-0 pointer-events-none" style={{ transform: `translateX(${ghost3X}px)`, opacity: 0.35 }} aria-hidden="true">{logoPre()}</div>
        )}
        {logoPre()}
        {sliceActive && (
          <div className="absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: `${sliceTop}%`, height: `${sliceHeight}%`, transform: `translateX(${sliceShift}px)`, background: "#000" }} aria-hidden="true">
            <div style={{ marginTop: `-${sliceTop}%` }}>{logoPre()}</div>
          </div>
        )}
        {slice2Active && (
          <div className="absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: `${slice2Top}%`, height: `${slice2Height}%`, transform: `translateX(${slice2Shift}px)`, background: "#000" }} aria-hidden="true">
            <div style={{ marginTop: `-${slice2Top}%` }}>{logoPre()}</div>
          </div>
        )}
        {slice3Active && (
          <div className="absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: `${slice3Top}%`, height: `${slice3Height}%`, transform: `translateX(${slice3Shift}px)`, background: "#000" }} aria-hidden="true">
            <div style={{ marginTop: `-${slice3Top}%` }}>{logoPre()}</div>
          </div>
        )}
        {fragmentActive && (
          <div className="absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: `${fragmentTop}%`, height: `${fragmentHeight}%`, background: "#000", mixBlendMode: "screen" }} aria-hidden="true">
            <div style={{ marginTop: `-${fragmentTop}%` }}>{logoPre({ filter: "brightness(1.6)" })}</div>
          </div>
        )}
        {whiteFlashActive && (
          <div className="absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: `${whiteFlashTop}%`, height: `${whiteFlashHeight}%`, background: "#000" }} aria-hidden="true">
            <div style={{ marginTop: `-${whiteFlashTop}%` }}>{logoPre({ filter: "brightness(3)", color: "#fff" })}</div>
          </div>
        )}
        {staticBarActive && (
          <div className="absolute left-0 right-0 pointer-events-none" style={{ top: `${staticBarTop}%`, height: `${staticBarHeight}%`, background: "repeating-linear-gradient(to right, #fff 0 2px, #000 2px 4px, #fff 4px 7px, #000 7px 11px)", opacity: 0.95 }} aria-hidden="true" />
        )}
        {staticBar2Active && (
          <div className="absolute left-0 right-0 pointer-events-none" style={{ top: `${staticBar2Top}%`, height: `${staticBar2Height}%`, background: "repeating-linear-gradient(to right, #fff 0 1px, #000 1px 3px, #fff 3px 5px, #000 5px 9px)", opacity: 0.9 }} aria-hidden="true" />
        )}
      </div>
      <div className="mt-8 sm:mt-12 font-mono text-sm sm:text-lg tracking-[0.3em] min-h-[1.5em]">
        {tagline}
        {tagline.length < full.length && <span className="cursor-blink-inline" />}
      </div>
    </div>
  );
};

const WarningScreen = ({ onDone }: { onDone: () => void }) => {
  const [boxW, setBoxW] = useState(0);
  const [boxH, setBoxH] = useState(0);
  const [welcomeOpacity, setWelcomeOpacity] = useState(0);
  const [warningOpacity, setWarningOpacity] = useState(0);
  const [promptOpacity, setPromptOpacity] = useState(0);
  const [readyForEnter, setReadyForEnter] = useState(false);
  const [exiting, setExiting] = useState(false);
  const targetW = 820;
  const targetH = 560;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await sleep(400); if (cancelled) return;
      const stepsW = 24;
      for (let i = 1; i <= stepsW; i++) {
        if (cancelled) return;
        setBoxW(Math.round((targetW * i) / stepsW));
        await sleep(18);
      }
      const stepsH = 18;
      for (let i = 1; i <= stepsH; i++) {
        if (cancelled) return;
        setBoxH(Math.round((targetH * i) / stepsH));
        await sleep(20);
      }
      await sleep(250); if (cancelled) return;
      const fadeSteps = 10;
      for (let i = 1; i <= fadeSteps; i++) {
        if (cancelled) return;
        setWelcomeOpacity(i / fadeSteps);
        await sleep(30);
      }
      await sleep(3000); if (cancelled) return;
      for (let i = fadeSteps; i >= 0; i--) {
        if (cancelled) return;
        setWelcomeOpacity(i / fadeSteps);
        await sleep(30);
      }
      await sleep(300); if (cancelled) return;
      for (let i = 1; i <= fadeSteps; i++) {
        if (cancelled) return;
        setWarningOpacity(i / fadeSteps);
        await sleep(40);
      }
      await sleep(3000); if (cancelled) return;
      for (let i = 1; i <= fadeSteps; i++) {
        if (cancelled) return;
        setPromptOpacity(i / fadeSteps);
        await sleep(40);
      }
      if (!cancelled) setReadyForEnter(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !readyForEnter || exiting) return;
      setExiting(true);
      const fadeSteps = 10;
      for (let i = fadeSteps; i >= 0; i--) {
        setPromptOpacity(i / fadeSteps);
        setWarningOpacity(i / fadeSteps);
        await sleep(25);
      }
      await sleep(120);
      const stepsH = 16;
      for (let i = stepsH - 1; i >= 0; i--) {
        setBoxH(Math.round((targetH * i) / stepsH));
        await sleep(18);
      }
      const stepsW = 20;
      for (let i = stepsW - 1; i >= 0; i--) {
        setBoxW(Math.round((targetW * i) / stepsW));
        await sleep(14);
      }
      await sleep(120);
      onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readyForEnter, exiting, onDone]);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center px-4">
      <div className="relative border border-white" style={{ width: `${boxW}px`, height: `${boxH}px`, maxWidth: "92vw", maxHeight: "82vh", transition: "none" }}>
        <div className="absolute inset-0 flex items-center justify-center text-center font-mono text-white text-2xl sm:text-4xl tracking-widest pointer-events-none" style={{ opacity: welcomeOpacity }}>
          WELCOME, USER.
        </div>
        {warningOpacity > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-6 text-center font-mono text-white overflow-auto" style={{ opacity: warningOpacity }}>
            <div className="text-[10px] sm:text-xs leading-relaxed max-w-[92%] whitespace-pre-line">
{`WARNING!

FrontView operates on live, volatile data streams. Street-level traffic indicators may appear distorted, delayed, or incomplete due to environmental interference, signal degradation, or third-party limitations. Interpret all movement data as approximate.

DISCLAIMER!

Accessing or operating FrontView for any of the following purposes is strictly forbidden and will be treated as a breach of system policy:

• Mass surveillance or population monitoring.

• Military planning, targeting, or strategic operations.

Any attempt to repurpose FrontView beyond its intended civilian intelligence visualization may trigger the notification of proper authorities.

FrontView is an active, evolving system. Unexpected behavior, visual anomalies, or data desynchronization may occur without warning.

Session integrity is not guaranteed.

© FRONTIER STUDIOS GAMES — ALL RIGHTS RESERVED

Unauthorized duplication, modification, or extraction of system components is prohibited.`}
            </div>
            <div className="mt-6 text-xs sm:text-sm tracking-wider" style={{ opacity: promptOpacity }}>
              Press Enter to continue<span className="cursor-blink-inline" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalIntro;
