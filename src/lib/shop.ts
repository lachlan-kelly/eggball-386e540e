// Eggball shop catalog + local persistence.

/** While true every item costs $0 (testing mode). Prices shown as "normally $X". */
export const FREE_MODE = true;
export function effectivePrice(listPrice: number) {
  return FREE_MODE ? 0 : listPrice;
}

export interface SkinItem {
  id: string;
  name: string;
  /** List price (what it costs once FREE_MODE is off) */
  price: number;
  /** Solid base colour of the ball */
  color: string;
  /** Optional flag stripes drawn over the ball */
  flag?: { colors: string[]; vertical?: boolean };
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
  { id: "sunset", name: "Sunset", price: 900, color: "#ff8b3d" },
  { id: "mint", name: "Mint", price: 900, color: "#3ddc97" },
  { id: "grape", name: "Grape", price: 1200, color: "#9b5de5" },
  { id: "gold", name: "Gold", price: 4500, color: "#ffcc33" },
  { id: "midnight", name: "Midnight", price: 2200, color: "#1b1f3b" },
  { id: "bubblegum", name: "Bubblegum", price: 1600, color: "#ff7ac6" },
  { id: "flag-au", name: "Australia", price: 2800, color: "#00247d", flag: { colors: ["#00247d", "#ffffff", "#cf142b"] } },
  { id: "flag-fr", name: "France", price: 2800, color: "#0055a4", flag: { colors: ["#0055a4", "#ffffff", "#ef4135"], vertical: true } },
  { id: "flag-it", name: "Italy", price: 2800, color: "#008c45", flag: { colors: ["#008c45", "#f4f5f0", "#cd212a"], vertical: true } },
  { id: "flag-de", name: "Germany", price: 2800, color: "#000000", flag: { colors: ["#000000", "#dd0000", "#ffce00"] } },
  { id: "flag-jp", name: "Japan", price: 3200, color: "#ffffff", flag: { colors: ["#ffffff", "#bc002d", "#ffffff"] } },
  { id: "flag-br", name: "Brazil", price: 3200, color: "#009c3b", flag: { colors: ["#009c3b", "#ffdf00", "#009c3b"] } },
];

export const EXPLOSIONS: ExplosionItem[] = [
  { id: "none", name: "None", price: 0, kind: "shockwave", colors: ["#ffffff"] },
  { id: "confetti", name: "Confetti", price: 1500, kind: "confetti", colors: ["#ff4d4d", "#4d94ff", "#ffd24d", "#4dff88", "#e04dff"] },
  { id: "emoji-party", name: "Party Emojis", price: 2000, kind: "emoji", emojis: ["🎉", "🥳", "🎊", "✨"] },
  { id: "emoji-fire", name: "Fire Emojis", price: 2000, kind: "emoji", emojis: ["🔥", "💥", "😤"] },
  { id: "emoji-egg", name: "Egg Storm", price: 2500, kind: "emoji", emojis: ["🥚", "🍳", "🐣"] },
  { id: "firework", name: "Fireworks", price: 3500, kind: "firework", colors: ["#ffd24d", "#ff4d4d", "#4dd2ff", "#ffffff"] },
  { id: "shock-gold", name: "Gold Shockwave", price: 4000, kind: "shockwave", colors: ["#ffcc33"] },
  { id: "money", name: "Money Rain", price: 6000, kind: "money", colors: ["#43d17a", "#2fa35c", "#ffe066"], emojis: ["💵", "💰", "🤑", "💸"] },
  { id: "blast", name: "Explosion", price: 7000, kind: "blast", colors: ["#ffcf4d", "#ff7a1a", "#ff3b30", "#4a4a4a"] },
  { id: "blackhole", name: "Black Hole", price: 12000, kind: "blackhole", colors: ["#9b5de5", "#3b1a5c", "#000000"] },
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
    price: 2500,
    icon: "🎺",
    wave: "square",
    melody: [[N.C5, 0.14], [N.E5, 0.14], [N.G5, 0.14], [N.C6, 0.42]],
  },
  {
    id: "anthem-stadium",
    name: "Stadium Chant",
    price: 3000,
    icon: "📣",
    wave: "sawtooth",
    melody: [[N.G4, 0.2], [N.G4, 0.2], [N.C5, 0.28], [N.G4, 0.2], [N.A4, 0.36]],
  },
  {
    id: "anthem-arcade",
    name: "Arcade Hero",
    price: 3500,
    icon: "🕹️",
    wave: "square",
    melody: [[N.E5, 0.1], [N.E5, 0.1], [N.G5, 0.1], [N.C6, 0.16], [N.B5, 0.1], [N.G5, 0.24]],
  },
  {
    id: "anthem-dramatic",
    name: "Dramatic Organ",
    price: 4500,
    icon: "🎹",
    wave: "triangle",
    melody: [[N.A4, 0.22], [N.G4, 0.14], [N.F4, 0.14], [N.E4, 0.3], [N.A4, 0.4]],
  },
  {
    id: "anthem-boss",
    name: "Boss Mode",
    price: 6000,
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
    price: 0,
    listPrice: 1200,
    icon: "⚡",
    description: "Burst forward in the direction you're moving.",
    cooldown: 5,
  },
  {
    id: "dribble",
    name: "Dribble",
    price: 0,
    listPrice: 4000,
    icon: "🏃",
    description: "A shorter dash that carries the ball with you — opponents can knock it loose.",
    cooldown: 7,
  },
  {
    id: "curl",
    name: "Curl",
    price: 0,
    listPrice: 5000,
    icon: "🌀",
    description: "Next kick within 5s swings out wide then bends back into the goal you're attacking.",
    cooldown: 10,
  },
  {
    id: "gamble",
    name: "Gamble",
    price: 0,
    listPrice: 9000,
    icon: "🎲",
    description: "Your next kick rolls a 1-10 power boost. 10 is rare — and shoots the full field.",
    cooldown: 12,
  },
  {
    id: "magnet",
    name: "Magnet",
    price: 0,
    listPrice: 14000,
    icon: "🧲",
    description: "Drag a nearby ball toward you until it reaches your feet. Short range.",
    cooldown: 9,
  },
  {
    id: "debug",
    name: "Debug",
    price: 0,
    listPrice: 22000,
    icon: "🐛",
    description: "Glitch out for a moment, then teleport to a random spot near the ball.",
    cooldown: 16,
  },
  {
    id: "rewind",
    name: "Time Rewind",
    price: 0,
    listPrice: 75000,
    icon: "⏳",
    description: "Rewind the match 3 seconds — clock included. Won't rewind past a goal.",
    cooldown: 45,
  },
];

export function getAbility(id?: string) {
  return ABILITIES.find((a) => a.id === id);
}

export type EquipKind = "skin" | "explosion" | "ability" | "anthem";

export interface ShopState {
  money: number;
  owned: string[];
  skin: string;
  explosion: string;
  /** Single equipped ability, triggered with Q or E */
  ability: string;
  anthem: string;
  name: string;
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
};

export function loadShop(): ShopState {
  if (typeof window === "undefined") return { ...DEFAULT_SHOP };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SHOP };
    const parsed = JSON.parse(raw) as Partial<ShopState> & { abilityQ?: string; abilityE?: string };
    return {
      money: typeof parsed.money === "number" ? parsed.money : 0,
      owned: Array.from(new Set([...(parsed.owned ?? []), ...FREEBIES])),
      skin: parsed.skin ?? "default",
      explosion: parsed.explosion ?? "none",
      ability: parsed.ability ?? parsed.abilityE ?? parsed.abilityQ ?? "dash",
      anthem: parsed.anthem ?? "anthem-none",
      name: typeof parsed.name === "string" ? parsed.name : "",
    };
  } catch {
    return { ...DEFAULT_SHOP };
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
