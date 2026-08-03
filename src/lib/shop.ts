// Eggball shop catalog + local persistence.

/** While true every item costs $0 (testing mode). Prices shown as "normally $X". */
export const FREE_MODE = false;
export function effectivePrice(listPrice: number) {
  return FREE_MODE ? 0 : listPrice;
}

import type { FlagSpec } from "./flags";

export interface SkinItem {
  id: string;
  name: string;
  /** List price (what it costs once FREE_MODE is off) */
  price: number;
  /** Solid base colour of the ball */
  color: string;
  /** Optional flag design drawn over the ball */
  flag?: FlagSpec;
}

export interface ExplosionItem {
  id: string;
  name: string;
  price: number;
  /** Particle style */
  kind: "confetti" | "emoji" | "firework" | "shockwave" | "money" | "blast" | "blackhole";
  colors?: string[];
  emojis?: string[];
}

export const SKINS: SkinItem[] = [
  { id: "default", name: "Classic", price: 0, color: "" },
  { id: "sunset", name: "Sunset", price: 1000, color: "#ff8b3d" },
  { id: "mint", name: "Mint", price: 1000, color: "#3ddc97" },
  { id: "grape", name: "Grape", price: 1000, color: "#9b5de5" },
  { id: "gold", name: "Gold", price: 1000, color: "#ffcc33" },
  { id: "midnight", name: "Midnight", price: 1000, color: "#1b1f3b" },
  { id: "bubblegum", name: "Bubblegum", price: 1000, color: "#ff7ac6" },
  { id: "ocean", name: "Ocean", price: 1000, color: "#1e88c7" },
  { id: "lava", name: "Lava", price: 1000, color: "#d92b1c" },
  { id: "slime", name: "Slime", price: 1000, color: "#8ddc3d" },
  { id: "ice", name: "Ice", price: 1000, color: "#bfefff" },
  { id: "void", name: "Void", price: 1000, color: "#0b0b12" },
  { id: "peach", name: "Peach", price: 1000, color: "#ffb59b" },
  { id: "cyber", name: "Cyber", price: 1000, color: "#00e5ff" },
  { id: "rose", name: "Rose", price: 1000, color: "#e8436f" },
  { id: "steel", name: "Steel", price: 1000, color: "#8a97a8" },
  { id: "emerald", name: "Emerald", price: 1000, color: "#0f9d58" },
  { id: "copper", name: "Copper", price: 1000, color: "#b87333" },
  { id: "neon", name: "Neon", price: 1000, color: "#c6ff00" },
  { id: "sand", name: "Sand", price: 1000, color: "#e4c98a" },
  // ---- Country skins ----
  { id: "flag-au", name: "Australia", price: 1000, color: "#00247d", flag: { type: "canton", colors: ["#00247d", "#00247d"], accent: "#00247d", accent2: "#ffffff" } },
  { id: "flag-nz", name: "New Zealand", price: 1000, color: "#00247d", flag: { type: "canton", colors: ["#00247d", "#00247d"], accent: "#00247d", accent2: "#cc142b" } },
  { id: "flag-us", name: "United States", price: 1000, color: "#b22234", flag: { type: "canton", colors: ["#b22234", "#ffffff", "#b22234", "#ffffff", "#b22234", "#ffffff"], accent: "#3c3b6e", accent2: "#ffffff" } },
  { id: "flag-gb", name: "United Kingdom", price: 1000, color: "#00247d", flag: { type: "cross", colors: ["#00247d"], accent: "#cf142b", accent2: "#ffffff" } },
  { id: "flag-fr", name: "France", price: 1000, color: "#0055a4", flag: { type: "vbands", colors: ["#0055a4", "#ffffff", "#ef4135"] } },
  { id: "flag-it", name: "Italy", price: 1000, color: "#008c45", flag: { type: "vbands", colors: ["#008c45", "#f4f5f0", "#cd212a"] } },
  { id: "flag-ie", name: "Ireland", price: 1000, color: "#169b62", flag: { type: "vbands", colors: ["#169b62", "#ffffff", "#ff883e"] } },
  { id: "flag-be", name: "Belgium", price: 1000, color: "#000000", flag: { type: "vbands", colors: ["#000000", "#fdda24", "#ef3340"] } },
  { id: "flag-ro", name: "Romania", price: 1000, color: "#002b7f", flag: { type: "vbands", colors: ["#002b7f", "#fcd116", "#ce1126"] } },
  { id: "flag-de", name: "Germany", price: 1000, color: "#000000", flag: { type: "bands", colors: ["#000000", "#dd0000", "#ffce00"] } },
  { id: "flag-nl", name: "Netherlands", price: 1000, color: "#ae1c28", flag: { type: "bands", colors: ["#ae1c28", "#ffffff", "#21468b"] } },
  { id: "flag-ru", name: "Russia", price: 1000, color: "#ffffff", flag: { type: "bands", colors: ["#ffffff", "#0039a6", "#d52b1e"] } },
  { id: "flag-es", name: "Spain", price: 1000, color: "#aa151b", flag: { type: "bands", colors: ["#aa151b", "#f1bf00", "#f1bf00", "#aa151b"] } },
  { id: "flag-pt", name: "Portugal", price: 1000, color: "#046a38", flag: { type: "vbands", colors: ["#046a38", "#046a38", "#da291c", "#da291c", "#da291c"] } },
  { id: "flag-pl", name: "Poland", price: 1000, color: "#ffffff", flag: { type: "bands", colors: ["#ffffff", "#dc143c"] } },
  { id: "flag-ua", name: "Ukraine", price: 1000, color: "#0057b7", flag: { type: "bands", colors: ["#0057b7", "#ffd700"] } },
  { id: "flag-id", name: "Indonesia", price: 1000, color: "#ce1126", flag: { type: "bands", colors: ["#ce1126", "#ffffff"] } },
  { id: "flag-ar", name: "Argentina", price: 1000, color: "#74acdf", flag: { type: "circle", colors: ["#74acdf", "#ffffff", "#74acdf"], accent: "#f6b40e" } },
  { id: "flag-jp", name: "Japan", price: 1000, color: "#ffffff", flag: { type: "circle", colors: ["#ffffff"], accent: "#bc002d" } },
  { id: "flag-bd", name: "Bangladesh", price: 1000, color: "#006a4e", flag: { type: "circle", colors: ["#006a4e"], accent: "#f42a41" } },
  { id: "flag-in", name: "India", price: 1000, color: "#ff9933", flag: { type: "circle", colors: ["#ff9933", "#ffffff", "#138808"], accent: "#000080" } },
  { id: "flag-kr", name: "South Korea", price: 1000, color: "#ffffff", flag: { type: "circle", colors: ["#ffffff"], accent: "#cd2e3a" } },
  { id: "flag-br", name: "Brazil", price: 1000, color: "#009c3b", flag: { type: "diamond", colors: ["#009c3b"], accent: "#ffdf00", accent2: "#002776" } },
  { id: "flag-se", name: "Sweden", price: 1000, color: "#006aa7", flag: { type: "cross", colors: ["#006aa7"], accent: "#fecc00" } },
  { id: "flag-no", name: "Norway", price: 1000, color: "#ba0c2f", flag: { type: "cross", colors: ["#ba0c2f"], accent: "#00205b", accent2: "#ffffff" } },
  { id: "flag-fi", name: "Finland", price: 1000, color: "#ffffff", flag: { type: "cross", colors: ["#ffffff"], accent: "#003580" } },
  { id: "flag-dk", name: "Denmark", price: 1000, color: "#c60c30", flag: { type: "cross", colors: ["#c60c30"], accent: "#ffffff" } },
  { id: "flag-is", name: "Iceland", price: 1000, color: "#02529c", flag: { type: "cross", colors: ["#02529c"], accent: "#dc1e35", accent2: "#ffffff" } },
  { id: "flag-ch", name: "Switzerland", price: 1000, color: "#d52b1e", flag: { type: "cross", colors: ["#d52b1e"], accent: "#ffffff" } },
  { id: "flag-gr", name: "Greece", price: 1000, color: "#0d5eaf", flag: { type: "bands", colors: ["#0d5eaf", "#ffffff", "#0d5eaf", "#ffffff", "#0d5eaf"] } },
  { id: "flag-ng", name: "Nigeria", price: 1000, color: "#008751", flag: { type: "vbands", colors: ["#008751", "#ffffff", "#008751"] } },
  { id: "flag-mx", name: "Mexico", price: 1000, color: "#006847", flag: { type: "vbands", colors: ["#006847", "#ffffff", "#ce1126"] } },
  { id: "flag-ca", name: "Canada", price: 1000, color: "#ff0000", flag: { type: "vbands", colors: ["#ff0000", "#ffffff", "#ff0000"] } },
  { id: "flag-tr", name: "Turkey", price: 1000, color: "#e30a17", flag: { type: "circle", colors: ["#e30a17"], accent: "#ffffff" } },
  { id: "flag-cz", name: "Czechia", price: 1000, color: "#ffffff", flag: { type: "diagonal", colors: ["#ffffff", "#d7141a"] } },
  { id: "flag-za", name: "South Africa", price: 1000, color: "#007a4d", flag: { type: "diagonal", colors: ["#007a4d", "#ffb612"] } },
];


export const EXPLOSIONS: ExplosionItem[] = [
  { id: "none", name: "None", price: 0, kind: "shockwave", colors: ["#ffffff"] },
  { id: "confetti", name: "Confetti", price: 4500, kind: "confetti", colors: ["#ff4d4d", "#4d94ff", "#ffd24d", "#4dff88", "#e04dff"] },
  { id: "emoji-party", name: "Party Emojis", price: 6000, kind: "emoji", emojis: ["🎉", "🥳", "🎊", "✨"] },
  { id: "emoji-fire", name: "Fire Emojis", price: 6000, kind: "emoji", emojis: ["🔥", "💥", "😤"] },
  { id: "emoji-egg", name: "Egg Storm", price: 7500, kind: "emoji", emojis: ["🥚", "🍳", "🐣"] },
  { id: "firework", name: "Fireworks", price: 10500, kind: "firework", colors: ["#ffd24d", "#ff4d4d", "#4dd2ff", "#ffffff"] },
  { id: "shock-gold", name: "Gold Shockwave", price: 12000, kind: "shockwave", colors: ["#ffcc33"] },
  { id: "money", name: "Money Rain", price: 18000, kind: "money", colors: ["#43d17a", "#2fa35c", "#ffe066"], emojis: ["💵", "💰", "🤑", "💸"] },
  { id: "blast", name: "Explosion", price: 21000, kind: "blast", colors: ["#ffcf4d", "#ff7a1a", "#ff3b30", "#4a4a4a"] },
  { id: "blackhole", name: "Black Hole", price: 36000, kind: "blackhole", colors: ["#9b5de5", "#3b1a5c", "#000000"] },
];

/** Player anthems — short tunes that play during the goal-scorer zoom-in.
 *  `melody` is [frequencyHz, seconds] pairs used by the built-in synth.
 *  `url` can point at an uploaded audio file; when set it is played instead. */
export interface AnthemItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  url?: string;
  melody?: Array<[number, number]>;
  wave?: OscillatorType;
}

const N = {
  C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392.0, A4: 440.0, B4: 493.9,
  C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784.0, A5: 880.0, B5: 987.8, C6: 1046.5,
};

export const ANTHEMS: AnthemItem[] = [
  { id: "anthem-none", name: "No Anthem", price: 0, icon: "🔇" },
  {
    id: "anthem-fanfare",
    name: "Victory Fanfare",
    price: 7500,
    icon: "🎺",
    wave: "square",
    melody: [[N.C5, 0.14], [N.E5, 0.14], [N.G5, 0.14], [N.C6, 0.42]],
  },
  {
    id: "anthem-stadium",
    name: "Stadium Chant",
    price: 9000,
    icon: "📣",
    wave: "sawtooth",
    melody: [[N.G4, 0.2], [N.G4, 0.2], [N.C5, 0.28], [N.G4, 0.2], [N.A4, 0.36]],
  },
  {
    id: "anthem-arcade",
    name: "Arcade Hero",
    price: 10500,
    icon: "🕹️",
    wave: "square",
    melody: [[N.E5, 0.1], [N.E5, 0.1], [N.G5, 0.1], [N.C6, 0.16], [N.B5, 0.1], [N.G5, 0.24]],
  },
  {
    id: "anthem-dramatic",
    name: "Dramatic Organ",
    price: 13500,
    icon: "🎹",
    wave: "triangle",
    melody: [[N.A4, 0.22], [N.G4, 0.14], [N.F4, 0.14], [N.E4, 0.3], [N.A4, 0.4]],
  },
  {
    id: "anthem-boss",
    name: "Boss Mode",
    price: 18000,
    icon: "👑",
    wave: "sawtooth",
    melody: [[N.C4, 0.18], [N.C4, 0.12], [N.D4, 0.18], [N.C4, 0.12], [N.F4, 0.22], [N.E4, 0.4]],
  },
];

export function getAnthem(id?: string) {
  return ANTHEMS.find((a) => a.id === id);
}

export interface AbilityItem {
  id: string;
  name: string;
  /** Actual price charged right now (0 while abilities are free for testing) */
  price: number;
  /** Intended price once abilities go live */
  listPrice: number;
  icon: string;
  description: string;
  cooldown: number; // seconds
}

export const ABILITIES: AbilityItem[] = [
  {
    id: "dash",
    name: "Dash",
    price: 2400,
    listPrice: 2400,
    icon: "⚡",
    description: "Burst forward in the direction you're moving.",
    cooldown: 5,
  },
  {
    id: "freeze",
    name: "Freeze",
    price: 8000,
    listPrice: 8000,
    icon: "❄️",
    description: "Freezes the ball solid in place for 2 seconds — nobody can move it.",
    cooldown: 12,
  },
  {
    id: "bumper",
    name: "Bumper",
    price: 22000,
    listPrice: 22000,
    icon: "🛡️",
    description: "For 5 seconds any touch auto-blasts the ball with power-shot force.",
    cooldown: 20,
  },

  {
    id: "invisible",
    name: "Invisible",
    price: 16000,
    listPrice: 16000,
    icon: "👻",
    description: "Vanish from everyone else's screen for 3 seconds, then fade back in.",
    cooldown: 14,
  },
  {
    id: "chain",
    name: "Chain",
    price: 24000,
    listPrice: 24000,
    icon: "⛓️",
    description: "Hook the closest player and reel them toward you.",
    cooldown: 12,
  },
  {
    id: "swap",
    name: "Swap",
    price: 32000,
    listPrice: 32000,
    icon: "🔀",
    description: "Instantly trade places with the closest opponent.",
    cooldown: 18,
  },
  {
    id: "rush",
    name: "Rush",
    price: 13000,
    listPrice: 13000,
    icon: "💨",
    description: "Big speed boost for a few seconds, leaving ghost trails behind you.",
    cooldown: 13,
  },

  {
    id: "gamble",
    name: "Gamble",
    price: 18000,
    listPrice: 18000,
    icon: "🎲",
    description: "Your next kick rolls a 1-10 power boost. 10 is rare — and shoots the full field.",
    cooldown: 12,
  },
  {
    id: "magnet",
    name: "Magnet",
    price: 28000,
    listPrice: 28000,
    icon: "🧲",
    description: "Drag a nearby ball toward you until it reaches your feet. Short range.",
    cooldown: 9,
  },
  {
    id: "debug",
    name: "Debug",
    price: 44000,
    listPrice: 44000,
    icon: "🐛",
    description: "Glitch out for a moment, then teleport to a random spot near the ball.",
    cooldown: 16,
  },
  {
    id: "rewind",
    name: "Time Rewind",
    price: 150000,
    listPrice: 150000,
    icon: "⏳",
    description: "Rewind the match 3 seconds — clock included. Won't rewind past a goal.",
    cooldown: 45,
  },
];

export function getAbility(id?: string) {
  return ABILITIES.find((a) => a.id === id);
}

export type EquipKind = "skin" | "explosion" | "ability" | "anthem";

export interface PlayerStats {
  goals: number;
  wins: number;
  games: number;
  hatricks: number;
}

export const DEFAULT_STATS: PlayerStats = { goals: 0, wins: 0, games: 0, hatricks: 0 };

export interface ShopState {
  money: number;
  owned: string[];
  skin: string;
  explosion: string;
  /** Single equipped ability, triggered with Q or E */
  ability: string;
  anthem: string;
  name: string;
  stats: PlayerStats;
}

const KEY = "eggball-shop-v1";

const FREEBIES = [
  "default",
  "none",
  "anthem-none",
  ...ABILITIES.map((a) => a.id),
  ...(FREE_MODE ? [...SKINS.map((s) => s.id), ...EXPLOSIONS.map((e) => e.id), ...ANTHEMS.map((a) => a.id)] : []),
];

export const DEFAULT_SHOP: ShopState = {
  money: 0,
  owned: [...FREEBIES],
  skin: "default",
  explosion: "none",
  ability: "dash",
  anthem: "anthem-none",
  name: "",
  stats: { ...DEFAULT_STATS },
};

export function loadShop(): ShopState {
  if (typeof window === "undefined") return { ...DEFAULT_SHOP, stats: { ...DEFAULT_STATS } };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SHOP, stats: { ...DEFAULT_STATS } };
    const parsed = JSON.parse(raw) as Partial<ShopState> & { abilityQ?: string; abilityE?: string };
    const ability = parsed.ability ?? parsed.abilityE ?? parsed.abilityQ ?? "dash";
    return {
      money: typeof parsed.money === "number" ? parsed.money : 0,
      owned: Array.from(new Set([...(parsed.owned ?? []), ...FREEBIES])),
      skin: parsed.skin ?? "default",
      explosion: parsed.explosion ?? "none",
      // "curl" was removed — fall back to dash for anyone who had it equipped.
      ability: ABILITIES.some((a) => a.id === ability) ? ability : "dash",
      anthem: parsed.anthem ?? "anthem-none",
      name: typeof parsed.name === "string" ? parsed.name : "",
      stats: { ...DEFAULT_STATS, ...(parsed.stats ?? {}) },
    };
  } catch {
    return { ...DEFAULT_SHOP, stats: { ...DEFAULT_STATS } };
  }
}


export function saveShop(s: ShopState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export const GOAL_REWARD = 100;
export const WIN_REWARD = 400;

export function getSkin(id?: string) {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}
export function getExplosion(id?: string) {
  return EXPLOSIONS.find((e) => e.id === id) ?? EXPLOSIONS[0];
}
