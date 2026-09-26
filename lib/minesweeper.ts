/** Pure Minesweeper rules, kept out of the component so they can be tested */

export interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacent: number;
  hitMine?: boolean;
}

export type Board = Cell[][];
export type GameState = "ready" | "playing" | "won" | "lost";

export const ROWS = 9;
export const COLS = 9;
export const MINES = 10;

const cloneBoard = (board: Board): Board => board.map((row) => row.map((cell) => ({ ...cell })));

function cellAt(board: Board, r: number, c: number): Cell {
  const cell = board[r]?.[c];
  if (!cell) throw new RangeError(`No cell at ${r},${c}`);
  return cell;
}

function inBounds(board: Board, r: number, c: number): boolean {
  return r >= 0 && r < board.length && c >= 0 && c < (board[0]?.length ?? 0);
}

export function createEmptyBoard(rows = ROWS, cols = COLS): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ isMine: false, isRevealed: false, isFlagged: false, adjacent: 0 })),
  );
}

/** Place mines anywhere except the first-clicked cell and its neighbours, then count adjacency */
export function placeMines(board: Board, safeR: number, safeC: number, mines = MINES, random: () => number = Math.random): Board {
  const next = cloneBoard(board);
  const rows = next.length;
  const cols = next[0]?.length ?? 0;
  const candidates: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      candidates.push([r, c]);
    }
  }
  // Partial Fisher-Yates shuffle: pick `mines` distinct cells
  const count = Math.min(mines, candidates.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
    const [r, c] = candidates[i]!;
    cellAt(next, r, c).isMine = true;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if ((dr || dc) && inBounds(next, r + dr, c + dc) && cellAt(next, r + dr, c + dc).isMine) n++;
        }
      }
      cellAt(next, r, c).adjacent = n;
    }
  }
  return next;
}

/** Reveal a cell, flood-filling outward from cells with no adjacent mines */
export function revealCell(board: Board, r: number, c: number): Board {
  const next = cloneBoard(board);
  const stack: [number, number][] = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    if (!inBounds(next, cr, cc)) continue;
    const cell = cellAt(next, cr, cc);
    if (cell.isRevealed || cell.isFlagged) continue;
    cell.isRevealed = true;
    if (cell.adjacent === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr || dc) stack.push([cr + dr, cc + dc]);
        }
      }
    }
  }
  return next;
}

export function revealMines(board: Board, hitR: number, hitC: number): Board {
  const next = board.map((row) => row.map((cell) => ({ ...cell, isRevealed: cell.isMine || cell.isRevealed })));
  cellAt(next, hitR, hitC).hitMine = true;
  return next;
}

export function toggleFlag(board: Board, r: number, c: number): Board {
  if (cellAt(board, r, c).isRevealed) return board;
  const next = cloneBoard(board);
  const cell = cellAt(next, r, c);
  cell.isFlagged = !cell.isFlagged;
  return next;
}

export function isWon(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell.isMine || cell.isRevealed));
}

export function countFlags(board: Board): number {
  return board.reduce((n, row) => n + row.filter((cell) => cell.isFlagged).length, 0);
}

export interface ClickResult {
  board: Board;
  state: GameState;
}

/** One left-click: places mines on the first click, reveals, and decides win or loss */
export function clickCell(board: Board, state: GameState, r: number, c: number, random?: () => number): ClickResult {
  if (state === "won" || state === "lost") return { board, state };
  const cell = cellAt(board, r, c);
  if (cell.isFlagged || cell.isRevealed) return { board, state };
  const armed = state === "ready" ? placeMines(board, r, c, MINES, random) : board;
  if (cellAt(armed, r, c).isMine) return { board: revealMines(armed, r, c), state: "lost" };
  const revealed = revealCell(armed, r, c);
  return { board: revealed, state: isWon(revealed) ? "won" : "playing" };
}
