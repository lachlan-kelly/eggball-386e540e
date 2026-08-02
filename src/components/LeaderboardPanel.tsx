import { useEffect, useRef, useState } from "react";
import { drawSkin } from "@/lib/flags";
import { ABILITIES, ANTHEMS, EXPLOSIONS, getSkin } from "@/lib/shop";
import { fetchLeaderboard, fetchProfile, getPlayerId, gpg, searchProfiles, type Profile } from "@/lib/profile";

type Tab = "leaderboard" | "stats";

function Ball({ skinId }: { skinId?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const skin = getSkin(skinId);
    ctx.clearRect(0, 0, c.width, c.height);
    drawSkin(ctx, 48, 48, 46, { color: skin.color || "#888", flag: skin.flag });
    ctx.beginPath();
    ctx.arc(48, 48, 46, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.stroke();
  }, [skinId]);
  return <canvas ref={ref} width={96} height={96} className="h-16 w-16 shrink-0" />;
}

function name_of(list: { id: string; name: string }[], id?: string) {
  return list.find((x) => x.id === id)?.name ?? "—";
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-neutral-900 rounded-lg px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

export function LeaderboardPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [board, setBoard] = useState<Profile[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const myId = getPlayerId();

  useEffect(() => {
    void fetchLeaderboard().then(setBoard);
    void fetchProfile(myId).then(setProfile);
  }, [myId]);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      void fetchProfile(myId).then(setProfile);
      return;
    }
    setLoading(true);
    const found = await searchProfiles(q);
    setResults(found);
    if (found.length) setProfile(found[0]);
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-lg p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl h-full max-h-[520px] flex overflow-hidden">
        <aside className="w-48 shrink-0 bg-neutral-900 p-4 flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Rankings</p>
          {(
            [
              ["leaderboard", "Leaderboard"],
              ["stats", "Stats"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`text-left px-3 py-2 rounded-md text-sm font-semibold ${
                tab === id ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800"
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
          {tab === "leaderboard" ? (
            <>
              <h2 className="text-lg font-bold mb-1">Goals per game</h2>
              <p className="text-xs text-neutral-500 mb-4">Every Eggball player, ranked by goal/game ratio.</p>
              {!board ? (
                <p className="text-sm text-neutral-500">Loading...</p>
              ) : board.length === 0 ? (
                <p className="text-sm text-neutral-500">No players yet — score a goal to get on the board.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {board.map((p, i) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                        p.id === myId ? "bg-yellow-500/15 ring-1 ring-yellow-500/40" : "bg-neutral-900"
                      }`}
                    >
                      <span className="w-6 text-neutral-500 font-bold">{i + 1}</span>
                      <span className="flex-1 font-semibold truncate">{p.name}</span>
                      <span className="text-neutral-400 tabular-nums">{p.goals}g / {p.games}gp</span>
                      <span className="w-14 text-right font-bold text-yellow-400 tabular-nums">
                        {gpg(p).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void runSearch()}
                  placeholder="Search a player by name"
                  className="flex-1 px-3 py-2 rounded-md bg-neutral-900 text-sm outline-none focus:ring-2 focus:ring-white/30"
                />
                <button
                  onClick={() => void runSearch()}
                  className="px-4 py-2 rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm font-semibold"
                >
                  Search
                </button>
              </div>
              {results.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setProfile(r)}
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        profile?.id === r.id ? "bg-neutral-600" : "bg-neutral-900 hover:bg-neutral-700"
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
              {loading ? (
                <p className="text-sm text-neutral-500">Searching...</p>
              ) : !profile ? (
                <p className="text-sm text-neutral-500">
                  No profile found. Play a match to create yours.
                </p>
              ) : (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <Ball skinId={profile.skin} />
                    <div>
                      <p className="text-2xl font-bold">{profile.name}</p>
                      <p className="text-xs text-neutral-500">
                        {profile.id === myId ? "This is you" : "Eggball player"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <StatCard label="Goals" value={profile.goals} />
                    <StatCard label="Wins" value={profile.wins} />
                    <StatCard label="Games" value={profile.games} />
                    <StatCard label="Hat-tricks" value={profile.hatricks} />
                    <StatCard label="Goals / game" value={gpg(profile).toFixed(2)} />
                    <StatCard label="Money" value={`$${profile.money.toLocaleString()}`} />
                  </div>
                  <h3 className="text-sm font-bold mb-2">Loadout</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <StatCard label="Skin" value={getSkin(profile.skin).name} />
                    <StatCard label="Goal explosion" value={name_of(EXPLOSIONS, profile.explosion)} />
                    <StatCard label="Anthem" value={name_of(ANTHEMS, profile.anthem)} />
                    <StatCard label="Ability" value={name_of(ABILITIES, profile.ability)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
