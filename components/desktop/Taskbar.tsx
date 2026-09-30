"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Volume2, VolumeX, Wifi } from "lucide-react";
import { appsFor, type AppId } from "@/data/apps";
import { LOCALES, type Lang } from "@/lib/i18n";
import { useLang, useStrings } from "@/lib/language";
import { setMuted, setVolume, sounds, useSoundSettings } from "@/lib/sounds";
import type { WinState } from "@/lib/windowManager";
import { XpFlag } from "@/components/ui/glyphs";
import LanguageBar from "./LanguageBar";

interface TaskbarProps {
  windows: WinState[];
  activeId: AppId | null;
  titles: Partial<Record<AppId, string>>;
  startOpen: boolean;
  onStart: () => void;
  onTask: (id: AppId) => void;
  onLaunch: (id: AppId) => void;
  onShowDesktop: () => void;
  /** Balloon tip anchored above the tray */
  balloon?: ReactNode;
}

/** 2:05 PM in English, 14.05 in Danish, as each XP showed it */
function useClock(lang: Lang) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);
  const locale = LOCALES[lang];
  return {
    time: now?.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }) ?? "",
    date: now?.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) ?? "",
  };
}

export default function Taskbar({ windows, activeId, titles, startOpen, onStart, onTask, onLaunch, onShowDesktop, balloon }: TaskbarProps) {
  const lang = useLang();
  const t = useStrings().taskbar;
  const apps = appsFor(lang);
  const { time, date } = useClock(lang);

  return (
    <div className="xp-taskbar absolute bottom-0 left-0 z-30 flex h-[30px] w-full items-center text-[11px] text-white">
      <button type="button" className="xp-start-btn shrink-0" aria-expanded={startOpen} aria-haspopup="menu" onClick={onStart}>
        <XpFlag size={20} />
        start
      </button>

      {/* Quick Launch */}
      <div className="ml-1 hidden items-center gap-0.5 border-r border-white/20 pr-1 sm:flex">
        <button type="button" className="xp-quicklaunch-btn" title={t.showDesktop} aria-label={t.showDesktop} onClick={onShowDesktop}>
          <ShowDesktopIcon />
        </button>
        {(["ie", "contact"] as const).map((id) => (
          <button key={id} type="button" className="xp-quicklaunch-btn" title={apps[id].label} aria-label={apps[id].label} onClick={() => onLaunch(id)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={apps[id].icon} alt="" width={18} height={18} draggable={false} />
          </button>
        ))}
      </div>

      <div className="xp-taskbar-apps flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1.5">
        {windows.map((w) => {
          const title = titles[w.id] ?? apps[w.id].title;
          return (
            <button
              key={w.id}
              type="button"
              aria-pressed={activeId === w.id && !w.min}
              className="xp-taskbtn min-w-[36px] max-w-[170px] shrink-0 sm:min-w-[120px]"
              title={title}
              onClick={() => onTask(w.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={apps[w.id].icon} alt="" width={16} height={16} className="shrink-0" draggable={false} />
              {/* Phones: with 3+ windows there's only room for icons */}
              <span className={`truncate ${windows.length > 2 ? "max-sm:hidden" : ""}`}>{title}</span>
            </button>
          );
        })}
      </div>

      <div className="xp-systray relative flex h-full shrink-0 items-center gap-2 whitespace-nowrap px-2.5">
        {balloon}
        <LanguageBar />
        <Wifi className="h-3.5 w-3.5 text-white/90" aria-label={t.online} />
        <VolumeControl />
        <span className="tabular-nums" title={date}>
          {time}
        </span>
      </div>
    </div>
  );
}

function ShowDesktopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="1.5" y="2.5" width="15" height="11" rx="1" fill="#3a78e0" stroke="#fff" />
      <rect x="3" y="4" width="12" height="6" fill="#8fd16a" />
      <rect x="3" y="10" width="12" height="2" fill="#4c8be8" />
      <path d="M6 16h6" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

/** The tray speaker: click for the XP volume popup with a slider and Mute checkbox */
function VolumeControl() {
  const t = useStrings().taskbar;
  const { volume, muted } = useSoundSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const Icon = muted || volume === 0 ? VolumeX : Volume2;

  return (
    <div ref={ref} className="relative flex items-center">
      <button type="button" className="grid place-items-center" aria-label={muted ? t.volumeMuted : t.volume} aria-expanded={open} title={t.volume} onClick={() => setOpen((o) => !o)}>
        <Icon className="h-3.5 w-3.5 text-white/90" />
      </button>
      {open && (
        <div className="absolute bottom-[26px] right-[-40px] z-50 flex w-[74px] flex-col items-center gap-2 border border-[#aca899] bg-[var(--xp-face)] px-2 py-2 text-[11px] text-black shadow-[2px_2px_4px_rgba(0,0,0,0.35)]">
          <span>{t.volume}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            aria-label={t.volume}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            onPointerUp={() => sounds.click()}
            className="h-[90px] w-5 cursor-pointer accent-[#316ac5] [direction:rtl] [writing-mode:vertical-lr]"
          />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} />
            {t.mute}
          </label>
        </div>
      )}
    </div>
  );
}
