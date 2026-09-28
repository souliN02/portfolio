import { createDeck, shuffle, type Card, type Suit } from "./cards";

/**
 * Hearts for one person against three computer players, as XP shipped it:
 * pass three cards (left, right, across, then no pass), 2 of clubs leads,
 * follow suit, no hearts led until broken, no points on the first trick,
 * hearts 1 point each, the Queen of Spades 13, and shooting the moon gives
 * everyone else 26. The game ends when someone reaches 100; lowest wins.
 *
 * Seats go clockwise in play order: 0 is you (south), 1 west, 2 north, 3 east.
 */

export type PassDirection = "left" | "right" | "across" | "none";
export type HeartsPhase = "passing" | "playing" | "trickDone" | "roundOver" | "gameOver";

export interface Play {
  seat: number;
  card: Card;
}

export interface HeartsState {
  hands: Card[][];
  round: number;
  phase: HeartsPhase;
  trick: Play[];
  /** Whose turn it is; while a finished trick is showing, the seat that won it */
  turn: number;
  heartsBroken: boolean;
  tricksPlayed: number;
  /** Points taken so far this round */
  points: number[];
  /** Running totals, updated at the end of each round */
  scores: number[];
  /** Each finished round's points (after any moon shot), for the score sheet */
  history: number[][];
  /** Who shot the moon in the round that just ended */
  moon: number | null;
}

export const SEATS = [0, 1, 2, 3] as const;
export const GAME_OVER_AT = 100;
const PASS_ORDER: PassDirection[] = ["left", "right", "across", "none"];
const PASS_OFFSET: Record<PassDirection, number> = { left: 1, across: 2, right: 3, none: 0 };
const SUIT_ORDER: Suit[] = ["clubs", "diamonds", "spades", "hearts"];

/** Aces are high in Hearts */
export const power = (card: Card) => (card.rank === 1 ? 14 : card.rank);
export const isQueenOfSpades = (card: Card) => card.suit === "spades" && card.rank === 12;
const isTwoOfClubs = (card: Card) => card.suit === "clubs" && card.rank === 2;
export const cardPoints = (card: Card) => (card.suit === "hearts" ? 1 : isQueenOfSpades(card) ? 13 : 0);

export const passDirection = (round: number): PassDirection => PASS_ORDER[round % 4]!;
export const passTarget = (seat: number, dir: PassDirection) => (seat + PASS_OFFSET[dir]) % 4;

export function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit) || power(a) - power(b));
}

const holderOfTwoOfClubs = (hands: Card[][]) => Math.max(0, hands.findIndex((h) => h.some(isTwoOfClubs)));

function dealRound(base: Pick<HeartsState, "round" | "scores" | "history">, random: () => number): HeartsState {
  const deck = shuffle(createDeck(), random).map((c) => ({ ...c, faceUp: true }));
  const hands = SEATS.map((s) => sortHand(deck.slice(s * 13, s * 13 + 13)));
  const passing = passDirection(base.round) !== "none";
  return {
    ...base,
    hands,
    phase: passing ? "passing" : "playing",
    trick: [],
    turn: passing ? 0 : holderOfTwoOfClubs(hands),
    heartsBroken: false,
    tricksPlayed: 0,
    points: [0, 0, 0, 0],
    moon: null,
  };
}

export const newHeartsGame = (random: () => number = Math.random) => dealRound({ round: 0, scores: [0, 0, 0, 0], history: [] }, random);

export const nextRound = (state: HeartsState, random: () => number = Math.random) =>
  state.phase === "roundOver" ? dealRound({ round: state.round + 1, scores: state.scores, history: state.history }, random) : state;

/** Swap three cards between every pair of players; `picks` are your three */
export function passCards(state: HeartsState, picks: string[]): HeartsState {
  if (state.phase !== "passing" || new Set(picks).size !== 3) return state;
  const mine = state.hands[0]!.filter((c) => picks.includes(c.id));
  if (mine.length !== 3) return state;
  const dir = passDirection(state.round);
  const outgoing = state.hands.map((hand, seat) => (seat === 0 ? mine : choosePass(hand)));
  const hands = state.hands.map((hand, seat) => {
    const from = SEATS.find((s) => passTarget(s, dir) === seat)!;
    const kept = hand.filter((c) => !outgoing[seat]!.includes(c));
    return sortHand([...kept, ...outgoing[from]!]);
  });
  return { ...state, hands, phase: "playing", turn: holderOfTwoOfClubs(hands) };
}

export function legalPlays(state: HeartsState, seat: number): Card[] {
  const hand = state.hands[seat] ?? [];
  if (state.phase !== "playing" || seat !== state.turn) return [];
  const firstTrick = state.tricksPlayed === 0;
  const lead = state.trick[0];
  if (!lead) {
    if (firstTrick) return hand.filter(isTwoOfClubs);
    const nonHearts = hand.filter((c) => c.suit !== "hearts");
    return state.heartsBroken || !nonHearts.length ? hand : nonHearts;
  }
  const follow = hand.filter((c) => c.suit === lead.card.suit);
  if (follow.length) return follow;
  if (firstTrick) {
    const safe = hand.filter((c) => !cardPoints(c));
    if (safe.length) return safe;
  }
  return hand;
}

export function trickWinner(trick: Play[]): number {
  const led = trick[0]?.card.suit;
  let best = trick[0];
  for (const p of trick) if (p.card.suit === led && best && power(p.card) > power(best.card)) best = p;
  return best?.seat ?? 0;
}

export function playCard(state: HeartsState, seat: number, cardId: string): HeartsState {
  const card = legalPlays(state, seat).find((c) => c.id === cardId);
  if (!card) return state;
  const trick = [...state.trick, { seat, card }];
  const done = trick.length === 4;
  return {
    ...state,
    hands: state.hands.map((h, s) => (s === seat ? h.filter((c) => c.id !== cardId) : h)),
    trick,
    heartsBroken: state.heartsBroken || card.suit === "hearts",
    phase: done ? "trickDone" : "playing",
    turn: done ? trickWinner(trick) : (seat + 1) % 4,
  };
}

/** Give a finished trick to its winner, who leads next; after the 13th trick, score the round */
export function collectTrick(state: HeartsState): HeartsState {
  if (state.phase !== "trickDone") return state;
  const winner = state.turn;
  const taken = state.trick.reduce((n, p) => n + cardPoints(p.card), 0);
  const points = state.points.map((p, s) => (s === winner ? p + taken : p));
  const tricksPlayed = state.tricksPlayed + 1;
  if (tricksPlayed < 13) return { ...state, trick: [], points, tricksPlayed, phase: "playing" };

  const moon = points.findIndex((p) => p === 26);
  const round = moon >= 0 ? points.map((_, s) => (s === moon ? 0 : 26)) : points;
  const scores = state.scores.map((t, s) => t + round[s]!);
  return {
    ...state,
    trick: [],
    points,
    tricksPlayed,
    scores,
    history: [...state.history, round],
    moon: moon >= 0 ? moon : null,
    phase: scores.some((t) => t >= GAME_OVER_AT) ? "gameOver" : "roundOver",
  };
}

export const winners = (state: HeartsState) => SEATS.filter((s) => state.scores[s] === Math.min(...state.scores));

/* ─── Computer players ─── */

const byPower = (a: Card, b: Card) => power(a) - power(b);
const highest = (cards: Card[]) => [...cards].sort(byPower).at(-1)!;
const lowest = (cards: Card[]) => [...cards].sort(byPower)[0]!;
const withoutQueen = (cards: Card[]) => {
  const rest = cards.filter((c) => !isQueenOfSpades(c));
  return rest.length ? rest : cards;
};

/** Pass the Queen of Spades and the cards that could catch it, high hearts, and short suits' high cards */
export function choosePass(hand: Card[]): Card[] {
  const count = (suit: Suit) => hand.filter((c) => c.suit === suit).length;
  const danger = (c: Card) => {
    if (isQueenOfSpades(c)) return 100;
    if (c.suit === "spades") return power(c) > 12 ? 90 : -50;
    const shortSuit = Math.max(0, 4 - count(c.suit)) * 2;
    return power(c) + (c.suit === "hearts" ? 6 : 0) + shortSuit;
  };
  return [...hand].sort((a, b) => danger(b) - danger(a)).slice(0, 3);
}

export function choosePlay(state: HeartsState, seat: number): Card {
  const legal = legalPlays(state, seat);
  if (legal.length <= 1) return legal[0]!;
  const hand = state.hands[seat]!;
  const queenOut = state.hands.some((h) => h.some(isQueenOfSpades));
  const lead = state.trick[0];

  if (!lead) {
    // Lead low, keeping hearts and the big spades back; low spades help flush out the Queen
    const holdsQueen = hand.some(isQueenOfSpades);
    const cost = (c: Card) => {
      let n = power(c);
      if (c.suit === "hearts") n += 8;
      if (c.suit === "spades" && queenOut) n += power(c) >= 12 ? 20 : holdsQueen ? 4 : -3;
      return n;
    };
    return [...legal].sort((a, b) => cost(a) - cost(b))[0]!;
  }

  if (legal[0]!.suit === lead.card.suit) {
    const winning = Math.max(...state.trick.filter((p) => p.card.suit === lead.card.suit).map((p) => power(p.card)));
    const last = state.trick.length === 3;
    const pointless = !state.trick.some((p) => cardPoints(p.card));
    // Last to play on a trick with no points: win it with the highest card, to get rid of it
    if (last && pointless) return highest(withoutQueen(legal));
    const under = legal.filter((c) => power(c) < winning);
    if (under.length) return highest(under);
    return last ? highest(withoutQueen(legal)) : lowest(withoutQueen(legal));
  }

  // Can't follow suit: dump the Queen, then the cards that could catch her, then hearts, then high cards
  const queen = legal.find(isQueenOfSpades);
  if (queen) return queen;
  const bigSpades = legal.filter((c) => c.suit === "spades" && power(c) > 12);
  if (queenOut && bigSpades.length) return highest(bigSpades);
  const hearts = legal.filter((c) => c.suit === "hearts");
  if (hearts.length) return highest(hearts);
  const count = (suit: Suit) => hand.filter((c) => c.suit === suit).length;
  return [...legal].sort((a, b) => power(b) * 4 - count(b.suit) - (power(a) * 4 - count(a.suit)))[0]!;
}
