interface Entry {
  version: string;
  date: string;
  changes: string[];
}

export const UPDATES: Entry[] = [
  {
    version: "v0.6",
    date: "Latest",
    changes: [
      "New ability: Freeze — locks the ball in place for 2s (replaces Dribble).",
      "New ability: Bumper — 5s of auto power-blasting any ball you touch.",
      "Curl locked to its launch direction and toned way down (no more 360s).",
      "Gamble rolls now actually matter — the ball speed cap was raised a lot.",
      "Power shots are stronger and the ball keeps rolling further.",
      "Loads of new skins plus properly drawn country flags.",
      "Time Rewind now has a full rewind visual effect.",
      "A bot fills in when a team is empty (Dash / Magnet only).",
      "Scoreboard centred, menu buttons split to the sides.",
      "Smoother multiplayer: interpolated players and ball, faster updates.",
    ],
  },
  {
    version: "v0.5",
    date: "Earlier",
    changes: [
      "Abilities: Dash, Magnet, Curl, Gamble, Debug, Time Rewind.",
      "Daily and weekly quests with money rewards.",
      "Player anthems and new goal explosions (Money, Explosion, Black Hole).",
    ],
  },
  {
    version: "v0.4",
    date: "Earlier",
    changes: [
      "Shop with skins and goal explosions, money from goals and wins.",
      "Power kick charge meter.",
      "Goal celebration camera zoom on the scorer.",
    ],
  },
];

export function UpdateLogPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-lg p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl h-full max-h-[520px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-neutral-900">
          <h2 className="text-lg font-bold">Update Log</h2>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm font-semibold"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {UPDATES.map((u) => (
            <div key={u.version}>
              <div className="flex items-baseline gap-2">
                <h3 className="font-bold text-yellow-400">{u.version}</h3>
                <span className="text-xs text-neutral-500">{u.date}</span>
              </div>
              <ul className="mt-2 flex flex-col gap-1">
                {u.changes.map((c, i) => (
                  <li key={i} className="text-sm text-neutral-300 flex gap-2">
                    <span className="text-neutral-600">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
