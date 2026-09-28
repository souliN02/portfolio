import { describe, expect, it } from "vitest";
import { makeCard, seededRandom, type Card } from "./cards";
import { autoTarget, canDeal, canMove, dealRow, dealSpider, isWon, move, pickUp, type SpiderState } from "./spider";

const sp = (rank: number, faceUp = true): Card => makeCard("spades", rank, faceUp);
const he = (rank: number, faceUp = true): Card => makeCard("hearts", rank, faceUp);
const empty10 = (): Card[][] => Array.from({ length: 10 }, () => []);

function state(partial: Partial<SpiderState>): SpiderState {
  return { tableau: empty10(), stock: [], completed: [], suits: 2, score: 500, moves: 0, ...partial };
}

describe("dealSpider", () => {
  it("deals 54 cards to ten piles and keeps 50 in the stock", () => {
    const s = dealSpider(4, seededRandom(3));
    expect(s.tableau.map((p) => p.length)).toEqual([6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
    expect(s.tableau.every((p) => p.at(-1)!.faceUp && p.slice(0, -1).every((c) => !c.faceUp))).toBe(true);
    expect(s.stock).toHaveLength(50);
    expect(new Set([...s.stock, ...s.tableau.flat()].map((c) => c.id)).size).toBe(104);
  });

  it("uses one, two or four suits", () => {
    const suits = (n: 1 | 2 | 4) => new Set([...dealSpider(n, seededRandom(1)).stock, ...dealSpider(n, seededRandom(1)).tableau.flat()].map((c) => c.suit)).size;
    expect(suits(1)).toBe(1);
    expect(suits(2)).toBe(2);
    expect(suits(4)).toBe(4);
  });
});

describe("moves", () => {
  it("picks up only runs of one suit", () => {
    const s = state({ tableau: [[sp(9), sp(8), sp(7)], [sp(9), he(8), sp(7)], ...empty10().slice(2)] });
    expect(pickUp(s, "t0", 0)).toHaveLength(3);
    expect(pickUp(s, "t1", 0)).toBeNull();
    expect(pickUp(s, "t1", 2)).toHaveLength(1);
  });

  it("places any card on one rank higher, whatever the suit", () => {
    const s = state({ tableau: [[he(8)], [sp(9)], [sp(10)], [], ...empty10().slice(4)] });
    expect(canMove(s, "t0", 0, "t1")).toBe(true);
    expect(canMove(s, "t0", 0, "t2")).toBe(false);
    expect(canMove(s, "t0", 0, "t3")).toBe(true);
  });

  it("costs a point, and turns over the uncovered card", () => {
    const s = state({ tableau: [[sp(4, false), he(8)], [sp(9)], ...empty10().slice(2)] });
    const next = move(s, "t0", 1, "t1");
    expect(next.score).toBe(499);
    expect(next.tableau[0]![0]!.faceUp).toBe(true);
  });

  it("takes a finished King-to-Ace run off the table for 100 points", () => {
    const run = Array.from({ length: 12 }, (_, i) => sp(13 - i));
    const s = state({ tableau: [[he(5, false), ...run], [sp(1)], ...empty10().slice(2)] });
    const next = move(s, "t1", 0, "t0");
    expect(next.completed).toEqual(["spades"]);
    expect(next.tableau[0]).toEqual([he(5)]);
    expect(next.score).toBe(500 - 1 + 100);
    expect(isWon({ ...next, completed: Array(8).fill("spades") })).toBe(true);
  });

  it("prefers a same-suit home when tapped", () => {
    const s = state({ tableau: [[sp(8)], [he(9)], [sp(9)], ...empty10().slice(3)] });
    expect(autoTarget(s, "t0", 0)).toBe("t2");
  });
});

describe("dealing", () => {
  it("deals a card to every pile, but never while a pile is empty", () => {
    const s = dealSpider(1, seededRandom(5));
    const next = dealRow(s);
    expect(next.stock).toHaveLength(40);
    expect(next.tableau.every((p, i) => p.length === s.tableau[i]!.length + 1 && p.at(-1)!.faceUp)).toBe(true);
    const withGap = { ...s, tableau: [[], ...s.tableau.slice(1)] };
    expect(canDeal(withGap)).toBe(false);
    expect(dealRow(withGap)).toBe(withGap);
  });
});
