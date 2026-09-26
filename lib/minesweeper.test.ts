import { describe, expect, it } from "vitest";
import { COLS, MINES, ROWS, clickCell, countFlags, createEmptyBoard, isWon, placeMines, revealCell, toggleFlag, type Board } from "./minesweeper";

/** Deterministic RNG so tests are repeatable */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const mines = (b: Board) => b.flat().filter((c) => c.isMine).length;

describe("placeMines", () => {
  it("places exactly the configured number of mines", () => {
    for (let seed = 1; seed < 20; seed++) {
      expect(mines(placeMines(createEmptyBoard(), 4, 4, MINES, seeded(seed)))).toBe(MINES);
    }
  });

  it("keeps the first click and its neighbours mine-free", () => {
    for (let seed = 1; seed < 50; seed++) {
      const b = placeMines(createEmptyBoard(), 0, 0, MINES, seeded(seed));
      expect(b[0]![0]!.isMine || b[0]![1]!.isMine || b[1]![0]!.isMine || b[1]![1]!.isMine).toBe(false);
    }
  });

  it("counts adjacent mines correctly", () => {
    const b = placeMines(createEmptyBoard(), 4, 4, MINES, seeded(7));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        let n = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && b[r + dr]?.[c + dc]?.isMine) n++;
        expect(b[r]![c]!.adjacent).toBe(n);
      }
    }
  });
});

describe("revealing", () => {
  it("flood-fills an empty board completely", () => {
    const b = revealCell(createEmptyBoard(3, 3), 1, 1);
    expect(b.flat().every((c) => c.isRevealed)).toBe(true);
    expect(isWon(b)).toBe(true);
  });

  it("does not reveal flagged cells", () => {
    const flagged = toggleFlag(createEmptyBoard(3, 3), 0, 0);
    const b = revealCell(flagged, 2, 2);
    expect(b[0]![0]!.isRevealed).toBe(false);
    expect(countFlags(b)).toBe(1);
  });

  it("the first click is always safe", () => {
    for (let seed = 1; seed < 30; seed++) {
      const { state } = clickCell(createEmptyBoard(), "ready", 4, 4, seeded(seed));
      expect(state === "playing" || state === "won").toBe(true);
    }
  });

  it("clicking a mine loses and reveals every mine", () => {
    const { board } = clickCell(createEmptyBoard(), "ready", 0, 0, seeded(3));
    const [mr, mc] = (() => {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r]![c]!.isMine) return [r, c];
      throw new Error("no mine");
    })();
    const lost = clickCell(board, "playing", mr, mc);
    expect(lost.state).toBe("lost");
    expect(lost.board[mr]![mc]!.hitMine).toBe(true);
    expect(lost.board.flat().filter((c) => c.isMine).every((c) => c.isRevealed)).toBe(true);
  });

  it("ignores clicks after the game ends", () => {
    const b = createEmptyBoard();
    expect(clickCell(b, "won", 0, 0).board).toBe(b);
  });
});
