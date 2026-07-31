// Shared skin / flag renderer used by both the game canvas and the shop preview.

export interface FlagSpec {
  type: "bands" | "vbands" | "circle" | "cross" | "canton" | "diagonal" | "diamond";
  colors: string[];
  /** primary accent (circle, cross, canton fill, diamond) */
  accent?: string;
  /** secondary accent (canton cross, diamond inner disc) */
  accent2?: string;
}

export interface DrawableSkin {
  color: string;
  flag?: FlagSpec;
}

/** Draws a circular ball skin centred at (x, y) with radius r. */
export function drawSkin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  skin: DrawableSkin,
  fallback = "#e23c3c",
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const left = x - r;
  const top = y - r;
  const size = r * 2;
  const f = skin.flag;

  ctx.fillStyle = skin.color || fallback;
  ctx.fillRect(left, top, size, size);

  if (f) {
    const c = f.colors;
    if (f.type === "bands") {
      const h = size / c.length;
      c.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(left, top + i * h, size, h + 0.6);
      });
    } else if (f.type === "vbands") {
      const w = size / c.length;
      c.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(left + i * w, top, w + 0.6, size);
      });
    } else if (f.type === "circle") {
      ctx.fillStyle = c[0];
      ctx.fillRect(left, top, size, size);
      if (c[1]) {
        // optional top/bottom bands behind the disc (e.g. India, Niger)
        const h = size / c.length;
        c.forEach((col, i) => {
          ctx.fillStyle = col;
          ctx.fillRect(left, top + i * h, size, h + 0.6);
        });
      }
      ctx.beginPath();
      ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = f.accent ?? "#bc002d";
      ctx.fill();
    } else if (f.type === "cross") {
      ctx.fillStyle = c[0];
      ctx.fillRect(left, top, size, size);
      const cx = left + size * 0.38;
      const bar = size * 0.26;
      if (f.accent2) {
        ctx.fillStyle = f.accent2;
        ctx.fillRect(cx - bar * 0.78, top, bar * 1.56, size);
        ctx.fillRect(left, y - bar * 0.78, size, bar * 1.56);
      }
      ctx.fillStyle = f.accent ?? "#ffffff";
      ctx.fillRect(cx - bar / 2, top, bar, size);
      ctx.fillRect(left, y - bar / 2, size, bar);
    } else if (f.type === "canton") {
      const h = size / c.length;
      c.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(left, top + i * h, size, h + 0.6);
      });
      const cw = size * 0.5;
      const ch = size * 0.45;
      ctx.fillStyle = f.accent ?? "#00247d";
      ctx.fillRect(left, top, cw, ch);
      if (f.accent2) {
        ctx.strokeStyle = f.accent2;
        ctx.lineWidth = Math.max(1.2, size * 0.06);
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left + cw, top + ch);
        ctx.moveTo(left + cw, top);
        ctx.lineTo(left, top + ch);
        ctx.stroke();
        ctx.lineWidth = Math.max(1.6, size * 0.08);
        ctx.beginPath();
        ctx.moveTo(left + cw / 2, top);
        ctx.lineTo(left + cw / 2, top + ch);
        ctx.moveTo(left, top + ch / 2);
        ctx.lineTo(left + cw, top + ch / 2);
        ctx.stroke();
      }
    } else if (f.type === "diagonal") {
      ctx.fillStyle = c[0];
      ctx.fillRect(left, top, size, size);
      ctx.beginPath();
      ctx.moveTo(left, top + size);
      ctx.lineTo(left + size, top);
      ctx.lineTo(left + size, top + size);
      ctx.closePath();
      ctx.fillStyle = c[1] ?? "#ffffff";
      ctx.fill();
    } else if (f.type === "diamond") {
      ctx.fillStyle = c[0];
      ctx.fillRect(left, top, size, size);
      ctx.beginPath();
      ctx.moveTo(x, top + size * 0.08);
      ctx.lineTo(left + size * 0.92, y);
      ctx.lineTo(x, top + size * 0.92);
      ctx.lineTo(left + size * 0.08, y);
      ctx.closePath();
      ctx.fillStyle = f.accent ?? "#ffdf00";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = f.accent2 ?? "#002776";
      ctx.fill();
    }
  }

  ctx.restore();
}
