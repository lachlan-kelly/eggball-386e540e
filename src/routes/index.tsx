import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShopPanel } from "@/components/ShopPanel";
import { QuestsPanel } from "@/components/QuestsPanel";
import { ABILITIES, GOAL_REWARD, WIN_REWARD, getAbility, getAnthem, getExplosion, getSkin, loadShop, saveShop, DEFAULT_SHOP, type AnthemItem, type EquipKind, type ShopState } from "@/lib/shop";
import { addProgress, defaultQuests, loadQuests, refreshQuests, saveQuests, type QuestMetric, type QuestState } from "@/lib/quests";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eggball - Multiplayer Soccer" },
      { name: "description", content: "Pick a team and play Eggball, a real-time multiplayer soccer game." },
      { property: "og:title", content: "Eggball" },
      { property: "og:description", content: "Real-time multiplayer soccer. Red vs Blue." },
    ],
  }),
  component: EggballPage,
});

// ---- Field constants ----
const FIELD_W = 1400;
const FIELD_H = 720;
const PAD = 70; // padded canvas area around the field so goals + out-of-bounds are visible
const CANVAS_W = FIELD_W + PAD * 2;
const CANVAS_H = FIELD_H + PAD * 2;
const PLAYER_R = 24;
const BALL_R = 17;
const GOAL_H = 220;
const GOAL_DEPTH = 46;
const POST_R = 8;
const PLAYER_SPEED = 190; // px/sec
const BALL_FRICTION = 0.965;
const BALL_MAX = 900;
const KICK_POWER = 720;
const KICK_DURATION = 0.18; // seconds
const KICK_REACH = 10; // extra px beyond touching to still land a kick
const GAME_LENGTH = 5 * 60; // seconds
const MERCY_LEAD = 5;
const CANVAS_ASPECT = CANVAS_W / CANVAS_H;
const CHARGE_TIME = 1.4; // seconds of ball contact to fully charge a power kick
const POWER_MULT = 2.5;
// Abilities
const DASH_SPEED = 640;
const DASH_TIME = 0.18;
const MAGNET_RANGE = 230;
const MAGNET_TIME = 1.0;
const MAGNET_ACCEL = 2000;
const CURL_WINDOW = 5; // seconds to land the curled kick
const CURL_RATE = 3.6; // rad/sec of velocity rotation at full spin
const CURL_OUT_TIME = 0.34; // seconds bending away from goal before swinging back
const CURL_LIFE = 1.7; // total seconds the curl acts on the ball
const DRIBBLE_SPEED = 400;
const DRIBBLE_TIME = 0.7;
const GAMBLE_WINDOW = 8; // seconds to use the rolled kick
const GAMBLE_MAX_MULT = 4.5; // roll of 10 = full-field shot
const DEBUG_GLITCH = 1.1; // seconds of glitching before the teleport
const REWIND_SECONDS = 3;
const HISTORY_STEP = 100; // ms between rewind snapshots
const BLACKHOLE_TIME = 1.6;
const BLACKHOLE_PULL = 900;

type Team = "red" | "blue" | null;

interface PlayerState {
  id: string;
  team: Exclude<Team, null>;
  x: number;
  y: number;
  vx: number;
  vy: number;
  kickUntil: number; // timestamp ms
  lastDirX: number;
  lastDirY: number;
  name: string;
  skin?: string;
  explosion?: string;
  anthem?: string;
  charge?: number; // 0..1 power-kick charge
  ability?: string;
  magnetUntil?: number; // timestamp ms while the magnet is pulling
  curlUntil?: number; // timestamp ms while curl is armed
  dashUntil?: number; // timestamp ms while dashing
  dribbleUntil?: number; // timestamp ms while dribbling (ball travels with you)
  gambleUntil?: number; // timestamp ms while a gamble roll is loaded
  gambleRoll?: number; // 1..10 rolled kick power
  glitchUntil?: number; // timestamp ms while the Debug glitch plays
}

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin?: number; // curl: rad/sec applied to the velocity direction
  curlFlipAt?: number; // timestamp ms when the curl swings back inward
  curlIn?: number; // sign of the inward (goal-bound) curl
}

interface Snapshot {
  t: number;
  bx: number;
  by: number;
  bvx: number;
  bvy: number;
  timeLeft: number;
  mx: number;
  my: number;
  hasMe: boolean;
}


interface GameState {
  ball: BallState;
  scoreRed: number;
  scoreBlue: number;
  timeLeft: number; // seconds
  countdown: number; // 3..2..1..0 (0 = playing)
  ended: boolean;
  winner: Team | "draw";
  hostId: string;
  intermission: number; // seconds remaining before next game starts (0 = not in intermission)
  celebrate: number; // seconds remaining of the goal-celebration camera
  celebrateId: string; // player id the camera zooms on
}


function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function EggballPage() {
  const [team, setTeam] = useState<Team>(null);
  const [joined, setJoined] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [shopOpen, setShopOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);
  const [shop, setShop] = useState<ShopState>(DEFAULT_SHOP);
  const [quests, setQuests] = useState<QuestState>(defaultQuests);
  const [score, setScore] = useState({ red: 0, blue: 0, timeLeft: GAME_LENGTH, countdown: 0, ended: false, winner: null as Team | "draw", intermission: 0 });
  // 0..1 readiness of the equipped ability (1 = ready), plus armed / gamble roll state
  const [abilityUi, setAbilityUi] = useState({ frac: 1, armed: false, roll: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const myIdRef = useRef<string>(makeId());
  const teamRef = useRef<Team>(null);
  const joinedRef = useRef(false);
  const nameRef = useRef<string>("");
  const shopRef = useRef<ShopState>(DEFAULT_SHOP);
  const questsRef = useRef<QuestState>(defaultQuests());
  const addMoneyRef = useRef<(n: number) => void>(() => {});
  const bumpQuestRef = useRef<(m: QuestMetric, n?: number) => void>(() => {});
  const playAnthemRef = useRef<(a?: AnthemItem) => void>(() => {});

  useEffect(() => {
    const loaded = loadShop();
    shopRef.current = loaded;
    setShop(loaded);
    if (loaded.name) {
      setNameInput(loaded.name);
      nameRef.current = loaded.name;
    }
  }, []);

  useEffect(() => {
    shopRef.current = shop;
  }, [shop]);
  useEffect(() => {
    addMoneyRef.current = (n: number) => {
      setShop((prev) => {
        const next = { ...prev, money: prev.money + n };
        shopRef.current = next;
        saveShop(next);
        return next;
      });
    };
  }, []);

  useEffect(() => {
    teamRef.current = team;
  }, [team]);
  useEffect(() => {
    joinedRef.current = joined;
  }, [joined]);

  // Simple synthesized SFX via WebAudio (no assets)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const getCtx = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      if (AC) audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  };
  const playTone = (freq: number, dur: number, type: OscillatorType = "square", vol = 0.15, slideTo?: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo !== undefined) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch {}
  };
  const sfxKick = () => playTone(320, 0.09, "square", 0.18, 140);
  const sfxGoal = () => { playTone(660, 0.15, "sawtooth", 0.2, 880); setTimeout(() => playTone(880, 0.25, "sawtooth", 0.2, 1320), 120); };
  const sfxWhistle = () => playTone(1400, 0.35, "triangle", 0.15, 1800);
  const sfxPost = () => playTone(180, 0.06, "square", 0.15);
  const sfxPower = () => { playTone(160, 0.22, "sawtooth", 0.22, 60); playTone(520, 0.18, "square", 0.14, 90); };

  useEffect(() => {
    const myId = myIdRef.current;
    const players = new Map<string, PlayerState>();
    const lastSeen = new Map<string, number>();
    let ball: BallState = { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0 };
    let scoreRed = 0;
    let scoreBlue = 0;
    let timeLeft = GAME_LENGTH;
    let countdown = 0; // seconds remaining in countdown; 0 = playing
    let ended = false;
    let winner: Team | "draw" = null as Team | "draw";
    let intermission = 0; // seconds
    // Host is elected from presence (lowest id). Until presence syncs we host
    // ourselves only if nobody else claims it — see presence sync below.
    let hostId = myId;
    let presenceSynced = false;
    let ballKickedAt = 0;
    let celebrate = 0;
    let celebrateId = "";
    let lastTouchId = "";
    let camZoom = 1;
    let camX = CANVAS_W / 2;
    let camY = CANVAS_H / 2;
    const knownIds = new Set<string>([myId]);
    let myCharge = 0;
    let prevCelebrate = 0;
    let prevEnded = false;
    // Ability state (local player only)
    const cooldownUntil: Record<"q" | "e", number> = { q: 0, e: 0 };
    const cooldownLen: Record<"q" | "e", number> = { q: 1, e: 1 };
    let dashDirX = 0;
    let dashDirY = 0;
    let lastAbilityUi = 0;
    let prevQ = false;
    let prevE = false;


    type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; emoji?: string; ring?: boolean; size: number };
    let particles: Particle[] = [];

    function spawnExplosion(x: number, y: number, explosionId?: string) {
      const ex = getExplosion(explosionId);
      if (ex.kind === "emoji") {
        for (let i = 0; i < 22; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 120 + Math.random() * 320;
          particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 1.4, maxLife: 1.4, color: "#fff", emoji: ex.emojis![i % ex.emojis!.length], size: 20 + Math.random() * 16 });
        }
      } else if (ex.kind === "confetti") {
        for (let i = 0; i < 60; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 100 + Math.random() * 420;
          particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 160, life: 1.6, maxLife: 1.6, color: ex.colors![i % ex.colors!.length], size: 4 + Math.random() * 5 });
        }
      } else if (ex.kind === "firework") {
        for (let burst = 0; burst < 3; burst++) {
          for (let i = 0; i < 26; i++) {
            const a = (i / 26) * Math.PI * 2;
            const sp = 200 + burst * 90;
            particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.1 + burst * 0.2, maxLife: 1.1 + burst * 0.2, color: ex.colors![burst % ex.colors!.length], size: 4 });
          }
        }
      }
      // Every explosion gets a shockwave ring
      const ringColor = ex.colors?.[0] ?? "#ffffff";
      particles.push({ x, y, vx: 0, vy: 0, life: 0.7, maxLife: 0.7, color: ringColor, ring: true, size: 10 });
    }

    function updateParticles(dt: number) {
      for (const p of particles) {
        if (p.ring) {
          p.size += 420 * dt;
        } else {
          p.vy += 520 * dt;
          p.vx *= 0.99;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
        p.life -= dt;
      }
      particles = particles.filter((p) => p.life > 0);
    }


    const keys = new Set<string>();
    const keyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const keyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    const channel = supabase.channel("eggball-room", {
      config: { broadcast: { self: false }, presence: { key: myId } },
    });

    // Handle incoming player states
    channel.on("broadcast", { event: "player" }, ({ payload }: { payload: PlayerState }) => {
      if (payload.id === myId) return;
      players.set(payload.id, payload);
      lastSeen.set(payload.id, performance.now());
      knownIds.add(payload.id);
    });
    channel.on("broadcast", { event: "leave" }, ({ payload }: { payload: { id: string } }) => {
      players.delete(payload.id);
      lastSeen.delete(payload.id);
      knownIds.delete(payload.id);
    });
    channel.on("broadcast", { event: "kick" }, ({ payload }: { payload: { bx: number; by: number; bvx: number; bvy: number; id?: string; spin?: number } }) => {
      // Only host authoritative on ball, but any client can announce a kick they applied.
      // Only the host will process kicks; others get ball via 'state'.
      if (hostId === myId) {
        ball.x = payload.bx;
        ball.y = payload.by;
        ball.vx = payload.bvx;
        ball.vy = payload.bvy;
        ball.spin = payload.spin ?? 0;
        ballKickedAt = performance.now();
        if (payload.id) lastTouchId = payload.id;
      }
    });

    // Someone just joined and is asking everyone to re-announce themselves.
    channel.on("broadcast", { event: "hello" }, () => {
      const me = getMyPlayer();
      if (me) channel.send({ type: "broadcast", event: "player", payload: { ...me } });
    });
    channel.on("broadcast", { event: "state" }, ({ payload }: { payload: GameState }) => {
      if (payload.hostId === myId) return; // ignore our own would-be echoes
      // Lowest id wins host election; ignore state from a higher-id would-be host.
      if (hostId === myId && myId < payload.hostId) return;
      ball = payload.ball;
      scoreRed = payload.scoreRed;
      scoreBlue = payload.scoreBlue;
      timeLeft = payload.timeLeft;
      countdown = payload.countdown;
      ended = payload.ended;
      winner = payload.winner;
      intermission = payload.intermission ?? 0;
      celebrate = payload.celebrate ?? 0;
      celebrateId = payload.celebrateId ?? "";
      hostId = payload.hostId;
      setScore({ red: scoreRed, blue: scoreBlue, timeLeft, countdown, ended, winner, intermission });
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, Array<{ id: string }>>;
      const ids = new Set<string>();
      Object.values(state).forEach((arr) => arr.forEach((p) => ids.add(p.id)));
      ids.add(myId);
      presenceSynced = true;
      // Determine host = lowest id
      const sorted = Array.from(ids).sort();
      hostId = sorted[0];
      // Only drop players that presence says are gone AND we haven't heard from
      // recently — presence can lag behind broadcasts on a fresh join.
      const now = performance.now();
      for (const id of Array.from(players.keys())) {
        if (id === myId) continue;
        const seen = lastSeen.get(id) ?? 0;
        if (!ids.has(id) && now - seen > 3000) {
          players.delete(id);
          lastSeen.delete(id);
        }
      }
    });
    channel.on("presence", { event: "join" }, () => {
      // Re-announce ourselves so the newcomer sees us immediately.
      const me = getMyPlayer();
      if (me) channel.send({ type: "broadcast", event: "player", payload: { ...me } });
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ id: myId });
        setConnected(true);
        // Ask everyone already in the room to announce themselves.
        channel.send({ type: "broadcast", event: "hello", payload: { id: myId } });
        setTimeout(() => channel.send({ type: "broadcast", event: "hello", payload: { id: myId } }), 800);
      }
    });

    // ---- Game loop ----
    let lastTs = performance.now();
    let lastBroadcast = 0;
    let lastStateBroadcast = 0;
    let running = true;
    let goalCooldown = 0; // small guard after goal reset

    function resetPositions() {
      // place all players on their sides
      const allPlayers = Array.from(players.values());
      const me = getMyPlayer();
      if (me) allPlayers.push(me);
      const redTeam = allPlayers.filter((p) => p.team === "red");
      const blueTeam = allPlayers.filter((p) => p.team === "blue");
      redTeam.forEach((p, i) => {
        p.x = FIELD_W * 0.25;
        p.y = (FIELD_H / (redTeam.length + 1)) * (i + 1);
        p.vx = 0;
        p.vy = 0;
      });
      blueTeam.forEach((p, i) => {
        p.x = FIELD_W * 0.75;
        p.y = (FIELD_H / (blueTeam.length + 1)) * (i + 1);
        p.vx = 0;
        p.vy = 0;
      });
      ball = { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0 };
    }

    function getMyPlayer(): PlayerState | null {
      const t = teamRef.current;
      if (!t || !joinedRef.current) return null;
      let me = players.get(myId);
      if (!me) {
        me = {
          id: myId,
          team: t,
          x: t === "red" ? FIELD_W * 0.25 : FIELD_W * 0.75,
          y: FIELD_H / 2,
          vx: 0,
          vy: 0,
          kickUntil: 0,
          lastDirX: t === "red" ? 1 : -1,
          lastDirY: 0,
          name: nameRef.current || `Player ${players.size + 1}`,
          skin: shopRef.current.skin,
          explosion: shopRef.current.explosion,
          charge: 0,
          abilityQ: shopRef.current.abilityQ,
          abilityE: shopRef.current.abilityE,
          magnetUntil: 0,
          curlUntil: 0,
          dashUntil: 0,
        };
        players.set(myId, me);
      }
      if (me.team !== t) me.team = t;
      if (nameRef.current && me.name !== nameRef.current) me.name = nameRef.current;
      me.skin = shopRef.current.skin;
      me.explosion = shopRef.current.explosion;
      me.abilityQ = shopRef.current.abilityQ;
      me.abilityE = shopRef.current.abilityE;
      return me;
    }


    function tick() {
      if (!running) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      // Host-only: timer & countdown
      if (hostId === myId) {
        if (ended) {
          // Auto-start next game after 10s intermission
          if (intermission > 0) {
            intermission = Math.max(0, intermission - dt);
            if (intermission <= 0) {
              scoreRed = 0;
              scoreBlue = 0;
              timeLeft = GAME_LENGTH;
              ended = false;
              winner = null as Team | "draw";
              countdown = 3;
              intermission = 0;
              resetPositions();
            }
          }
        } else if (celebrate > 0) {
          // Goal celebration camera: clock paused, players free to run around.
          celebrate = Math.max(0, celebrate - dt);
          if (celebrate <= 0) {
            celebrate = 0;
            celebrateId = "";
            countdown = 3;
            resetPositions();
          }
        } else {
          if (countdown > 0) {
            countdown = Math.max(0, countdown - dt);
          } else {
            timeLeft = Math.max(0, timeLeft - dt);
            if (timeLeft <= 0) {
              ended = true;
              winner = scoreRed > scoreBlue ? "red" : scoreBlue > scoreRed ? "blue" : "draw";
              intermission = 10;
              sfxWhistle();
            }
          }
        }
        if (goalCooldown > 0) goalCooldown = Math.max(0, goalCooldown - dt);
      }


      // Move my player
      const me = getMyPlayer();
      const canMove = !ended && (hostId === myId ? countdown <= 0 : countdown <= 0);
      if (me && canMove) {
        let ix = 0,
          iy = 0;
        if (keys.has("w") || keys.has("arrowup")) iy -= 1;
        if (keys.has("s") || keys.has("arrowdown")) iy += 1;
        if (keys.has("a") || keys.has("arrowleft")) ix -= 1;
        if (keys.has("d") || keys.has("arrowright")) ix += 1;
        const len = Math.hypot(ix, iy);
        if (len > 0) {
          ix /= len;
          iy /= len;
          me.lastDirX = ix;
          me.lastDirY = iy;
        }

        // ---- Abilities (Q / E) ----
        {
          const tryAbility = (slot: "q" | "e") => {
            const id = slot === "q" ? shopRef.current.abilityQ : shopRef.current.abilityE;
            const ab = getAbility(id);
            if (!ab || now < cooldownUntil[slot]) return;
            if (ab.id === "dash") {
              const dx = len > 0 ? ix : me.lastDirX;
              const dy = len > 0 ? iy : me.lastDirY;
              const dl = Math.hypot(dx, dy) || 1;
              dashDirX = dx / dl;
              dashDirY = dy / dl;
              me.dashUntil = now + DASH_TIME * 1000;
              playTone(240, 0.12, "sawtooth", 0.16, 700);
            } else if (ab.id === "magnet") {
              const d = Math.hypot(ball.x - me.x, ball.y - me.y);
              if (d > MAGNET_RANGE) return; // out of range: no cooldown burned
              me.magnetUntil = now + MAGNET_TIME * 1000;
              playTone(180, 0.25, "triangle", 0.12, 520);
            } else if (ab.id === "curl") {
              me.curlUntil = now + CURL_WINDOW * 1000;
              playTone(520, 0.18, "triangle", 0.12, 900);
            }
            cooldownUntil[slot] = now + ab.cooldown * 1000;
            cooldownLen[slot] = ab.cooldown * 1000;
          };
          const qDown = keys.has("q");
          const eDown = keys.has("e");
          if (qDown && !prevQ) tryAbility("q");
          if (eDown && !prevE) tryAbility("e");
          prevQ = qDown;
          prevE = eDown;
        }

        // Target velocity (dash overrides speed along the dash direction)
        const dashing = (me.dashUntil ?? 0) > now;
        let tvx = dashing ? dashDirX * DASH_SPEED : ix * PLAYER_SPEED;
        let tvy = dashing ? dashDirY * DASH_SPEED : iy * PLAYER_SPEED;


        // If touching another player, slowdown factor based on pushing against them
        for (const other of players.values()) {
          if (other.id === me.id) continue;
          const dx = me.x - other.x;
          const dy = me.y - other.y;
          const d = Math.hypot(dx, dy);
          const minD = PLAYER_R * 2;
          if (d > 0 && d < minD) {
            const nx = dx / d;
            const ny = dy / d;
            // Are we pushing INTO them?
            const push = -(ix * nx + iy * ny); // >0 means pressing into them
            if (push > 0) {
              // Do they push back? (their velocity into us)
              const theirPush = other.vx * -nx + other.vy * -ny;
              const theirPressing = Math.max(0, theirPush) / PLAYER_SPEED; // 0..~1
              const slow = 1 - Math.min(0.9, push * (0.4 + theirPressing * 0.5));
              tvx *= slow;
              tvy *= slow;
              // If they're not pressing back hard, nudge them
              if (theirPressing < 0.6) {
                other.x += -nx * 60 * dt * (1 - theirPressing);
                other.y += -ny * 60 * dt * (1 - theirPressing);
              }
              // Resolve overlap
              const overlap = minD - d;
              me.x += nx * overlap * 0.5;
              me.y += ny * overlap * 0.5;
              other.x -= nx * overlap * 0.5;
              other.y -= ny * overlap * 0.5;
            }
          }
        }

        me.vx = tvx;
        me.vy = tvy;
        me.x += me.vx * dt;
        me.y += me.vy * dt;

        // Clamp to the CANVAS extents (not the field). Players can leave the field
        // (walk behind the goals / into the out-of-bounds strip), but stay on-screen.
        me.x = Math.max(-PAD + PLAYER_R, Math.min(FIELD_W + PAD - PLAYER_R, me.x));
        me.y = Math.max(-PAD + PLAYER_R, Math.min(FIELD_H + PAD - PLAYER_R, me.y));

        // Solid goal posts — players bump into them.
        {
          const gYPost = FIELD_H / 2 - GOAL_H / 2;
          const posts = [
            { x: 0, y: gYPost },
            { x: 0, y: gYPost + GOAL_H },
            { x: FIELD_W, y: gYPost },
            { x: FIELD_W, y: gYPost + GOAL_H },
          ];
          for (const post of posts) {
            const dx = me.x - post.x;
            const dy = me.y - post.y;
            const d = Math.hypot(dx, dy);
            const minD = PLAYER_R + POST_R;
            if (d > 0 && d < minD) {
              const nx = dx / d;
              const ny = dy / d;
              me.x = post.x + nx * minD;
              me.y = post.y + ny * minD;
              // Kill velocity into the post
              const vn = me.vx * nx + me.vy * ny;
              if (vn < 0) {
                me.vx -= vn * nx;
                me.vy -= vn * ny;
              }
            }
          }
        }

        // Kick input — direction is from player center toward ball (contact point),
        // so where you hit the ball determines where it goes (like Eggball/Beatball).
        // Power-kick charge: builds while we're touching the ball, resets the
        // instant contact is lost.
        {
          const cdx = ball.x - me.x;
          const cdy = ball.y - me.y;
          const cd = Math.hypot(cdx, cdy);
          if (cd < PLAYER_R + BALL_R + 2) {
            myCharge = Math.min(1, myCharge + dt / CHARGE_TIME);
          } else {
            myCharge = 0;
          }
          me.charge = myCharge;
        }

        if ((keys.has("x") || keys.has(" ")) && me.kickUntil < now) {
          me.kickUntil = now + KICK_DURATION * 1000;
          const bdx = ball.x - me.x;
          const bdy = ball.y - me.y;
          const bd = Math.hypot(bdx, bdy);
          if (bd > 0 && bd < PLAYER_R + BALL_R + KICK_REACH) {
            const nx = bdx / bd;
            const ny = bdy / bd;
            const powered = myCharge >= 1;
            const power = KICK_POWER * (powered ? POWER_MULT : 1);
            const nvx = nx * power;
            const nvy = ny * power;
            // Curl: if armed, bend the shot toward the direction we're running.
            let spin = 0;
            if ((me.curlUntil ?? 0) > now) {
              const mdx = me.lastDirX;
              const mdy = me.lastDirY;
              const cross = nx * mdy - ny * mdx; // >0 = curl clockwise
              const sign = cross === 0 ? 1 : Math.sign(cross);
              spin = sign * CURL_RATE * (0.55 + Math.min(1, Math.abs(cross)) * 0.45);
              me.curlUntil = 0;
              playTone(760, 0.25, "sine", 0.14, 380);
              for (let i = 0; i < 14; i++) {
                const a = Math.random() * Math.PI * 2;
                particles.push({ x: ball.x, y: ball.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.4, maxLife: 0.4, color: "#7dd3fc", size: 3 });
              }
            }
            if (powered) {
              sfxPower();
              for (let i = 0; i < 18; i++) {
                const a = Math.atan2(ny, nx) + (Math.random() - 0.5) * 1.2;
                const sp = 80 + Math.random() * 200;
                particles.push({ x: ball.x, y: ball.y, vx: -Math.cos(a) * sp, vy: -Math.sin(a) * sp, life: 0.45, maxLife: 0.45, color: "#ffe066", size: 3 + Math.random() * 3 });
              }
              particles.push({ x: ball.x, y: ball.y, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, color: "#ffe066", ring: true, size: 8 });
            } else {
              sfxKick();
            }
            myCharge = 0;
            me.charge = 0;
            if (hostId === myId) {
              ball.vx = nvx;
              ball.vy = nvy;
              ball.spin = spin;
              ballKickedAt = now;
              lastTouchId = myId;
            } else {
              channel.send({ type: "broadcast", event: "kick", payload: { bx: ball.x, by: ball.y, bvx: nvx, bvy: nvy, id: myId, spin } });
            }
          }
        }
      }

      // Host-only: ball physics
      if (hostId === myId && countdown <= 0 && !ended && celebrate <= 0) {
        // Magnet: any player with an active magnet drags the ball toward them.
        for (const p of players.values()) {
          if (!p.magnetUntil || p.magnetUntil < now) continue;
          const dx = p.x - ball.x;
          const dy = p.y - ball.y;
          const d = Math.hypot(dx, dy);
          if (d < PLAYER_R + BALL_R + 2) {
            ball.vx = 0;
            ball.vy = 0;
            p.magnetUntil = 0;
            continue;
          }
          if (d > MAGNET_RANGE + 60) continue;
          ball.vx += (dx / d) * MAGNET_ACCEL * dt;
          ball.vy += (dy / d) * MAGNET_ACCEL * dt;
          ball.spin = 0;
          lastTouchId = p.id;
        }

        // Black hole goal explosion: drags every player (and the ball) inward
        if (blackhole.until > now) {
          const pull = (o: { x: number; y: number; vx: number; vy: number }) => {
            const dx = blackhole.x - o.x;
            const dy = blackhole.y - o.y;
            const d = Math.hypot(dx, dy) || 1;
            o.vx += (dx / d) * BLACKHOLE_PULL * dt;
            o.vy += (dy / d) * BLACKHOLE_PULL * dt;
          };
          pull(ball);
          for (const p of players.values()) pull(p);
        }

        // Curl spin: two-phase — bends outward first, then swings back inward
        // toward the goal the kicker is attacking.
        if (ball.spin) {
          if (ball.curlFlipAt && now >= ball.curlFlipAt) {
            ball.spin = -Math.abs(ball.spin) * Math.sign(ball.curlIn || 1) * -1;
            ball.spin = Math.abs(ball.spin) * (ball.curlIn || 1);
            ball.curlFlipAt = 0;
          }
          const ang = Math.atan2(ball.vy, ball.vx) + ball.spin * dt;
          const sp2 = Math.hypot(ball.vx, ball.vy);
          ball.vx = Math.cos(ang) * sp2;
          ball.vy = Math.sin(ang) * sp2;
          ball.spin *= Math.pow(0.988, dt * 60);
          if (Math.abs(ball.spin) < 0.05) {
            ball.spin = 0;
            ball.curlFlipAt = 0;
          }
        }

        // Apply friction
        ball.vx *= Math.pow(BALL_FRICTION, dt * 60);
        ball.vy *= Math.pow(BALL_FRICTION, dt * 60);
        // Clamp
        const bs = Math.hypot(ball.vx, ball.vy);
        if (bs > BALL_MAX) {
          ball.vx = (ball.vx / bs) * BALL_MAX;
          ball.vy = (ball.vy / bs) * BALL_MAX;
        }
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;


        // Wall collision - but goal openings on left/right.
        // A goal only counts when the WHOLE ball is past the goal line.
        const inGoalY = ball.y > FIELD_H / 2 - GOAL_H / 2 && ball.y < FIELD_H / 2 + GOAL_H / 2;
        if (inGoalY && ball.x + BALL_R < 0 && goalCooldown <= 0) {
          scoreBlue += 1;
          sfxGoal();
          goalCooldown = 3;
          startCelebration();
          checkEnd();
        } else if (!inGoalY && ball.x - BALL_R < 0) {
          ball.x = BALL_R;
          ball.vx = -ball.vx * 0.7;
        }
        if (inGoalY && ball.x - BALL_R > FIELD_W && goalCooldown <= 0) {
          scoreRed += 1;
          sfxGoal();
          goalCooldown = 3;
          startCelebration();
          checkEnd();
        } else if (!inGoalY && ball.x + BALL_R > FIELD_W) {
          ball.x = FIELD_W - BALL_R;
          ball.vx = -ball.vx * 0.7;
        }
        // Back walls of the goal boxes (so the ball doesn't fly off forever)
        if (inGoalY && ball.x - BALL_R < -GOAL_DEPTH) {
          ball.x = -GOAL_DEPTH + BALL_R;
          ball.vx = -ball.vx * 0.5;
        }
        if (inGoalY && ball.x + BALL_R > FIELD_W + GOAL_DEPTH) {
          ball.x = FIELD_W + GOAL_DEPTH - BALL_R;
          ball.vx = -ball.vx * 0.5;
        }
        if (ball.y - BALL_R < 0) {
          ball.y = BALL_R;
          ball.vy = -ball.vy * 0.7;
        }
        if (ball.y + BALL_R > FIELD_H) {
          ball.y = FIELD_H - BALL_R;
          ball.vy = -ball.vy * 0.7;
        }

        // Goal post collisions — solid bumpers at the corners of each goal opening
        const gYPost = FIELD_H / 2 - GOAL_H / 2;
        const posts = [
          { x: 0, y: gYPost },
          { x: 0, y: gYPost + GOAL_H },
          { x: FIELD_W, y: gYPost },
          { x: FIELD_W, y: gYPost + GOAL_H },
        ];
        for (const post of posts) {
          const dx = ball.x - post.x;
          const dy = ball.y - post.y;
          const d = Math.hypot(dx, dy);
          const minD = BALL_R + POST_R;
          if (d > 0 && d < minD) {
            const nx = dx / d;
            const ny = dy / d;
            ball.x = post.x + nx * minD;
            ball.y = post.y + ny * minD;
            const vn = ball.vx * nx + ball.vy * ny;
            if (vn < 0) {
              ball.vx -= 2 * vn * nx * 0.85;
              ball.vy -= 2 * vn * ny * 0.85;
              if (Math.hypot(ball.vx, ball.vy) > 120) sfxPost();
            }
          }
        }

        // Ball vs players: loose, realistic push. While in contact and NOT recently
        // kicked, the ball's velocity along the contact normal is forced to match the
        // player's normal-component velocity. So pushing rolls the ball forward, and
        // the moment the player stops moving, the ball also stops (no drift, no
        // slingshot). Tangential (sideways) motion is heavily damped so the ball
        // does not stick to the player when they move sideways past it.
        const allPlayers = Array.from(players.values());
        const recentlyKicked = now - ballKickedAt < 140;
        for (const p of allPlayers) {
          const dx = ball.x - p.x;
          const dy = ball.y - p.y;
          const d = Math.hypot(dx, dy);
          const minD = PLAYER_R + BALL_R;
          if (d > 0 && d < minD) {
            const nx = dx / d;
            const ny = dy / d;
            // Resolve overlap (positional only)
            const overlap = minD - d;
            ball.x += nx * overlap;
            ball.y += ny * overlap;

            if (!recentlyKicked) {
              // Dribble: the ball rolls out mostly in the direction the player is
              // RUNNING (blended slightly with the contact normal), at the speed
              // of the push. Off-centre contacts nudge it a little sideways
              // instead of squirting it away, and it stops when the player stops.
              const pspeed = Math.hypot(p.vx, p.vy);
              const along = p.vx * nx + p.vy * ny;
              if (pspeed > 1 && along > 0) {
                const vhx = p.vx / pspeed;
                const vhy = p.vy / pspeed;
                let rx = nx * 0.25 + vhx * 0.75;
                let ry = ny * 0.25 + vhy * 0.75;
                const rl = Math.hypot(rx, ry) || 1;
                rx /= rl;
                ry /= rl;
                const speed = along * 0.95;
                ball.vx = rx * speed;
                ball.vy = ry * speed;
                lastTouchId = p.id;
              } else {
                ball.vx = 0;
                ball.vy = 0;
              }
            }

            // Pinch detection: another player pressing into the ball from the opposite side,
            // AND neither contact is against a wall (pure player-vs-player pinch).
            for (const q of allPlayers) {
              if (q.id === p.id) continue;
              const qdx = ball.x - q.x;
              const qdy = ball.y - q.y;
              const qd = Math.hypot(qdx, qdy);
              if (qd > 0 && qd < minD + 2) {
                const qnx = qdx / qd;
                const qny = qdy / qd;
                if (qnx * nx + qny * ny < -0.5) {
                  const pInto = p.vx * -nx + p.vy * -ny; // p pressing toward ball
                  const qInto = q.vx * -qnx + q.vy * -qny;
                  if (pInto > 40 && qInto > 40) {
                    // Escape perpendicular to the squeeze axis
                    const perpX = -ny;
                    const perpY = nx;
                    // Pick the side further from the field center vertically
                    const sign = ball.y < FIELD_H / 2 ? -1 : 1;
                    ball.vx = perpX * sign * KICK_POWER * 1.1;
                    ball.vy = perpY * sign * KICK_POWER * 1.1;
                  }
                }
              }
            }
          }
        }
      }

      function checkEnd() {
        const lead = Math.abs(scoreRed - scoreBlue);
        if (lead >= MERCY_LEAD) {
          ended = true;
          winner = scoreRed > scoreBlue ? "red" : "blue";
          intermission = 10;
          celebrate = 0;
          celebrateId = "";
        }
      }

      // Goal scored: freeze the ball and run a short celebration camera on the
      // scorer before the 3-2-1 restart. Players can still run around.
      function startCelebration() {
        celebrate = 2.6;
        celebrateId = lastTouchId;
        ball.vx = 0;
        ball.vy = 0;
      }


      // Every kickoff (start of a round and after every goal) the ability
      // starts on full cooldown.
      if (prevCountdown > 0 && countdown <= 0) {
        const ab0 = getAbility(shopRef.current.ability);
        if (ab0) {
          cooldownUntil.v = now + ab0.cooldown * 1000;
          cooldownLen.v = ab0.cooldown * 1000;
        }
      }
      prevCountdown = countdown;

      // Ability HUD (throttled to ~15Hz)
      if (now - lastAbilityUi > 66) {
        lastAbilityUi = now;
        const left = cooldownUntil.v - now;
        const frac = left <= 0 ? 1 : Math.max(0, Math.min(1, 1 - left / cooldownLen.v));
        setAbilityUi({
          frac,
          armed: (me?.curlUntil ?? 0) > now || (me?.gambleUntil ?? 0) > now,
          roll: (me?.gambleUntil ?? 0) > now ? me?.gambleRoll ?? 0 : 0,
        });
      }


      // Broadcast my player state ~20Hz
      if (me && now - lastBroadcast > 50) {
        lastBroadcast = now;
        const payload: PlayerState = { ...me };
        channel.send({ type: "broadcast", event: "player", payload });
      }

      // Host broadcasts game state ~20Hz
      if (hostId === myId && now - lastStateBroadcast > 50) {
        lastStateBroadcast = now;
        const state: GameState = {
          ball,
          scoreRed,
          scoreBlue,
          timeLeft,
          countdown,
          ended,
          winner,
          hostId,
          intermission,
          celebrate,
          celebrateId,
        };
        channel.send({ type: "broadcast", event: "state", payload: state });
        setScore({ red: scoreRed, blue: scoreBlue, timeLeft, countdown, ended, winner, intermission });
      }


      // Purge stale players
      for (const [id, t] of lastSeen) {
        if (now - t > 4000) {
          players.delete(id);
          lastSeen.delete(id);
        }
      }

      // Goal explosion + anthem + rewards (runs on every client from replicated state)
      if (celebrate > 0 && prevCelebrate <= 0) {
        lastGoalAt = now;
        const scorer = celebrateId === myId ? getMyPlayer() : players.get(celebrateId);
        spawnExplosion(ball.x, ball.y, scorer?.explosion);
        playAnthemRef.current(getAnthem(scorer?.anthem));
        if (celebrateId === myId) {
          addMoneyRef.current(GOAL_REWARD);
          bumpQuestRef.current("goals");
        }
      }
      prevCelebrate = celebrate;

      if (ended && !prevEnded) {
        if (teamRef.current && joinedRef.current) {
          bumpQuestRef.current("games");
          if (winner === teamRef.current) {
            addMoneyRef.current(WIN_REWARD);
            bumpQuestRef.current("wins");
          }
        }
      }
      prevEnded = ended;

      // Rewind snapshots (ball + clock + my own position)
      if (now - lastHistory > HISTORY_STEP) {
        lastHistory = now;
        history.push({
          t: now,
          bx: ball.x,
          by: ball.y,
          bvx: ball.vx,
          bvy: ball.vy,
          timeLeft,
          mx: me?.x ?? 0,
          my: me?.y ?? 0,
          hasMe: !!me,
        });
        while (history.length && now - history[0].t > 9000) history.shift();
      }

      updateParticles(dt);

      draw();
      requestAnimationFrame(tick);
    }

    function draw() {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      // Clear whole canvas (out-of-bounds strip)
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Goal-celebration camera: smoothly zoom in on the scorer, then back out.
      const camTarget = celebrate > 0 && celebrateId ? players.get(celebrateId) : undefined;
      const wantZoom = camTarget ? 2.3 : 1;
      const focusX = camTarget ? camTarget.x + PAD : CANVAS_W / 2;
      const focusY = camTarget ? camTarget.y + PAD : CANVAS_H / 2;
      camZoom += (wantZoom - camZoom) * 0.08;
      camX += (focusX - camX) * 0.12;
      camY += (focusY - camY) * 0.12;

      ctx.save();
      ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-camX, -camY);
      ctx.translate(PAD, PAD);

      // Field background
      ctx.fillStyle = "#1f7a3a";
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      // Stripes
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      const stripe = 70;
      for (let i = 0; i < FIELD_W; i += stripe * 2) ctx.fillRect(i, 0, stripe, FIELD_H);
      // Border
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, FIELD_W - 4, FIELD_H - 4);
      // Center line
      ctx.beginPath();
      ctx.moveTo(FIELD_W / 2, 0);
      ctx.lineTo(FIELD_W / 2, FIELD_H);
      ctx.stroke();
      // Center circle
      ctx.beginPath();
      ctx.arc(FIELD_W / 2, FIELD_H / 2, 70, 0, Math.PI * 2);
      ctx.stroke();
      // Goals (fully visible boxes extending OUT from the field)
      const gy = FIELD_H / 2 - GOAL_H / 2;
      ctx.fillStyle = "rgba(220,50,50,0.30)";
      ctx.fillRect(-GOAL_DEPTH, gy, GOAL_DEPTH, GOAL_H);
      ctx.fillStyle = "rgba(50,110,220,0.30)";
      ctx.fillRect(FIELD_W, gy, GOAL_DEPTH, GOAL_H);
      // Goal frame
      ctx.strokeStyle = "#ff6666";
      ctx.lineWidth = 4;
      ctx.strokeRect(-GOAL_DEPTH, gy, GOAL_DEPTH, GOAL_H);
      ctx.strokeStyle = "#6699ff";
      ctx.strokeRect(FIELD_W, gy, GOAL_DEPTH, GOAL_H);
      // Solid goal posts (bumpers)
      const drawPost = (x: number, y: number, color: string) => {
        ctx.beginPath();
        ctx.arc(x, y, POST_R, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      drawPost(0, gy, "#ffdddd");
      drawPost(0, gy + GOAL_H, "#ffdddd");
      drawPost(FIELD_W, gy, "#ddeaff");
      drawPost(FIELD_W, gy + GOAL_H, "#ddeaff");

      // Players
      const now = performance.now();
      const all = Array.from(players.values());
      for (const p of all) {
        const kicking = p.kickUntil > now;
        const skin = getSkin(p.skin);
        const teamColor = p.team === "red" ? "#e23c3c" : "#3c6ee2";
        const glitching = (p.glitchUntil ?? 0) > now;
        // Outer transform so the Debug glitch can shake / ghost the whole player
        ctx.save();
        if (glitching) {
          ctx.globalAlpha = 0.4 + Math.random() * 0.5;
          ctx.translate((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
        ctx.fillStyle = skin.color || teamColor;
        ctx.fill();
        if (skin.flag) {
          ctx.clip();
          const bands = skin.flag.colors;
          const n = bands.length;
          for (let i = 0; i < n; i++) {
            ctx.fillStyle = bands[i];
            if (skin.flag.vertical) {
              ctx.fillRect(p.x - PLAYER_R + (i * PLAYER_R * 2) / n, p.y - PLAYER_R, (PLAYER_R * 2) / n + 1, PLAYER_R * 2);
            } else {
              ctx.fillRect(p.x - PLAYER_R, p.y - PLAYER_R + (i * PLAYER_R * 2) / n, PLAYER_R * 2, (PLAYER_R * 2) / n + 1);
            }
          }
        }
        ctx.restore();
        // Curl armed: subtle spinning aura
        if ((p.curlUntil ?? 0) > now) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, PLAYER_R + 6 + Math.sin(now / 120) * 2, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(125,211,252,0.85)";
          ctx.stroke();
        }
        // Gamble loaded: golden dashed ring
        if ((p.gambleUntil ?? 0) > now) {
          ctx.save();
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(p.x, p.y, PLAYER_R + 9, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(250,204,21,0.9)";
          ctx.stroke();
          ctx.restore();
        }
        // Dribbling: trailing streak
        if ((p.dribbleUntil ?? 0) > now) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, PLAYER_R + 4, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(134,239,172,0.85)";
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = kicking ? "#ffffff" : "#000000";
        ctx.stroke();

        // Name tag
        if (p.name) {
          const raw = p.name;
          const display = raw.length > 6 ? raw.slice(0, 6) + "..." : raw;
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(0,0,0,0.75)";
          ctx.strokeText(display, p.x, p.y + PLAYER_R + 4);
          ctx.fillStyle = p.team === "red" ? "#ff6b6b" : "#6ea8ff";
          ctx.fillText(display, p.x, p.y + PLAYER_R + 4);
        }
        ctx.restore();
      }
      // Magnet beam: crackling line from the ball to each magnetising player
      for (const p of all) {
        if ((p.magnetUntil ?? 0) <= now) continue;
        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(147,197,253,0.9)";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        const segs = 8;
        for (let i = 1; i <= segs; i++) {
          const t = i / segs;
          const jitter = i === segs ? 0 : (Math.random() - 0.5) * 14;
          const bx = p.x + (ball.x - p.x) * t;
          const by = p.y + (ball.y - p.y) * t;
          const nx = -(ball.y - p.y);
          const ny = ball.x - p.x;
          const nl = Math.hypot(nx, ny) || 1;
          ctx.lineTo(bx + (nx / nl) * jitter, by + (ny / nl) * jitter);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R + 7, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(147,197,253,0.7)";
        ctx.stroke();
        ctx.restore();
      }
      // Black hole goal explosion: swirling void that drags everyone in
      if (blackholeUntil > now) {
        const bt = Math.max(0, (blackholeUntil - now) / (BLACKHOLE_TIME * 1000));
        const rad = 80 * Math.sin(Math.min(1, bt) * Math.PI) + 16;
        const grad = ctx.createRadialGradient(blackholeX, blackholeY, 2, blackholeX, blackholeY, rad);
        grad.addColorStop(0, "#000000");
        grad.addColorStop(0.65, "rgba(59,26,92,0.9)");
        grad.addColorStop(1, "rgba(155,93,229,0)");
        ctx.beginPath();
        ctx.arc(blackholeX, blackholeY, rad, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Ball


      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#333";
      ctx.stroke();

      // Power-kick charge meter: a circle growing inside the ball
      {
        let charge = 0;
        for (const p of all) charge = Math.max(charge, p.charge ?? 0);
        if (charge > 0.02) {
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, Math.max(1, BALL_R * charge), 0, Math.PI * 2);
          ctx.fillStyle = charge >= 1 ? "#ffd43b" : "rgba(255, 140, 40, 0.75)";
          ctx.fill();
          if (charge >= 1) {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_R + 3 + Math.sin(now / 90) * 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#ffd43b";
            ctx.stroke();
          }
        }
      }

      // Particles (goal explosions / power-kick burst)
      for (const pt of particles) {
        const a = Math.max(0, pt.life / pt.maxLife);
        ctx.globalAlpha = a;
        if (pt.ring) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.lineWidth = 5;
          ctx.strokeStyle = pt.color;
          ctx.stroke();
        } else if (pt.emoji) {
          ctx.font = `${pt.size}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pt.emoji, pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color;
          ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        }
        ctx.globalAlpha = 1;
      }

      // Countdown overlay
      if (countdown > 0 && !ended) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, FIELD_W, FIELD_H);
        ctx.fillStyle = "white";
        ctx.font = "bold 140px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(Math.ceil(countdown)), FIELD_W / 2, FIELD_H / 2);
      }
      if (ended) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, FIELD_W, FIELD_H);
        ctx.fillStyle = "white";
        ctx.font = "bold 64px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const text =
          winner === "draw" ? "Draw!" : winner === "red" ? "Red wins!" : winner === "blue" ? "Blue wins!" : "";
        ctx.fillText(text, FIELD_W / 2, FIELD_H / 2 - 30);
        ctx.font = "22px sans-serif";
        ctx.fillText(`Final: Red ${scoreRed} - ${scoreBlue} Blue`, FIELD_W / 2, FIELD_H / 2 + 20);
        if (intermission > 0) {
          ctx.font = "bold 28px sans-serif";
          ctx.fillText(`Next game in ${Math.ceil(intermission)}...`, FIELD_W / 2, FIELD_H / 2 + 70);
        }
      }

      ctx.restore();

      // GOAL! banner drawn in screen space (unaffected by the zoom camera)
      if (celebrate > 0) {
        const scorer = celebrateId ? players.get(celebrateId) : undefined;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 90px sans-serif";
        ctx.lineWidth = 8;
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.strokeText("GOAL!", CANVAS_W / 2, 90);
        ctx.fillStyle = "#ffffff";
        ctx.fillText("GOAL!", CANVAS_W / 2, 90);
        if (scorer) {
          ctx.font = "bold 40px sans-serif";
          ctx.lineWidth = 6;
          ctx.strokeStyle = "rgba(0,0,0,0.7)";
          ctx.strokeText(scorer.name, CANVAS_W / 2, 155);
          ctx.fillStyle = scorer.team === "red" ? "#ff6b6b" : "#6ea8ff";
          ctx.fillText(scorer.name, CANVAS_W / 2, 155);
        }
        ctx.restore();
      }
    }


    requestAnimationFrame(tick);

    return () => {
      running = false;
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      channel.send({ type: "broadcast", event: "leave", payload: { id: myId } }).catch(() => {});
      supabase.removeChannel(channel);
    };
  }, []);

  const mm = Math.floor(score.timeLeft / 60);
  const ss = Math.floor(score.timeLeft % 60).toString().padStart(2, "0");

  const joinWith = (t: Exclude<Team, null>) => {
    const trimmed = nameInput.trim().slice(0, 12);
    const finalName = trimmed || `Player ${Math.floor(Math.random() * 999) + 1}`;
    nameRef.current = finalName;
    setShop((prev) => {
      const next = { ...prev, name: finalName };
      shopRef.current = next;
      saveShop(next);
      return next;
    });
    setTeam(t);
    setJoined(true);
    setMenuOpen(false);
  };

  const showMenu = !joined || menuOpen;

  const buyItem = (id: string, price: number) => {
    setShop((prev) => {
      if (prev.owned.includes(id) || prev.money < price) return prev;
      const next = { ...prev, money: prev.money - price, owned: [...prev.owned, id] };
      shopRef.current = next;
      saveShop(next);
      return next;
    });
  };

  const equipItem = (kind: EquipKind, id: string) => {
    setShop((prev) => {
      const next = { ...prev, [kind]: id } as ShopState;
      shopRef.current = next;
      saveShop(next);
      return next;
    });
  };

  const claimQuest = (scope: "daily" | "weekly", questId: string, reward: number) => {
    setQuests((prev) => {
      const board = prev[scope];
      if (board.claimed.includes(questId)) return prev;
      const next = { ...prev, [scope]: { ...board, claimed: [...board.claimed, questId] } };
      questsRef.current = next;
      saveQuests(next);
      return next;
    });
    addMoneyRef.current(reward);
  };

  const AbilityDial = ({ id, frac, armed, roll }: { id: string; frac: number; armed: boolean; roll: number }) => {
    const ability = ABILITIES.find((a) => a.id === id);
    if (!ability) return null;
    const R = 26;
    const C = 2 * Math.PI * R;
    const ready = frac >= 1;
    return (
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
          <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={R}
            fill="none"
            stroke={armed ? "#7dd3fc" : ready ? "#facc15" : "#94a3b8"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
          />
        </svg>
        <div
          className={`absolute inset-[9px] rounded-full flex items-center justify-center text-xl ${
            ready ? "bg-neutral-800" : "bg-neutral-900/80 opacity-50"
          }`}
          title={`${ability.name} — ${ability.description}`}
        >
          {ability.icon}
        </div>
        <span className="absolute -bottom-1 -right-1 h-5 px-1 rounded-full bg-neutral-700 text-[11px] font-bold flex items-center justify-center">
          Q/E
        </span>
        {roll > 0 && (
          <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-yellow-400 text-black text-xs font-black flex items-center justify-center">
            {roll}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-neutral-900 text-white flex flex-col items-center overflow-hidden">
      <div className="flex items-center gap-6 text-2xl font-bold py-2 shrink-0">
        <span className="text-red-400">RED {score.red}</span>
        <span className="text-neutral-300 text-lg tabular-nums">{mm}:{ss}</span>
        <span className="text-blue-400">{score.blue} BLUE</span>
        {joined && (
          <button
            onClick={() => setMenuOpen(true)}
            className="ml-4 px-3 py-1 rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm font-semibold"
          >
            Teams
          </button>
        )}
        {joined && (
          <button
            onClick={() => {
              setQuestsOpen(false);
              setShopOpen(true);
            }}
            className="px-3 py-1 rounded-md bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold"
          >
            Shop
          </button>
        )}
        {joined && (
          <button
            onClick={() => {
              setShopOpen(false);
              setQuestsOpen(true);
            }}
            className="px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold"
          >
            Quests
          </button>
        )}
        <span className="text-sm font-bold text-yellow-400">${shop.money.toLocaleString()}</span>
      </div>
      <div
        className="relative"
        style={{
          width: `min(100vw, calc((100vh - 120px) * ${CANVAS_ASPECT}))`,
          aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ width: "100%", height: "100%", display: "block", borderRadius: 8 }}
        />
        {joined && !shopOpen && !questsOpen && !showMenu && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-4">
            <AbilityDial id={shop.ability} frac={abilityUi.frac} armed={abilityUi.armed} roll={abilityUi.roll} />
          </div>
        )}

        {shopOpen && (
          <ShopPanel
            shop={shop}
            onBuy={buyItem}
            onEquip={equipItem}
            onPreviewAnthem={(a) => playAnthemRef.current(a)}
            onClose={() => setShopOpen(false)}
          />
        )}
        {questsOpen && !shopOpen && (
          <QuestsPanel
            quests={quests}
            money={shop.money}
            onClaim={claimQuest}
            onClose={() => setQuestsOpen(false)}
          />
        )}
        {showMenu && !shopOpen && !questsOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="bg-neutral-800 rounded-xl p-8 shadow-2xl text-center max-w-sm">
              <h1 className="text-3xl font-bold mb-2">Eggball</h1>
              <p className="text-neutral-400 mb-4 text-sm">
                Pick a team to jump in. WASD/arrows to move. X or Space to kick. Q or E for your ability.
              </p>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value.slice(0, 12))}
                maxLength={12}
                placeholder="Your name (optional, max 12)"
                className="w-full px-3 py-2 mb-5 rounded-md bg-neutral-700 text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-white/40 text-center"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => joinWith("red")}
                  className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-400 font-bold"
                >
                  {team === "red" ? "Stay Red" : "Join Red"}
                </button>
                <button
                  onClick={() => joinWith("blue")}
                  className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-400 font-bold"
                >
                  {team === "blue" ? "Stay Blue" : "Join Blue"}
                </button>
              </div>
              {joined && menuOpen && (
                <button
                  onClick={() => setMenuOpen(false)}
                  className="mt-4 text-xs text-neutral-400 hover:text-white underline"
                >
                  Cancel
                </button>
              )}
              <p className="mt-4 text-xs text-neutral-500">
                {connected ? "Connected" : "Connecting..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


