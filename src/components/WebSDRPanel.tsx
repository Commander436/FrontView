import { useState } from 'react';
import { Radio, ExternalLink, Volume2 } from 'lucide-react';

interface WebSDRStation {
  name: string;
  location: string;
  url: string;
  freqRange: string;
  lat: number;
  lon: number;
}

const WEBSDR_STATIONS: WebSDRStation[] = [
  { name: 'University of Twente', location: 'Netherlands', url: 'http://websdr.ewi.utwente.nl:8901/', freqRange: '0–29 MHz', lat: 52.24, lon: 6.85 },
  { name: 'KiwiSDR Krakow', location: 'Poland', url: 'http://krakow.kiwisdr.com:8073/', freqRange: '0–30 MHz', lat: 50.06, lon: 19.94 },
  { name: 'W4AX Virginia', location: 'USA', url: 'http://w4ax.com:8901/', freqRange: '0–29 MHz', lat: 37.54, lon: -77.44 },
  { name: 'Wide-band WebSDR', location: 'Japan', url: 'http://ja1prg.asuscomm.com:8901/', freqRange: 'HF', lat: 35.68, lon: 139.76 },
  { name: 'VK4RZA', location: 'Australia', url: 'http://sdr.vk4rza.com:8073/', freqRange: '0–30 MHz', lat: -27.47, lon: 153.03 },
  { name: 'GlobalTuners Bonn', location: 'Germany', url: 'http://websdr.uk:8901/', freqRange: 'HF/VHF', lat: 50.73, lon: 7.10 },
];

export function WebSDRPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
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
            Global radio receivers — tune HF/VHF/UHF live
          </p>
          {WEBSDR_STATIONS.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-foreground/5 border border-transparent hover:border-foreground/10 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-display tracking-wider text-foreground truncate">{s.name}</div>
                <div className="text-[8px] font-mono text-muted-foreground">{s.location} · {s.freqRange}</div>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
