import { describe, expect, it } from "vitest";
import { makeCard, rankLabel, type Card, type Suit } from "./cards";
import { autoTarget, canMove, dealFreeCell, hasMoves, isWon, maxMovable, move, nextAutoMove, type FreeCellState } from "./freecell";

const S: Record<string, Suit> = { C: "clubs", D: "diamonds", H: "hearts", S: "spades" };
const RANKS = "A23456789TJQK";
/** Microsoft's notation: "JD" is the Jack of diamonds, "TS" the 10 of spades */
const c = (code: string): Card => makeCard(S[code[1]!]!, RANKS.indexOf(code[0]!) + 1, true);
const code = (card: Card) => `${rankLabel(card.rank).replace("10", "T")}${card.suit[0]!.toUpperCase()}`;

function state(partial: Partial<FreeCellState>): FreeCellState {
  return { game: 0, cells: [null, null, null, null], foundations: [[], [], [], []], tableau: Array.from({ length: 8 }, () => []), moves: 0, ...partial };
}

describe("dealFreeCell", () => {
  it("deals game #1 exactly as Windows did", () => {
    const rows = [
      "JD 2D 9H JC 5D 7H 7C 5H",
      "KD KC 9S 5S AD QC KH 3H",
      "2S KS 9D QD JS AS AH 3C",
      "4C 5C TS QH 4H AC 4D 7S",
      "3S TD 4S TH 8H 2C JH 7D",
      "6D 8S 8D QS 6C 3D 8C TC",
      "6S 9C 2H 6H",
    ];
    const s = dealFreeCell(1);
    rows.forEach((row, r) => row.split(" ").forEach((expected, col) => expect(code(s.tableau[col]![r]!)).toBe(expected)));
    expect(s.tableau.map((p) => p.length)).toEqual([7, 7, 7, 7, 6, 6, 6, 6]);
  });

  it("deals every game with all 52 cards face up", () => {
    for (const n of [2, 617, 11982, 32000]) {
      const cards = dealFreeCell(n).tableau.flat();
      expect(new Set(cards.map((x) => x.id)).size).toBe(52);
      expect(cards.every((x) => x.faceUp)).toBe(true);
    }
  });
});

describe("moves", () => {
  it("moves as many cards as free cells and empty columns allow", () => {
    const s = state({ cells: [c("AS"), null, null, null], tableau: [[c("9S"), c("8H"), c("7C"), c("6D")], [c("TD")], [], [c("KH")], [c("KD")], [c("KC")], [c("KS")], [c("QH")]] });
    // 3 free cells and 1 empty column: (3 + 1) * 2 = 8 onto a card, 4 into the empty column
    expect(maxMovable(s, false)).toBe(8);
    expect(maxMovable(s, true)).toBe(4);
    expect(canMove(s, "t0", 0, "t1")).toBe(true);
    const cramped = { ...s, cells: [c("AS"), c("2S"), c("3S"), null], tableau: s.tableau.map((p, i) => (i === 2 ? [c("QC")] : p)) };
    expect(maxMovable(cramped, false)).toBe(2);
    expect(canMove(cramped, "t0", 0, "t1")).toBe(false);
    expect(canMove(cramped, "t0", 2, "t1")).toBe(false);
  });

  it("uses free cells for single cards and keeps home cells in suit order", () => {
    const s = state({ tableau: [[c("5H"), c("AH")], [c("2H")], [c("2S")], [], [], [], [], []] });
    expect(canMove(s, "t0", 0, "c0")).toBe(false);
    expect(canMove(s, "t0", 1, "c0")).toBe(true);
    const home = move(s, "t0", 1, "f0");
    expect(canMove(home, "t1", 0, "f0")).toBe(true);
    expect(canMove(home, "t2", 0, "f0")).toBe(false);
    expect(canMove(home, "f0", 0, "t3")).toBe(false);
  });

  it("taps send a card home, then onto a column, then to a free cell", () => {
    const s = state({ foundations: [[c("AH")], [], [], []], tableau: [[c("2H")], [c("9C")], [c("5S")], [c("KD")], [c("KC")], [c("QS")], [c("QD")], [c("JH")]] });
    expect(autoTarget(s, "t0", 0)).toBe("f0");
    expect(autoTarget(s, "t1", 0)).toBe("c0");
    expect(autoTarget(s, "t7", 0)).toBe("t5");
  });
});

describe("automatic moves and the end of the game", () => {
  it("sends Aces and safe cards home, but keeps cards that are still needed", () => {
    const s = state({ foundations: [[c("AH")], [c("AC")], [], []], tableau: [[c("2H")], [c("3H")], [c("AS")], [], [], [], [], []] });
    expect(nextAutoMove(s)).toMatchObject({ from: "t0" });
    const later = state({ foundations: [[c("AH"), c("2H")], [c("AC")], [], []], tableau: [[c("3H")], [], [], [], [], [], [], []] });
    // A black 2 could still need the red 3
    expect(nextAutoMove(later)).toBeNull();
  });

  it("notices when no legal moves are left", () => {
    const stuck = state({
      cells: [c("KH"), c("KD"), c("KS"), c("KC")],
      // Queens and 10s on top: nothing stacks, and every Ace is buried
      tableau: [[c("AH"), c("QH")], [c("AD"), c("QD")], [c("AS"), c("QS")], [c("AC"), c("QC")], [c("3H"), c("TH")], [c("3D"), c("TD")], [c("3S"), c("TS")], [c("3C"), c("TC")]],
    });
    expect(hasMoves(stuck)).toBe(false);
    expect(hasMoves(dealFreeCell(1))).toBe(true);
  });

  it("is won when every card is home", () => {
    const suits = ["H", "D", "S", "C"];
    const home = suits.map((s) => [..."A23456789TJQK"].map((r) => c(`${r}${s}`)));
    expect(isWon(state({ foundations: home }))).toBe(true);
  });
});
