import { readJson, writeStorage } from "./storage";

/**
 * Per-browser game statistics, like XP's Statistics dialogs: games played,
 * games won, and a best result. The terminal's `highscores` reads them.
 */

export const GAME_IDS = ["minesweeper", "solitaire", "spider", "freecell", "hearts"] as const;
export type GameId = (typeof GAME_IDS)[number];

export interface GameStat {
  played: number;
  won: number;
  /** Best time in seconds, or best score, depending on the game */
  best?: number;
}

export type GameStats = Record<GameId, GameStat>;

/** How each game's best result is measured */
export const BEST_KIND: Record<GameId, { label: string; better: "lower" | "higher"; unit: string }> = {
  minesweeper: { label: "Best time", better: "lower", unit: "seconds" },
  solitaire: { label: "High score", better: "higher", unit: "points" },
  spider: { label: "High score", better: "higher", unit: "points" },
  freecell: { label: "Fewest moves", better: "lower", unit: "moves" },
  /** Your final score in a game you won */
  hearts: { label: "Best win", better: "lower", unit: "points" },
};

const KEY = "xp_game_stats";

export function readStats(): GameStats {
  const saved = readJson<Partial<Record<GameId, Partial<GameStat>>>>("local", KEY) ?? {};
  const out = {} as GameStats;
  for (const id of GAME_IDS) {
    const s = saved[id];
    out[id] = {
      played: Number(s?.played) || 0,
      won: Number(s?.won) || 0,
      ...(typeof s?.best === "number" && Number.isFinite(s.best) ? { best: s.best } : {}),
    };
  }
  return out;
}

export function isBetter(id: GameId, value: number, best: number | undefined): boolean {
  return best === undefined || (BEST_KIND[id].better === "lower" ? value < best : value > best);
}

function update(id: GameId, change: (s: GameStat) => GameStat) {
  const stats = readStats();
  stats[id] = change(stats[id]);
  writeStorage("local", KEY, JSON.stringify(stats));
}

/** Call once per game, on the first move */
export const recordStart = (id: GameId) => update(id, (s) => ({ ...s, played: s.played + 1 }));

/** Call on a win; returns true when `result` is a new best */
export function recordWin(id: GameId, result?: number): boolean {
  let record = false;
  update(id, (s) => {
    record = result !== undefined && isBetter(id, result, s.best);
    return { ...s, won: s.won + 1, ...(record ? { best: result } : {}) };
  });
  return record;
}
