"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const TRAIL = 14;
const VERTICES = 4;

/** Mystify: two bouncing polygons with fading trails. Any input wakes the desktop. */
export default function Screensaver({ onWake }: { onWake: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const speed = () => (1.2 + Math.random() * 2.2) * (Math.random() < 0.5 ? -1 : 1);
    const shapes = [0, 1].map((i) => ({
      hue: i * 180,
      pts: Array.from({ length: VERTICES }, (): Point => ({ x: Math.random() * w, y: Math.random() * h, vx: speed(), vy: speed() })),
      trail: [] as { x: number; y: number }[][],
    }));

    let frame = 0;
    const tick = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      for (const s of shapes) {
        for (const p of s.pts) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
        s.trail.unshift(s.pts.map(({ x, y }) => ({ x, y })));
        if (s.trail.length > TRAIL) s.trail.pop();
        s.hue = (s.hue + 0.4) % 360;
        s.trail.forEach((pts, i) => {
          ctx.strokeStyle = `hsla(${s.hue}, 90%, 60%, ${1 - i / TRAIL})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          pts.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          ctx.closePath();
          ctx.stroke();
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // Ignore the tiny jitter a resting mouse can produce
    let origin: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      origin ??= { x: e.clientX, y: e.clientY };
      if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 12) onWake();
    };
    const wake = () => onWake();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    window.addEventListener("wheel", wake);
    window.addEventListener("touchstart", wake);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("wheel", wake);
      window.removeEventListener("touchstart", wake);
    };
  }, [onWake]);

  return <canvas ref={canvas} className="fixed inset-0 z-[100] h-full w-full cursor-none bg-black" aria-label="Screensaver. Move the mouse or press a key to return." role="img" />;
}
