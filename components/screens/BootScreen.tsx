"use client";

import { useEffect, useRef, useState } from "react";
import { XpFlag } from "@/components/ui/glyphs";

const BOOT_MS = 3000;
const FADE_MS = 450;

/** XP-style boot screen. Any key, click or tap skips it. */
export default function BootScreen({ onFinished }: { onFinished: () => void }) {
  const [fading, setFading] = useState(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    const skip = () => setFading(true);
    const t = setTimeout(skip, BOOT_MS);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => onFinishedRef.current(), FADE_MS);
    return () => clearTimeout(t);
  }, [fading]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex cursor-wait flex-col items-center justify-center bg-black transition-opacity ${fading ? "opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      role="status"
      aria-label="Starting Portfolio XP"
    >
      <div className="flex flex-col items-center gap-5">
        <p className="text-sm uppercase tracking-[0.35em] text-white/50">Bekir Saliv</p>
        <div className="flex items-center gap-4">
          <XpFlag size={56} />
          <div>
            <p className="text-2xl font-bold tracking-wide text-white">
              Portfolio<span className="ml-1.5 font-extrabold italic text-[#FF6600]">XP</span>
            </p>
            <p className="text-xs tracking-[0.15em] text-white/40">Developer Edition</p>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/xp-loading.gif" alt="" className="mt-6" draggable={false} />
      </div>
      <p className="absolute bottom-6 text-[11px] text-white/35">Press any key or click to skip</p>
    </div>
  );
}
