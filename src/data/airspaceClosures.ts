import { AirspaceClosure } from "@/types/globe";

// Real-world FIR/UIR and restricted airspace polygons
// Sources: ICAO FIR boundaries, FAA TFRs, Eurocontrol NOP
export const AIRSPACE_CLOSURES: AirspaceClosure[] = [
  {
    id: 'ukdv-fir', name: 'UKDV Dnipro FIR', type: 'prohibited',
    polygon: [[22.15, 52.37], [24.10, 51.89], [30.17, 51.50], [33.00, 52.35], [40.22, 52.38], [40.23, 49.40], [40.00, 46.50], [38.21, 46.10], [35.20, 46.15], [33.60, 45.30], [31.70, 45.20], [30.00, 46.00], [28.50, 46.42], [22.15, 48.10], [22.15, 52.37]],
    lowerLimit: 'GND', upperLimit: 'UNL', status: 'active',
    validFrom: '2022-02-24T00:00:00Z', source: 'ICAO / Eurocontrol',
    description: 'Complete airspace closure — Dnipro FIR. All civilian traffic prohibited since February 24, 2022.',
  },
  {
    id: 'orbb-fir-partial', name: 'ORBB Baghdad FIR – Northern Restriction', type: 'restricted',
    polygon: [[42.00, 37.50], [46.00, 37.50], [46.00, 35.00], [44.50, 33.50], [42.00, 33.50], [42.00, 37.50]],
    lowerLimit: 'GND', upperLimit: 'FL240', status: 'active',
    validFrom: '2024-01-15T00:00:00Z', source: 'FAA / ICAO',
    description: 'Restricted airspace in northern Iraq below FL240. Turkish military operations.',
  },
  {
    id: 'hlll-fir', name: 'HLLL Tripoli FIR', type: 'danger',
    polygon: [[9.40, 33.20], [12.00, 33.20], [15.00, 33.10], [20.00, 33.00], [25.00, 31.50], [25.00, 29.50], [20.00, 22.00], [15.00, 23.00], [12.00, 24.00], [9.40, 30.00], [9.40, 33.20]],
    lowerLimit: 'GND', upperLimit: 'UNL', status: 'active',
    source: 'EASA / ICAO',
    description: 'Danger area due to ongoing armed conflict, militia activity, and MANPADS proliferation.',
  },
  {
    id: 'hcsm-fir', name: 'HCSM Mogadishu FIR – Below FL260', type: 'danger',
    polygon: [[41.00, 12.00], [51.50, 12.00], [51.50, -1.60], [41.00, -1.60], [41.00, 12.00]],
    lowerLimit: 'GND', upperLimit: 'FL260', status: 'active',
    source: 'EASA / FAA',
    description: 'Danger zone below FL260 in Mogadishu FIR. Al-Shabaab anti-aircraft capability.',
  },
  {
    id: 'ostt-fir', name: 'OSTT Damascus FIR', type: 'prohibited',
    polygon: [[35.70, 37.30], [42.40, 37.10], [42.00, 32.30], [39.20, 32.30], [35.80, 33.00], [35.70, 37.30]],
    lowerLimit: 'GND', upperLimit: 'UNL', status: 'active',
    validFrom: '2013-07-01T00:00:00Z', source: 'ICAO / Eurocontrol',
    description: 'Complete closure of Damascus FIR. Military conflict, air defense systems active.',
  },
  {
    id: 'oysc-fir', name: 'OYSC Sanaa FIR', type: 'prohibited',
    polygon: [[42.50, 19.00], [53.50, 16.50], [53.50, 12.00], [43.00, 12.00], [42.50, 15.00], [42.50, 19.00]],
    lowerLimit: 'GND', upperLimit: 'UNL', status: 'active',
    source: 'FAA / EASA',
    description: 'Sanaa FIR closed to civilian traffic. Houthi anti-ship missiles and drones transiting airspace.',
  },
  {
    id: 'oiix-east-tfr', name: 'OIIX Tehran FIR – Eastern TFR', type: 'restricted',
    polygon: [[59.00, 39.00], [63.00, 39.00], [63.00, 25.50], [59.00, 25.50], [59.00, 39.00]],
    lowerLimit: 'GND', upperLimit: 'FL300', status: 'active',
    source: 'FAA NOTAM',
    description: 'US FAA prohibition on US civil aviation in eastern Tehran FIR.',
  },
  {
    id: 'zkkp-fir', name: 'ZKKP Pyongyang FIR', type: 'prohibited',
    polygon: [[124.00, 43.00], [131.00, 43.00], [131.00, 37.70], [124.00, 37.70], [124.00, 43.00]],
    lowerLimit: 'GND', upperLimit: 'UNL', status: 'active',
    source: 'ICAO',
    description: 'Pyongyang FIR effectively closed to international traffic. Ballistic missile launches with minimal NOTAM warning.',
  },
  {
    id: 'us-dc-frz', name: 'Washington DC FRZ (P-56)', type: 'prohibited',
    polygon: [[-77.085, 38.935], [-77.035, 38.935], [-76.985, 38.910], [-76.965, 38.875], [-76.975, 38.845], [-77.015, 38.835], [-77.065, 38.845], [-77.090, 38.875], [-77.095, 38.910], [-77.085, 38.935]],
    lowerLimit: 'GND', upperLimit: 'FL180', status: 'active',
    source: 'FAA',
    description: 'Permanent Flight Restricted Zone around the White House and Capitol. Shoot-down authority in effect.',
  },
  {
    id: 'hecc-sinai', name: 'HECC Cairo FIR – Sinai Restriction', type: 'restricted',
    polygon: [[32.30, 31.30], [34.90, 31.50], [34.90, 27.80], [32.30, 27.80], [32.30, 31.30]],
    lowerLimit: 'GND', upperLimit: 'FL260', status: 'active',
    source: 'EASA / ICAO',
    description: 'Restricted airspace over Sinai Peninsula below FL260. Egyptian counter-insurgency operations.',
  },
  {
    id: 'oakx-fir', name: 'OAKX Kabul FIR', type: 'danger',
    polygon: [[60.50, 38.50], [75.00, 38.50], [75.00, 29.30], [60.50, 29.30], [60.50, 38.50]],
    lowerLimit: 'GND', upperLimit: 'FL320', status: 'active',
    source: 'FAA / EASA',
    description: 'Kabul FIR danger zone below FL320. Taliban-controlled ATC with limited capability.',
  },
  {
    id: 'gabs-fir', name: 'GABS Bamako FIR – Northern Sector', type: 'danger',
    polygon: [[-12.00, 25.00], [4.30, 25.00], [4.30, 15.00], [-12.00, 15.00], [-12.00, 25.00]],
    lowerLimit: 'GND', upperLimit: 'FL250', status: 'active',
    source: 'EASA / French MoD',
    description: 'Northern Mali danger zone. Jihadist insurgency, military operations by Malian forces.',
  },
];
