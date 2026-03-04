import { InfrastructureItem } from '@/types/globe';

export const INFRASTRUCTURE: InfrastructureItem[] = [
  // ===== AIRPORTS =====
  { id: 'apt-atl', name: 'Hartsfield-Jackson Atlanta', type: 'airport', category: 'transport', latitude: 33.6407, longitude: -84.4277, country: 'United States', description: "World's busiest airport by passenger traffic." },
  { id: 'apt-dxb', name: 'Dubai International', type: 'airport', category: 'transport', latitude: 25.2532, longitude: 55.3657, country: 'UAE', description: 'Major international hub connecting East and West.' },
  { id: 'apt-lhr', name: 'London Heathrow', type: 'airport', category: 'transport', latitude: 51.4700, longitude: -0.4543, country: 'United Kingdom', description: "Europe's busiest airport." },
  { id: 'apt-hnd', name: 'Tokyo Haneda', type: 'airport', category: 'transport', latitude: 35.5494, longitude: 139.7798, country: 'Japan', description: "Tokyo's primary domestic and international hub." },
  { id: 'apt-cdg', name: 'Paris Charles de Gaulle', type: 'airport', category: 'transport', latitude: 49.0097, longitude: 2.5479, country: 'France', description: "France's largest international airport." },
  { id: 'apt-ord', name: "Chicago O'Hare", type: 'airport', category: 'transport', latitude: 41.9742, longitude: -87.9073, country: 'United States', description: 'Major U.S. hub and one of the busiest worldwide.' },
  { id: 'apt-pek', name: 'Beijing Capital', type: 'airport', category: 'transport', latitude: 40.0799, longitude: 116.6031, country: 'China', description: "China's second busiest airport." },
  { id: 'apt-sin', name: 'Singapore Changi', type: 'airport', category: 'transport', latitude: 1.3644, longitude: 103.9915, country: 'Singapore', description: 'Award-winning Southeast Asian hub.' },
  { id: 'apt-ist', name: 'Istanbul Airport', type: 'airport', category: 'transport', latitude: 41.2753, longitude: 28.7519, country: 'Turkey', description: "Turkey's largest airport and major transit hub." },
  { id: 'apt-icn', name: 'Incheon International', type: 'airport', category: 'transport', latitude: 37.4602, longitude: 126.4407, country: 'South Korea', description: "South Korea's primary international airport." },
  { id: 'apt-fra', name: 'Frankfurt Airport', type: 'airport', category: 'transport', latitude: 50.0379, longitude: 8.5622, country: 'Germany', description: "Germany's busiest airport and Lufthansa hub." },
  { id: 'apt-syd', name: 'Sydney Kingsford Smith', type: 'airport', category: 'transport', latitude: -33.9461, longitude: 151.1772, country: 'Australia', description: "Australia's busiest airport." },
  { id: 'apt-gru', name: 'São Paulo Guarulhos', type: 'airport', category: 'transport', latitude: -23.4356, longitude: -46.4731, country: 'Brazil', description: "South America's busiest airport." },
  { id: 'apt-jnb', name: 'O.R. Tambo International', type: 'airport', category: 'transport', latitude: -26.1392, longitude: 28.2460, country: 'South Africa', description: "Africa's busiest airport." },

  // ===== PORTS =====
  { id: 'port-sha', name: 'Port of Shanghai', type: 'port', category: 'transport', latitude: 31.3604, longitude: 121.6247, country: 'China', description: "World's busiest container port by TEU volume." },
  { id: 'port-sin', name: 'Port of Singapore', type: 'port', category: 'transport', latitude: 1.2644, longitude: 103.8210, country: 'Singapore', description: 'Major transshipment hub in Southeast Asia.' },
  { id: 'port-rot', name: 'Port of Rotterdam', type: 'port', category: 'transport', latitude: 51.9036, longitude: 4.4993, country: 'Netherlands', description: "Europe's largest seaport." },
  { id: 'port-la', name: 'Port of Los Angeles', type: 'port', category: 'transport', latitude: 33.7395, longitude: -118.2613, country: 'United States', description: "Western Hemisphere's busiest container port." },
  { id: 'port-hk', name: 'Port of Hong Kong', type: 'port', category: 'transport', latitude: 22.3050, longitude: 114.1689, country: 'China', description: 'Major container port in southern China.' },
  { id: 'port-ham', name: 'Port of Hamburg', type: 'port', category: 'transport', latitude: 53.5364, longitude: 9.9685, country: 'Germany', description: "Germany's largest port and third-largest in Europe." },
  { id: 'port-bus', name: 'Port of Busan', type: 'port', category: 'transport', latitude: 35.0966, longitude: 129.0412, country: 'South Korea', description: "South Korea's largest port." },
  { id: 'port-ant', name: 'Port of Antwerp', type: 'port', category: 'transport', latitude: 51.2930, longitude: 4.3006, country: 'Belgium', description: "Europe's second-largest seaport." },
  { id: 'port-jeb', name: 'Jebel Ali Port', type: 'port', category: 'transport', latitude: 25.0075, longitude: 55.0607, country: 'UAE', description: "World's largest man-made port." },
  { id: 'port-san', name: 'Port of Santos', type: 'port', category: 'transport', latitude: -23.9535, longitude: -46.3126, country: 'Brazil', description: "Latin America's largest port." },

  // ===== ENERGY: NUCLEAR =====
  { id: 'nuc-bruce', name: 'Bruce Nuclear Station', type: 'nuclear', category: 'energy', latitude: 44.3254, longitude: -81.5972, country: 'Canada', description: "World's largest operating nuclear power plant by capacity (6.4 GW)." },
  { id: 'nuc-kashiwazaki', name: 'Kashiwazaki-Kariwa', type: 'nuclear', category: 'energy', latitude: 37.4289, longitude: 138.5965, country: 'Japan', description: "World's largest nuclear plant by net capacity (7.97 GW), currently shut down." },
  { id: 'nuc-zaporizhzhia', name: 'Zaporizhzhia Nuclear', type: 'nuclear', category: 'energy', latitude: 47.5076, longitude: 34.5852, country: 'Ukraine', description: "Europe's largest nuclear power plant. Under Russian military control since 2022." },
  { id: 'nuc-gravelines', name: 'Gravelines Nuclear', type: 'nuclear', category: 'energy', latitude: 51.0145, longitude: 2.1074, country: 'France', description: "Western Europe's largest nuclear plant (5.5 GW)." },
  { id: 'nuc-palo', name: 'Palo Verde Nuclear', type: 'nuclear', category: 'energy', latitude: 33.3886, longitude: -112.8615, country: 'United States', description: "Largest nuclear plant in the United States (3.9 GW)." },
  { id: 'nuc-hanul', name: 'Hanul Nuclear', type: 'nuclear', category: 'energy', latitude: 37.0929, longitude: 129.3830, country: 'South Korea', description: 'Major South Korean nuclear complex (5.9 GW).' },
  { id: 'nuc-hinkley', name: 'Hinkley Point C', type: 'nuclear', category: 'energy', latitude: 51.2080, longitude: -3.1310, country: 'United Kingdom', description: 'Under construction, first new UK nuclear plant in decades.' },
  { id: 'nuc-barakah', name: 'Barakah Nuclear', type: 'nuclear', category: 'energy', latitude: 23.9681, longitude: 52.2571, country: 'UAE', description: 'First nuclear power plant in the Arab world (5.6 GW).' },

  // ===== ENERGY: HYDRO =====
  { id: 'hydro-tgd', name: 'Three Gorges Dam', type: 'hydro', category: 'energy', latitude: 30.8231, longitude: 111.0034, country: 'China', description: "World's largest hydroelectric dam (22.5 GW)." },
  { id: 'hydro-itaipu', name: 'Itaipu Dam', type: 'hydro', category: 'energy', latitude: -25.4084, longitude: -54.5894, country: 'Brazil/Paraguay', description: 'Second-largest hydroelectric dam globally (14 GW).' },
  { id: 'hydro-guri', name: 'Guri Dam', type: 'hydro', category: 'energy', latitude: 7.7597, longitude: -63.0023, country: 'Venezuela', description: "One of the world's largest dams (10.2 GW)." },
  { id: 'hydro-tucurui', name: 'Tucuruí Dam', type: 'hydro', category: 'energy', latitude: -3.8317, longitude: -49.6461, country: 'Brazil', description: 'Major Amazon basin hydroelectric dam (8.4 GW).' },
  { id: 'hydro-grand-coulee', name: 'Grand Coulee Dam', type: 'hydro', category: 'energy', latitude: 47.9558, longitude: -118.9817, country: 'United States', description: 'Largest hydroelectric dam in the U.S. (6.8 GW).' },
  { id: 'hydro-aswan', name: 'Aswan High Dam', type: 'hydro', category: 'energy', latitude: 23.9708, longitude: 32.8781, country: 'Egypt', description: 'Controls the Nile flood and generates 2.1 GW.' },

  // ===== ENERGY: WIND FARMS =====
  { id: 'wind-gansu', name: 'Gansu Wind Farm', type: 'wind_farm', category: 'energy', latitude: 40.3106, longitude: 96.6332, country: 'China', description: "World's largest wind farm complex (planned 20 GW)." },
  { id: 'wind-hornsea', name: 'Hornsea Wind Farm', type: 'wind_farm', category: 'energy', latitude: 53.8850, longitude: 1.7800, country: 'United Kingdom', description: "World's largest offshore wind farm (2.9 GW combined)." },
  { id: 'wind-alta', name: 'Alta Wind Energy Center', type: 'wind_farm', category: 'energy', latitude: 35.0637, longitude: -118.3655, country: 'United States', description: 'Largest onshore wind farm in the U.S. (1.5 GW).' },
  { id: 'wind-jaisalmer', name: 'Jaisalmer Wind Park', type: 'wind_farm', category: 'energy', latitude: 26.9157, longitude: 70.9083, country: 'India', description: "India's largest wind farm (1.6 GW)." },
  { id: 'wind-dogger', name: 'Dogger Bank Wind Farm', type: 'wind_farm', category: 'energy', latitude: 54.7500, longitude: 2.0000, country: 'United Kingdom', description: 'Under construction, will be 3.6 GW when complete.' },

  // ===== ENERGY: SOLAR FARMS =====
  { id: 'solar-bhadla', name: 'Bhadla Solar Park', type: 'solar_farm', category: 'energy', latitude: 27.5297, longitude: 71.9125, country: 'India', description: "World's largest solar park (2.25 GW)." },
  { id: 'solar-tengger', name: 'Tengger Desert Solar', type: 'solar_farm', category: 'energy', latitude: 37.4370, longitude: 104.8074, country: 'China', description: 'Massive solar installation in the Tengger Desert (1.5 GW).' },
  { id: 'solar-noor', name: 'Noor-Ouarzazate', type: 'solar_farm', category: 'energy', latitude: 31.0370, longitude: -6.8610, country: 'Morocco', description: "World's largest concentrated solar power plant." },
  { id: 'solar-topaz', name: 'Topaz Solar Farm', type: 'solar_farm', category: 'energy', latitude: 35.0380, longitude: -119.9590, country: 'United States', description: 'Major U.S. photovoltaic power station (580 MW).' },
  { id: 'solar-benban', name: 'Benban Solar Park', type: 'solar_farm', category: 'energy', latitude: 24.4550, longitude: 32.7420, country: 'Egypt', description: "Africa's largest solar park (1.65 GW)." },

  // ===== TELECOM: BROADCAST/RADIO/CELL =====
  { id: 'twr-tokyo', name: 'Tokyo Skytree', type: 'broadcast_tower', category: 'telecom', latitude: 35.7101, longitude: 139.8107, country: 'Japan', description: "World's tallest tower (634m), primary broadcast tower for Tokyo." },
  { id: 'twr-cn', name: 'CN Tower', type: 'broadcast_tower', category: 'telecom', latitude: 43.6426, longitude: -79.3871, country: 'Canada', description: 'Iconic Toronto communications and observation tower (553m).' },
  { id: 'twr-shanghai', name: 'Oriental Pearl Tower', type: 'broadcast_tower', category: 'telecom', latitude: 31.2397, longitude: 121.4998, country: 'China', description: 'Major broadcast tower in Shanghai (468m).' },
  { id: 'twr-berlin', name: 'Berliner Fernsehturm', type: 'broadcast_tower', category: 'telecom', latitude: 52.5208, longitude: 13.4094, country: 'Germany', description: "Berlin's iconic TV tower (368m)." },
  { id: 'twr-ostankino', name: 'Ostankino Tower', type: 'broadcast_tower', category: 'telecom', latitude: 55.8197, longitude: 37.6117, country: 'Russia', description: 'Tallest free-standing structure in Europe (540m).' },
  { id: 'twr-kl', name: 'KL Tower', type: 'broadcast_tower', category: 'telecom', latitude: 3.1529, longitude: 101.7007, country: 'Malaysia', description: 'Kuala Lumpur telecommunications tower (421m).' },
  { id: 'twr-cairo', name: 'Cairo Tower', type: 'broadcast_tower', category: 'telecom', latitude: 30.0459, longitude: 31.2243, country: 'Egypt', description: "Cairo's primary broadcast tower (187m)." },
  { id: 'twr-sutro', name: 'Sutro Tower', type: 'radio_tower', category: 'telecom', latitude: 37.7552, longitude: -122.4528, country: 'United States', description: 'Major San Francisco broadcast antenna tower (298m).' },
  { id: 'twr-kvly', name: 'KVLY-TV Mast', type: 'radio_tower', category: 'telecom', latitude: 47.3442, longitude: -97.2886, country: 'United States', description: 'One of the tallest structures in the Western Hemisphere (629m).' },
  { id: 'twr-lualualei', name: 'Lualualei VLF Station', type: 'radio_tower', category: 'telecom', latitude: 21.4217, longitude: -158.1508, country: 'United States', description: 'U.S. Navy VLF transmitter for submarine communications.' },
];
