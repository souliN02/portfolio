"use client";

import { useEffect, useRef } from "react";
import { isRed, rankLabel, type Card } from "@/lib/cards";
import { SUIT_COLOR, SUIT_PATHS } from "./Card";

interface Source {
  x: number;
  y: number;
  cards: Card[];
}

interface WinCascadeProps {
  width: number;
  height: number;
  cw: number;
  ch: number;
  /** The foundations, bottom card first */
  sources: Source[];
  onDone: () => void;
}

const STEP_MS = 1000 / 60;

function drawCard(ctx: CanvasRenderingContext2D, card: Card, w: number, h: number) {
  const r = Math.max(3, w * 0.06);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(0.5, 0.5, w - 1, h - 1, r);
  else ctx.rect(0.5, 0.5, w - 1, h - 1);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#4a4a4a";
  ctx.stroke();

  const color = isRed(card.suit) ? SUIT_COLOR.red : SUIT_COLOR.black;
  const corner = Math.max(9, Math.round(w * 0.2));
  const suit = new Path2D(SUIT_PATHS[card.suit]);
  const drawSuit = (x: number, y: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 24, size / 24);
    ctx.fill(suit);
    ctx.restore();
  };
  ctx.fillStyle = color;
  ctx.font = `bold ${corner}px Tahoma, Verdana, sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  const cx = Math.max(1, w * 0.03) + corner * 0.58;
  ctx.fillText(rankLabel(card.rank), cx, Math.max(2, w * 0.04));
  drawSuit(cx - corner * 0.4, Math.max(2, w * 0.04) + corner + 1, corner * 0.8);
  const big = w * (card.rank === 1 ? 0.5 : 0.4);
  drawSuit((w - big) / 2, (h - big) / 2 + (w < 50 ? h * 0.1 : 0), big);
}

/** XP Solitaire's victory: the cards leap off the foundations one by one, bouncing and leaving trails */
export default function WinCascade({ width, height, cw, ch, sources, onDone }: WinCascadeProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.scale(dpr, dpr);

    // Each card is drawn once to its own small canvas, then stamped along its path
    const art = (card: Card) => {
      const c = document.createElement("canvas");
      c.width = Math.ceil(cw * dpr);
      c.height = Math.ceil(ch * dpr);
      const g = c.getContext("2d")!;
      g.scale(dpr, dpr);
      drawCard(g, card, cw, ch);
      return c;
    };

    // Kings first, round-robin across the four foundations
    const queue: { card: Card; x: number; y: number }[] = [];
    for (let rank = 12; rank >= 0; rank--) {
      for (const s of sources) {
        const card = s.cards[rank];
        if (card) queue.push({ card, x: s.x, y: s.y });
      }
    }

    let next = 0;
    const launch = () => {
      const q = queue[next++];
      if (!q) return null;
      const dir = Math.random() < 0.5 ? -1 : 1;
      return { image: art(q.card), x: q.x, y: q.y, vx: dir * (2 + Math.random() * 5), vy: -Math.random() * 9 };
    };

    let card = launch();
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const frame = (now: number) => {
      acc += Math.min(100, now - last);
      last = now;
      while (acc >= STEP_MS && card) {
        acc -= STEP_MS;
        card.vy += 0.7;
        card.x += card.vx;
        card.y += card.vy;
        if (card.y + ch > height) {
          card.y = height - ch;
          card.vy = -card.vy * 0.78;
        }
        ctx.drawImage(card.image, card.x, card.y, cw, ch);
        if (card.x < -cw || card.x > width) card = launch();
      }
      if (!card) return done.current();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // Runs once per win; the table is frozen while it plays
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute left-0 top-0 z-40 cursor-pointer"
      style={{ width, height }}
      onPointerDown={() => done.current()}
      aria-label="You won! Click to continue."
      role="img"
    />
  );
}
