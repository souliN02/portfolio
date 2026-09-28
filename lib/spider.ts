import { createDeck, faceUp, shuffle, top, type Card, type Suit } from "./cards";

/**
 * Spider Solitaire as XP played it: two decks' worth of cards in 1, 2 or 4
 * suits, ten tableau piles, and a stock dealt ten cards at a time. A finished
 * King-to-Ace run of one suit leaves the table; eight of them win.
 *
 * Piles are "stock" and "t0".."t9". Score starts at 500, each move costs one
 * point, and each finished run earns 100.
 */

export type SpiderSuits = 1 | 2 | 4;

export interface SpiderState {
  tableau: Card[][];
  stock: Card[];
  /** The suit of each finished run, in the order they were completed */
  completed: Suit[];
  suits: SpiderSuits;
  score: number;
  moves: number;
}

export const SPIDER_TABLEAU = ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9"] as const;
export const RUNS_TO_WIN = 8;

const SUIT_SETS: Record<SpiderSuits, Suit[]> = {
  1: ["spades"],
  2: ["spades", "hearts"],
  4: ["clubs", "diamonds", "hearts", "spades"],
};

export const DIFFICULTY: Record<SpiderSuits, string> = { 1: "Easy: One Suit", 2: "Medium: Two Suits", 4: "Difficult: Four Suits" };

export function dealSpider(suits: SpiderSuits = 1, random: () => number = Math.random): SpiderState {
  const set = SUIT_SETS[suits];
  const deck = shuffle(createDeck(set, 8 / set.length), random);
  const tableau: Card[][] = [];
  let k = 0;
  for (let i = 0; i < 10; i++) {
    const n = i < 4 ? 6 : 5;
    const cards = deck.slice(k, k + n);
    k += n;
    cards[n - 1] = faceUp(cards[n - 1]!);
    tableau.push(cards);
  }
  return { tableau, stock: deck.slice(k), completed: [], suits, score: 500, moves: 0 };
}

export function pile(state: SpiderState, id: string): Card[] {
  if (id === "stock") return state.stock;
  return (id[0] === "t" && state.tableau[Number(id.slice(1))]) || [];
}

function withPile(state: SpiderState, id: string, cards: Card[]): SpiderState {
  const i = Number(id.slice(1));
  return { ...state, tableau: state.tableau.map((p, j) => (j === i ? cards : p)) };
}

const flipTop = (cards: Card[]): Card[] => {
  const t = top(cards);
  return t && !t.faceUp ? [...cards.slice(0, -1), faceUp(t)] : cards;
};

/** Only a run of one suit, in descending order, can be picked up together */
export function pickUp(state: SpiderState, from: string, index: number): Card[] | null {
  if (from[0] !== "t") return null;
  const cards = pile(state, from);
  if (index < 0 || index >= cards.length) return null;
  const picked = cards.slice(index);
  if (!picked.every((c) => c.faceUp)) return null;
  for (let i = 1; i < picked.length; i++) {
    if (picked[i]!.suit !== picked[i - 1]!.suit || picked[i]!.rank !== picked[i - 1]!.rank - 1) return null;
  }
  return picked;
}

/** Any card goes on a card one rank higher, whatever its suit, and anything goes in an empty pile */
export function canMove(state: SpiderState, from: string, index: number, to: string): boolean {
  if (from === to || to[0] !== "t") return false;
  const cards = pickUp(state, from, index);
  if (!cards) return false;
  const onto = top(pile(state, to));
  return !onto || onto.rank === cards[0]!.rank + 1;
}

/** Take a finished King-to-Ace run of one suit off the top of a pile */
function collectRun(state: SpiderState, id: string): SpiderState {
  const cards = pile(state, id);
  if (cards.length < 13) return state;
  const run = cards.slice(-13);
  const suit = run[0]!.suit;
  if (!run.every((c, i) => c.faceUp && c.suit === suit && c.rank === 13 - i)) return state;
  return { ...withPile(state, id, flipTop(cards.slice(0, -13))), completed: [...state.completed, suit], score: state.score + 100 };
}

export function move(state: SpiderState, from: string, index: number, to: string): SpiderState {
  if (!canMove(state, from, index, to)) return state;
  const source = pile(state, from);
  let next = withPile(state, from, flipTop(source.slice(0, index)));
  next = withPile(next, to, [...pile(state, to), ...source.slice(index)]);
  return collectRun({ ...next, score: Math.max(0, next.score - 1), moves: next.moves + 1 }, to);
}

/** XP refuses to deal while any pile is empty */
export const hasEmptyPile = (state: SpiderState) => state.tableau.some((p) => !p.length);
export const canDeal = (state: SpiderState) => state.stock.length > 0 && !hasEmptyPile(state);

/** One card face up onto every pile */
export function dealRow(state: SpiderState): SpiderState {
  if (!canDeal(state)) return state;
  const row = state.stock.slice(-10).reverse();
  let next: SpiderState = {
    ...state,
    stock: state.stock.slice(0, -10),
    tableau: state.tableau.map((p, i) => [...p, faceUp(row[i]!)]),
    score: Math.max(0, state.score - 1),
    moves: state.moves + 1,
  };
  for (const id of SPIDER_TABLEAU) next = collectRun(next, id);
  return next;
}

/** Where a click or tap sends a run: onto the same suit if possible, then any card, then an empty pile */
export function autoTarget(state: SpiderState, from: string, index: number): string | null {
  const cards = pickUp(state, from, index);
  if (!cards) return null;
  const targets = SPIDER_TABLEAU.filter((id) => canMove(state, from, index, id));
  const sameSuit = targets.find((id) => top(pile(state, id))?.suit === cards[0]!.suit);
  const onCard = targets.find((id) => pile(state, id).length > 0);
  // Moving a whole pile into an empty one changes nothing
  const empty = index > 0 ? targets.find((id) => !pile(state, id).length) : undefined;
  return sameSuit ?? onCard ?? empty ?? null;
}

export const isWon = (state: SpiderState) => state.completed.length === RUNS_TO_WIN;
