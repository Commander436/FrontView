import { ConflictZone } from "@/types/globe";

export const CONFLICT_ZONES: ConflictZone[] = [
  {
    name: "Russia–Ukraine War",
    region: "Eastern Europe",
    countries: ["Ukraine", "Russia"],
    latitude: 48.38,
    longitude: 37.80,
    radius: 300000,
    severity: "high",
    summary: "Full-scale invasion launched Feb 2022. Major combat across eastern and southern Ukraine with global geopolitical repercussions.",
    recentDevelopments: "Ongoing frontline fighting in Donetsk and Zaporizhzhia oblasts. Drone and missile strikes on civilian infrastructure continue."
  },
  {
    name: "Gaza–Israel Conflict",
    region: "Middle East",
    countries: ["Israel", "Palestine"],
    latitude: 31.35,
    longitude: 34.31,
    radius: 30000,
    severity: "high",
    summary: "Escalated conflict following October 2023 attack. Devastating humanitarian crisis in Gaza Strip.",
    recentDevelopments: "Ceasefire negotiations ongoing. Massive displacement and infrastructure destruction in Gaza."
  },
  {
    name: "Sahel Insurgency",
    region: "West Africa",
    countries: ["Mali", "Burkina Faso", "Niger", "Chad"],
    latitude: 14.50,
    longitude: 1.00,
    radius: 500000,
    severity: "medium",
    summary: "Jihadist insurgency and inter-communal violence across the Sahel belt. Military coups have destabilized governance.",
    recentDevelopments: "Junta-led governments in Mali, Burkina Faso, and Niger have expelled French and UN forces."
  },
  {
    name: "Eastern DRC Crisis",
    region: "Central Africa",
    countries: ["DR Congo", "Rwanda"],
    latitude: -1.66,
    longitude: 29.22,
    radius: 200000,
    severity: "high",
    summary: "M23 rebel group and dozens of armed militias fighting in North and South Kivu provinces.",
    recentDevelopments: "M23 captured Goma in early 2025. Regional tensions with Rwanda escalating."
  },
  {
    name: "Myanmar Civil War",
    region: "Southeast Asia",
    countries: ["Myanmar"],
    latitude: 19.76,
    longitude: 96.08,
    radius: 300000,
    severity: "high",
    summary: "Nationwide civil war following February 2021 military coup. Ethnic armed organizations and resistance forces fighting junta.",
    recentDevelopments: "Resistance forces have captured significant territory in Shan and Rakhine states."
  },
  {
    name: "Sudan Civil War",
    region: "East Africa",
    countries: ["Sudan"],
    latitude: 15.50,
    longitude: 32.56,
    radius: 400000,
    severity: "high",
    summary: "War between the Sudanese Armed Forces (SAF) and Rapid Support Forces (RSF) since April 2023.",
    recentDevelopments: "Massive displacement crisis. RSF controls much of Darfur and Khartoum. Famine declared in multiple regions."
  },
  {
    name: "Yemen Civil War",
    region: "Middle East",
    countries: ["Yemen", "Saudi Arabia"],
    latitude: 15.37,
    longitude: 44.19,
    radius: 250000,
    severity: "medium",
    summary: "Protracted civil war between Houthi forces and internationally recognized government. Humanitarian catastrophe.",
    recentDevelopments: "Houthi attacks on Red Sea shipping have disrupted global trade routes."
  },
  {
    name: "Somalia – Al-Shabaab",
    region: "East Africa",
    countries: ["Somalia"],
    latitude: 2.05,
    longitude: 45.32,
    radius: 300000,
    severity: "medium",
    summary: "Al-Shabaab insurgency continues to destabilize southern and central Somalia despite government offensives.",
    recentDevelopments: "Government forces continue offensive operations with African Union support."
  },
  {
    name: "Ethiopian Internal Conflicts",
    region: "East Africa",
    countries: ["Ethiopia"],
    latitude: 9.15,
    longitude: 40.49,
    radius: 250000,
    severity: "medium",
    summary: "Post-Tigray War instability with ongoing conflicts in Amhara and Oromia regions.",
    recentDevelopments: "Amhara Fano militia clashes with federal forces continue despite Tigray ceasefire."
  },
  {
    name: "Syria Aftermath",
    region: "Middle East",
    countries: ["Syria", "Turkey", "Israel"],
    latitude: 35.20,
    longitude: 38.99,
    radius: 200000,
    severity: "medium",
    summary: "Post-Assad power transition. Turkish operations in the north and Israeli strikes in the south.",
    recentDevelopments: "New transitional government forming. Multiple armed factions contesting territory."
  },
  {
    name: "Haiti Gang Violence",
    region: "Caribbean",
    countries: ["Haiti"],
    latitude: 18.97,
    longitude: -72.29,
    radius: 50000,
    severity: "medium",
    summary: "Armed gang coalitions have seized control of much of Port-au-Prince. Complete breakdown of state authority.",
    recentDevelopments: "Multinational security mission deployed but struggling to restore order."
  },
  {
    name: "Mozambique – Cabo Delgado",
    region: "Southern Africa",
    countries: ["Mozambique"],
    latitude: -12.35,
    longitude: 40.35,
    radius: 150000,
    severity: "medium",
    summary: "ISIS-affiliated insurgency in northern Cabo Delgado province disrupting major gas projects.",
    recentDevelopments: "Rwandan and SADC forces supporting counter-insurgency. Attacks have decreased but continue."
  },
  {
    name: "Colombia Armed Groups",
    region: "South America",
    countries: ["Colombia"],
    latitude: 4.57,
    longitude: -74.30,
    radius: 300000,
    severity: "low",
    summary: "Ongoing armed conflict involving ELN, FARC dissidents, and narco-trafficking groups despite peace process.",
    recentDevelopments: "Peace talks with ELN stalled. Violence continues in border regions with Venezuela."
  },
  {
    name: "Kashmir Tensions",
    region: "South Asia",
    countries: ["India", "Pakistan"],
    latitude: 34.08,
    longitude: 74.80,
    radius: 100000,
    severity: "low",
    summary: "Disputed territory between India and Pakistan with intermittent militant activity and military standoffs.",
    recentDevelopments: "Periodic cross-border skirmishes and militant attacks continue."
  },
  {
    name: "South China Sea Disputes",
    region: "East Asia",
    countries: ["China", "Philippines", "Vietnam", "Taiwan"],
    latitude: 15.00,
    longitude: 115.00,
    radius: 500000,
    severity: "low",
    summary: "Maritime territorial disputes with Chinese military buildup on artificial islands. Frequent naval confrontations.",
    recentDevelopments: "Philippines-China standoffs at Second Thomas Shoal. Increased military patrols by all parties."
  },
];
