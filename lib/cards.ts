/** Playing cards shared by Solitaire, Spider Solitaire, FreeCell and Hearts */

export type Suit = "clubs" | "diamonds" | "hearts" | "spades";

export const SUITS: readonly Suit[] = ["clubs", "diamonds", "hearts", "spades"];

export interface Card {
  /** Unique within one game (Spider plays with several copies of each card) */
  id: string;
  suit: Suit;
  /** 1 = Ace ... 11 = Jack, 12 = Queen, 13 = King */
  rank: number;
  faceUp: boolean;
}

const RANK_LABELS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const RANK_NAMES = ["", "Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];

export const isRed = (suit: Suit) => suit === "diamonds" || suit === "hearts";
export const rankLabel = (rank: number) => RANK_LABELS[rank] ?? "?";
export const cardName = (card: Pick<Card, "rank" | "suit">) => `${RANK_NAMES[card.rank]} of ${card.suit}`;

export function makeCard(suit: Suit, rank: number, faceUp = false, copy = 0): Card {
  return { id: `${suit[0]}${rank}${copy ? `-${copy}` : ""}`, suit, rank, faceUp };
}

/** One or more 52-card decks (or partial decks, for Spider's easier levels) */
export function createDeck(suits: readonly Suit[] = SUITS, copies = 1): Card[] {
  const deck: Card[] = [];
  for (let copy = 0; copy < copies; copy++) {
    for (const suit of suits) {
      for (let rank = 1; rank <= 13; rank++) deck.push(makeCard(suit, rank, false, copy));
    }
  }
  return deck;
}

/** Fisher-Yates, returning a new array */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export const faceUp = (card: Card): Card => (card.faceUp ? card : { ...card, faceUp: true });
export const top = <T>(pile: readonly T[]): T | undefined => pile[pile.length - 1];

/** Deterministic random numbers for tests and replayable deals */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
