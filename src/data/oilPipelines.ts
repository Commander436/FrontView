// Major global oil & gas pipelines (simplified polylines from public data)
export interface Pipeline {
  id: string;
  name: string;
  substance: 'oil' | 'gas' | 'petroleum';
  operator: string;
  country: string;
  coordinates: [number, number][]; // [lon, lat] pairs
  lengthKm?: number;
  description: string;
}

export const OIL_PIPELINES: Pipeline[] = [
  {
    id: 'pl-druzhba', name: 'Druzhba Pipeline', substance: 'oil', operator: 'Transneft',
    country: 'Russia → Europe', lengthKm: 5500,
    coordinates: [[52.3, 54.9], [48.0, 53.5], [40.5, 52.0], [35.5, 51.5], [30.5, 50.4], [24.0, 51.8], [20.0, 51.5], [16.0, 50.5], [14.4, 50.1]],
    description: 'World\'s longest oil pipeline network, transporting Russian crude to Central and Western Europe via Belarus, Poland, Germany, Czech Republic, Hungary.',
  },
  {
    id: 'pl-btc', name: 'Baku-Tbilisi-Ceyhan', substance: 'oil', operator: 'BP',
    country: 'Azerbaijan → Turkey', lengthKm: 1768,
    coordinates: [[49.87, 40.41], [47.5, 41.0], [44.8, 41.7], [43.0, 41.0], [40.0, 39.5], [37.0, 37.5], [35.95, 36.77]],
    description: 'Major Caspian oil export route bypassing Russia and Iran, strategically critical for Western energy security.',
  },
  {
    id: 'pl-nord-stream', name: 'Nord Stream', substance: 'gas', operator: 'Nord Stream AG',
    country: 'Russia → Germany', lengthKm: 1224,
    coordinates: [[28.7, 60.1], [24.5, 59.5], [20.0, 58.0], [15.0, 55.5], [12.1, 54.1]],
    description: 'Subsea gas pipeline from Russia to Germany via Baltic Sea. Damaged by sabotage in September 2022.',
  },
  {
    id: 'pl-turkstream', name: 'TurkStream', substance: 'gas', operator: 'Gazprom',
    country: 'Russia → Turkey', lengthKm: 930,
    coordinates: [[38.0, 44.5], [36.0, 43.0], [33.0, 42.5], [30.0, 42.0], [28.9, 41.2]],
    description: 'Subsea gas pipeline from Russia to Turkey under the Black Sea. Became more important after Nord Stream disruption.',
  },
  {
    id: 'pl-tap', name: 'Trans-Adriatic Pipeline (TAP)', substance: 'gas', operator: 'TAP AG',
    country: 'Greece → Italy', lengthKm: 878,
    coordinates: [[40.5, 39.5], [26.0, 40.8], [24.0, 40.5], [20.5, 40.2], [19.0, 40.5], [18.5, 40.9]],
    description: 'Brings Caspian gas from the Southern Gas Corridor to European markets via Greece, Albania, and Italy.',
  },
  {
    id: 'pl-keystone', name: 'Keystone Pipeline', substance: 'oil', operator: 'TC Energy',
    country: 'Canada → USA', lengthKm: 3462,
    coordinates: [[-110.0, 52.0], [-108.0, 49.0], [-104.0, 46.0], [-100.0, 43.0], [-97.0, 40.0], [-95.5, 37.0], [-94.5, 33.0], [-93.0, 29.5]],
    description: 'Major crude oil pipeline system from Alberta oil sands to US Gulf Coast refineries. Subject of major political debate.',
  },
  {
    id: 'pl-east-west', name: 'East-West Pipeline (Petroline)', substance: 'oil', operator: 'Saudi Aramco',
    country: 'Saudi Arabia', lengthKm: 1200,
    coordinates: [[50.1, 26.3], [47.0, 25.5], [44.0, 24.0], [42.0, 23.5], [39.2, 22.5], [38.5, 22.0]],
    description: 'Strategic Saudi pipeline linking eastern oil fields to Red Sea port of Yanbu, bypassing Strait of Hormuz.',
  },
  {
    id: 'pl-iran-turkey', name: 'Iran-Turkey Gas Pipeline', substance: 'gas', operator: 'NIGC / BOTAŞ',
    country: 'Iran → Turkey', lengthKm: 2577,
    coordinates: [[51.4, 35.7], [48.5, 36.5], [46.0, 37.0], [44.5, 37.5], [43.0, 38.0], [40.0, 39.5]],
    description: 'Gas pipeline from Iran\'s South Pars field to Turkey. Subject to occasional flow disruptions and geopolitical pressure.',
  },
  {
    id: 'pl-espo', name: 'ESPO Pipeline', substance: 'oil', operator: 'Transneft',
    country: 'Russia (Siberia → Pacific)', lengthKm: 4857,
    coordinates: [[104.3, 52.3], [110.0, 51.5], [118.0, 50.0], [126.0, 48.5], [132.0, 47.0], [133.9, 43.1]],
    description: 'Eastern Siberia-Pacific Ocean pipeline. Key route for Russian crude exports to China and the Pacific.',
  },
  {
    id: 'pl-power-of-siberia', name: 'Power of Siberia', substance: 'gas', operator: 'Gazprom',
    country: 'Russia → China', lengthKm: 3000,
    coordinates: [[114.0, 62.0], [118.0, 57.0], [124.0, 52.0], [130.0, 48.5], [127.5, 45.8]],
    description: 'Russia\'s first gas pipeline to China. Became strategically important as Russian gas pivoted from Europe to Asia.',
  },
  {
    id: 'pl-sumed', name: 'SUMED Pipeline', substance: 'oil', operator: 'Arab Petroleum Pipelines',
    country: 'Egypt', lengthKm: 320,
    coordinates: [[33.9, 29.0], [32.5, 29.5], [31.2, 30.1], [29.9, 31.2]],
    description: 'Suez-Mediterranean pipeline. Critical bypass for Suez Canal, carrying Gulf crude to Mediterranean tankers.',
  },
];
