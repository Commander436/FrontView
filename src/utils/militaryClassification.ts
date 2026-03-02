const MILITARY_CALLSIGN_PREFIXES = [
  'RCH', 'REACH', 'DUKE', 'EVAC', 'KING', 'HAWK', 'VIPER',
  'COBRA', 'STEEL', 'SWORD', 'FURY', 'VALOR', 'DEMON', 'GHOST',
  'NAVY', 'ARMY', 'FORCE', 'GUARD', 'TALON', 'EAGLE',
  'NATO', 'ALLIED', 'WEASEL', 'CHIEF', 'BLADE',
  'TANGO', 'BOXER', 'RAVEN', 'REAPER', 'SHADOW',
  'NOMAD', 'CHAOS', 'ATLAS', 'BRAVO', 'ALPHA',
  'CFC', 'CNV', 'RRR', 'IAM', 'MMF', 'PAT',
  'BAF', 'GAF', 'FAF', 'SHF', 'PLF', 'HUF',
  'ASCOT', 'RAFR', 'RFR',
];

export function classifyAircraft(
  callsign: string,
  speed: number,
  altitude: number
): { isMilitary: boolean; classification: 'confirmed' | 'probable' | 'unidentified' } {
  const cs = (callsign || '').toUpperCase().trim();

  // Confirmed: callsign matches known military pattern
  if (cs.length > 0) {
    for (const prefix of MILITARY_CALLSIGN_PREFIXES) {
      if (cs.startsWith(prefix)) {
        return { isMilitary: true, classification: 'confirmed' };
      }
    }
  }

  // Probable: very high speed (military jets typically > 300 m/s / ~600 kts)
  if (speed > 300 && altitude > 5000) {
    return { isMilitary: true, classification: 'probable' };
  }

  // Unidentified: high speed + high altitude + no callsign
  if (speed > 250 && altitude > 10000 && (!cs || cs.length <= 2)) {
    return { isMilitary: true, classification: 'unidentified' };
  }

  return { isMilitary: false, classification: 'unidentified' };
}
