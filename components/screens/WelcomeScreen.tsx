"use client";

import { useEffect, useRef } from "react";
import { Power } from "lucide-react";
import { profileFor } from "@/data/profile";
import { useLang, useStrings } from "@/lib/language";
import { XpFlag } from "@/components/ui/glyphs";

export type WelcomeMode = "login" | "welcome" | "loggingOff" | "shuttingDown";

interface WelcomeScreenProps {
  mode: WelcomeMode;
  onLogin: () => void;
  onTurnOff: () => void;
}

/**
 * The XP Welcome screen. Clicking the user tile counts as a user gesture,
 * which is what lets the browser play the startup sound.
 */
export default function WelcomeScreen({ mode, onLogin, onTurnOff }: WelcomeScreenProps) {
  const tile = useRef<HTMLButtonElement>(null);
  const lang = useLang();
  const t = useStrings().welcome;
  const profile = profileFor(lang);
  useEffect(() => {
    if (mode === "login") tile.current?.focus({ preventScroll: true });
  }, [mode]);

  return (
    <div className="fixed inset-0 z-[9998] flex select-none flex-col bg-[#5a7edc] text-white [font-family:var(--xp-font)]">
      {/* Top band */}
      <div className="relative h-[10vh] min-h-[48px] shrink-0 bg-[#00309c]">
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#a8c1f0] to-transparent" />
      </div>

      {/* Middle */}
      <main className="relative flex flex-1 items-center overflow-hidden bg-[radial-gradient(circle_at_18%_22%,#9db9f2_0%,#6d8fe3_30%,#5a7edc_60%)]">
        {mode === "login" ? (
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center gap-8 px-6 md:flex-row md:gap-0">
            <div className="flex flex-col items-center gap-3 md:w-1/2 md:items-end md:pr-10">
              <div className="flex items-center gap-3">
                <XpFlag size={64} />
                <p className="text-[34px] font-bold leading-none [text-shadow:1px_2px_3px_rgba(0,0,0,0.25)]">
                  Portfolio<span className="ml-1 italic text-[#ff8a1a]">XP</span>
                </p>
              </div>
              <p className="text-[15px] text-white/95 md:text-right">{t.begin}</p>
            </div>

            <div className="hidden h-[300px] w-px bg-gradient-to-b from-transparent via-white/70 to-transparent md:block" aria-hidden="true" />

            <div className="md:w-1/2 md:pl-10">
              <button
                ref={tile}
                type="button"
                onClick={onLogin}
                className="group flex items-center gap-4 rounded-l-[10px] py-2 pl-2 pr-10 text-left outline-none transition-colors hover:bg-gradient-to-r hover:from-[#1c47b8] hover:to-transparent focus-visible:bg-gradient-to-r focus-visible:from-[#1c47b8] focus-visible:to-transparent"
              >
                <span className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-[6px] border-[3px] border-white/85 bg-gradient-to-br from-white to-[#cfe0fb] shadow-md transition-colors group-hover:border-[#ffcf40] group-focus-visible:border-[#ffcf40]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/xp-icons/User 1.ico" alt="" width={48} height={48} draggable={false} />
                </span>
                <span>
                  <span className="block text-[22px] leading-tight [text-shadow:1px_1px_2px_rgba(0,0,0,0.3)]">{profile.name}</span>
                  <span className="block text-[12px] text-white/85">{profile.role}</span>
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[900px] items-center px-6">
            <p className={`md:w-1/2 md:pr-10 md:text-right ${mode === "welcome" ? "text-[56px] italic" : "text-[26px]"} font-bold [text-shadow:1px_2px_4px_rgba(0,0,0,0.3)]`} role="status">
              {t[mode]}
            </p>
          </div>
        )}
      </main>

      {/* Bottom band */}
      <div className="relative flex h-[10vh] min-h-[56px] shrink-0 items-center justify-between gap-4 bg-[#00309c] px-5">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#e88d3a] to-transparent" />
        {mode === "login" ? (
          <>
            <button type="button" onClick={onTurnOff} className="flex items-center gap-2 text-[13px] outline-none hover:underline focus-visible:underline">
              <span className="grid h-[26px] w-[26px] place-items-center rounded-[4px] border border-white/80 bg-gradient-to-b from-[#f08a6a] to-[#c9321a]">
                <Power className="h-4 w-4" />
              </span>
              {t.turnOff}
            </button>
            <p className="hidden max-w-[360px] text-right text-[11px] leading-snug text-white/85 sm:block">
              {t.hint}
            </p>
          </>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
