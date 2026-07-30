// Eggball daily / weekly quests with local persistence.

export type QuestMetric =
  | "goals"
  | "wins"
  | "abilities"
  | "kicks"
  | "powerKicks"
  | "games";

export interface Quest {
  id: string;
  metric: QuestMetric;
  target: number;
  label: string;
  reward: number;
}

interface Template {
  key: string;
  metric: QuestMetric;
  label: (n: number) => string;
  targets: { daily: number[]; weekly: number[] };
  /** money per unit of target */
  rate: number;
}

const TEMPLATES: Template[] = [
  {
    key: "goals",
    metric: "goals",
    label: (n) => `Score ${n} goal${n === 1 ? "" : "s"}`,
    targets: { daily: [3, 5, 8], weekly: [15, 25, 40] },
    rate: 60,
  },
  {
    key: "wins",
    metric: "wins",
    label: (n) => `Win ${n} match${n === 1 ? "" : "es"}`,
    targets: { daily: [1, 2, 3], weekly: [3, 5, 8] },
    rate: 400,
  },
  {
    key: "abilities",
    metric: "abilities",
    label: (n) => `Use abilities ${n} times`,
    targets: { daily: [3, 5, 10], weekly: [20, 35, 60] },
    rate: 45,
  },
  {
    key: "kicks",
    metric: "kicks",
    label: (n) => `Kick the ball ${n} times`,
    targets: { daily: [25, 40, 60], weekly: [150, 250, 400] },
    rate: 8,
  },
  {
    key: "powerKicks",
    metric: "powerKicks",
    label: (n) => `Land ${n} power shots`,
    targets: { daily: [3, 5, 8], weekly: [15, 25, 40] },
    rate: 90,
  },
  {
    key: "games",
    metric: "games",
    label: (n) => `Finish ${n} match${n === 1 ? "" : "es"}`,
    targets: { daily: [2, 3, 5], weekly: [8, 12, 20] },
    rate: 120,
  },
];

export type QuestScope = "daily" | "weekly";

export interface QuestBoard {
  period: number;
  quests: Quest[];
  progress: Record<string, number>;
  claimed: string[];
}

export interface QuestState {
  daily: QuestBoard;
  weekly: QuestBoard;
}

const DAY = 86400000;
const WEEK = DAY * 7;

export function dailyPeriod(now = Date.now()) {
  return Math.floor(now / DAY);
}
export function weeklyPeriod(now = Date.now()) {
  return Math.floor(now / WEEK);
}
export function msUntilReset(scope: QuestScope, now = Date.now()) {
  const span = scope === "daily" ? DAY : WEEK;
  return span - (now % span);
}

export function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

/** Deterministic PRNG so every session sees the same quests for a period. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function generate(scope: QuestScope, period: number): Quest[] {
  const count = scope === "daily" ? 3 : 5;
  const rand = rng(period * (scope === "daily" ? 7919 : 104729) + (scope === "daily" ? 11 : 29));
  const pool = [...TEMPLATES];
  const quests: Quest[] = [];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) pool.push(...TEMPLATES);
    const t = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    const options = t.targets[scope];
    const target = options[Math.floor(rand() * options.length)];
    const mult = scope === "daily" ? 1 : 1.4;
    quests.push({
      id: `${scope}-${period}-${t.key}-${target}-${i}`,
      metric: t.metric,
      target,
      label: t.label(target),
      reward: Math.round((target * t.rate * mult) / 25) * 25,
    });
  }
  return quests;
}

function freshBoard(scope: QuestScope, period: number): QuestBoard {
  return { period, quests: generate(scope, period), progress: {}, claimed: [] };
}

const KEY = "eggball-quests-v1";

export function defaultQuests(): QuestState {
  return {
    daily: freshBoard("daily", dailyPeriod()),
    weekly: freshBoard("weekly", weeklyPeriod()),
  };
}

export function loadQuests(): QuestState {
  if (typeof window === "undefined") return defaultQuests();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultQuests();
    const parsed = JSON.parse(raw) as Partial<QuestState>;
    return refreshQuests({
      daily: parsed.daily ?? freshBoard("daily", dailyPeriod()),
      weekly: parsed.weekly ?? freshBoard("weekly", weeklyPeriod()),
    });
  } catch {
    return defaultQuests();
  }
}

/** Rolls boards over when their period has elapsed. */
export function refreshQuests(state: QuestState): QuestState {
  const d = dailyPeriod();
  const w = weeklyPeriod();
  return {
    daily: state.daily.period === d ? state.daily : freshBoard("daily", d),
    weekly: state.weekly.period === w ? state.weekly : freshBoard("weekly", w),
  };
}

export function saveQuests(s: QuestState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function addProgress(state: QuestState, metric: QuestMetric, amount = 1): QuestState {
  const bump = (board: QuestBoard): QuestBoard => {
    let changed = false;
    const progress = { ...board.progress };
    for (const q of board.quests) {
      if (q.metric !== metric) continue;
      const cur = progress[q.id] ?? 0;
      if (cur >= q.target) continue;
      progress[q.id] = Math.min(q.target, cur + amount);
      changed = true;
    }
    return changed ? { ...board, progress } : board;
  };
  const daily = bump(state.daily);
  const weekly = bump(state.weekly);
  if (daily === state.daily && weekly === state.weekly) return state;
  return { daily, weekly };
}

export function isComplete(board: QuestBoard, q: Quest) {
  return (board.progress[q.id] ?? 0) >= q.target;
}
