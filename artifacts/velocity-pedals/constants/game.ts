export type Weather = "clear" | "rain" | "wind";

export type TrackId = "urban" | "alpine" | "coastal" | "desert";

export type TrackTheme = "city" | "alpine" | "coastal" | "desert";

export type Track = {
  id: TrackId;
  name: string;
  subtitle: string;
  distance: number;
  weather: Weather;
  skyTop: string;
  skyBottom: string;
  road: string;
  lane: string;
  accent: string;
  theme: TrackTheme;
  image?: number;
};

export const TRACKS: Record<TrackId, Track> = {
  urban: {
    id: "urban",
    name: "City Sprint",
    subtitle: "Sunset sprint through downtown traffic",
    distance: 1500,
    weather: "clear",
    skyTop: "#ff5e7e",
    skyBottom: "#ffb15c",
    road: "#1a1f3a",
    lane: "#3a4068",
    accent: "#c6ff3a",
    theme: "city",
    image: require("../assets/images/track-urban.png"),
  },
  alpine: {
    id: "alpine",
    name: "Alpine Descent",
    subtitle: "High-speed downhill through icy peaks",
    distance: 2000,
    weather: "rain",
    skyTop: "#5e9bff",
    skyBottom: "#bcd9ff",
    road: "#2a3142",
    lane: "#4d5670",
    accent: "#7df0ff",
    theme: "alpine",
    image: require("../assets/images/track-alpine.png"),
  },
  coastal: {
    id: "coastal",
    name: "Coastal Sprint",
    subtitle: "Flat, breezy ride along the shore",
    distance: 1800,
    weather: "wind",
    skyTop: "#42d6ff",
    skyBottom: "#ffe7a8",
    road: "#7a8baa",
    lane: "#a8b8d0",
    accent: "#ff6b9d",
    theme: "coastal",
    image: require("../assets/images/track-coastal.png"),
  },
  desert: {
    id: "desert",
    name: "Desert Dunes",
    subtitle: "Sunset sprint past saguaro cacti",
    distance: 1700,
    weather: "clear",
    skyTop: "#ff6f2c",
    skyBottom: "#ffc36b",
    road: "#c89a5e",
    lane: "#a47a44",
    accent: "#ffba2d",
    theme: "desert",
  },
};

export const TRACK_ORDER: TrackId[] = ["urban", "desert", "coastal", "alpine"];

export type BikeColorId = "yellow" | "neon" | "red" | "blue";

export type BikeColor = {
  id: BikeColorId;
  name: string;
  color: string;
  cost: number;
};

export const BIKE_COLORS: Record<BikeColorId, BikeColor> = {
  yellow: { id: "yellow", name: "Default Yellow", color: "#ffd23a", cost: 0 },
  neon: { id: "neon", name: "Neon Green", color: "#c6ff3a", cost: 500 },
  red: { id: "red", name: "Hot Red", color: "#ff3b5b", cost: 1000 },
  blue: { id: "blue", name: "Midnight Blue", color: "#3a5cff", cost: 1500 },
};

export const BIKE_COLOR_ORDER: BikeColorId[] = ["yellow", "neon", "red", "blue"];

export type UpgradeKey = "tires" | "frame" | "gear";

export const UPGRADE_INFO: Record<
  UpgradeKey,
  { name: string; subtitle: string; icon: "disc" | "shield" | "settings" }
> = {
  tires: {
    name: "Tires",
    subtitle: "Better grip and faster recovery",
    icon: "disc",
  },
  frame: {
    name: "Frame",
    subtitle: "Stiffer ride, higher top speed",
    icon: "shield",
  },
  gear: {
    name: "Gearing",
    subtitle: "More efficient pedaling, draft boost",
    icon: "settings",
  },
};

export const MAX_LEVEL = 5;

export function upgradeCost(level: number): number {
  return 80 + level * 90;
}

export type Upgrades = Record<UpgradeKey, number>;

export function deriveStats(upgrades: Upgrades) {
  const baseSpeed = 26 + upgrades.tires * 1.5;
  const maxSpeed = 58 + upgrades.frame * 4 + upgrades.gear * 2;
  const sprintCost = Math.max(0.6, 1.4 - upgrades.gear * 0.12);
  const draftRecover = 1.4 + upgrades.gear * 0.18;
  const accel = 0.85 + upgrades.frame * 0.06;
  const grip = 0.55 + upgrades.tires * 0.07;
  return { baseSpeed, maxSpeed, sprintCost, draftRecover, accel, grip };
}

export const CAREER_STAGES: { trackId: TrackId; name: string; reward: number }[] = [
  { trackId: "urban", name: "Stage 1 — Downtown Crit", reward: 80 },
  { trackId: "coastal", name: "Stage 2 — Bayfront Loop", reward: 110 },
  { trackId: "alpine", name: "Stage 3 — Foothill Climb", reward: 140 },
  { trackId: "urban", name: "Stage 4 — Night Sprint", reward: 170 },
  { trackId: "coastal", name: "Stage 5 — Coast Highway", reward: 200 },
  { trackId: "alpine", name: "Stage 6 — Pass Descent", reward: 240 },
  { trackId: "urban", name: "Stage 7 — Skyline Stage", reward: 280 },
  { trackId: "coastal", name: "Stage 8 — Cape Sprint", reward: 320 },
  { trackId: "alpine", name: "Stage 9 — World Grand Tour", reward: 500 },
];
