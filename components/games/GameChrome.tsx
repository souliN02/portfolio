"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import Menu, { type MenuItem } from "@/components/ui/Menu";
import { StatusBar } from "@/components/windows/ExplorerChrome";

/* The parts every XP game window shares: a working Game/Help menu bar, undo history, a timer and shortcuts */

export interface GameMenu {
  label: string;
  items: MenuItem[];
}

interface GameShellProps {
  menus: GameMenu[];
  /** Status bar panes */
  status?: ReactNode;
  children: ReactNode;
  rootRef?: RefObject<HTMLDivElement | null>;
}

export function GameShell({ menus, status, children, rootRef }: GameShellProps) {
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = rootRef ?? ownRef;
  const [open, setOpen] = useState<{ index: number; x: number; y: number } | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const size = { width: ref.current?.clientWidth ?? 0, height: ref.current?.clientHeight ?? 0 };

  return (
    <div ref={ref} className="relative flex h-full w-full flex-col bg-[var(--xp-face)] text-[11px]">
      <div className="xp-menubar shrink-0" role="menubar">
        {menus.map((m, i) => (
          <button
            key={m.label}
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open?.index === i}
            className={`xp-menubar-btn ${open?.index === i ? "xp-menubar-btn-open" : ""}`}
            // The menu closes on any press outside it; this press should toggle, not reopen
            onPointerDown={(e) => open && e.nativeEvent.stopPropagation()}
            onClick={(e) => {
              if (open?.index === i) return setOpen(null);
              const b = e.currentTarget;
              setOpen({ index: i, x: b.offsetLeft, y: b.offsetTop + b.offsetHeight });
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
      {status && <StatusBar>{status}</StatusBar>}
      {open && <Menu x={open.x} y={open.y} items={menus[open.index]!.items} bounds={size} onClose={close} />}
    </div>
  );
}

/** Size of an element, kept up to date as the window is resized or the phone rotates */
export function useElementSize<T extends HTMLElement>(): [RefObject<T | null>, { width: number; height: number }] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize((s) => (s.width === el.clientWidth && s.height === el.clientHeight ? s : { width: el.clientWidth, height: el.clientHeight }));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

/**
 * Game states with undo. `commit` records a move; `replace` changes the
 * current state without a new undo step (for automatic follow-up moves,
 * so one Undo takes back the player's move and everything it triggered).
 */
export function useHistory<T>(init: () => T) {
  const [h, setH] = useState(() => ({ past: [] as T[], present: init() }));
  const commit = useCallback((next: T) => setH((s) => (next === s.present ? s : { past: [...s.past.slice(-199), s.present], present: next })), []);
  const replace = useCallback((next: (present: T) => T) => setH((s) => ({ ...s, present: next(s.present) })), []);
  const undo = useCallback(() => setH((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1]! } : s)), []);
  const reset = useCallback((next: T) => setH({ past: [], present: next }), []);
  return { state: h.present, canUndo: h.past.length > 0, commit, replace, undo, reset };
}

/** Seconds since `running` became true, capped at 999 like XP's counters */
export function useStopwatch(running: boolean, resetKey: unknown) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => setSeconds(0), [resetKey]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => Math.min(999, s + 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  return seconds;
}

/** F2 for a new game and Ctrl+Z to undo, while focus is inside this game's window */
export function useGameKeys(rootRef: RefObject<HTMLElement | null>, keys: { newGame: () => void; undo?: () => void; extra?: Record<string, () => void> }) {
  const latest = useRef(keys);
  latest.current = keys;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const win = rootRef.current?.closest(".xp-window");
      if (!win?.contains(document.activeElement) || (e.target as HTMLElement).closest("input, textarea")) return;
      const k = latest.current;
      if (e.key === "F2") k.newGame();
      else if (e.key.toLowerCase() === "z" && (e.ctrlKey || e.metaKey) && k.undo) k.undo();
      else if (k.extra?.[e.key]) k.extra[e.key]!();
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [rootRef]);
}

/** The table fills the window, but grows (and scrolls) if a very long pile needs the room */
export function Felt({ children, boardRef }: { children: ReactNode; boardRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={boardRef} className="xp-felt absolute inset-0 overflow-y-auto overflow-x-hidden">
      {children}
    </div>
  );
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Face-down and face-up offsets for a fanned pile, squeezed so it fits the space below it */
export function fanOffsets(cards: { faceUp: boolean }[], avail: number, ch: number): number[] {
  let down = Math.max(3, ch * 0.1);
  let up = Math.max(12, ch * 0.27);
  const nd = cards.slice(0, -1).filter((c) => !c.faceUp).length;
  const nu = Math.max(0, cards.length - 1 - nd);
  if (nd * down + nu * up > avail && nu > 0) up = Math.max(Math.max(9, ch * 0.18), (avail - nd * down) / nu);
  if (nd * down + nu * up > avail && nd > 0) down = Math.max(2, (avail - nu * up) / nd);
  const out: number[] = [];
  let y = 0;
  cards.forEach((c) => {
    out.push(y);
    y += c.faceUp ? up : down;
  });
  return out;
}
