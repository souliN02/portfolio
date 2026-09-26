"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";

export type MenuItem =
  | { separator: true }
  | { separator?: false; label: string; onClick: () => void; icon?: ComponentType<{ className?: string }>; bold?: boolean; disabled?: boolean };

interface MenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
  /** Size of the area the menu must stay inside */
  bounds: { width: number; height: number };
}

/** Right-click menu that stays on screen, closes on Escape or outside click, and supports arrow keys */
export default function Menu({ x, y, items, onClose, bounds }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setPos({
      x: Math.max(0, Math.min(x, bounds.width - el.offsetWidth)),
      y: Math.max(0, Math.min(y, bounds.height - el.offsetHeight)),
    });
  }, [x, y, bounds.width, bounds.height]);

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    // Registered on the next tick so the click that opened the menu doesn't close it
    const t = setTimeout(() => document.addEventListener("pointerdown", away), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", away);
    };
  }, [onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const buttons = [...(ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? (i + 1) % buttons.length : (i - 1 + buttons.length) % buttons.length;
      buttons[next]?.focus();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      role="menu"
      className="xp-menu absolute z-[60]"
      style={{ left: pos.x, top: pos.y }}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={`sep-${i}`} className="xp-menu-sep" role="separator" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={`xp-menu-item ${item.bold ? "font-bold" : ""}`}
            onClick={() => {
              onClose();
              item.onClick();
            }}
          >
            <span className="grid w-4 place-items-center">{item.icon && <item.icon className="h-3.5 w-3.5" />}</span>
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
