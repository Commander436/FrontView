import { InternetBlackout } from "@/types/globe";

// Internet blackouts with country/region polygon geometry
// Sources: IODA, Cloudflare Radar, NetBlocks patterns
export const INTERNET_BLACKOUTS: InternetBlackout[] = [
  {
    id: 'ib-sudan-1', country: 'Sudan', region: 'Nationwide',
    latitude: 15.50, longitude: 32.56,
    polygon: [[21.82, 31.43], [23.89, 19.58], [36.87, 22.00], [38.61, 18.00], [33.96, 9.58], [24.19, 8.72], [23.89, 15.62], [21.82, 31.43]],
    connectivityDrop: 87, severity: 'critical', source: 'IODA / NetBlocks',
    description: 'Nationwide internet disruption due to ongoing civil war. Telecommunications infrastructure destroyed in Khartoum.',
    duration: 'Ongoing since April 2023 (intermittent)', lastUpdated: '2025-03-06T12:00:00Z',
  },
  {
    id: 'ib-myanmar-1', country: 'Myanmar', region: 'Sagaing & Chin States',
    latitude: 21.50, longitude: 95.50,
    polygon: [[92.19, 28.00], [98.55, 28.30], [100.12, 20.35], [98.95, 9.95], [97.37, 16.50], [92.19, 28.00]],
    connectivityDrop: 72, severity: 'critical', source: 'IODA / Cloudflare Radar',
    description: 'Military junta imposing internet shutdowns in conflict zones. Mobile data blocked in resistance-held territories.',
    duration: 'Recurring since Feb 2021', lastUpdated: '2025-03-06T08:00:00Z',
  },
  {
    id: 'ib-ethiopia-amhara', country: 'Ethiopia', region: 'Amhara Region',
    latitude: 11.50, longitude: 39.50,
    polygon: [[38.00, 13.50], [40.50, 13.50], [40.50, 9.50], [38.00, 9.50], [38.00, 13.50]],
    connectivityDrop: 95, severity: 'critical', source: 'NetBlocks / IODA',
    description: 'Complete internet blackout imposed by federal government during Fano militia operations.',
    duration: 'Since August 2023 (extended)', lastUpdated: '2025-03-06T06:00:00Z',
  },
  {
    id: 'ib-iran-1', country: 'Iran', region: 'Sistan-Baluchestan',
    latitude: 28.00, longitude: 60.00,
    polygon: [[58.00, 31.00], [63.00, 31.00], [63.00, 25.00], [58.00, 25.00], [58.00, 31.00]],
    connectivityDrop: 68, severity: 'major', source: 'NetBlocks / Cloudflare Radar',
    description: 'Regional internet throttling during security operations. VPN traffic blocked.',
    duration: 'Intermittent, multi-day events', lastUpdated: '2025-03-05T20:00:00Z',
  },
  {
    id: 'ib-gaza', country: 'Palestine', region: 'Gaza Strip',
    latitude: 31.40, longitude: 34.36,
    polygon: [[34.22, 31.60], [34.56, 31.60], [34.56, 31.22], [34.22, 31.22], [34.22, 31.60]],
    connectivityDrop: 96, severity: 'critical', source: 'NetBlocks / Cloudflare Radar',
    description: 'Near-total telecommunications collapse. Cell towers destroyed. Fiber optic cables severed.',
    duration: 'Ongoing since October 2023', lastUpdated: '2025-03-06T14:00:00Z',
  },
  {
    id: 'ib-pakistan-balochistan', country: 'Pakistan', region: 'Balochistan',
    latitude: 28.50, longitude: 66.00,
    polygon: [[61.00, 32.00], [70.00, 32.00], [70.00, 25.00], [63.00, 25.00], [61.00, 32.00]],
    connectivityDrop: 55, severity: 'major', source: 'NetBlocks',
    description: 'Recurring mobile internet suspensions during security operations and political unrest.',
    duration: 'Recurring multi-day shutdowns', lastUpdated: '2025-03-04T16:00:00Z',
  },
  {
    id: 'ib-cuba', country: 'Cuba', region: 'Nationwide',
    latitude: 22.00, longitude: -79.50,
    polygon: [[-85.00, 23.50], [-74.00, 23.50], [-74.00, 19.80], [-85.00, 19.80], [-85.00, 23.50]],
    connectivityDrop: 45, severity: 'moderate', source: 'IODA / Cloudflare Radar',
    description: 'Government-imposed throttling during political protests. Mobile data intermittently blocked.',
    duration: 'Intermittent, event-driven', lastUpdated: '2025-03-03T12:00:00Z',
  },
  {
    id: 'ib-drc', country: 'DR Congo', region: 'North Kivu',
    latitude: -1.50, longitude: 29.00,
    polygon: [[28.00, 0.50], [30.00, 0.50], [30.00, -3.00], [28.00, -3.00], [28.00, 0.50]],
    connectivityDrop: 78, severity: 'critical', source: 'NetBlocks / IODA',
    description: 'Internet disruption in conflict zone following M23 capture of Goma.',
    duration: 'Ongoing since January 2025', lastUpdated: '2025-03-06T04:00:00Z',
  },
];
