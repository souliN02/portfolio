"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { LANG_NAMES } from "@/data/ui";
import { LANGS, type Lang } from "@/lib/i18n";
import { setLang, useLang, useStrings } from "@/lib/language";
import { sounds } from "@/lib/sounds";

/** XP's language bar, minimized to the tray: EN or DA, and a click lists both */
export default function LanguageBar() {
  const lang = useLang();
  const t = useStrings().langBar;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const close = () => {
    setOpen(false);
    button.current?.focus({ preventScroll: true });
  };

  const choose = (next: Lang) => {
    sounds.click();
    setLang(next);
    close();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = [...(ref.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
      const i = items.indexOf(document.activeElement as HTMLElement);
      items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    }
  };

  return (
    <div ref={ref} className="relative flex items-center" onKeyDown={onKeyDown}>
      <button
        ref={button}
        type="button"
        className="xp-langbar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.label}: ${LANG_NAMES[lang].name}`}
        title={LANG_NAMES[lang].name}
        onClick={() => setOpen((o) => !o)}
      >
        {LANG_NAMES[lang].code}
      </button>
      {open && (
        <div role="menu" aria-label={t.label} className="xp-menu absolute bottom-[26px] right-[-8px] z-50 whitespace-normal">
          {LANGS.map((l) => (
            <button key={l} type="button" role="menuitemradio" aria-checked={l === lang} className="xp-menu-item whitespace-nowrap" onClick={() => choose(l)}>
              <span className="grid w-3 place-items-center" aria-hidden="true">
                {l === lang ? "✓" : ""}
              </span>
              <span className="xp-langbar-code" aria-hidden="true">
                {LANG_NAMES[l].code}
              </span>
              <span lang={l}>{LANG_NAMES[l].name}</span>
            </button>
          ))}
          <div className="xp-menu-sep" role="separator" />
          <p className="max-w-[220px] px-2 pb-1 pt-0.5 text-[#6d6d6d]">{t.note}</p>
        </div>
      )}
    </div>
  );
}
