"use client";

import { useEffect } from "react";

export default function SafeToTurnOff({ onPowerOn }: { onPowerOn: () => void }) {
  useEffect(() => {
    // Delay so the click that chose "Turn Off" doesn't immediately power back on
    const t = setTimeout(() => {
      window.addEventListener("keydown", onPowerOn, { once: true });
      window.addEventListener("pointerdown", onPowerOn, { once: true });
    }, 600);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onPowerOn);
      window.removeEventListener("pointerdown", onPowerOn);
    };
  }, [onPowerOn]);

  return (
    <div className="fixed inset-0 z-[9999] flex cursor-pointer flex-col items-center justify-center gap-6 bg-black px-6 text-center">
      <p className="text-[clamp(18px,3.2vw,32px)] font-bold tracking-wide text-[#ff8c00] [font-family:Arial,sans-serif]">It&apos;s now safe to turn off your computer.</p>
      <p className="text-[12px] text-white/35">Press any key or click to start again</p>
    </div>
  );
}
