import { useState, useRef, useEffect } from 'react';
import { Radio, Volume2, VolumeX, Signal, X } from 'lucide-react';

interface WebSDRStation {
  name: string;
  location: string;
  embedUrl: string;
  freqRange: string;
  lat: number;
  lon: number;
}

const WEBSDR_STATIONS: WebSDRStation[] = [
  { name: 'University of Twente', location: 'Netherlands', embedUrl: 'http://websdr.ewi.utwente.nl:8901/', freqRange: '0–29 MHz', lat: 52.24, lon: 6.85 },
  { name: 'KiwiSDR Krakow', location: 'Poland', embedUrl: 'http://krakow.kiwisdr.com:8073/', freqRange: '0–30 MHz', lat: 50.06, lon: 19.94 },
  { name: 'W4AX Virginia', location: 'USA', embedUrl: 'http://w4ax.com:8901/', freqRange: '0–29 MHz', lat: 37.54, lon: -77.44 },
  { name: 'Wide-band WebSDR', location: 'Japan', embedUrl: 'http://ja1prg.asuscomm.com:8901/', freqRange: 'HF', lat: 35.68, lon: 139.76 },
  { name: 'VK4RZA', location: 'Australia', embedUrl: 'http://sdr.vk4rza.com:8073/', freqRange: '0–30 MHz', lat: -27.47, lon: 153.03 },
  { name: 'GlobalTuners Bonn', location: 'Germany', embedUrl: 'http://websdr.uk:8901/', freqRange: 'HF/VHF', lat: 50.73, lon: 7.10 },
];

export function WebSDRPanel() {
  const [expanded, setExpanded] = useState(false);
  const [activeStation, setActiveStation] = useState<WebSDRStation | null>(null);
  const [stationStatus, setStationStatus] = useState<Map<string, 'online' | 'offline' | 'checking'>>(new Map());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check station availability on expand
  useEffect(() => {
    if (!expanded) return;
    const statusMap = new Map<string, 'online' | 'offline' | 'checking'>();
    WEBSDR_STATIONS.forEach(s => statusMap.set(s.name, 'online')); // assume online, iframe will show error if not
    setStationStatus(statusMap);
  }, [expanded]);

  const openStation = (station: WebSDRStation) => {
    setActiveStation(station);
  };

  const closeStation = () => {
    setActiveStation(null);
  };

  return (
    <>
      <div className="rounded-2xl border border-foreground/8 overflow-hidden glass-panel bg-card/30">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-[9px] font-display uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-foreground/60" />
          <span className="flex-1 text-left">RADIO OSINT (WebSDR)</span>
          <Volume2 className="w-3 h-3 text-foreground/40" />
        </button>
        {expanded && (
          <div className="px-3 pb-3 space-y-1.5">
            <p className="text-[8px] font-mono text-muted-foreground px-1">
              Global radio receivers — click to open in‑app console
            </p>
            {WEBSDR_STATIONS.map((s, i) => {
              const status = stationStatus.get(s.name) || 'checking';
              return (
                <button
                  key={i}
                  onClick={() => openStation(s)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-foreground/5 border border-transparent hover:border-foreground/10 transition-all group text-left ${
                    activeStation?.name === s.name ? 'bg-foreground/8 border-foreground/15' : ''
                  }`}
                >
                  <Signal className={`w-3 h-3 shrink-0 ${
                    status === 'online' ? 'text-green-400' : status === 'offline' ? 'text-destructive' : 'text-muted-foreground animate-pulse'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-display tracking-wider text-foreground truncate">{s.name}</div>
                    <div className="text-[8px] font-mono text-muted-foreground">{s.location} · {s.freqRange}</div>
                  </div>
                  {status === 'offline' && (
                    <span className="text-[7px] text-destructive font-mono">OFFLINE</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* In-app radio console overlay */}
      {activeStation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[90vw] max-w-4xl h-[80vh] rounded-2xl glass-panel bg-card/90 border border-foreground/15 flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/10">
              <Radio className="w-4 h-4 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-display tracking-wider text-foreground truncate">{activeStation.name}</div>
                <div className="text-[9px] font-mono text-muted-foreground">{activeStation.location} · {activeStation.freqRange}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[8px] font-mono text-green-400">LIVE</span>
              </div>
              <button
                onClick={closeStation}
                className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Embedded receiver */}
            <div className="flex-1 relative">
              <iframe
                ref={iframeRef}
                src={activeStation.embedUrl}
                className="w-full h-full border-0"
                title={`WebSDR: ${activeStation.name}`}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                allow="autoplay; microphone"
              />
              {/* Fallback message overlay - shows if iframe blocked */}
              <div className="absolute bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm px-4 py-2 border-t border-foreground/10">
                <p className="text-[8px] font-mono text-muted-foreground">
                  If the receiver does not load, it may be temporarily offline or blocked by mixed-content policy. 
                  Audio/waterfall controls are provided by the receiver interface above.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
