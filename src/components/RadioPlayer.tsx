import { useState, useRef, useEffect } from 'react';
import { Radio, X, Play, Pause, Volume2 } from 'lucide-react';
import { RadioStation } from '@/hooks/useRadioStations';
import { Slider } from '@/components/ui/slider';

interface RadioPlayerProps {
  station: RadioStation;
  onClose: () => void;
}

export function RadioPlayer({ station, onClose }: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    const audio = new Audio(station.url);
    audio.volume = volume / 100;
    audioRef.current = audio;

    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [station.url]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[380px] rounded-2xl glass-panel bg-card/90 border border-foreground/15 shadow-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Radio className="w-4 h-4 text-foreground/70 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-display tracking-wider text-foreground truncate">{station.name}</div>
          <div className="text-[9px] font-mono text-muted-foreground truncate">
            {station.country}{station.bitrate ? ` · ${station.bitrate} kbps` : ''}{station.tags ? ` · ${station.tags.split(',').slice(0, 2).join(', ')}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {playing && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[8px] font-mono text-green-400">LIVE</span>
            </span>
          )}
          <button onClick={togglePlay} className="p-1.5 rounded-lg hover:bg-foreground/10 text-foreground transition-all">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="px-4 pb-3 flex items-center gap-2">
        <Volume2 className="w-3 h-3 text-muted-foreground shrink-0" />
        <Slider
          value={[volume]}
          onValueChange={([v]) => setVolume(v)}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-[8px] font-mono text-muted-foreground w-6 text-right">{volume}</span>
      </div>
    </div>
  );
}
