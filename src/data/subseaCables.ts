export interface SubseaCable {
  id: string;
  name: string;
  landingPoints: string[];
  lengthKm: number;
  coordinates: [number, number][]; // [lon, lat]
  status: 'normal' | 'degraded' | 'fault' | 'unknown';
  description: string;
}

export const SUBSEA_CABLES: SubseaCable[] = [
  {
    id: 'sc-tat14', name: 'TAT-14', landingPoints: ['Tuckerton NJ USA', 'Blaabjerg Denmark', 'Norden Germany', 'Saint-Valery-en-Caux France'],
    lengthKm: 15428,
    coordinates: [[-74.34, 39.60], [-65.0, 42.0], [-50.0, 47.0], [-30.0, 50.0], [-15.0, 52.0], [-5.0, 52.5], [0.8, 51.0], [1.7, 56.8], [7.1, 53.6]],
    status: 'normal', description: 'Transatlantic cable connecting US to Europe via Denmark, Germany, France, Netherlands, UK.',
  },
  {
    id: 'sc-apcn2', name: 'APCN-2', landingPoints: ['Chongming China', 'Shima Japan', 'Pusan South Korea', 'Tanshui Taiwan', 'Lantau Hong Kong'],
    lengthKm: 19000,
    coordinates: [[121.7, 31.6], [124.0, 33.0], [126.5, 34.5], [129.0, 35.1], [131.0, 34.5], [136.8, 34.3], [121.5, 25.0], [114.1, 22.3]],
    status: 'normal', description: 'Asia Pacific Cable Network 2 connecting China, Japan, South Korea, Taiwan, Hong Kong.',
  },
  {
    id: 'sc-seamewe5', name: 'SEA-ME-WE 5', landingPoints: ['Marseille France', 'Jeddah Saudi Arabia', 'Mumbai India', 'Singapore', 'Jakarta Indonesia'],
    lengthKm: 20000,
    coordinates: [[5.37, 43.30], [11.0, 37.0], [18.5, 34.0], [25.0, 34.5], [30.0, 33.0], [32.5, 31.2], [34.5, 29.0], [39.0, 21.5], [44.0, 12.5], [51.0, 10.0], [57.0, 16.0], [65.0, 19.0], [72.8, 18.9], [80.0, 13.0], [85.0, 8.0], [95.0, 5.0], [100.0, 3.0], [103.8, 1.3], [106.8, -6.2]],
    status: 'normal', description: 'Major submarine cable from France to Singapore via Egypt, Saudi Arabia, and India.',
  },
  {
    id: 'sc-ace', name: 'Africa Coast to Europe (ACE)', landingPoints: ['Peniche Portugal', 'Dakar Senegal', 'Accra Ghana', 'Lagos Nigeria', 'Luanda Angola', 'Cape Town South Africa'],
    lengthKm: 17000,
    coordinates: [[-9.37, 39.36], [-10.0, 35.0], [-14.0, 28.0], [-17.4, 14.7], [-17.0, 9.0], [-14.0, 5.0], [-4.0, 5.5], [0.0, 5.5], [3.4, 6.4], [5.0, 4.0], [8.0, 1.0], [10.0, -3.0], [12.0, -6.0], [13.2, -8.8], [12.0, -15.0], [13.0, -23.0], [15.0, -28.0], [18.4, -33.9]],
    status: 'normal', description: 'Submarine cable connecting Europe to 24 countries along the West African coast.',
  },
  {
    id: 'sc-sac', name: 'South Atlantic Cable System (SACS)', landingPoints: ['Sangano Angola', 'Fortaleza Brazil'],
    lengthKm: 6165,
    coordinates: [[13.2, -9.3], [5.0, -10.0], [-5.0, -8.0], [-15.0, -6.0], [-25.0, -5.0], [-35.0, -4.0], [-38.5, -3.7]],
    status: 'normal', description: 'First submarine cable directly connecting Africa and South America across the South Atlantic.',
  },
  {
    id: 'sc-peace', name: 'PEACE Cable', landingPoints: ['Marseille France', 'Cairo Egypt', 'Karachi Pakistan', 'Singapore'],
    lengthKm: 15000,
    coordinates: [[5.37, 43.30], [10.0, 37.0], [18.0, 34.5], [25.0, 34.5], [30.0, 31.2], [33.0, 28.0], [39.0, 21.0], [50.0, 12.5], [58.0, 17.0], [67.0, 24.9], [73.0, 20.0], [80.0, 12.0], [90.0, 7.0], [98.0, 3.0], [103.8, 1.3]],
    status: 'normal', description: 'Pakistan and East Africa Connecting Europe cable. Chinese-funded, strategically significant.',
  },
  {
    id: 'sc-marea', name: 'MAREA', landingPoints: ['Virginia Beach VA USA', 'Bilbao Spain'],
    lengthKm: 6600,
    coordinates: [[-75.97, 36.85], [-65.0, 40.0], [-50.0, 42.0], [-35.0, 43.0], [-20.0, 43.5], [-10.0, 43.5], [-3.0, 43.4]],
    status: 'normal', description: 'Microsoft-Facebook owned transatlantic cable. One of highest-capacity submarine cables globally.',
  },
  {
    id: 'sc-aae1', name: 'AAE-1', landingPoints: ['Marseille France', 'Alexandria Egypt', 'Mumbai India', 'Hong Kong', 'Singapore'],
    lengthKm: 25000,
    coordinates: [[5.37, 43.30], [15.0, 37.0], [25.0, 35.0], [29.9, 31.2], [34.0, 28.0], [38.0, 21.0], [43.0, 12.5], [48.0, 10.0], [57.0, 16.5], [65.0, 21.0], [72.8, 18.9], [80.0, 10.0], [92.0, 6.0], [100.0, 2.0], [103.8, 1.3], [110.0, 5.0], [114.1, 22.3]],
    status: 'normal', description: 'Asia Africa Europe-1. One of the longest submarine cables connecting SE Asia to Europe.',
  },
  {
    id: 'sc-dunant', name: 'Dunant', landingPoints: ['Virginia Beach VA USA', 'Saint-Hilaire-de-Riez France'],
    lengthKm: 6600,
    coordinates: [[-75.97, 36.85], [-65.0, 39.0], [-50.0, 42.0], [-35.0, 44.0], [-20.0, 45.5], [-10.0, 46.0], [-1.8, 46.7]],
    status: 'normal', description: 'Google-owned transatlantic cable named after Henry Dunant, founder of the Red Cross.',
  },
  {
    id: 'sc-2africa', name: '2Africa', landingPoints: ['Multiple landing points across Africa, Europe, Middle East'],
    lengthKm: 45000,
    coordinates: [[-9.0, 38.7], [-10.0, 33.0], [-14.0, 28.0], [-17.0, 14.7], [-17.0, 9.0], [-4.0, 5.5], [3.4, 6.4], [8.8, 4.0], [13.2, -8.8], [15.0, -18.0], [18.4, -33.9], [28.0, -33.0], [35.5, -27.0], [40.5, -15.0], [43.3, -11.7], [44.3, -12.3], [46.0, -1.0], [49.0, 7.0], [51.5, 12.0], [39.0, 21.5], [34.5, 28.0], [30.0, 31.2], [25.0, 35.0], [15.0, 38.0], [5.37, 43.30]],
    status: 'normal', description: 'Meta-led mega cable circumnavigating Africa. One of the longest submarine cables ever deployed.',
  },
  {
    id: 'sc-tgn-pacific', name: 'TGN-Pacific', landingPoints: ['Nedonna Beach OR USA', 'Toyohashi Japan'],
    lengthKm: 9620,
    coordinates: [[-123.9, 45.5], [-135.0, 45.0], [-155.0, 40.0], [-170.0, 38.0], [175.0, 36.0], [160.0, 35.0], [145.0, 34.0], [137.3, 34.7]],
    status: 'normal', description: 'Telia Carrier transpacific cable connecting the US West Coast to Japan.',
  },
  {
    id: 'sc-sapcy', name: 'Southern Cross NEXT', landingPoints: ['Sydney Australia', 'Auckland New Zealand', 'Los Angeles USA'],
    lengthKm: 15840,
    coordinates: [[151.2, -33.9], [165.0, -35.0], [175.0, -37.5], [-175.0, -35.0], [-160.0, -30.0], [-145.0, -25.0], [-130.0, -20.0], [-118.2, 33.7]],
    status: 'normal', description: 'Trans-Pacific cable connecting Australia and New Zealand to the US West Coast.',
  },
  {
    id: 'sc-redse', name: 'EIG (Europe India Gateway)', landingPoints: ['London UK', 'Marseille France', 'Alexandria Egypt', 'Mumbai India'],
    lengthKm: 15000,
    coordinates: [[-0.1, 51.0], [1.0, 50.5], [5.37, 43.30], [10.0, 37.0], [20.0, 35.0], [29.9, 31.2], [34.0, 28.0], [38.0, 21.0], [43.0, 12.5], [51.0, 10.0], [58.0, 17.0], [67.0, 23.0], [72.8, 18.9]],
    status: 'normal', description: 'Major cable connecting UK/France to India via the Mediterranean, Red Sea, and Arabian Sea.',
  },
];
