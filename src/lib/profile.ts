// Cloud-backed player profiles: a stable per-browser UUID owns the row, so a
// player can rename themselves and the leaderboard follows them.

import { supabase } from "@/integrations/supabase/client";
import type { PlayerStats, ShopState } from "./shop";

const ID_KEY = "eggball-player-id";

export function getPlayerId(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
  let id = window.localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export interface Profile {
  id: string;
  name: string;
  goals: number;
  wins: number;
  games: number;
  hatricks: number;
  money: number;
  skin: string;
  explosion: string;
  anthem: string;
  ability: string;
}

/** Goals per game, used to rank the leaderboard. */
export function gpg(p: { goals: number; games: number }) {
  return p.games > 0 ? p.goals / p.games : 0;
}

export async function syncProfile(shop: ShopState, stats: PlayerStats): Promise<void> {
  const id = getPlayerId();
  const row = {
    id,
    name: shop.name || "Player",
    goals: stats.goals,
    wins: stats.wins,
    games: stats.games,
    hatricks: stats.hatricks,
    money: shop.money,
    skin: shop.skin,
    explosion: shop.explosion,
    anthem: shop.anthem,
    ability: shop.ability,
  };
  await supabase.from("eggball_profiles").upsert(row, { onConflict: "id" });
}

export async function fetchLeaderboard(limit = 100): Promise<Profile[]> {
  const { data } = await supabase
    .from("eggball_profiles")
    .select("id,name,goals,wins,games,hatricks,money,skin,explosion,anthem,ability")
    .order("goals", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as Profile[];
  return rows.slice().sort((a, b) => gpg(b) - gpg(a) || b.goals - a.goals);
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data } = await supabase
    .from("eggball_profiles")
    .select("id,name,goals,wins,games,hatricks,money,skin,explosion,anthem,ability")
    .ilike("name", `%${query}%`)
    .limit(20);
  return (data ?? []) as Profile[];
}

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("eggball_profiles")
    .select("id,name,goals,wins,games,hatricks,money,skin,explosion,anthem,ability")
    .eq("id", id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}
