import { ConflictZone } from "@/types/globe";

export const CONFLICT_ZONES: ConflictZone[] = [
  { name: "Eastern Ukraine", region: "Europe", latitude: 48.3794, longitude: 37.8022, radius: 200000, severity: "high", summary: "Ongoing conflict since 2022. Major military operations across eastern and southern regions." },
  { name: "Gaza Strip", region: "Middle East", latitude: 31.3547, longitude: 34.3088, radius: 30000, severity: "high", summary: "Ongoing Israeli-Palestinian conflict. Major humanitarian crisis." },
  { name: "Sahel Region", region: "West Africa", latitude: 14.4974, longitude: 1.0000, radius: 500000, severity: "medium", summary: "Insurgency and instability across Mali, Burkina Faso, and Niger." },
  { name: "Eastern DRC", region: "Central Africa", latitude: -1.6596, longitude: 29.2220, radius: 200000, severity: "high", summary: "Armed groups and M23 insurgency in North Kivu province." },
  { name: "Myanmar Civil War", region: "Southeast Asia", latitude: 19.7633, longitude: 96.0785, radius: 300000, severity: "high", summary: "Nationwide civil conflict following 2021 military coup." },
  { name: "Sudan Conflict", region: "East Africa", latitude: 15.5007, longitude: 32.5599, radius: 400000, severity: "high", summary: "Civil war between Sudanese Armed Forces and RSF since April 2023." },
  { name: "Yemen", region: "Middle East", latitude: 15.3694, longitude: 44.1910, radius: 250000, severity: "medium", summary: "Ongoing civil war and Houthi insurgency. Maritime disruptions." },
];
