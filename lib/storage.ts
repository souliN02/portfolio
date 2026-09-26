/**
 * localStorage/sessionStorage can throw (private windows, blocked site data),
 * so every access goes through these helpers and failures just mean "nothing saved".
 */

type Kind = "local" | "session";

function store(kind: Kind): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStorage(kind: Kind, key: string): string | null {
  try {
    return store(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(kind: Kind, key: string, value: string | null) {
  try {
    const s = store(kind);
    if (value === null) s?.removeItem(key);
    else s?.setItem(key, value);
  } catch {}
}

export function readJson<T>(kind: Kind, key: string): T | null {
  const raw = readStorage(kind, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
