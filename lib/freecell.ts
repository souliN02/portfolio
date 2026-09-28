import { isRed, makeCard, top, type Card, type Suit } from "./cards";

/**
 * FreeCell with Microsoft's numbered deals, so game #1 here is the same
 * game #1 XP dealt (and #11982 is still the famous unsolvable one).
 *
 * Piles are "c0".."c3" (free cells), "f0".."f3" (home cells) and
 * "t0".."t7" (tableau). Every card is dealt face up.
 */

export interface FreeCellState {
  game: number;
  cells: (Card | null)[];
  foundations: Card[][];
  tableau: Card[][];
  moves: number;
}

export const CELLS = ["c0", "c1", "c2", "c3"] as const;
export const FC_FOUNDATIONS = ["f0", "f1", "f2", "f3"] as const;
export const FC_TABLEAU = ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"] as const;
export const MAX_GAME = 32000;

/** Microsoft's deal order: clubs, diamonds, hearts, spades within each rank */
const MS_SUITS: Suit[] = ["clubs", "diamonds", "hearts", "spades"];

export function dealFreeCell(game: number): FreeCellState {
  let seed = game;
  const rand = () => {
    seed = (seed * 214013 + 2531011) & 0x7fffffff;
    return seed >> 16;
  };
  const deck = Array.from({ length: 52 }, (_, i) => 51 - i);
  for (let i = 0; i < 52; i++) {
    const j = 51 - (rand() % (52 - i));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  const tableau: Card[][] = Array.from({ length: 8 }, () => []);
  deck.forEach((c, k) => tableau[k % 8]!.push(makeCard(MS_SUITS[c % 4]!, Math.floor(c / 4) + 1, true)));
  return { game, cells: [null, null, null, null], foundations: [[], [], [], []], tableau, moves: 0 };
}

export const randomGame = (random: () => number = Math.random) => 1 + Math.floor(random() * MAX_GAME);

export function pile(state: FreeCellState, id: string): Card[] {
  const i = Number(id.slice(1));
  if (id[0] === "c") {
    const card = state.cells[i];
    return card ? [card] : [];
  }
  if (id[0] === "f") return state.foundations[i] ?? [];
  if (id[0] === "t") return state.tableau[i] ?? [];
  return [];
}

function withPile(state: FreeCellState, id: string, cards: Card[]): FreeCellState {
  const i = Number(id.slice(1));
  if (id[0] === "c") return { ...state, cells: state.cells.map((c, j) => (j === i ? (cards[0] ?? null) : c)) };
  if (id[0] === "f") return { ...state, foundations: state.foundations.map((p, j) => (j === i ? cards : p)) };
  return { ...state, tableau: state.tableau.map((p, j) => (j === i ? cards : p)) };
}

const stacksOn = (card: Card, onto: Card) => isRed(card.suit) !== isRed(onto.suit) && card.rank === onto.rank - 1;

/** How many cards can move at once, using free cells and empty columns as scratch space */
export function maxMovable(state: FreeCellState, toEmptyColumn: boolean): number {
  const freeCells = state.cells.filter((c) => !c).length;
  const emptyColumns = state.tableau.filter((p) => !p.length).length - (toEmptyColumn ? 1 : 0);
  return (freeCells + 1) * 2 ** Math.max(0, emptyColumns);
}

/** Cards on the home cells stay there, as in XP */
export function pickUp(state: FreeCellState, from: string, index: number): Card[] | null {
  if (from[0] === "f") return null;
  const cards = pile(state, from);
  if (index < 0 || index >= cards.length) return null;
  const picked = cards.slice(index);
  for (let i = 1; i < picked.length; i++) if (!stacksOn(picked[i]!, picked[i - 1]!)) return null;
  return picked;
}

export function canMove(state: FreeCellState, from: string, index: number, to: string): boolean {
  if (from === to) return false;
  const cards = pickUp(state, from, index);
  if (!cards) return false;
  const first = cards[0]!;
  const onto = top(pile(state, to));
  if (to[0] === "c") return cards.length === 1 && !onto;
  if (to[0] === "f") {
    if (cards.length !== 1) return false;
    return onto ? onto.suit === first.suit && first.rank === onto.rank + 1 : first.rank === 1;
  }
  if (to[0] === "t") {
    if (onto && !stacksOn(first, onto)) return false;
    return cards.length <= maxMovable(state, !onto);
  }
  return false;
}

export function move(state: FreeCellState, from: string, index: number, to: string): FreeCellState {
  if (!canMove(state, from, index, to)) return state;
  const source = pile(state, from);
  const next = withPile(withPile(state, from, source.slice(0, index)), to, [...pile(state, to), ...source.slice(index)]);
  return { ...next, moves: state.moves + 1 };
}

export interface FreeCellMove {
  from: string;
  index: number;
  to: string;
}

const homeRank = (state: FreeCellState, suit: Suit) => state.foundations.find((f) => f[0]?.suit === suit)?.length ?? 0;

/** A card can go home by itself once nothing still in play could need to be placed on it */
function safeToSendHome(state: FreeCellState, card: Card): boolean {
  if (card.rank <= 2) return true;
  const opposite = isRed(card.suit) ? (["clubs", "spades"] as const) : (["diamonds", "hearts"] as const);
  return opposite.every((s) => homeRank(state, s) >= card.rank - 1);
}

/** The next card XP would send home automatically after a move, if any */
export function nextAutoMove(state: FreeCellState): FreeCellMove | null {
  for (const from of [...CELLS, ...FC_TABLEAU]) {
    const cards = pile(state, from);
    const card = top(cards);
    if (!card || !safeToSendHome(state, card)) continue;
    const to = FC_FOUNDATIONS.find((id) => canMove(state, from, cards.length - 1, id));
    if (to) return { from, index: cards.length - 1, to };
  }
  return null;
}

/** Where a click or tap sends cards: home, onto a card, into an empty column, then into a free cell */
export function autoTarget(state: FreeCellState, from: string, index: number): string | null {
  if (!pickUp(state, from, index)) return null;
  const single = index === pile(state, from).length - 1;
  if (single) {
    const home = FC_FOUNDATIONS.find((id) => canMove(state, from, index, id));
    if (home) return home;
  }
  const targets = FC_TABLEAU.filter((id) => canMove(state, from, index, id));
  const onCard = targets.find((id) => pile(state, id).length > 0);
  if (onCard) return onCard;
  const empty = targets.find((id) => !pile(state, id).length);
  if (empty && !(from[0] === "t" && index === 0)) return empty;
  if (single && from[0] === "t") return CELLS.find((id) => canMove(state, from, index, id)) ?? null;
  return null;
}

/** False when the game is stuck: XP's "There are no more legal moves" */
export function hasMoves(state: FreeCellState): boolean {
  const targets = [...CELLS, ...FC_FOUNDATIONS, ...FC_TABLEAU];
  for (const from of [...CELLS, ...FC_TABLEAU]) {
    const cards = pile(state, from);
    for (let i = 0; i < cards.length; i++) {
      if (targets.some((to) => canMove(state, from, i, to))) return true;
    }
  }
  return false;
}

export const cardsLeft = (state: FreeCellState) => 52 - state.foundations.reduce((n, f) => n + f.length, 0);
export const isWon = (state: FreeCellState) => cardsLeft(state) === 0;
