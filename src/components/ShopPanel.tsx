import { useEffect, useRef, useState } from "react";
import { drawSkin } from "@/lib/flags";
import { PACKS, RARITY_META, type PackResult } from "@/lib/packs";
import {
  ABILITIES,
  ANTHEMS,
  EXPLOSIONS,
  SKINS,
  effectivePrice,
  FREE_MODE,
  type AnthemItem,
  type EquipKind,
  type ShopState,
  type SkinItem,
  type ExplosionItem,
} from "@/lib/shop";


type Section = "packs" | "skins" | "explosions" | "abilities" | "anthems";

function priceLabel(list: number) {
  if (list === 0) return "Free";
  return FREE_MODE ? `Free (normally $${list.toLocaleString()})` : `$${list.toLocaleString()}`;
}


function SkinPreview({ skin }: { skin: SkinItem }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    drawSkin(ctx, 48, 48, 46, skin);
    ctx.beginPath();
    ctx.arc(48, 48, 46, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.stroke();
  }, [skin]);
  return <canvas ref={ref} width={96} height={96} className="h-12 w-12 shrink-0" />;
}


function ExplosionPreview({ item }: { item: ExplosionItem }) {
  return (
    <div className="h-12 w-12 rounded-lg bg-neutral-900 flex items-center justify-center text-xl shrink-0">
      {item.kind === "emoji" || item.kind === "money" ? (
        item.emojis?.[0]
      ) : item.kind === "blast" ? (
        "💥"
      ) : item.kind === "blackhole" ? (
        "🕳️"
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
  onOpenPack,
  onPreviewAnthem,
  onClose,
}: {
  shop: ShopState;
  onBuy: (id: string, price: number) => void;
  onEquip: (kind: EquipKind, id: string) => void;
  onOpenPack: (packId: string) => PackResult | null;
  onPreviewAnthem?: (anthem: AnthemItem) => void;
  onClose: () => void;
}) {
  const [section, setSection] = useState<Section>("packs");
  const [pull, setPull] = useState<PackResult | null>(null);
  const [opening, setOpening] = useState(false);

  const rows =
    section === "skins"
      ? SKINS.map((s) => ({ id: s.id, name: s.name, price: s.price, preview: <SkinPreview skin={s} />, kind: "skin" as const }))
      : section === "explosions"
        ? EXPLOSIONS.map((e) => ({ id: e.id, name: e.name, price: e.price, preview: <ExplosionPreview item={e} />, kind: "explosion" as const }))
        : [];

  const buyPack = (packId: string) => {
    if (opening) return;
    setOpening(true);
    setPull(null);
    window.setTimeout(() => {
      setPull(onOpenPack(packId));
      setOpening(false);
    }, 550);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-lg p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl h-full max-h-[520px] flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 bg-neutral-900 p-4 flex flex-col gap-2">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Balance</p>
            <p className="text-2xl font-bold text-yellow-400">${shop.money.toLocaleString()}</p>
          </div>
          {(
            [
              ["packs", "Packs"],
              ["skins", "Skins"],
              ["explosions", "Goal Explosions"],
              ["abilities", "Abilities"],
              ["anthems", "Player Anthems"],
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
          {section === "packs" ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-neutral-500">
                Packs roll a random skin, goal explosion or anthem. Better packs = better odds.
                Duplicates pay back 35% of the item's value.
              </p>
              <div className="min-h-[86px] rounded-lg bg-neutral-900/60 p-3 flex items-center justify-center text-center">
                {opening ? (
                  <p className="text-sm font-bold text-yellow-400 animate-pulse">Opening pack...</p>
                ) : pull ? (
                  <div>
                    <p
                      className="text-[11px] font-black uppercase tracking-widest"
                      style={{ color: RARITY_META[pull.item.rarity].color }}
                    >
                      {RARITY_META[pull.item.rarity].label}
                    </p>
                    <p className="text-lg font-bold">{pull.item.name}</p>
                    <p className="text-xs text-neutral-400">
                      {pull.duplicate
                        ? `Duplicate — refunded $${pull.refund.toLocaleString()}`
                        : `Unlocked! Equip it in ${pull.item.kind === "skin" ? "Skins" : pull.item.kind === "explosion" ? "Goal Explosions" : "Player Anthems"}.`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">Buy a pack to see what you pull.</p>
                )}
              </div>
              {PACKS.map((p) => (
                <div key={p.id} className="flex items-center gap-3 bg-neutral-900/60 rounded-lg p-3">
                  <div className="h-12 w-12 rounded-lg bg-neutral-800 flex items-center justify-center text-2xl shrink-0">
                    {p.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-neutral-400">{p.blurb}</p>
                    <p className="text-[11px] text-neutral-500">
                      {(["common", "rare", "epic", "legendary"] as const)
                        .filter((r) => p.odds[r] > 0)
                        .map((r) => `${RARITY_META[r].label} ${Math.round(p.odds[r] * 100)}%`)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    disabled={shop.money < effectivePrice(p.price) || opening}
                    onClick={() => buyPack(p.id)}
                    className="px-3 py-1.5 rounded-md bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-black text-xs font-bold shrink-0"
                  >
                    {priceLabel(p.price)}
                  </button>
                </div>
              ))}
            </div>
          ) : section === "abilities" ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-neutral-500">
                Equip <b>one</b> ability — trigger it in-game with <b>Q</b> or <b>E</b>. Dash is free; the rest are earned.
              </p>
              {ABILITIES.map((a) => {
                const equipped = shop.ability === a.id;
                const cost = effectivePrice(a.price);
                const owned = shop.owned.includes(a.id) || cost === 0;
                return (
                  <div key={a.id} className="flex items-center gap-3 bg-neutral-900/60 rounded-lg p-3">
                    <div className="h-12 w-12 rounded-full bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center text-xl shrink-0">
                      {a.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">
                        {a.name} <span className="text-neutral-500 font-normal">· {a.cooldown}s cooldown</span>
                      </p>
                      <p className="text-xs text-neutral-400">{a.description}</p>
                      <p className="text-[11px] text-yellow-500/80">{priceLabel(a.listPrice)}</p>
                    </div>
                    {equipped ? (
                      <span className="text-xs font-bold text-green-400 shrink-0">Equipped</span>
                    ) : owned ? (
                      <button
                        onClick={() => onEquip("ability", a.id)}
                        className="px-3 py-1.5 rounded-md bg-neutral-700 hover:bg-neutral-600 text-xs font-semibold shrink-0"
                      >
                        Equip
                      </button>
                    ) : (
                      <button
                        disabled={shop.money < cost}
                        onClick={() => onBuy(a.id, cost)}
                        className="px-3 py-1.5 rounded-md bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-black text-xs font-bold shrink-0"
                      >
                        Buy
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

          ) : section === "anthems" ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-neutral-500">
                Your anthem plays for everyone during the goal-scorer zoom-in.
              </p>
              {ANTHEMS.map((a) => {
                const owned = shop.owned.includes(a.id) || effectivePrice(a.price) === 0;
                const equipped = shop.anthem === a.id;
                return (
                  <div key={a.id} className="flex items-center gap-3 bg-neutral-900/60 rounded-lg p-3">
                    <div className="h-12 w-12 rounded-lg bg-neutral-800 flex items-center justify-center text-xl shrink-0">
                      {a.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{a.name}</p>
                      <p className="text-xs text-neutral-400">{priceLabel(a.price)}</p>
                    </div>
                    {a.id !== "anthem-none" && onPreviewAnthem && (
                      <button
                        onClick={() => onPreviewAnthem(a)}
                        className="px-2 py-1.5 rounded-md bg-neutral-700 hover:bg-neutral-600 text-xs font-semibold shrink-0"
                      >
                        ▶
                      </button>
                    )}
                    {equipped ? (
                      <span className="text-xs font-bold text-green-400 shrink-0">Equipped</span>
                    ) : owned ? (
                      <button
                        onClick={() => onEquip("anthem", a.id)}
                        className="px-3 py-1.5 rounded-md bg-neutral-700 hover:bg-neutral-600 text-xs font-semibold shrink-0"
                      >
                        Equip
                      </button>
                    ) : (
                      <button
                        disabled={shop.money < effectivePrice(a.price)}
                        onClick={() => onBuy(a.id, effectivePrice(a.price))}
                        className="px-3 py-1.5 rounded-md bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-black text-xs font-bold shrink-0"
                      >
                        Buy
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {rows.map((r) => {
                const cost = effectivePrice(r.price);
                const owned = shop.owned.includes(r.id) || cost === 0;
                const equipped = r.kind === "skin" ? shop.skin === r.id : shop.explosion === r.id;
                return (
                  <div key={r.id} className="flex items-center gap-3 bg-neutral-900/60 rounded-lg p-3">
                    {r.preview}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{r.name}</p>
                      <p className="text-xs text-neutral-400">{priceLabel(r.price)}</p>
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
                        disabled={shop.money < cost}
                        onClick={() => onBuy(r.id, cost)}
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
