"use client";

import { useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { APPS, CORNER_ICON, DESKTOP_ICONS, RECYCLE_EMPTY_ICON, type AppId } from "@/data/apps";
import { TASKBAR_H, type Viewport } from "@/lib/windowManager";

export interface Pos {
  x: number;
  y: number;
}
export type Positions = Record<AppId, Pos>;

export const ICON_W = 76;
export const ICON_H = 80;
const GRID = 10;
export const ALL_ICONS: AppId[] = [...DESKTOP_ICONS, CORNER_ICON];

/** Icons in columns from the top-left (wrapping above the taskbar), Recycle Bin in the bottom-right */
export function defaultPositions(vp: Viewport): Positions {
  const startX = 10;
  const startY = 10;
  const stepX = 84;
  const stepY = 88;
  const perCol = Math.max(1, Math.floor((vp.height - TASKBAR_H - startY - ICON_H) / stepY) + 1);
  const pos = {} as Positions;
  DESKTOP_ICONS.forEach((id, i) => {
    pos[id] = { x: startX + Math.floor(i / perCol) * stepX, y: startY + (i % perCol) * stepY };
  });
  pos[CORNER_ICON] = { x: Math.max(startX, vp.width - ICON_W - 10), y: Math.max(startY, vp.height - TASKBAR_H - ICON_H - 6) };
  return pos;
}

export function positionsFit(pos: Partial<Positions>, vp: Viewport): pos is Positions {
  return ALL_ICONS.every((id) => {
    const p = pos[id];
    return p && p.x >= 0 && p.y >= 0 && p.x + ICON_W <= vp.width && p.y + ICON_H <= vp.height - TASKBAR_H;
  });
}

/** The icon nearest in the arrow key's direction */
function neighbour(from: AppId, key: string, positions: Positions): AppId | null {
  const a = positions[from];
  let best: AppId | null = null;
  let bestScore = Infinity;
  for (const id of ALL_ICONS) {
    if (id === from) continue;
    const b = positions[id];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const along = key === "ArrowRight" ? dx : key === "ArrowLeft" ? -dx : key === "ArrowDown" ? dy : -dy;
    const across = key === "ArrowRight" || key === "ArrowLeft" ? Math.abs(dy) : Math.abs(dx);
    if (along <= 0) continue;
    const score = along + across * 2;
    if (score < bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

interface DesktopIconsProps {
  positions: Positions;
  selected: AppId | null;
  binEmpty: boolean;
  onPositions: (next: Positions, persist: boolean) => void;
  onSelect: (id: AppId | null) => void;
  onOpen: (id: AppId) => void;
  onMenu: (id: AppId, x: number, y: number) => void;
}

type Drag = { id: AppId; startX: number; startY: number; orig: Pos; moved: boolean; touch: boolean; timer?: ReturnType<typeof setTimeout> };

export default function DesktopIcons({ positions, selected, binEmpty, onPositions, onSelect, onOpen, onMenu }: DesktopIconsProps) {
  const drag = useRef<Drag | null>(null);
  const latest = useRef(positions);
  latest.current = positions;
  const buttons = useRef<Partial<Record<AppId, HTMLButtonElement | null>>>({});
  const tapped = useRef<AppId | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, id: AppId) => {
    if (e.button !== 0) return;
    onSelect(id);
    e.currentTarget.setPointerCapture(e.pointerId);
    const touch = e.pointerType !== "mouse";
    const { clientX, clientY } = e;
    drag.current = { id, startX: clientX, startY: clientY, orig: { ...positions[id] }, moved: false, touch };
    // Touch screens have no right-click: long-press an icon for its menu
    if (touch) {
      drag.current.timer = setTimeout(() => {
        if (drag.current && !drag.current.moved) {
          drag.current = null;
          onMenu(id, clientX, clientY);
        }
      }, 550);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    // Fingers wobble more than a mouse, so a touch needs a bigger move to count as a drag
    if (Math.abs(dx) > (d.touch ? 8 : 3) || Math.abs(dy) > (d.touch ? 8 : 3)) {
      d.moved = true;
      clearTimeout(d.timer);
    }
    if (!d.moved) return;
    const snap = (v: number) => (e.altKey ? v : Math.round(v / GRID) * GRID);
    onPositions({ ...latest.current, [d.id]: { x: Math.max(0, snap(d.orig.x + dx)), y: Math.max(0, snap(d.orig.y + dy)) } }, false);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    clearTimeout(d.timer);
    if (d.moved) onPositions(latest.current, true);
    // Touch screens have no double-click, so a tap that didn't drag opens the app (on the click that follows)
    tapped.current = d.touch && !d.moved && e.type === "pointerup" ? d.id : null;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, id: AppId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onOpen(id);
    } else if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      const next = neighbour(id, e.key, positions);
      if (next) {
        onSelect(next);
        buttons.current[next]?.focus();
      }
    } else if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      onMenu(id, r.left + r.width / 2, r.top + r.height / 2);
    }
  };

  const focusable = selected ?? ALL_ICONS[0];

  return (
    <div role="group" aria-label="Desktop">
      {ALL_ICONS.map((id) => {
        const pos = positions[id];
        const isSelected = selected === id;
        const icon = id === "recycle" && binEmpty ? RECYCLE_EMPTY_ICON : APPS[id].icon;
        return (
          <button
            key={id}
            ref={(el) => {
              buttons.current[id] = el;
            }}
            type="button"
            tabIndex={id === focusable ? 0 : -1}
            aria-label={`${APPS[id].label}. Press Enter to open.`}
            className="xp-icon absolute flex touch-none flex-col items-center [-webkit-touch-callout:none]"
            style={{ left: pos.x, top: pos.y, width: ICON_W }}
            onPointerDown={(e) => onPointerDown(e, id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={() => {
              if (tapped.current !== id) return;
              tapped.current = null;
              onOpen(id);
            }}
            onDoubleClick={() => onOpen(id)}
            onKeyDown={(e) => onKeyDown(e, id)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(id);
              onMenu(id, e.clientX, e.clientY);
            }}
          >
            <span className="relative block h-10 w-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon} alt="" width={40} height={40} className="h-10 w-10" draggable={false} />
              {/* XP tints a selected icon blue; the mask limits the tint to the icon's own pixels */}
              {isSelected && (
                <span
                  className="absolute inset-0 bg-[#0b3bb4]/45"
                  style={{ maskImage: `url("${icon}")`, maskSize: "contain", WebkitMaskImage: `url("${icon}")`, WebkitMaskSize: "contain" }}
                  aria-hidden="true"
                />
              )}
            </span>
            <span className={`xp-icon-label mt-1 max-w-full break-words px-0.5 text-center text-[11px] leading-tight text-white ${isSelected ? "bg-[var(--xp-select)] [text-shadow:none]" : ""}`}>
              {APPS[id].label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
