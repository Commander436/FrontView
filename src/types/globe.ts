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
  summary: string;
  recentDevelopments?: string;
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

export interface SelectedEntity {
  type: 'aircraft' | 'satellite' | 'city' | 'base' | 'conflict' | 'ship';
  data: Aircraft | SatelliteData | City | MilitaryBase | ConflictZone | Ship;
}

export interface LayerVisibility {
  aircraft: boolean;
  ships: boolean;
  satellites: boolean;
  bases: boolean;
  conflicts: boolean;
  cities: boolean;
  showOrbits: boolean;
  militaryFlights: boolean;
  weatherRadar: boolean;
  streetTraffic: boolean;
  buildings: boolean;
}
