"use client";

import { memo } from "react";
import { cardName, isRed, rankLabel, type Card, type Suit } from "@/lib/cards";

/** Width to height of an XP card (71 x 96) */
export const CARD_RATIO = 96 / 71;

/**
 * Suit shapes as SVG paths rather than ♥ characters, which iOS draws as
 * emoji. The club is three circles and a stem, all wound the same way so
 * they fill as one shape (the win animation reuses these for canvas).
 */
export const SUIT_PATHS: Record<Suit, string> = {
  hearts: "M12 21.2S2.5 15 2.5 8.6C2.5 5.5 4.9 3.2 7.8 3.2c1.8 0 3.4 1 4.2 2.4.8-1.4 2.4-2.4 4.2-2.4 2.9 0 5.3 2.3 5.3 5.4 0 6.4-9.5 12.6-9.5 12.6Z",
  diamonds: "M12 2 20 12 12 22 4 12Z",
  spades:
    "M12 2S3 8.5 3 13.5c0 3 2.2 5 4.8 5 1.5 0 2.8-.7 3.4-1.7-.2 2-1 3.7-2.4 5h6.4c-1.4-1.3-2.2-3-2.4-5 .6 1 1.9 1.7 3.4 1.7 2.6 0 4.8-2 4.8-5C21 8.5 12 2 12 2Z",
  clubs:
    "M7.6 7a4.4 4.4 0 1 0 8.8 0 4.4 4.4 0 1 0-8.8 0ZM2.8 13.6a4.4 4.4 0 1 0 8.8 0 4.4 4.4 0 1 0-8.8 0ZM12.4 13.6a4.4 4.4 0 1 0 8.8 0 4.4 4.4 0 1 0-8.8 0ZM11 11.5 9 22h6l-2-10.5Z",
};

export const SUIT_COLOR = { red: "#d40000", black: "#000" };

export function SuitIcon({ suit, size, className }: { suit: Suit; size: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d={SUIT_PATHS[suit]} />
    </svg>
  );
}

interface CardViewProps {
  card: Card;
  w: number;
  h: number;
}

/** One card, face up or down, drawn at any size from phone-tiny to full XP size */
export const CardView = memo(function CardView({ card, w, h }: CardViewProps) {
  const radius = Math.max(3, Math.round(w * 0.06));
  if (!card.faceUp) return <div className="card-back h-full w-full" style={{ width: w, height: h, borderRadius: radius }} />;

  const corner = Math.max(9, Math.round(w * 0.2));
  const court = card.rank > 10;
  const roomy = w >= 50;
  const index = (
    <span className="flex flex-col items-center leading-none" style={{ fontSize: corner, width: corner * 1.15 }}>
      <span className="font-bold tracking-[-0.06em]">{rankLabel(card.rank)}</span>
      <SuitIcon suit={card.suit} size={Math.round(corner * 0.8)} className="mt-[1px]" />
    </span>
  );

  return (
    <div
      className="card-face relative h-full w-full select-none"
      style={{ width: w, height: h, borderRadius: radius, color: isRed(card.suit) ? SUIT_COLOR.red : SUIT_COLOR.black }}
      aria-label={cardName(card)}
    >
      <span className="absolute" style={{ left: Math.max(1, w * 0.03), top: Math.max(2, w * 0.04) }}>
        {index}
      </span>
      {roomy && (
        <span className="absolute rotate-180" style={{ right: w * 0.03, bottom: w * 0.04 }}>
          {index}
        </span>
      )}
      {court ? (
        <span
          className="card-court absolute flex flex-col items-center justify-center font-serif font-bold leading-none"
          style={{ left: w * 0.24, right: w * 0.24, top: h * 0.2, bottom: h * 0.2, fontSize: w * 0.32, borderRadius: Math.max(2, w * 0.04) }}
        >
          {rankLabel(card.rank)}
          <SuitIcon suit={card.suit} size={Math.round(w * 0.22)} />
        </span>
      ) : (
        <span className="absolute inset-0 grid place-items-center" style={{ paddingTop: roomy ? 0 : h * 0.22 }}>
          <SuitIcon suit={card.suit} size={Math.round(w * (card.rank === 1 ? 0.5 : roomy ? 0.42 : 0.36))} />
        </span>
      )}
    </div>
  );
});
