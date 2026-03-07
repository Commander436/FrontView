export type DisplayMode = 'normal' | 'crt' | 'nvg' | 'flir';
export type DensityMode = 'sparse' | 'moderate' | 'dense';

export interface Aircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  onGround: boolean;
  lastContact: number;
  militaryClassification?: 'confirmed' | 'probable' | 'unidentified';
  airline?: string;
  aircraftType?: string;
  model?: string;
  registration?: string;
}

export interface SatelliteData {
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  tle1: string;
  tle2: string;
  noradId?: string;
}

export interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
  timezone: string;
  description: string;
  tier: 1 | 2 | 3 | 4;
}

export interface MilitaryBase {
  name: string;
  country: string;
  branch: string;
  latitude: number;
  longitude: number;
  description: string;
}

export interface ConflictZone {
  name: string;
  region: string;
  countries: string[];
  latitude: number;
  longitude: number;
  radius: number;
  severity: 'high' | 'medium' | 'low';
  eventType: 'combat' | 'strike' | 'humanitarian' | 'standoff' | 'thermal';
  summary: string;
  recentDevelopments?: string;
  timestamp?: string;
  source?: string;
}

export interface Ship {
  mmsi: string;
  name: string;
  type: 'cargo' | 'tanker' | 'passenger' | 'fishing' | 'military';
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  lastUpdate: string;
}

export type InfraType = 'airport' | 'port' | 'wind_farm' | 'solar_farm' | 'nuclear' | 'hydro' | 'radio_tower' | 'cell_tower' | 'broadcast_tower';

export interface InfrastructureItem {
  id: string;
  name: string;
  type: InfraType;
  category: 'energy' | 'transport' | 'telecom';
  latitude: number;
  longitude: number;
  country: string;
  description: string;
}

export interface GPSInterferenceZone {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  radius: number;
  severity: 'high' | 'medium' | 'low';
  type: 'jamming' | 'spoofing' | 'degradation' | 'ionospheric';
  interferenceScore: number; // 0-1
  source: string;
  description: string;
  lastUpdated: string;
}

export interface InternetBlackout {
  id: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  radius: number;
  connectivityDrop: number;
  severity: 'critical' | 'major' | 'moderate';
  source: string;
  description: string;
  duration: string;
  lastUpdated: string;
}

export interface AirspaceClosure {
  id: string;
  name: string;
  type: 'restricted' | 'danger' | 'prohibited';
  polygon: [number, number][]; // [lon, lat] pairs
  lowerLimit: string;
  upperLimit: string;
  status: 'active' | 'inactive' | 'unknown';
  validFrom?: string;
  validTo?: string;
  source: string;
  description: string;
}

export interface LiveCamera {
  id: string;
  name: string;
  type: 'traffic' | 'city' | 'harbor' | 'weather' | 'scenic';
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  provider: string;
  streamUrl: string;
  thumbnailUrl?: string;
  status: 'online' | 'offline';
  description: string;
}

export interface SelectedEntity {
  type: 'aircraft' | 'satellite' | 'city' | 'base' | 'conflict' | 'ship' | 'infrastructure' | 'gps_interference' | 'internet_blackout' | 'airspace_closure' | 'live_camera';
  data: Aircraft | SatelliteData | City | MilitaryBase | ConflictZone | Ship | InfrastructureItem | GPSInterferenceZone | InternetBlackout | AirspaceClosure | LiveCamera;
}

export interface LayerVisibility {
  aircraft: boolean;
  militaryFlights: boolean;
  ships: boolean;
  satellites: boolean;
  showOrbits: boolean;
  streetTraffic: boolean;
  cities: boolean;
  airports: boolean;
  ports: boolean;
  energy: boolean;
  telecom: boolean;
  bases: boolean;
  buildings: boolean;
  weatherRadar: boolean;
  conflicts: boolean;
  gpsInterference: boolean;
  internetBlackouts: boolean;
  airspaceClosures: boolean;
  liveCameras: boolean;
}
