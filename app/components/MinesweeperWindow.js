"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ROWS = 9;
const COLS = 9;
const MINES = 10;

const NUM_COLORS = {
  1: "#0000FF",
  2: "#008000",
  3: "#FF0000",
  4: "#000080",
  5: "#800000",
  6: "#008080",
  7: "#000000",
  8: "#808080",
};

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacent: 0,
    }))
  );
}

function placeMines(board, safeR, safeC) {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    // Keep safe zone around first click
    if (
      Math.abs(r - safeR) <= 1 &&
      Math.abs(c - safeC) <= 1
    )
      continue;
    if (newBoard[r][c].isMine) continue;
    newBoard[r][c].isMine = true;
    placed++;
  }
  // Calculate adjacency
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (newBoard[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc].isMine) {
            count++;
          }
        }
      }
      newBoard[r][c].adjacent = count;
    }
  }
  return newBoard;
}

function revealCell(board, r, c) {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const stack = [[r, c]];
  while (stack.length > 0) {
    const [cr, cc] = stack.pop();
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
    if (newBoard[cr][cc].isRevealed || newBoard[cr][cc].isFlagged) continue;
    newBoard[cr][cc].isRevealed = true;
    if (newBoard[cr][cc].adjacent === 0 && !newBoard[cr][cc].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          stack.push([cr + dr, cc + dc]);
        }
      }
    }
  }
  return newBoard;
}

function checkWin(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c].isMine && !board[r][c].isRevealed) return false;
    }
  }
  return true;
}

export default function MinesweeperWindow() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [gameState, setGameState] = useState("ready"); // ready, playing, won, lost
  const [time, setTime] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTime((t) => Math.min(999, t + 1));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const reset = useCallback(() => {
    clearInterval(timerRef.current);
    setBoard(createEmptyBoard());
    setGameState("ready");
    setTime(0);
    setFlagCount(0);
  }, []);

  const handleClick = useCallback(
    (r, c) => {
      if (gameState === "won" || gameState === "lost") return;
      if (board[r][c].isFlagged || board[r][c].isRevealed) return;

      let currentBoard = board;

      // First click — place mines
      if (gameState === "ready") {
        currentBoard = placeMines(board, r, c);
        setGameState("playing");
      }

      if (currentBoard[r][c].isMine) {
        // Game over — reveal all mines
        const lost = currentBoard.map((row) =>
          row.map((cell) => ({
            ...cell,
            isRevealed: cell.isMine ? true : cell.isRevealed,
          }))
        );
        lost[r][c].hitMine = true;
        setBoard(lost);
        setGameState("lost");
        clearInterval(timerRef.current);
        return;
      }

      const newBoard = revealCell(currentBoard, r, c);
      setBoard(newBoard);
      if (checkWin(newBoard)) {
        setGameState("won");
        clearInterval(timerRef.current);
      }
    },
    [board, gameState]
  );

  const handleRightClick = useCallback(
    (e, r, c) => {
      e.preventDefault();
      if (gameState === "won" || gameState === "lost") return;
      if (board[r][c].isRevealed) return;

      const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      const wasFlagged = newBoard[r][c].isFlagged;
      newBoard[r][c].isFlagged = !wasFlagged;
      setBoard(newBoard);
      setFlagCount((f) => f + (wasFlagged ? -1 : 1));
    },
    [board, gameState]
  );

  const smiley = gameState === "won" ? "😎" : gameState === "lost" ? "😵" : "🙂";
  const minesLeft = MINES - flagCount;

  const padNum = (n) => String(Math.max(0, n)).padStart(3, "0");

  return (
    <div className="h-full w-full flex flex-col items-center bg-[#C0C0C0] p-2">
      {/* Header bar */}
      <div
        className="flex items-center justify-between w-full max-w-[280px] mb-2 p-1"
        style={{
          border: "2px inset #808080",
          backgroundColor: "#C0C0C0",
        }}
      >
        {/* Mine counter */}
        <div
          className="font-mono text-lg font-bold px-1 min-w-[50px] text-center"
          style={{
            backgroundColor: "#000",
            color: "#FF0000",
            border: "1px inset #808080",
          }}
        >
          {padNum(minesLeft)}
        </div>

        {/* Smiley reset button */}
        <button
          onClick={reset}
          className="text-xl w-8 h-8 flex items-center justify-center cursor-pointer"
          style={{
            border: "2px outset #DFDFDF",
            backgroundColor: "#C0C0C0",
          }}
          title="New Game"
        >
          {smiley}
        </button>

        {/* Timer */}
        <div
          className="font-mono text-lg font-bold px-1 min-w-[50px] text-center"
          style={{
            backgroundColor: "#000",
            color: "#FF0000",
            border: "1px inset #808080",
          }}
        >
          {padNum(time)}
        </div>
      </div>

      {/* Board */}
      <div
        className="inline-block"
        style={{ border: "3px inset #808080" }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => {
              let content = "";
              let textColor = "#000";
              let bgColor = "#C0C0C0";
              let borderStyle = "2px outset #DFDFDF";

              if (cell.isRevealed) {
                borderStyle = "1px solid #808080";
                bgColor = "#D0D0D0";
                if (cell.isMine) {
                  content = "💣";
                  if (cell.hitMine) bgColor = "#FF0000";
                } else if (cell.adjacent > 0) {
                  content = cell.adjacent;
                  textColor = NUM_COLORS[cell.adjacent] || "#000";
                }
              } else if (cell.isFlagged) {
                content = "🚩";
              }

              return (
                <button
                  key={c}
                  onClick={() => handleClick(r, c)}
                  onContextMenu={(e) => handleRightClick(e, r, c)}
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold cursor-pointer select-none"
                  style={{
                    border: borderStyle,
                    backgroundColor: bgColor,
                    color: textColor,
                    fontSize: cell.isRevealed && cell.adjacent ? "13px" : "12px",
                    lineHeight: 1,
                    padding: 0,
                    minWidth: "28px",
                    minHeight: "28px",
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Game status */}
      {(gameState === "won" || gameState === "lost") && (
        <div
          className="mt-3 text-center text-sm font-bold px-4 py-1"
          style={{
            border: "2px inset #808080",
            backgroundColor: gameState === "won" ? "#90EE90" : "#FFB6B6",
          }}
        >
          {gameState === "won"
            ? "Congratulations! You win!"
            : "Game Over! Click the smiley to try again."}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-2 text-[10px] text-gray-600 text-center">
        Left-click to reveal · Right-click to flag · {ROWS}×{COLS} · {MINES} mines
      </div>
    </div>
  );
}
