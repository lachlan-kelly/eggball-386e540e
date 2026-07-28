import { useState } from "react";
import { EXPLOSIONS, SKINS, type ShopState, type SkinItem, type ExplosionItem } from "@/lib/shop";

type Section = "skins" | "explosions" | "abilities";

function SkinPreview({ skin }: { skin: SkinItem }) {
  const base = skin.color || "#e23c3c";
  return (
    <div
      className="h-12 w-12 rounded-full border-2 border-black/70 overflow-hidden shrink-0"
      style={{ background: base }}
    >
      {skin.flag && (
        <div className={`h-full w-full flex ${skin.flag.vertical ? "flex-row" : "flex-col"}`}>
          {skin.flag.colors.map((c, i) => (
            <div key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExplosionPreview({ item }: { item: ExplosionItem }) {
  return (
    <div className="h-12 w-12 rounded-lg bg-neutral-900 flex items-center justify-center text-xl shrink-0">
      {item.kind === "emoji" ? (
        item.emojis?.[0]
      ) : item.kind === "confetti" ? (
        <div className="flex gap-0.5">
          {(item.colors ?? []).slice(0, 4).map((c, i) => (
            <span key={i} className="h-3 w-1.5 rounded-sm" style={{ background: c }} />
          ))}
        </div>
      ) : (
        <span
          className="h-6 w-6 rounded-full border-2"
          style={{ borderColor: item.colors?.[0] ?? "#fff" }}
        />
      )}
    </div>
  );
}

export function ShopPanel({
  shop,
  onBuy,
  onEquip,
  onClose,
}: {
  shop: ShopState;
  onBuy: (id: string, price: number) => void;
  onEquip: (kind: "skin" | "explosion", id: string) => void;
  onClose: () => void;
}) {
  const [section, setSection] = useState<Section>("skins");

  const rows =
    section === "skins"
      ? SKINS.map((s) => ({ id: s.id, name: s.name, price: s.price, preview: <SkinPreview skin={s} />, kind: "skin" as const }))
      : section === "explosions"
        ? EXPLOSIONS.map((e) => ({ id: e.id, name: e.name, price: e.price, preview: <ExplosionPreview item={e} />, kind: "explosion" as const }))
        : [];

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-lg p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl h-full max-h-[520px] flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 bg-neutral-900 p-4 flex flex-col gap-2">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Balance</p>
            <p className="text-2xl font-bold text-yellow-400">${shop.money}</p>
          </div>
          {(
            [
              ["skins", "Skins"],
              ["explosions", "Goal Explosions"],
              ["abilities", "Abilities"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`text-left px-3 py-2 rounded-md text-sm font-semibold ${
                section === id ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800"
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

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {section === "abilities" ? (
            <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
              Abilities coming soon.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {rows.map((r) => {
                const owned = shop.owned.includes(r.id) || r.price === 0;
                const equipped = r.kind === "skin" ? shop.skin === r.id : shop.explosion === r.id;
                return (
                  <div key={r.id} className="flex items-center gap-3 bg-neutral-900/60 rounded-lg p-3">
                    {r.preview}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{r.name}</p>
                      <p className="text-xs text-neutral-400">{r.price === 0 ? "Free" : `$${r.price}`}</p>
                    </div>
                    {equipped ? (
                      <span className="text-xs font-bold text-green-400">Equipped</span>
                    ) : owned ? (
                      <button
                        onClick={() => onEquip(r.kind, r.id)}
                        className="px-3 py-1.5 rounded-md bg-neutral-700 hover:bg-neutral-600 text-xs font-semibold"
                      >
                        Equip
                      </button>
                    ) : (
                      <button
                        disabled={shop.money < r.price}
                        onClick={() => onBuy(r.id, r.price)}
                        className="px-3 py-1.5 rounded-md bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-black text-xs font-bold"
                      >
                        Buy
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
