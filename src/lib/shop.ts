// Eggball shop catalog + local persistence.

export interface SkinItem {
  id: string;
  name: string;
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
  kind: "confetti" | "emoji" | "firework" | "shockwave";
  colors?: string[];
  emojis?: string[];
}

export const SKINS: SkinItem[] = [
  { id: "default", name: "Classic", price: 0, color: "" },
  { id: "sunset", name: "Sunset", price: 150, color: "#ff8b3d" },
  { id: "mint", name: "Mint", price: 150, color: "#3ddc97" },
  { id: "grape", name: "Grape", price: 200, color: "#9b5de5" },
  { id: "gold", name: "Gold", price: 500, color: "#ffcc33" },
  { id: "midnight", name: "Midnight", price: 350, color: "#1b1f3b" },
  { id: "bubblegum", name: "Bubblegum", price: 250, color: "#ff7ac6" },
  { id: "flag-au", name: "Australia", price: 400, color: "#00247d", flag: { colors: ["#00247d", "#ffffff", "#cf142b"] } },
  { id: "flag-fr", name: "France", price: 400, color: "#0055a4", flag: { colors: ["#0055a4", "#ffffff", "#ef4135"], vertical: true } },
  { id: "flag-it", name: "Italy", price: 400, color: "#008c45", flag: { colors: ["#008c45", "#f4f5f0", "#cd212a"], vertical: true } },
  { id: "flag-de", name: "Germany", price: 400, color: "#000000", flag: { colors: ["#000000", "#dd0000", "#ffce00"] } },
  { id: "flag-jp", name: "Japan", price: 450, color: "#ffffff", flag: { colors: ["#ffffff", "#bc002d", "#ffffff"] } },
  { id: "flag-br", name: "Brazil", price: 450, color: "#009c3b", flag: { colors: ["#009c3b", "#ffdf00", "#009c3b"] } },
];

export const EXPLOSIONS: ExplosionItem[] = [
  { id: "none", name: "None", price: 0, kind: "shockwave", colors: ["#ffffff"] },
  { id: "confetti", name: "Confetti", price: 200, kind: "confetti", colors: ["#ff4d4d", "#4d94ff", "#ffd24d", "#4dff88", "#e04dff"] },
  { id: "emoji-party", name: "Party Emojis", price: 300, kind: "emoji", emojis: ["🎉", "🥳", "🎊", "✨"] },
  { id: "emoji-fire", name: "Fire Emojis", price: 300, kind: "emoji", emojis: ["🔥", "💥", "😤"] },
  { id: "emoji-egg", name: "Egg Storm", price: 350, kind: "emoji", emojis: ["🥚", "🍳", "🐣"] },
  { id: "firework", name: "Fireworks", price: 450, kind: "firework", colors: ["#ffd24d", "#ff4d4d", "#4dd2ff", "#ffffff"] },
  { id: "shock-gold", name: "Gold Shockwave", price: 500, kind: "shockwave", colors: ["#ffcc33"] },
];

export interface ShopState {
  money: number;
  owned: string[];
  skin: string;
  explosion: string;
}

const KEY = "eggball-shop-v1";

export const DEFAULT_SHOP: ShopState = {
  money: 0,
  owned: ["default", "none"],
  skin: "default",
  explosion: "none",
};

export function loadShop(): ShopState {
  if (typeof window === "undefined") return { ...DEFAULT_SHOP };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SHOP };
    const parsed = JSON.parse(raw) as Partial<ShopState>;
    return {
      money: typeof parsed.money === "number" ? parsed.money : 0,
      owned: Array.from(new Set([...(parsed.owned ?? []), "default", "none"])),
      skin: parsed.skin ?? "default",
      explosion: parsed.explosion ?? "none",
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

export const GOAL_REWARD = 75;
export const WIN_REWARD = 250;

export function getSkin(id?: string) {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}
export function getExplosion(id?: string) {
  return EXPLOSIONS.find((e) => e.id === id) ?? EXPLOSIONS[0];
}
