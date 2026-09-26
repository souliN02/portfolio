"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { COLOR_SCHEMES, PROMPT, complete, introLines, runCommand } from "@/lib/terminal";
import { readJson, readStorage, writeStorage } from "@/lib/storage";
import { useDesktop } from "@/components/desktop/DesktopContext";

const HIST_KEY = "xp_term_history";
const COLOR_KEY = "xp_term_color";
const CHAR_DELAY = 9; // ms between character chunks within a line
const LINE_DELAY = 16; // ms before a new line starts printing
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);
const LINK_RE = /((?:https?:\/\/|www\.)[^\s)]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

interface Pending {
  out: string[];
  idx: number;
  char: number;
  speed: number;
}

export default function Terminal() {
  const api = useDesktop();
  const [lines, setLines] = useState<string[]>(() => introLines(new Date()));
  const [input, setInput] = useState("");
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [colorIdx, setColorIdx] = useState(0);
  const [typed, setTyped] = useState<string[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const historyRef = useRef<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colors = COLOR_SCHEMES[colorIdx] ?? COLOR_SCHEMES[0];

  // Restore color scheme and command history from a previous visit
  useEffect(() => {
    const saved = COLOR_SCHEMES.findIndex((s) => s.id === readStorage("local", COLOR_KEY));
    if (saved >= 0) setColorIdx(saved);
    const h = readJson<unknown>("local", HIST_KEY);
    if (Array.isArray(h)) historyRef.current = h.filter((x): x is string => typeof x === "string");
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines, typed]);

  useEffect(() => {
    if (!pending) inputRef.current?.focus({ preventScroll: true });
  }, [pending]);

  // Typewriter: reveal the output a chunk at a time
  useEffect(() => {
    if (!pending) return;
    const { out, idx, char, speed } = pending;
    const target = out[idx] ?? "";
    const t = setTimeout(
      () => {
        const next = Math.min(target.length, char + speed);
        setTyped([...out.slice(0, idx), target.slice(0, next)]);
        if (next < target.length) setPending({ out, idx, char: next, speed });
        else if (idx + 1 < out.length) setPending({ out, idx: idx + 1, char: 0, speed });
        else {
          setLines((prev) => [...prev, ...out]);
          setTyped([]);
          setPending(null);
        }
      },
      char === 0 ? LINE_DELAY : CHAR_DELAY,
    );
    return () => clearTimeout(t);
  }, [pending]);

  const flush = useCallback(() => {
    if (!pending) return;
    setLines((prev) => [...prev, ...pending.out]);
    setTyped([]);
    setPending(null);
  }, [pending]);

  const execute = (raw: string) => {
    const echo = `${PROMPT} ${raw.trim()}`;
    const { output, effect } = runCommand(raw, { history: historyRef.current, colorIndex: colorIdx, now: new Date(), random: Math.random });

    switch (effect?.type) {
      case "clear":
        setLines([]);
        return;
      case "exit":
        api.closeApp("terminal");
        return;
      case "openApp":
        api.openApp(effect.app, effect.props);
        break;
      case "openUrl":
        window.open(effect.url, "_blank", "noopener");
        break;
      case "color":
        setColorIdx(effect.index);
        writeStorage("local", COLOR_KEY, COLOR_SCHEMES[effect.index]!.id);
        break;
      case "shutdown":
        api.requestTurnOff();
        break;
    }

    setLines((prev) => [...prev, echo]);
    if (!output.length) return;
    const out = [...output, ""];
    const total = out.reduce((n, l) => n + l.length, 0);
    setPending({ out, idx: 0, char: 0, speed: Math.max(1, Math.ceil(total / 110)) });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // While output is printing, any key skips to the end
    if (pending) {
      if (!MODIFIER_KEYS.has(e.key)) {
        e.preventDefault();
        flush();
      }
      return;
    }
    const history = historyRef.current;
    if (e.key === "Tab") {
      e.preventDefault();
      const c = complete(input);
      if (c.value) setInput(c.value);
      else if (c.matches) setLines((prev) => [...prev, `${PROMPT} ${input}`, `  ${c.matches!.join("   ")}`, ""]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) {
        historyRef.current = [...history, input].slice(-100);
        writeStorage("local", HIST_KEY, JSON.stringify(historyRef.current));
      }
      setHistoryIdx(-1);
      execute(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(i);
      setInput(history[i] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      const i = historyIdx + 1;
      setHistoryIdx(i >= history.length ? -1 : i);
      setInput(i >= history.length ? "" : (history[i] ?? ""));
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const renderLine = (line: string): ReactNode => {
    if (!line) return line;
    const parts: ReactNode[] = [];
    let last = 0;
    for (const m of line.matchAll(LINK_RE)) {
      const token = m[0];
      const start = m.index ?? 0;
      if (start > last) parts.push(line.slice(last, start));
      const href = token.includes("@") && !token.startsWith("http") ? `mailto:${token}` : token.startsWith("http") ? token : `https://${token}`;
      parts.push(
        <a key={start} href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-75" style={{ color: colors.fg }} onClick={(e) => e.stopPropagation()}>
          {token}
        </a>,
      );
      last = start + token.length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
  };

  return (
    <div className="flex h-full w-full flex-col font-mono text-sm" style={{ backgroundColor: colors.bg, color: colors.fg }} onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      <div ref={scrollRef} className="flex-grow overflow-auto p-2 pb-0" role="log" aria-live="polite">
        {lines.map((line, i) => (
          <div key={i} className="min-h-[20px] whitespace-pre-wrap leading-5">
            {renderLine(line)}
          </div>
        ))}
        {typed.map((line, i) => (
          <div key={`t${i}`} className="min-h-[20px] whitespace-pre-wrap leading-5">
            {renderLine(line)}
            {i === typed.length - 1 && <span className="terminal-cursor">▮</span>}
          </div>
        ))}
        {!pending && (
          <div className="flex items-center leading-5">
            <label htmlFor="terminal-input" className="whitespace-pre">
              {PROMPT}&nbsp;
            </label>
            <input
              id="terminal-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="flex-grow border-none bg-transparent outline-none pointer-coarse:text-[16px]"
              style={{ color: colors.fg, caretColor: colors.fg }}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
        )}
      </div>
    </div>
  );
}
