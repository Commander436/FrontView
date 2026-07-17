import { useState, useEffect, useRef } from 'react';
import { LeftPanel } from '@/components/LeftPanel';
import { RightPanel } from '@/components/RightPanel';
import { GlobeView } from '@/components/GlobeView';
import { ScopeOverlay } from '@/components/ScopeOverlay';
import { ViewSwitcher, type AppView } from '@/components/ViewSwitcher';
import { NewsPanel } from '@/components/NewsPanel';
import { useGlobeState } from '@/hooks/useGlobeState';
import { useAircraft } from '@/hooks/useAircraft';
import { useSatellites } from '@/hooks/useSatellites';
import { useFIRMS } from '@/hooks/useFIRMS';
import { useAIS } from '@/hooks/useAIS';
import { useAnnotations } from '@/hooks/useAnnotations';
import { PointAnnotationModal } from '@/components/PointAnnotationModal';
import { Search } from 'lucide-react';
import { DisplayMode } from '@/types/globe';
import { toast } from 'sonner';
import filterNormalIcon from '@/assets/filter-normal.png';
import filterCrtIcon from '@/assets/filter-crt.png';
import filterNvgIcon from '@/assets/filter-nvg.png';
import filterFlirIcon from '@/assets/filter-flir.png';

declare const Cesium: any;

function toMGRS(lat: number, lon: number): string {
  const zoneNum = Math.floor((lon + 180) / 6) + 1;
  const letters = 'CDEFGHJKLMNPQRSTUVWX';
  const bandIdx = Math.max(0, Math.min(letters.length - 1, Math.floor((lat + 80) / 8)));
  const band = letters[bandIdx];
  const easting = Math.round(((lon - (zoneNum * 6 - 183)) / 6 + 0.5) * 100000) % 100000;
  const northing = Math.round((lat >= 0 ? lat : lat + 90) / 90 * 10000000) % 100000;
  return `${zoneNum}${band} ${String(easting).padStart(5, '0')} ${String(northing).padStart(5, '0')}`;
}

const DISPLAY_MODES: { value: DisplayMode; label: string; icon: string }[] = [
  { value: 'normal', label: 'NORMAL', icon: filterNormalIcon },
  { value: 'crt',    label: 'CRT',    icon: filterCrtIcon },
  { value: 'nvg',    label: 'NVG',    icon: filterNvgIcon },
  { value: 'flir',   label: 'FLIR',   icon: filterFlirIcon },
];

const Index = () => {
  const {
    layers, toggleLayer,
    selectedEntity, selectEntity,
    displayMode, setDisplayMode,
  } = useGlobeState();

  // Aircraft enabled if EITHER civilian or military toggle is on
  const { aircraft } = useAircraft(layers.aircraft, layers.militaryFlights);
  const { satellites } = useSatellites(layers.satellites);
  const { anomalies: thermalAnomalies } = useFIRMS(layers.conflicts);
  const { ships: liveShips } = useAIS(layers.ships);
  const {
    annotations, drawingTool, setDrawingTool,
    pendingPoint, setPendingPoint,
    addPoint, addLine, addSquare, addCircle, addTriangle, addCustom,
    updateColor, updateTitle, updateStyle, updateIcon, remove, clearAll,
  } = useAnnotations(aircraft, liveShips, satellites);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [cameraCoords, setCameraCoords] = useState({ lat: 0, lon: 0 });
  const [cameraHeading, setCameraHeading] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  // Play intro entry animations only on first mount (i.e. right after the terminal intro)
  const [introAnim] = useState(true);

  // Global ↔ News view switcher
  const [view, setView] = useState<AppView>('global');
  const [hasNavigated, setHasNavigated] = useState(false);
  const [switcherTransitioning, setSwitcherTransitioning] = useState(false);
  const viewRef = useRef<AppView>('global');
  const switchTimersRef = useRef<number[]>([]);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => () => switchTimersRef.current.forEach(window.clearTimeout), []);
  const changeView = (v: AppView) => {
    if (v === viewRef.current) return;
    switchTimersRef.current.forEach(window.clearTimeout);
    switchTimersRef.current = [];
    setHasNavigated(true);
    // Fade the switcher out, swap views mid-fade, then fade back in once the
    // new layout has settled so it re-centers on the correct anchor.
    setSwitcherTransitioning(true);
    switchTimersRef.current.push(
      window.setTimeout(() => {
        viewRef.current = v;
        setView(v);
      }, 250),
      window.setTimeout(() => setSwitcherTransitioning(false), 1200)
    );
  };

  // Track the horizontal center of the globe area so the top-center switcher
  // stays anchored to the visible globe (not the viewport) in Global view,
  // and re-centers on the viewport in News view.
  const mainRef = useRef<HTMLElement | null>(null);
  const [switcherCenterX, setSwitcherCenterX] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (view === 'news') {
      setSwitcherCenterX(undefined); // center on viewport
      return;
    }
    const measure = () => {
      const el = mainRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSwitcherCenterX(r.left + r.width / 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (mainRef.current) ro.observe(mainRef.current);
    window.addEventListener('resize', measure);
    // Re-measure a few times as slide animations settle
    const t1 = setTimeout(measure, 300);
    const t2 = setTimeout(measure, 700);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      clearTimeout(t1); clearTimeout(t2);
    };
  }, [view, leftCollapsed, selectedEntity]);

  const leftAnim   = !hasNavigated ? 'intro-left-in'   : view === 'news' ? 'view-slide-out-left'  : 'view-slide-in-left';
  const bottomAnim = !hasNavigated ? 'intro-bottom-in' : view === 'news' ? 'view-slide-out-down'  : 'view-slide-in-bottom';
  const rightAnim  = view === 'news' ? 'view-slide-out-right' : hasNavigated ? 'view-slide-in-right' : '';

  // Keep the selected annotation in sync with edits (rename/style/icon/color)
  useEffect(() => {
    if (selectedEntity?.type !== 'annotation') return;
    const id = (selectedEntity.data as any).id;
    const fresh = annotations.find(a => a.id === id);
    if (fresh && fresh !== selectedEntity.data) {
      selectEntity({ type: 'annotation' as any, data: fresh });
    }
  }, [annotations, selectedEntity, selectEntity]);

  // Camera coordinate tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof Cesium === 'undefined') return;
      const viewer = (window as any).__cesiumViewer;
      if (!viewer || viewer.isDestroyed()) return;
      const carto = viewer.camera.positionCartographic;
      if (carto) {
        setCameraCoords({
          lat: Cesium.Math.toDegrees(carto.latitude),
          lon: Cesium.Math.toDegrees(carto.longitude),
        });
      }
      setCameraHeading(Cesium.Math.toDegrees(viewer.camera.heading));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Zoom hints when buildings/traffic layers are enabled from orbit
  useEffect(() => {
    if (!layers.buildings) return;
    const viewer = (window as any).__cesiumViewer;
    const h = viewer?.camera?.positionCartographic?.height;
    if (h && h > 50000) {
      toast.message('3D Buildings enabled', {
        description: 'Zoom into a city (< 50 km altitude) to load OSM building footprints.',
      });
    }
  }, [layers.buildings]);
  useEffect(() => {
    if (!layers.streetTraffic) return;
    const viewer = (window as any).__cesiumViewer;
    const h = viewer?.camera?.positionCartographic?.height;
    if (h && h > 30000) {
      toast.message('Street Traffic enabled', {
        description: 'Zoom into a city (< 30 km altitude) to spawn simulated vehicles.',
      });
    }
  }, [layers.streetTraffic]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`);
      const data = await res.json();
      if (data.length === 0) {
        setSearchError('Location not found.');
        return;
      }
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      let altitude = 500000;
      const type = result.type || '';
      const cls = result.class || '';
      const bbox = result.boundingbox;

      if (cls === 'building' || type === 'house' || type === 'building' || type === 'yes') {
        altitude = 500;
      } else if (type === 'aerodrome' || type === 'airport') {
        altitude = 3000;
      } else if (type === 'city' || type === 'town' || type === 'village' || type === 'hamlet') {
        altitude = 15000;
      } else if (type === 'state' || type === 'province' || type === 'region') {
        altitude = 300000;
      } else if (type === 'country') {
        altitude = 1500000;
      } else if (type === 'continent') {
        altitude = 8000000;
      } else if (bbox) {
        const latSpan = Math.abs(parseFloat(bbox[1]) - parseFloat(bbox[0]));
        const lonSpan = Math.abs(parseFloat(bbox[3]) - parseFloat(bbox[2]));
        const maxSpan = Math.max(latSpan, lonSpan);
        if (maxSpan < 0.005) altitude = 500;
        else if (maxSpan < 0.05) altitude = 3000;
        else if (maxSpan < 0.5) altitude = 20000;
        else if (maxSpan < 5) altitude = 200000;
        else altitude = 1000000;
      }

      const viewer = (window as any).__cesiumViewer;
      if (viewer && !viewer.isDestroyed()) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
          duration: 2.5,
          easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        });
      }
      setSearchQuery('');
    } catch {
      setSearchError('Search failed.');
    }
  };

  const handleDrawComplete = (kind: string, payload: any) => {
    if (kind === 'point') {
      setPendingPoint(payload);
    } else if (kind === 'line') {
      const ann = addLine(payload.a, payload.b);
      selectEntity({ type: 'annotation' as any, data: ann });
      setDrawingTool(null);
    } else if (kind === 'square') {
      const ann = addSquare(payload.a, payload.b);
      selectEntity({ type: 'annotation' as any, data: ann });
      setDrawingTool(null);
    } else if (kind === 'circle') {
      const ann = addCircle(payload.center, payload.radiusMeters);
      selectEntity({ type: 'annotation' as any, data: ann });
      setDrawingTool(null);
    } else if (kind === 'triangle') {
      const ann = addTriangle(payload.vertices);
      selectEntity({ type: 'annotation' as any, data: ann });
      setDrawingTool(null);
    } else if (kind === 'custom') {
      const ann = addCustom(payload.vertices, payload.closed);
      selectEntity({ type: 'annotation' as any, data: ann });
      setDrawingTool(null);
    }
  };

  // Scene tinting is now handled by Cesium PostProcessStage shaders inside
  // GlobeView — no CSS filter is applied here.
  const showScope = layers.scopeOverlay;
  const hudColor = displayMode === 'flir' ? 'text-orange-400/80' : displayMode === 'nvg' || displayMode === 'crt' ? 'text-green-400/80' : 'text-foreground/60';

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      <div className={`${leftAnim} flex`}>
      <LeftPanel
        layers={layers}
        onToggleLayer={toggleLayer}
        displayMode={displayMode}
        onSetDisplayMode={setDisplayMode}
        aircraftCount={aircraft.length}
        satelliteCount={satellites.length}
        shipCount={liveShips.length}
        collapsed={leftCollapsed}
        onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
        drawingTool={drawingTool}
        onSetDrawingTool={setDrawingTool}
        annotationCount={annotations.length}
        onClearAllAnnotations={clearAll}
      />
      </div>
      <main ref={mainRef} className="flex-1 relative min-w-0">
        <div className={`relative w-full h-full ${introAnim ? 'intro-globe-in' : ''}`}>
          <GlobeView
            layers={layers}
            aircraft={aircraft}
            satellites={satellites}
            thermalAnomalies={thermalAnomalies}
            liveShips={liveShips}
            displayMode={displayMode}
            selectedEntity={selectedEntity}
            onEntitySelect={selectEntity}
            annotations={annotations}
            drawingTool={drawingTool}
            onDrawComplete={handleDrawComplete}
          />
          <ScopeOverlay
            mode={
              displayMode !== 'normal'
                ? displayMode
                : showScope
                ? 'scope-only'
                : 'normal'
            }
          />
        </div>

        {/* Unified bottom-center tactical dock */}
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 ${bottomAnim}`}>
          <div className="flex flex-col items-stretch gap-2 p-2.5 rounded-2xl glass-panel bg-card/70 border border-foreground/15 shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchError(''); }}
                placeholder="Search location…"
                className="w-[22rem] pl-9 pr-4 py-2 rounded-xl bg-secondary/40 border border-foreground/12 text-[11px] font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 transition-all"
              />
              {searchError && (
                <div className="absolute -top-5 left-0 text-[9px] text-destructive font-mono">{searchError}</div>
              )}
            </form>
            {/* Filter icon-tiles */}
            <div className="flex gap-1.5 justify-center">
              {DISPLAY_MODES.map(m => {
                const active = displayMode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setDisplayMode(m.value)}
                    className={`relative flex flex-col items-center justify-end gap-1 w-[5.25rem] h-14 rounded-xl border transition-all duration-200 ease-out ${
                      active
                        ? 'bg-foreground/15 border-foreground/40 text-foreground shadow-[0_0_18px_hsl(0_0%_100%/0.25)]'
                        : 'bg-secondary/30 border-foreground/8 text-muted-foreground hover:text-foreground/80 hover:bg-foreground/5'
                    }`}
                    title={m.label}
                  >
                    <img
                      src={m.icon}
                      alt={m.label}
                      width={22}
                      height={22}
                      loading="lazy"
                      className={`w-[22px] h-[22px] mt-1 transition-all duration-300 ${active ? 'opacity-100' : 'opacity-55'}`}
                      style={{ filter: 'invert(1) brightness(1.4)' }}
                    />
                    <span className="text-[8px] font-display tracking-[0.15em] mb-1">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compass — bottom-right */}
        <button
          onClick={() => {
            const viewer = (window as any).__cesiumViewer;
            if (!viewer || viewer.isDestroyed()) return;
            const carto = viewer.camera.positionCartographic;
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
              orientation: { heading: 0, pitch: viewer.camera.pitch, roll: 0 },
              duration: 0.6,
            });
          }}
          title="Reorient to North"
          className={`absolute bottom-6 right-6 z-30 w-20 h-20 rounded-full glass-panel bg-card/70 border border-foreground/20 flex items-center justify-center text-foreground hover:bg-card/90 hover:shadow-[0_0_18px_hsl(0_0%_100%/0.3)] transition-all group ${introAnim ? 'intro-hud-in' : ''}`}
        >
          {/* Outer fixed ring with tick marks */}
          <div className="absolute inset-0 rounded-full pointer-events-none">
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 origin-top"
                style={{
                  transform: `translate(-50%, 0) rotate(${i * 10}deg) translateY(-38px)`,
                  width: i % 9 === 0 ? '2px' : '1px',
                  height: i % 9 === 0 ? '7px' : i % 3 === 0 ? '5px' : '3px',
                  background: i % 9 === 0 ? 'hsl(var(--foreground) / 0.85)' : 'hsl(var(--foreground) / 0.35)',
                }}
              />
            ))}
          </div>
          {/* Rotating compass face */}
          <div
            className="relative w-16 h-16"
            style={{ transform: `rotate(${-cameraHeading}deg)`, transition: 'transform 180ms linear' }}
          >
            {/* Cardinal labels rotate with face */}
            <span className="absolute top-[2px] left-1/2 -translate-x-1/2 text-[10px] font-display font-bold text-destructive tracking-wider">N</span>
            <span className="absolute right-[2px] top-1/2 -translate-y-1/2 text-[8px] font-display text-foreground/70">E</span>
            <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[8px] font-display text-foreground/70">S</span>
            <span className="absolute left-[2px] top-1/2 -translate-y-1/2 text-[8px] font-display text-foreground/70">W</span>
            {/* Needle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ height: '44px' }}>
              <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '14px solid hsl(var(--destructive))' }} />
              <div style={{ width: '2px', height: '14px', background: 'hsl(var(--foreground) / 0.55)' }} />
              <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '10px solid hsl(var(--foreground) / 0.7)' }} />
            </div>
            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground/80 ring-1 ring-background" />
          </div>
          {/* Heading readout */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-foreground/70 tracking-widest tabular-nums">
            {String(Math.round((cameraHeading + 360) % 360)).padStart(3, '0')}°
          </div>
        </button>

        {/* Coordinate HUD — bottom-left tactical readout */}
        <div className={`absolute bottom-4 left-4 z-30 pointer-events-none font-mono text-[10px] ${hudColor} space-y-0.5 ${introAnim ? 'intro-hud-in' : ''}`}>
          <div>LAT {cameraCoords.lat >= 0 ? 'N' : 'S'}{Math.abs(cameraCoords.lat).toFixed(4)}°</div>
          <div>LON {cameraCoords.lon >= 0 ? 'E' : 'W'}{Math.abs(cameraCoords.lon).toFixed(4)}°</div>
          <div className="opacity-60">MGRS {toMGRS(cameraCoords.lat, cameraCoords.lon)}</div>
        </div>

        {pendingPoint && (
          <PointAnnotationModal
            lon={pendingPoint.lon}
            lat={pendingPoint.lat}
            onSave={(title, description, icon) => {
              const ann = addPoint(pendingPoint.lon, pendingPoint.lat, title, description, icon);
              setPendingPoint(null);
              setDrawingTool(null);
              selectEntity({ type: 'annotation' as any, data: ann });
            }}
            onCancel={() => setPendingPoint(null)}
          />
        )}
      </main>
      <div className={rightAnim}>
        <RightPanel
          selectedEntity={selectedEntity}
          onClose={() => selectEntity(null)}
          onAnnotationColor={updateColor}
          onAnnotationRename={updateTitle}
          onAnnotationStyle={updateStyle}
          onAnnotationIcon={updateIcon}
          onAnnotationDelete={(id) => { remove(id); selectEntity(null); }}
        />
      </div>
      {/* Top-level view switcher — stays mounted across view changes, fades
          out mid-transition and re-anchors to the correct center. */}
      <ViewSwitcher
        view={view}
        onChange={changeView}
        centerX={switcherCenterX}
        transitioning={switcherTransitioning}
      />
      {/* News panel is a top-level fixed overlay so it covers the ENTIRE
          viewport (including the side panels) and slides in from the true
          screen edges. */}
      <NewsPanel active={view === 'news'} onRequestGlobal={() => changeView('global')} />
    </div>
  );
};

export default Index;
