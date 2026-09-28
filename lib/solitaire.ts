import { createDeck, faceUp, isRed, shuffle, top, type Card } from "./cards";

/**
 * Klondike Solitaire with Windows XP's standard scoring. Pure: every action
 * returns a new state, which also makes Undo a matter of keeping old states.
 *
 * Piles are addressed by id: "stock", "waste", "f0".."f3" (foundations)
 * and "t0".."t6" (tableau). A move takes the cards from `index` to the end.
 */

export type DrawCount = 1 | 3;

export interface SolitaireState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
  drawCount: DrawCount;
  score: number;
  moves: number;
}

export const FOUNDATIONS = ["f0", "f1", "f2", "f3"] as const;
export const TABLEAU = ["t0", "t1", "t2", "t3", "t4", "t5", "t6"] as const;

export const SCORE = {
  wasteToTableau: 5,
  toFoundation: 10,
  turnOver: 5,
  foundationToTableau: -15,
  recycleDrawOne: -100,
  recycleDrawThree: -20,
  /** Every 10 seconds of a timed game */
  timePenalty: -2,
} as const;

export function deal(drawCount: DrawCount = 1, random: () => number = Math.random): SolitaireState {
  const deck = shuffle(createDeck(), random);
  const tableau: Card[][] = [];
  let k = 0;
  for (let i = 0; i < 7; i++) {
    const cards = deck.slice(k, k + i + 1);
    k += i + 1;
    cards[i] = faceUp(cards[i]!);
    tableau.push(cards);
  }
  return { stock: deck.slice(k), waste: [], foundations: [[], [], [], []], tableau, drawCount, score: 0, moves: 0 };
}

export function pile(state: SolitaireState, id: string): Card[] {
  if (id === "stock") return state.stock;
  if (id === "waste") return state.waste;
  const i = Number(id.slice(1));
  if (id[0] === "f") return state.foundations[i] ?? [];
  if (id[0] === "t") return state.tableau[i] ?? [];
  return [];
}

function withPile(state: SolitaireState, id: string, cards: Card[]): SolitaireState {
  if (id === "stock") return { ...state, stock: cards };
  if (id === "waste") return { ...state, waste: cards };
  const i = Number(id.slice(1));
  if (id[0] === "f") return { ...state, foundations: state.foundations.map((p, j) => (j === i ? cards : p)) };
  return { ...state, tableau: state.tableau.map((p, j) => (j === i ? cards : p)) };
}

/** Red on black (or black on red), one rank lower */
const stacksOn = (card: Card, onto: Card) => isRed(card.suit) !== isRed(onto.suit) && card.rank === onto.rank - 1;

/** Deal from the stock onto the waste, or turn the waste back over when the stock is empty */
export function draw(state: SolitaireState): SolitaireState {
  if (state.stock.length) {
    const n = Math.min(state.drawCount, state.stock.length);
    const drawn = state.stock.slice(-n).reverse().map(faceUp);
    return { ...state, stock: state.stock.slice(0, -n), waste: [...state.waste, ...drawn], moves: state.moves + 1 };
  }
  if (!state.waste.length) return state;
  const stock = [...state.waste].reverse().map((c) => ({ ...c, faceUp: false }));
  const penalty = state.drawCount === 1 ? SCORE.recycleDrawOne : SCORE.recycleDrawThree;
  return { ...state, stock, waste: [], score: Math.max(0, state.score + penalty), moves: state.moves + 1 };
}

/** The cards that would be picked up from `index`, or null if they can't be */
export function pickUp(state: SolitaireState, from: string, index: number): Card[] | null {
  const cards = pile(state, from);
  if (from === "stock" || index < 0 || index >= cards.length) return null;
  if ((from === "waste" || from[0] === "f") && index !== cards.length - 1) return null;
  const picked = cards.slice(index);
  if (!picked.every((c) => c.faceUp)) return null;
  for (let i = 1; i < picked.length; i++) if (!stacksOn(picked[i]!, picked[i - 1]!)) return null;
  return picked;
}

export function canMove(state: SolitaireState, from: string, index: number, to: string): boolean {
  if (from === to) return false;
  const cards = pickUp(state, from, index);
  if (!cards) return false;
  const first = cards[0]!;
  const onto = top(pile(state, to));
  if (to[0] === "f") {
    if (cards.length !== 1) return false;
    return onto ? onto.suit === first.suit && first.rank === onto.rank + 1 : first.rank === 1;
  }
  if (to[0] === "t") return onto ? onto.faceUp && stacksOn(first, onto) : first.rank === 13;
  return false;
}

export function move(state: SolitaireState, from: string, index: number, to: string): SolitaireState {
  if (!canMove(state, from, index, to)) return state;
  const source = pile(state, from);
  const cards = source.slice(index);
  let score = state.score;
  if (to[0] === "f") score += SCORE.toFoundation;
  else if (from === "waste") score += SCORE.wasteToTableau;
  else if (from[0] === "f") score += SCORE.foundationToTableau;

  let next = withPile(withPile(state, from, source.slice(0, index)), to, [...pile(state, to), ...cards]);
  // The card left on top of a tableau pile turns over by itself
  const uncovered = from[0] === "t" ? top(pile(next, from)) : undefined;
  if (uncovered && !uncovered.faceUp) {
    next = withPile(next, from, [...pile(next, from).slice(0, -1), faceUp(uncovered)]);
    score += SCORE.turnOver;
  }
  return { ...next, score: Math.max(0, score), moves: state.moves + 1 };
}

/**
 * Where a click or tap sends a card: a foundation first, then a tableau pile.
 * Cards already on a foundation stay put (they can still be dragged down).
 */
export function autoTarget(state: SolitaireState, from: string, index: number): string | null {
  if (from[0] === "f" || !pickUp(state, from, index)) return null;
  if (index === pile(state, from).length - 1) {
    const f = FOUNDATIONS.find((id) => canMove(state, from, index, id));
    if (f) return f;
  }
  const targets = TABLEAU.filter((id) => canMove(state, from, index, id));
  const onCard = targets.find((id) => pile(state, id).length > 0);
  if (onCard) return onCard;
  // A King already at the bottom of its pile gains nothing from moving to another empty one
  return targets[0] && !(from[0] === "t" && index === 0) ? targets[0] : null;
}

export const isWon = (state: SolitaireState) => state.foundations.every((f) => f.length === 13);

/** Everything is face up and dealt, so the rest can be played out automatically */
export function canAutoFinish(state: SolitaireState): boolean {
  return !isWon(state) && !state.stock.length && !state.waste.length && state.tableau.every((p) => p.every((c) => c.faceUp));
}

/** The next card to send home while auto-finishing: always the lowest one showing, which is always playable */
export function autoFinishMove(state: SolitaireState): { from: string; index: number; to: string } | null {
  let best: { from: string; index: number; to: string; rank: number } | null = null;
  for (const from of ["waste", ...TABLEAU]) {
    const cards = pile(state, from);
    const card = top(cards);
    if (!card || (best && card.rank >= best.rank)) continue;
    const to = FOUNDATIONS.find((id) => canMove(state, from, cards.length - 1, id));
    if (to) best = { from, index: cards.length - 1, to, rank: card.rank };
  }
  return best && { from: best.from, index: best.index, to: best.to };
}

export const timePenalty = (state: SolitaireState): SolitaireState => ({ ...state, score: Math.max(0, state.score + SCORE.timePenalty) });

/** XP's bonus for a fast win: 700,000 divided by the seconds taken (games under 30 seconds get none) */
export const timeBonus = (seconds: number) => (seconds >= 30 ? Math.floor(700000 / seconds) : 0);
