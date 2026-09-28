import { describe, expect, it } from "vitest";
import { makeCard, seededRandom, type Card, type Suit } from "./cards";
import {
  cardPoints,
  choosePass,
  choosePlay,
  collectTrick,
  legalPlays,
  newHeartsGame,
  nextRound,
  passCards,
  passDirection,
  playCard,
  trickWinner,
  type HeartsState,
} from "./hearts";

const S: Record<string, Suit> = { c: "clubs", d: "diamonds", h: "hearts", s: "spades" };
const c = (code: string): Card => makeCard(S[code[0]!]!, Number(code.slice(1)), true);
const cards = (...codes: string[]) => codes.map(c);

function state(partial: Partial<HeartsState>): HeartsState {
  return {
    hands: [[], [], [], []],
    round: 0,
    phase: "playing",
    trick: [],
    turn: 0,
    heartsBroken: false,
    tricksPlayed: 1,
    points: [0, 0, 0, 0],
    scores: [0, 0, 0, 0],
    history: [],
    moon: null,
    ...partial,
  };
}

describe("dealing and passing", () => {
  it("deals 13 cards each and starts by passing", () => {
    const s = newHeartsGame(seededRandom(1));
    expect(s.hands.map((h) => h.length)).toEqual([13, 13, 13, 13]);
    expect(new Set(s.hands.flat().map((x) => x.id)).size).toBe(52);
    expect(s.phase).toBe("passing");
  });

  it("passes left, right, across, then keeps", () => {
    expect([0, 1, 2, 3, 4].map(passDirection)).toEqual(["left", "right", "across", "none", "left"]);
  });

  it("sends your three cards to the player on your left", () => {
    const s = newHeartsGame(seededRandom(2));
    const picks = s.hands[0]!.slice(0, 3).map((x) => x.id);
    const next = passCards(s, picks);
    expect(next.phase).toBe("playing");
    expect(next.hands.map((h) => h.length)).toEqual([13, 13, 13, 13]);
    for (const id of picks) expect(next.hands[1]!.some((x) => x.id === id)).toBe(true);
    expect(next.hands[next.turn]!.some((x) => x.suit === "clubs" && x.rank === 2)).toBe(true);
  });

  it("passes the Queen of Spades and high cards, but keeps low spades", () => {
    const pass = choosePass(cards("s12", "s3", "s4", "h1", "c2", "c3", "c4", "c5", "d2", "d3", "d4", "d5", "d6"));
    expect(pass.map((x) => x.id)).toContain("s12");
    expect(pass.map((x) => x.id)).toContain("h1");
    expect(pass.map((x) => x.id)).not.toContain("s3");
  });
});

describe("rules", () => {
  it("leads the 2 of clubs, and takes no points on the first trick", () => {
    const first = state({ tricksPlayed: 0, hands: [cards("c2", "c9", "h5"), cards("h2", "s12", "d3"), [], []] });
    expect(legalPlays(first, 0).map((x) => x.id)).toEqual(["c2"]);
    const afterLead = playCard(first, 0, "c2");
    expect(legalPlays(afterLead, 1).map((x) => x.id)).toEqual(["d3"]);
  });

  it("follows suit when possible", () => {
    const s = state({ trick: [{ seat: 3, card: c("d9") }], hands: [cards("d2", "d13", "s5"), [], [], []] });
    expect(legalPlays(s, 0).map((x) => x.id)).toEqual(["d2", "d13"]);
  });

  it("keeps hearts from being led until they are broken", () => {
    const s = state({ hands: [cards("h5", "c9"), [], [], []] });
    expect(legalPlays(s, 0).map((x) => x.id)).toEqual(["c9"]);
    expect(legalPlays({ ...s, heartsBroken: true }, 0)).toHaveLength(2);
    expect(legalPlays(state({ hands: [cards("h5", "h9"), [], [], []] }), 0)).toHaveLength(2);
  });

  it("gives the trick to the highest card of the suit led, with Aces high", () => {
    expect(trickWinner([{ seat: 2, card: c("c5") }, { seat: 3, card: c("h13") }, { seat: 0, card: c("c1") }, { seat: 1, card: c("c12") }])).toBe(0);
  });

  it("scores hearts and the Queen, and a moon shot gives everyone else 26", () => {
    expect(cardPoints(c("h7")) + cardPoints(c("s12")) + cardPoints(c("s13"))).toBe(14);
    const lastTrick = state({ phase: "trickDone", turn: 2, tricksPlayed: 12, points: [0, 0, 25, 0], trick: [{ seat: 2, card: c("h1") }, { seat: 3, card: c("c3") }, { seat: 0, card: c("d4") }, { seat: 1, card: c("d5") }] });
    const done = collectTrick(lastTrick);
    expect(done.moon).toBe(2);
    expect(done.scores).toEqual([26, 26, 0, 26]);
    expect(done.phase).toBe("roundOver");
  });
});

describe("computer players", () => {
  it("dump the Queen of Spades when they can't follow suit", () => {
    const s = state({ turn: 1, trick: [{ seat: 0, card: c("d9") }], hands: [[], cards("s12", "h2", "c13"), [], []] });
    expect(choosePlay(s, 1).id).toBe("s12");
  });

  it("duck under the winning card", () => {
    const s = state({ turn: 1, trick: [{ seat: 0, card: c("c10") }], hands: [[], cards("c2", "c9", "c13"), [], []] });
    expect(choosePlay(s, 1).id).toBe("c9");
  });

  it("play whole games legally, with every round's points adding up", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const random = seededRandom(seed);
      let s = newHeartsGame(random);
      for (let guard = 0; guard < 5000 && s.phase !== "gameOver"; guard++) {
        if (s.phase === "passing") s = passCards(s, choosePass(s.hands[0]!).map((x) => x.id));
        else if (s.phase === "trickDone") s = collectTrick(s);
        else if (s.phase === "roundOver") {
          const last = s.history.at(-1)!;
          expect([26, 78]).toContain(last.reduce((a, b) => a + b, 0));
          s = nextRound(s, random);
        } else {
          const card = choosePlay(s, s.turn);
          expect(legalPlays(s, s.turn)).toContain(card);
          s = playCard(s, s.turn, card.id);
        }
      }
      expect(s.phase).toBe("gameOver");
      expect(Math.max(...s.scores)).toBeGreaterThanOrEqual(100);
    }
  });
});
