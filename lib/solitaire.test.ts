import { describe, expect, it } from "vitest";
import { makeCard, seededRandom, type Card, type Suit } from "./cards";
import { SCORE, autoFinishMove, autoTarget, canAutoFinish, canMove, deal, draw, isWon, move, pickUp, timeBonus, type SolitaireState } from "./solitaire";

const S: Record<string, Suit> = { c: "clubs", d: "diamonds", h: "hearts", s: "spades" };
/** "h7" is the 7 of hearts, face up; "h7x" is face down */
const c = (code: string): Card => makeCard(S[code[0]!]!, Number(code.slice(1).replace("x", "")), !code.endsWith("x"));
const cards = (...codes: string[]) => codes.map(c);
const run = (s: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => c(`${s}${from + i}`));

function state(partial: Partial<SolitaireState>): SolitaireState {
  return { stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []], drawCount: 1, score: 0, moves: 0, ...partial };
}

describe("deal", () => {
  it("deals 1 to 7 cards per pile with only the top card showing", () => {
    const s = deal(1, seededRandom(1));
    s.tableau.forEach((p, i) => {
      expect(p).toHaveLength(i + 1);
      expect(p.map((x) => x.faceUp)).toEqual([...Array(i).fill(false), true]);
    });
    expect(s.stock).toHaveLength(24);
    const ids = [...s.stock, ...s.tableau.flat()].map((x) => x.id);
    expect(new Set(ids).size).toBe(52);
  });
});

describe("drawing", () => {
  it("draws one card, or three, onto the waste", () => {
    const s = deal(1, seededRandom(2));
    const one = draw(s);
    expect(one.waste).toHaveLength(1);
    expect(one.waste[0]!.faceUp).toBe(true);
    const three = draw({ ...s, drawCount: 3 });
    expect(three.waste).toHaveLength(3);
    // The third card down in the stock ends up on top of the waste
    expect(three.waste[2]!.id).toBe(s.stock[s.stock.length - 3]!.id);
  });

  it("turns the waste back into the stock in the same order, for a penalty", () => {
    let s = state({ stock: cards("h2x", "s5x"), score: 150 });
    s = draw(draw(s));
    expect(s.stock).toHaveLength(0);
    const recycled = draw(s);
    expect(recycled.stock.map((x) => x.id)).toEqual(["h2", "s5"]);
    expect(recycled.stock.every((x) => !x.faceUp)).toBe(true);
    expect(recycled.score).toBe(150 + SCORE.recycleDrawOne);
    expect(draw({ ...s, drawCount: 3 }).score).toBe(150 + SCORE.recycleDrawThree);
  });
});

describe("moves", () => {
  it("only accepts an Ace on an empty foundation, then the same suit going up", () => {
    const s = state({ waste: cards("h1"), tableau: [cards("h2"), cards("s2"), [], [], [], [], []] });
    expect(canMove(s, "t0", 0, "f0")).toBe(false);
    const next = move(s, "waste", 0, "f0");
    expect(canMove(next, "t0", 0, "f0")).toBe(true);
    expect(canMove(next, "t1", 0, "f0")).toBe(false);
  });

  it("builds down in alternating colours, with only Kings on empty piles", () => {
    const s = state({ tableau: [cards("s8"), cards("h7"), cards("d7"), cards("c7"), cards("h13"), [], []] });
    expect(canMove(s, "t1", 0, "t0")).toBe(true);
    expect(canMove(s, "t3", 0, "t0")).toBe(false);
    expect(canMove(s, "t1", 0, "t5")).toBe(false);
    expect(canMove(s, "t4", 0, "t5")).toBe(true);
  });

  it("moves a whole run and turns over the card underneath, for points", () => {
    const s = state({ tableau: [cards("d4x", "s9", "h8", "c7"), cards("d10"), [], [], [], [], []] });
    expect(pickUp(s, "t0", 1)).toHaveLength(3);
    const next = move(s, "t0", 1, "t1");
    expect(next.tableau[1]!.map((x) => x.id)).toEqual(["d10", "s9", "h8", "c7"]);
    expect(next.tableau[0]).toEqual([c("d4")]);
    expect(next.score).toBe(SCORE.turnOver);
  });

  it("scores like XP", () => {
    const s = state({ waste: cards("h6"), foundations: [cards("s1"), [], [], []], tableau: [cards("c7"), cards("s2"), [], [], [], [], []], score: 20 });
    expect(move(s, "waste", 0, "t0").score).toBe(20 + SCORE.wasteToTableau);
    expect(move(s, "t1", 0, "f0").score).toBe(20 + SCORE.toFoundation);
    const onFoundation = state({ foundations: [cards("s1", "s2", "s3"), [], [], []], tableau: [cards("h4"), [], [], [], [], [], []], score: 20 });
    expect(move(onFoundation, "f0", 2, "t0").score).toBe(20 + SCORE.foundationToTableau);
  });

  it("refuses face-down cards and cards from the middle of the waste", () => {
    const s = state({ waste: cards("h1", "s1"), tableau: [cards("d5x", "c4"), [], [], [], [], [], []] });
    expect(pickUp(s, "waste", 0)).toBeNull();
    expect(pickUp(s, "t0", 0)).toBeNull();
    expect(pickUp(s, "stock", 0)).toBeNull();
  });
});

describe("autoTarget", () => {
  it("prefers a foundation, then a pile with cards, and leaves foundations alone", () => {
    const s = state({ foundations: [cards("h1"), [], [], []], tableau: [cards("h2"), cards("s3"), [], [], [], [], []] });
    expect(autoTarget(s, "t0", 0)).toBe("f0");
    const s2 = state({ tableau: [cards("h2x", "d12"), [], cards("s13"), [], [], [], []] });
    expect(autoTarget(s2, "t0", 1)).toBe("t2");
    expect(autoTarget(state({ foundations: [cards("h1"), [], [], []], tableau: [cards("s2"), [], [], [], [], [], []] }), "f0", 0)).toBeNull();
  });

  it("does not shuffle a King between empty piles", () => {
    const s = state({ tableau: [cards("s13"), [], [], [], [], [], []] });
    expect(autoTarget(s, "t0", 0)).toBeNull();
  });
});

describe("finishing", () => {
  it("auto-finishes once every card is face up", () => {
    let s = state({
      foundations: [run("c", 1, 12), run("d", 1, 12), run("h", 1, 11), run("s", 1, 11)],
      tableau: [cards("s13", "h12"), cards("h13", "s12"), cards("c13"), cards("d13"), [], [], []],
    });
    expect(canAutoFinish(s)).toBe(true);
    for (let step = 0; step < 10; step++) {
      const m = autoFinishMove(s);
      if (!m) break;
      s = move(s, m.from, m.index, m.to);
    }
    expect(isWon(s)).toBe(true);
    expect(canAutoFinish(s)).toBe(false);
  });

  it("gives XP's time bonus", () => {
    expect(timeBonus(100)).toBe(7000);
    expect(timeBonus(29)).toBe(0);
  });
});
