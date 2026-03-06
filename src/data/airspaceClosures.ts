import { AirspaceClosure } from '@/types/globe';

export const AIRSPACE_CLOSURES: AirspaceClosure[] = [
  {
    id: 'r-2508',
    name: 'R-2508 Edwards Complex',
    type: 'restricted',
    polygon: [[-118.5,35.0],[-117.5,35.0],[-117.5,36.0],[-118.0,36.5],[-118.5,36.0]],
    lowerLimit: 'SFC',
    upperLimit: 'FL600',
    status: 'active',
    validFrom: '2026-01-01T00:00:00Z',
    validTo: '2026-12-31T23:59:59Z',
    source: 'FAA NOTAM',
    description: 'Edwards Air Force Base restricted airspace complex in the Mojave Desert, California. Used extensively for military flight testing, weapons systems evaluation, and experimental aircraft operations. One of the largest restricted airspace blocks in the United States, encompassing multiple test ranges and the historic Edwards AFB where countless aviation milestones have been achieved.'
  },
  {
    id: 'r-4009',
    name: 'R-4009 Nellis Range',
    type: 'restricted',
    polygon: [[-116.5,36.5],[-115.0,36.5],[-115.0,37.5],[-115.5,38.0],[-116.5,37.5]],
    lowerLimit: 'SFC',
    upperLimit: 'UNL',
    status: 'active',
    validFrom: '2026-01-01T00:00:00Z',
    validTo: '2026-12-31T23:59:59Z',
    source: 'FAA NOTAM',
    description: 'Nellis Air Force Range restricted airspace in Nevada. Home to the USAF Weapons School and Red Flag exercises, this massive complex hosts the most advanced aerial combat training in the world. The range covers over 12,000 square miles and includes the Nevada Test and Training Range.'
  },
  {
    id: 'p-56a',
    name: 'P-56A Washington DC',
    type: 'prohibited',
    polygon: [[-77.06,38.88],[-77.01,38.88],[-77.01,38.92],[-77.03,38.93],[-77.06,38.92]],
    lowerLimit: 'SFC',
    upperLimit: 'FL180',
    status: 'active',
    source: 'FAA AIP',
    description: 'Prohibited airspace over the White House, National Mall, and Capitol complex in Washington, D.C. Permanently active with no exceptions for civilian traffic. Enforced by NORAD with fighter intercept capability. One of the most heavily defended airspaces in the world.'
  },
  {
    id: 'd-202',
    name: 'D-202 North Sea Danger',
    type: 'danger',
    polygon: [[2.0,54.0],[3.5,54.0],[3.5,55.0],[2.5,55.5],[2.0,55.0]],
    lowerLimit: 'SFC',
    upperLimit: 'FL250',
    status: 'unknown',
    source: 'EASA AIP',
    description: 'North Sea danger area used for military exercises including live-fire naval gunnery, air-to-surface weapons training, and submarine operations. Periodically activated via NOTAM by the Royal Netherlands and Royal Air Force for joint NATO exercises.'
  },
  {
    id: 'r-ega-d323',
    name: 'D-323 Salisbury Plain',
    type: 'danger',
    polygon: [[-2.1,51.15],[-1.7,51.15],[-1.7,51.35],[-1.9,51.4],[-2.1,51.35]],
    lowerLimit: 'SFC',
    upperLimit: 'FL100',
    status: 'inactive',
    source: 'UK AIP',
    description: 'Salisbury Plain military training area danger airspace in Wiltshire, England. One of the largest military training areas in the UK, used by the British Army for live-fire exercises, armored vehicle maneuvers, and helicopter operations. Home to multiple permanent military installations.'
  },
  {
    id: 'r-moscow-uga',
    name: 'UGR-1 Moscow TMA Restricted',
    type: 'restricted',
    polygon: [[37.2,55.5],[37.9,55.5],[37.9,55.9],[37.5,56.0],[37.2,55.9]],
    lowerLimit: 'SFC',
    upperLimit: 'FL200',
    status: 'active',
    source: 'Russian AIP',
    description: 'Restricted airspace zone surrounding Moscow\'s Terminal Maneuvering Area. Permanently restricted due to government and military installations in the greater Moscow region. All flights require specific clearance from Russian Federation air traffic control.'
  },
  {
    id: 'd-china-scs',
    name: 'South China Sea ADIZ',
    type: 'restricted',
    polygon: [[112.0,10.0],[117.0,10.0],[117.0,15.0],[115.0,18.0],[112.0,15.0]],
    lowerLimit: 'SFC',
    upperLimit: 'UNL',
    status: 'active',
    source: 'PLA NOTAM',
    description: 'South China Sea Air Defense Identification Zone. A heavily contested region with overlapping territorial claims between China, Vietnam, the Philippines, Malaysia, and Taiwan. Military patrols by multiple nations operate continuously. One of the most geopolitically sensitive airspaces in the world.'
  },
  {
    id: 'r-korea-dmz',
    name: 'Korean DMZ Prohibited Zone',
    type: 'prohibited',
    polygon: [[126.0,37.8],[127.5,37.8],[127.5,38.4],[127.0,38.6],[126.0,38.4]],
    lowerLimit: 'SFC',
    upperLimit: 'UNL',
    status: 'active',
    source: 'ICAO / ROK AIP',
    description: 'Prohibited airspace along the Korean Demilitarized Zone separating North and South Korea. One of the most heavily fortified borders in the world. No civilian aircraft permitted. Military aircraft from both sides patrol continuously with strict protocols to prevent escalation.'
  },
  {
    id: 'r-middle-east-1',
    name: 'R-Iraq Western Desert',
    type: 'restricted',
    polygon: [[40.0,32.0],[43.0,32.0],[43.0,34.0],[41.5,34.5],[40.0,34.0]],
    lowerLimit: 'SFC',
    upperLimit: 'FL450',
    status: 'active',
    source: 'Iraqi CAA NOTAM',
    description: 'Western Iraq restricted airspace covering desert regions used for coalition military operations and training. Active military operations including drone surveillance, aerial refueling tracks, and combat air patrol corridors. International coalition forces maintain continuous presence.'
  },
  {
    id: 'd-norway-1',
    name: 'D-601 Halkavarre Range',
    type: 'danger',
    polygon: [[25.0,69.5],[26.5,69.5],[26.5,70.0],[25.5,70.2],[25.0,70.0]],
    lowerLimit: 'SFC',
    upperLimit: 'FL300',
    status: 'unknown',
    source: 'Norwegian AIP',
    description: 'Halkavarre shooting and bombing range in northern Norway, near the Finnish border. Used by Norwegian Armed Forces and NATO allies for arctic warfare training, live-fire exercises, and cold-weather military operations. Periodically activated for large-scale NATO exercises.'
  },
  {
    id: 'r-aus-woomera',
    name: 'R-489 Woomera Range',
    type: 'restricted',
    polygon: [[135.0,-31.0],[137.0,-31.0],[137.0,-29.0],[136.0,-28.5],[135.0,-29.0]],
    lowerLimit: 'SFC',
    upperLimit: 'UNL',
    status: 'active',
    source: 'Australian AIP',
    description: 'Woomera Prohibited Area in South Australia, one of the largest weapons testing ranges in the world at over 122,000 square kilometers. Used for missile testing, space launch operations, and joint military exercises with allied forces. Home to the RAAF Woomera Test Range.'
  },
  {
    id: 'p-camp-david',
    name: 'P-40 Camp David',
    type: 'prohibited',
    polygon: [[-77.48,39.63],[-77.44,39.63],[-77.44,39.67],[-77.46,39.68],[-77.48,39.67]],
    lowerLimit: 'SFC',
    upperLimit: 'FL180',
    status: 'active',
    source: 'FAA AIP',
    description: 'Prohibited airspace surrounding Camp David, the presidential retreat in Frederick County, Maryland. Permanently active regardless of presidential presence. Enforced by military fighter intercept and surface-to-air missile batteries.'
  },
];
