"use client";

import { useEffect, useState } from "react";
import { COLS, MINES, ROWS, clickCell, countFlags, createEmptyBoard, toggleFlag, type Board, type GameState } from "@/lib/minesweeper";
import { recordStart, recordWin } from "@/lib/gameStats";

const NUM_COLORS: Record<number, string> = {
  1: "#0000FF",
  2: "#008000",
  3: "#FF0000",
  4: "#000080",
  5: "#800000",
  6: "#008080",
  7: "#000000",
  8: "#808080",
};

const pad = (n: number) => String(Math.max(0, n)).padStart(3, "0");

export default function Minesweeper() {
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [game, setGame] = useState<GameState>("ready");
  const [time, setTime] = useState(0);
  const [flagMode, setFlagMode] = useState(false); // touch screens: taps place flags

  useEffect(() => {
    if (game !== "playing") return;
    const t = setInterval(() => setTime((s) => Math.min(999, s + 1)), 1000);
    return () => clearInterval(t);
  }, [game]);

  const reset = () => {
    setBoard(createEmptyBoard());
    setGame("ready");
    setTime(0);
  };

  const flag = (r: number, c: number) => {
    if (game === "won" || game === "lost") return;
    setBoard((b) => toggleFlag(b, r, c));
  };

  const reveal = (r: number, c: number) => {
    if (flagMode) return flag(r, c);
    const result = clickCell(board, game, r, c);
    if (game === "ready" && result.state !== "ready") recordStart("minesweeper");
    if (result.state === "won" && game !== "won") recordWin("minesweeper", time);
    setBoard(result.board);
    setGame(result.state);
  };

  const face = game === "won" ? "😎" : game === "lost" ? "😵" : "🙂";

  return (
    <div className="flex h-full w-full flex-col items-center overflow-auto bg-[#C0C0C0] p-2">
      <div className="mb-2 flex w-full max-w-[272px] items-center justify-between p-1" style={{ border: "2px inset #808080" }}>
        <Counter value={MINES - countFlags(board)} label="Mines left" />
        <button type="button" onClick={reset} className="flex h-8 w-8 items-center justify-center text-xl" style={{ border: "2px outset #DFDFDF", background: "#C0C0C0" }} aria-label="New game">
          {face}
        </button>
        <Counter value={time} label="Seconds" />
      </div>

      <div className="inline-block" style={{ border: "3px inset #808080" }} onContextMenu={(e) => e.preventDefault()} role="grid" aria-label="Minesweeper board">
        {board.map((row, r) => (
          <div key={r} className="flex" role="row">
            {row.map((cell, c) => {
              let content: string | number = "";
              let color = "#000";
              if (cell.isRevealed) {
                if (cell.isMine) content = "💣";
                else if (cell.adjacent > 0) {
                  content = cell.adjacent;
                  color = NUM_COLORS[cell.adjacent] ?? "#000";
                }
              } else if (cell.isFlagged) content = "🚩";
              return (
                <button
                  key={c}
                  type="button"
                  role="gridcell"
                  aria-label={cell.isRevealed ? (cell.isMine ? "Mine" : `${cell.adjacent || "Empty"}`) : cell.isFlagged ? "Flagged" : "Hidden"}
                  onClick={() => reveal(r, c)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    flag(r, c);
                  }}
                  className="ms-cell flex select-none items-center justify-center font-bold"
                  style={{
                    width: 28,
                    height: 28,
                    padding: 0,
                    lineHeight: 1,
                    fontSize: cell.isRevealed && cell.adjacent ? 13 : 12,
                    color,
                    border: cell.isRevealed ? "1px solid #808080" : "2px outset #DFDFDF",
                    background: cell.hitMine ? "#FF0000" : cell.isRevealed ? "#D0D0D0" : "#C0C0C0",
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {(game === "won" || game === "lost") && (
        <div className="mt-3 px-4 py-1 text-center text-sm font-bold" style={{ border: "2px inset #808080", background: game === "won" ? "#90EE90" : "#FFB6B6" }} role="status">
          {game === "won" ? "Congratulations! You win!" : "Game over! Click the face to try again."}
        </div>
      )}

      {/* Touch screens have no right-click, so flagging gets its own toggle */}
      <button
        type="button"
        onClick={() => setFlagMode((f) => !f)}
        aria-pressed={flagMode}
        className="mt-3 hidden items-center gap-1 px-3 py-1.5 text-xs font-bold pointer-coarse:flex"
        style={{ border: flagMode ? "2px inset #808080" : "2px outset #DFDFDF", background: flagMode ? "#D0D0D0" : "#C0C0C0" }}
      >
        🚩 Flag mode: {flagMode ? "On" : "Off"}
      </button>

      <p className="mt-2 text-center text-[10px] text-gray-700">
        <span className="pointer-coarse:hidden">Left-click to reveal · Right-click to flag</span>
        <span className="hidden pointer-coarse:inline">Tap to reveal · Flag mode to flag</span> · {ROWS}×{COLS} · {MINES} mines
      </p>
    </div>
  );
}

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-[50px] px-1 text-center font-mono text-lg font-bold" style={{ background: "#000", color: "#FF0000", border: "1px inset #808080" }} aria-label={`${label}: ${value}`}>
      {pad(value)}
    </div>
  );
}
