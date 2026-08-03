interface Row {
  id: string;
  name: string;
  team: "red" | "blue";
  goals: number;
}

export function ScoreboardPanel({
  roster,
  red,
  blue,
  onClose,
}: {
  roster: Row[];
  red: number;
  blue: number;
  onClose: () => void;
}) {
  const side = (team: "red" | "blue") => roster.filter((r) => r.team === team);

  const Column = ({ team, score }: { team: "red" | "blue"; score: number }) => (
    <div className="flex-1 flex flex-col min-w-0">
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-t-lg font-bold ${
          team === "red" ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"
        }`}
      >
        <span>{team === "red" ? "RED" : "BLUE"}</span>
        <span className="tabular-nums">{score}</span>
      </div>
      <div className="flex-1 overflow-y-auto bg-neutral-900/60 rounded-b-lg divide-y divide-neutral-800">
        {side(team).length === 0 && (
          <div className="px-3 py-3 text-sm text-neutral-500">No players</div>
        )}
        {side(team).map((r) => (
          <div key={r.id} className="px-3 py-2 flex items-center justify-between text-sm">
            <span className="truncate">{r.name}</span>
            <span className="text-neutral-400 tabular-nums">{r.goals}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-lg p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl h-full max-h-[480px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-neutral-900">
          <h2 className="text-lg font-bold">Scoreboard</h2>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm font-semibold"
          >
            Close
          </button>
        </div>
        <div className="flex-1 p-5 flex gap-4 overflow-hidden">
          <Column team="red" score={red} />
          <Column team="blue" score={blue} />
        </div>
        <p className="px-5 pb-4 text-xs text-neutral-500">Goals scored this session, per player.</p>
      </div>
    </div>
  );
}
