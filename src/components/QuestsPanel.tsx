import { useEffect, useState } from "react";
import {
  formatDuration,
  isComplete,
  msUntilReset,
  type QuestBoard,
  type QuestState,
} from "@/lib/quests";

type Scope = "daily" | "weekly";

function Board({
  board,
  scope,
  onClaim,
}: {
  board: QuestBoard;
  scope: Scope;
  onClaim: (scope: Scope, questId: string, reward: number) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold capitalize">{scope} quests</h2>
        <p className="text-xs text-neutral-400">
          Resets in{" "}
          <span className="tabular-nums text-neutral-200">
            {formatDuration(msUntilReset(scope, now))}
          </span>
        </p>
      </div>
      {board.quests.map((q) => {
        const progress = Math.min(q.target, board.progress[q.id] ?? 0);
        const done = isComplete(board, q);
        const claimed = board.claimed.includes(q.id);
        const pct = Math.round((progress / q.target) * 100);
        return (
          <div key={q.id} className="bg-neutral-900/60 rounded-lg p-3 flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">{q.label}</p>
              <div className="mt-2 h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full ${done ? "bg-green-500" : "bg-yellow-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 tabular-nums">
                {progress} / {q.target}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-yellow-400">${q.reward.toLocaleString()}</p>
              {claimed ? (
                <span className="text-[11px] font-bold text-green-400">Claimed</span>
              ) : (
                <button
                  disabled={!done}
                  onClick={() => onClaim(scope, q.id, q.reward)}
                  className="mt-1 px-3 py-1.5 rounded-md bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-black text-xs font-bold"
                >
                  Claim
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function QuestsPanel({
  quests,
  money,
  onClaim,
  onClose,
}: {
  quests: QuestState;
  money: number;
  onClaim: (scope: Scope, questId: string, reward: number) => void;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<Scope>("daily");

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-lg p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl h-full max-h-[520px] flex overflow-hidden">
        <aside className="w-48 shrink-0 bg-neutral-900 p-4 flex flex-col gap-2">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Balance</p>
            <p className="text-2xl font-bold text-yellow-400">${money.toLocaleString()}</p>
          </div>
          {(
            [
              ["daily", "Daily Quests"],
              ["weekly", "Weekly Quests"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setScope(id)}
              className={`text-left px-3 py-2 rounded-md text-sm font-semibold ${
                scope === id ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={onClose}
            className="mt-auto px-3 py-2 rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm font-semibold"
          >
            Close
          </button>
        </aside>
        <div className="flex-1 p-5 overflow-y-auto">
          <Board
            board={scope === "daily" ? quests.daily : quests.weekly}
            scope={scope}
            onClaim={onClaim}
          />
        </div>
      </div>
    </div>
  );
}
