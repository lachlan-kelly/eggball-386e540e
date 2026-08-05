// Eggball pack system — buy a pack, roll a random cosmetic weighted by rarity.

import { ANTHEMS, EXPLOSIONS, SKINS, type EquipKind } from "./shop";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_META: Record<Rarity, { label: string; color: string }> = {
  common: { label: "Common", color: "#94a3b8" },
  rare: { label: "Rare", color: "#38bdf8" },
  epic: { label: "Epic", color: "#a855f7" },
  legendary: { label: "Legendary", color: "#f2b705" },
};

export interface PoolItem {
  id: string;
  name: string;
  kind: Extract<EquipKind, "skin" | "explosion" | "anthem">;
  price: number;
  rarity: Rarity;
}

/** Value decides rarity so the catalog stays the single source of truth. */
function rarityFor(price: number): Rarity {
  if (price >= 18000) return "legendary";
  if (price >= 9000) return "epic";
  if (price >= 4000) return "rare";
  return "common";
}

export const POOL: PoolItem[] = [
  ...SKINS.filter((s) => s.price > 0).map((s) => ({
    id: s.id,
    name: s.name,
    kind: "skin" as const,
    price: s.price,
    // Flag skins are the collectible ones, so they sit a tier above plain colours.
    rarity: (s.flag ? "rare" : "common") as Rarity,
  })),
  ...EXPLOSIONS.filter((e) => e.price > 0).map((e) => ({
    id: e.id,
    name: e.name,
    kind: "explosion" as const,
    price: e.price,
    rarity: rarityFor(e.price),
  })),
  ...ANTHEMS.filter((a) => a.price > 0).map((a) => ({
    id: a.id,
    name: a.name,
    kind: "anthem" as const,
    price: a.price,
    rarity: rarityFor(a.price),
  })),
];

export function poolItem(id: string) {
  return POOL.find((p) => p.id === id);
}

export interface PackItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  blurb: string;
  /** Chance of each rarity, summing to 1. */
  odds: Record<Rarity, number>;
}

export const PACKS: PackItem[] = [
  {
    id: "pack-bronze",
    name: "Bronze Pack",
    price: 3000,
    icon: "🥉",
    blurb: "Mostly commons, small shot at something better.",
    odds: { common: 0.78, rare: 0.18, epic: 0.035, legendary: 0.005 },
  },
  {
    id: "pack-silver",
    name: "Silver Pack",
    price: 9000,
    icon: "🥈",
    blurb: "Solid rare odds with a real epic chance.",
    odds: { common: 0.45, rare: 0.4, epic: 0.13, legendary: 0.02 },
  },
  {
    id: "pack-gold",
    name: "Gold Pack",
    price: 25000,
    icon: "🥇",
    blurb: "Epics are common here — legendaries show up.",
    odds: { common: 0.15, rare: 0.4, epic: 0.37, legendary: 0.08 },
  },
  {
    id: "pack-legend",
    name: "Legend Pack",
    price: 70000,
    icon: "💎",
    blurb: "Guaranteed epic or better.",
    odds: { common: 0, rare: 0, epic: 0.7, legendary: 0.3 },
  },
];

export function getPack(id: string) {
  return PACKS.find((p) => p.id === id);
}

export interface PackResult {
  item: PoolItem;
  duplicate: boolean;
  /** Money handed back when the roll was already owned. */
  refund: number;
}

function rollRarity(odds: Record<Rarity, number>): Rarity {
  const r = Math.random();
  let acc = 0;
  for (const key of ["legendary", "epic", "rare", "common"] as Rarity[]) {
    acc += odds[key];
    if (r < acc) return key;
  }
  return "common";
}

/** Open a pack: returns the rolled item and a refund when it's a duplicate. */
export function openPack(packId: string, owned: string[]): PackResult | null {
  const pack = getPack(packId);
  if (!pack) return null;
  let rarity = rollRarity(pack.odds);
  let candidates = POOL.filter((p) => p.rarity === rarity);
  if (candidates.length === 0) {
    rarity = "common";
    candidates = POOL.filter((p) => p.rarity === rarity);
  }
  // Prefer something new so packs actually feel rewarding.
  const fresh = candidates.filter((p) => !owned.includes(p.id));
  const from = fresh.length > 0 ? fresh : candidates;
  const item = from[Math.floor(Math.random() * from.length)];
  const duplicate = owned.includes(item.id);
  return { item, duplicate, refund: duplicate ? Math.round(item.price * 0.35) : 0 };
}
