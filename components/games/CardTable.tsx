"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cardName, type Card } from "@/lib/cards";
import { CardView } from "./Card";

/**
 * The green table shared by Solitaire, Spider and FreeCell. Each game lays
 * out its cards and pile slots; the table handles the pointer: drag a card
 * (and everything on top of it) onto a pile, or tap it to let the game send
 * it somewhere sensible. Mouse, touch and pen all go through the same path.
 */

export interface TableCard {
  card: Card;
  pile: string;
  index: number;
  x: number;
  y: number;
  z: number;
  /** Can be picked up (with the cards on top of it) */
  draggable: boolean;
}

export interface TableSlot {
  id: string;
  label: string;
  x: number;
  y: number;
  /** Height of the drop zone: tableau piles reach down to the bottom of the table */
  h: number;
  /** Shown when the pile is empty */
  children?: ReactNode;
}

interface CardTableProps {
  width: number;
  height: number;
  cw: number;
  ch: number;
  cards: TableCard[];
  slots: TableSlot[];
  canDrop: (pile: string, index: number, to: string) => boolean;
  onDrop: (pile: string, index: number, to: string) => void;
  /** A card was tapped or clicked without dragging; return false if nothing happened */
  onTap: (pile: string, index: number) => boolean;
  onSlotTap?: (id: string) => void;
}

interface Drag {
  pile: string;
  index: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  active: boolean;
  draggable: boolean;
  touch: boolean;
}

const MOVE_MS = 170;

export default function CardTable({ width, height, cw, ch, cards, slots, canDrop, onDrop, onTap, onSlotTap }: CardTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [dragView, setDragView] = useState<Pick<Drag, "pile" | "index" | "dx" | "dy"> | null>(null);
  const [shake, setShake] = useState<string | null>(null);

  // Cards that just changed pile are lifted above everything while they slide into place
  const lastPile = useRef(new Map<string, string>());
  const [lifted, setLifted] = useState<ReadonlySet<string>>(new Set());
  const liftTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useLayoutEffect(() => {
    const moved = new Set<string>();
    for (const tc of cards) {
      const prev = lastPile.current.get(tc.card.id);
      if (prev !== undefined && prev !== tc.pile) moved.add(tc.card.id);
    }
    lastPile.current = new Map(cards.map((tc) => [tc.card.id, tc.pile]));
    if (!moved.size) return;
    setLifted(moved);
    clearTimeout(liftTimer.current);
    liftTimer.current = setTimeout(() => setLifted(new Set()), MOVE_MS + 40);
  }, [cards]);
  useLayoutEffect(() => () => clearTimeout(liftTimer.current), []);

  const topIndex = new Map<string, number>();
  for (const tc of cards) topIndex.set(tc.pile, Math.max(tc.index, topIndex.get(tc.pile) ?? -1));

  const find = (el: EventTarget) => {
    const node = (el as HTMLElement).closest<HTMLElement>("[data-pile]");
    if (!node) return null;
    const pile = node.dataset.pile!;
    const index = Number(node.dataset.index);
    return cards.find((c) => c.pile === pile && c.index === index) ?? null;
  };

  const tap = (pile: string, index: number) => {
    if (onTap(pile, index)) return;
    const id = `${pile}:${index}`;
    setShake(id);
    setTimeout(() => setShake((s) => (s === id ? null : s)), 320);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || drag.current) return;
    const hit = find(e.target);
    if (!hit) return;
    ref.current?.setPointerCapture(e.pointerId);
    drag.current = { pile: hit.pile, index: hit.index, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, active: false, draggable: hit.draggable, touch: e.pointerType !== "mouse" };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d?.draggable) return;
    d.dx = e.clientX - d.startX;
    d.dy = e.clientY - d.startY;
    // Fingers wobble, so a touch has to travel further before it counts as a drag
    if (!d.active && Math.hypot(d.dx, d.dy) > (d.touch ? 9 : 4)) d.active = true;
    if (d.active) setDragView({ pile: d.pile, index: d.index, dx: d.dx, dy: d.dy });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    setDragView(null);
    if (!d) return;
    if (e.type === "pointercancel") return;
    if (!d.active) return tap(d.pile, d.index);

    // Drop on the legal pile the dragged card overlaps most
    const moving = cards.find((c) => c.pile === d.pile && c.index === d.index);
    if (!moving) return;
    const x = moving.x + d.dx;
    const y = moving.y + d.dy;
    let best: { id: string; area: number } | null = null;
    for (const s of slots) {
      const w = Math.min(x + cw, s.x + cw) - Math.max(x, s.x);
      const h = Math.min(y + ch, s.y + s.h) - Math.max(y, s.y);
      const area = w > 0 && h > 0 ? w * h : 0;
      if (area > (best?.area ?? 0) && canDrop(d.pile, d.index, s.id)) best = { id: s.id, area };
    }
    if (best) onDrop(d.pile, d.index, best.id);
  };

  const onCardKey = (e: KeyboardEvent<HTMLDivElement>, tc: TableCard) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    tap(tc.pile, tc.index);
  };

  return (
    <div
      ref={ref}
      className="relative select-none"
      style={{ width, height }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {slots.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-label={s.label}
          tabIndex={onSlotTap ? 0 : -1}
          className="card-slot absolute grid place-items-center"
          style={{ left: s.x, top: s.y, width: cw, height: ch, borderRadius: Math.max(3, Math.round(cw * 0.06)) }}
          onClick={() => onSlotTap?.(s.id)}
        >
          {s.children}
        </button>
      ))}

      {cards.map((tc) => {
        const dragging = dragView && tc.pile === dragView.pile && tc.index >= dragView.index;
        const focusable = tc.card.faceUp ? tc.draggable : tc.index === topIndex.get(tc.pile);
        return (
          <div
            key={tc.card.id}
            data-pile={tc.pile}
            data-index={tc.index}
            role="button"
            tabIndex={focusable ? 0 : -1}
            aria-label={tc.card.faceUp ? cardName(tc.card) : "Face-down card"}
            onKeyDown={(e) => onCardKey(e, tc)}
            className={`card-slot-card absolute outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${tc.draggable ? "cursor-pointer touch-none" : ""} ${shake === `${tc.pile}:${tc.index}` ? "card-shake" : ""}`}
            style={{
              left: tc.x,
              top: tc.y,
              width: cw,
              height: ch,
              zIndex: dragging ? 1000 + tc.index : lifted.has(tc.card.id) ? 500 + tc.z : tc.z,
              transform: dragging ? `translate(${dragView.dx}px, ${dragView.dy}px)` : undefined,
              transition: dragging ? "none" : `left ${MOVE_MS}ms ease-out, top ${MOVE_MS}ms ease-out, transform ${MOVE_MS}ms ease-out`,
              filter: dragging ? "drop-shadow(2px 4px 4px rgba(0,0,0,0.35))" : undefined,
            }}
          >
            <CardView card={tc.card} w={cw} h={ch} />
          </div>
        );
      })}
    </div>
  );
}
