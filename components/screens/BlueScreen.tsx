"use client";

import { useEffect, useRef, useState } from "react";
import { PROFILE } from "@/data/profile";
import { useStrings } from "@/lib/language";
import type { Crash } from "@/lib/terminal";
import { isTouchDevice, prefersReducedMotion } from "@/lib/viewport";

/** XP's own codes and parameters for the two stop errors the terminal can cause */
const STOP_CODES: Record<Crash["stop"], string> = {
  CRITICAL_OBJECT_TERMINATION: "0x000000F4 (0x00000003,0x86F2A020,0x86F2A194,0x805C6E60)",
  UNMOUNTABLE_BOOT_VOLUME: "0x000000ED (0x86C2E030,0xC0000032,0x00000000,0x00000000)",
};
const DUMP_MS = 2600;

/** The XP blue screen, after `format c:` or `taskkill /im explorer.exe`. Once the memory dump finishes, any key or tap restarts */
export default function BlueScreen({ crash, onRestart }: { crash: Crash; onRestart: () => void }) {
  const t = useStrings().bsod;
  const [dumped, setDumped] = useState(0);
  const [touch] = useState(isTouchDevice);
  const ref = useRef<HTMLDivElement>(null);
  const onRestartRef = useRef(onRestart);
  onRestartRef.current = onRestart;
  const done = dumped >= 100;

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    if (prefersReducedMotion()) {
      setDumped(100);
      return;
    }
    const start = performance.now();
    const timer = setInterval(() => {
      const pct = Math.min(100, Math.floor(((performance.now() - start) / DUMP_MS) * 100));
      setDumped(pct);
      if (pct >= 100) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  // Only after the dump, so the keystrokes that caused the crash can't skip straight past it
  useEffect(() => {
    if (!done) return;
    const restart = () => onRestartRef.current();
    window.addEventListener("keydown", restart, { once: true });
    window.addEventListener("pointerdown", restart, { once: true });
    return () => {
      window.removeEventListener("keydown", restart);
      window.removeEventListener("pointerdown", restart);
    };
  }, [done]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alertdialog"
      aria-modal="true"
      aria-label={t.label}
      className="fixed inset-0 z-[9999] cursor-none select-none overflow-y-auto bg-[#0000aa] px-[clamp(12px,3vw,48px)] py-[clamp(16px,4vh,48px)] font-['Lucida_Console','Courier_New',monospace] text-[clamp(11px,2vw,26px)] leading-[1.3] text-white outline-none [overflow-wrap:anywhere]"
    >
      <div className="space-y-[1.3em]">
        <p>{t.detected}</p>
        <p>{t.cause(crash.file)}</p>
        <p>{crash.stop}</p>
        <p>{t.firstTime}</p>
        <p>{crash.stop === "UNMOUNTABLE_BOOT_VOLUME" ? t.stepFormat : t.stepKill(crash.file)}</p>
        <p>{t.technical}</p>
        <p>*** STOP: {STOP_CODES[crash.stop]}</p>
        <div aria-live="polite">
          <p>{t.beginDump}</p>
          <p className="whitespace-pre">
            {t.dumping} {String(dumped).padStart(3)}
          </p>
          {done && (
            <>
              <p>{t.dumpDone}</p>
              <p>{t.contact(PROFILE.email)}</p>
            </>
          )}
        </div>
        {done && (
          <p>
            {t.restart(touch)}
            <span className="terminal-cursor">_</span>
          </p>
        )}
      </div>
    </div>
  );
}
