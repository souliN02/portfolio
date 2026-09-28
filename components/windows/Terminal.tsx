"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { COLOR_SCHEMES, PROMPT, complete, introLines, isCommandText, runCommand } from "@/lib/terminal";
import { readStats } from "@/lib/gameStats";
import { readJson, readStorage, writeStorage } from "@/lib/storage";
import { useDesktop } from "@/components/desktop/DesktopContext";

const HIST_KEY = "xp_term_history";
const COLOR_KEY = "xp_term_color";
const CHAR_DELAY = 9; // ms between character chunks within a line
const LINE_DELAY = 16; // ms before a new line starts printing
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);
const LINK_RE = /((?:https?:\/\/|www\.)[^\s)]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
/** A 'quoted command' anywhere in the output can be tapped to run it */
const QUOTED_RE = /'([^'\n]+)'/g;
/** Phones have no Tab or arrow keys, and typing is slow, so these get buttons */
const QUICK_COMMANDS = ["help", "projects", "games", "about", "hire", "contact", "cls"];

interface Line {
  text: string;
  /** Words that run a command when tapped, mapped to the command */
  links?: Record<string, string>;
}

interface Pending {
  out: Line[];
  idx: number;
  char: number;
  speed: number;
}

const plain = (texts: string[]): Line[] => texts.map((text) => ({ text }));

const phraseCache = new WeakMap<Record<string, string>, RegExp>();
function phraseRegex(links: Record<string, string>): RegExp {
  let re = phraseCache.get(links);
  if (!re) {
    const alts = Object.keys(links)
      .sort((a, b) => b.length - a.length)
      .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    re = new RegExp(`(?<=^|[\\s,(])(?:${alts})(?=$|[\\s,).:])`, "g");
    phraseCache.set(links, re);
  }
  return re;
}

export default function Terminal() {
  const api = useDesktop();
  const { setTitle, touch } = api;
  const [lines, setLines] = useState<Line[]>(() => plain(introLines(new Date())));
  const [input, setInput] = useState("");
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [colorIdx, setColorIdx] = useState(0);
  const [typed, setTyped] = useState<Line[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [columns, setColumns] = useState<number>();
  const historyRef = useRef<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colors = COLOR_SCHEMES[colorIdx] ?? COLOR_SCHEMES[0];

  // Restore color scheme and command history from a previous visit
  useEffect(() => {
    const saved = COLOR_SCHEMES.findIndex((s) => s.id === readStorage("local", COLOR_KEY));
    if (saved >= 0) setColorIdx(saved);
    const h = readJson<unknown>("local", HIST_KEY);
    if (Array.isArray(h)) historyRef.current = h.filter((x): x is string => typeof x === "string");
  }, []);

  // A `title` set here shouldn't outlive the window
  useEffect(() => () => setTitle("terminal", null), [setTitle]);

  // How many characters fit on a line, so output can wrap to a phone's width
  useEffect(() => {
    const el = scrollRef.current;
    const probe = probeRef.current;
    if (!el || !probe) return;
    const measure = () => {
      const charW = probe.getBoundingClientRect().width / 10;
      const style = getComputedStyle(el);
      const inner = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (charW > 0) setColumns(Math.floor(inner / charW));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines, typed]);

  // Focus the prompt on open, except on touch screens where that would throw a keyboard over the window
  useEffect(() => {
    if (!touch) inputRef.current?.focus({ preventScroll: true });
  }, [touch]);

  // Typewriter: reveal the output a chunk at a time
  useEffect(() => {
    if (!pending) return;
    const { out, idx, char, speed } = pending;
    const target = out[idx]?.text ?? "";
    const t = setTimeout(
      () => {
        const next = Math.min(target.length, char + speed);
        setTyped([...out.slice(0, idx), { ...out[idx]!, text: target.slice(0, next) }]);
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
    const echo = { text: `${PROMPT} ${raw.trim()}` };
    const ctx = { history: historyRef.current, colorIndex: colorIdx, now: new Date(), random: Math.random, columns, openApps: api.getOpenApps(), stats: readStats() };
    const { output, effect, links } = runCommand(raw, ctx);

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
      case "closeApps":
        effect.apps.forEach(api.closeApp);
        break;
      case "openUrl":
        window.open(effect.url, "_blank", "noopener");
        break;
      case "color":
        setColorIdx(effect.index);
        writeStorage("local", COLOR_KEY, COLOR_SCHEMES[effect.index]!.id);
        break;
      case "title":
        setTitle("terminal", effect.text);
        break;
      case "shutdown":
        api.requestTurnOff();
        break;
    }

    setLines((prev) => [...prev, echo]);
    if (!output.length) return;
    const out = [...output, ""].map((text) => ({ text, links }));
    const total = out.reduce((n, l) => n + l.text.length, 0);
    setPending({ out, idx: 0, char: 0, speed: Math.max(1, Math.ceil(total / 110)) });
  };

  /** Run a command as if it had been typed, from Enter, a tapped command or a quick button */
  const submit = (raw: string) => {
    flush();
    if (raw.trim()) {
      historyRef.current = [...historyRef.current, raw].slice(-100);
      writeStorage("local", HIST_KEY, JSON.stringify(historyRef.current));
    }
    setHistoryIdx(-1);
    execute(raw);
    setInput("");
  };

  const tabComplete = () => {
    const c = complete(input, { openApps: api.getOpenApps() });
    if (c.value) setInput(c.value);
    else if (c.matches) setLines((prev) => [...prev, ...plain([`${PROMPT} ${input}`, `  ${c.matches!.join("   ")}`, ""])]);
  };

  const browseHistory = (dir: -1 | 1) => {
    const history = historyRef.current;
    if (dir < 0) {
      if (!history.length) return;
      const i = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(i);
      setInput(history[i] ?? "");
    } else {
      if (historyIdx === -1) return;
      const i = historyIdx + 1;
      setHistoryIdx(i >= history.length ? -1 : i);
      setInput(i >= history.length ? "" : (history[i] ?? ""));
    }
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
    if (e.key === "Tab") {
      e.preventDefault();
      tabComplete();
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit(input);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      browseHistory(e.key === "ArrowUp" ? -1 : 1);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const commandButton = (key: number, label: string, command: string) => (
    <button
      key={key}
      type="button"
      className="cursor-pointer underline decoration-dotted underline-offset-2 hover:opacity-75"
      style={{ color: colors.fg }}
      title={`Run: ${command}`}
      onClick={(e) => {
        e.stopPropagation();
        submit(command);
        // Back to the prompt for the next command (on a phone that would pop the keyboard up, so not there)
        if (!touch) inputRef.current?.focus({ preventScroll: true });
      }}
    >
      {label}
    </button>
  );

  const renderLine = ({ text, links }: Line): ReactNode => {
    if (!text) return text;
    const found: { start: number; end: number; node: ReactNode }[] = [];
    for (const m of text.matchAll(LINK_RE)) {
      const token = m[0];
      const start = m.index ?? 0;
      const href = token.includes("@") && !token.startsWith("http") ? `mailto:${token}` : token.startsWith("http") ? token : `https://${token}`;
      found.push({
        start,
        end: start + token.length,
        node: (
          <a key={start} href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-75" style={{ color: colors.fg }} onClick={(e) => e.stopPropagation()}>
            {token}
          </a>
        ),
      });
    }
    for (const m of text.matchAll(QUOTED_RE)) {
      const start = m.index ?? 0;
      if (isCommandText(m[1]!)) found.push({ start, end: start + m[0].length, node: commandButton(start, m[0], m[1]!) });
    }
    if (links) {
      for (const m of text.matchAll(phraseRegex(links))) {
        const start = m.index ?? 0;
        found.push({ start, end: start + m[0].length, node: commandButton(start, m[0], links[m[0]]!) });
      }
    }
    if (!found.length) return text;
    found.sort((a, b) => a.start - b.start);
    const parts: ReactNode[] = [];
    let last = 0;
    for (const f of found) {
      if (f.start < last) continue;
      if (f.start > last) parts.push(text.slice(last, f.start));
      parts.push(f.node);
      last = f.end;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  return (
    <div
      className="flex h-full w-full flex-col font-mono text-sm @max-md:text-[12px]"
      style={{ backgroundColor: colors.bg, color: colors.fg }}
      onClick={() => {
        flush();
        inputRef.current?.focus({ preventScroll: true });
      }}
    >
      <div ref={scrollRef} className="relative flex-grow overflow-auto p-2 pb-0" role="log" aria-live="polite">
        <span ref={probeRef} className="invisible absolute whitespace-pre" aria-hidden="true">
          0000000000
        </span>
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
        {/* Hidden rather than removed while output prints, so a phone keyboard stays open */}
        <div className={pending ? "sr-only" : "flex min-h-[28px] items-center leading-5"}>
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
            className="min-w-0 flex-grow border-none bg-transparent outline-none"
            style={{ color: colors.fg, caretColor: colors.fg }}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="go"
          />
        </div>
      </div>

      {/* Touch screens: Tab, history and the most useful commands, one tap each */}
      <div className="hidden shrink-0 gap-1.5 overflow-x-auto border-t p-1.5 pointer-coarse:flex" style={{ borderColor: `${colors.fg}40` }} aria-label="Quick commands">
        <QuickKey label="Tab" title="Complete the command" color={colors.fg} onPress={tabComplete} />
        <QuickKey label="↑" title="Previous command" color={colors.fg} onPress={() => browseHistory(-1)} />
        <QuickKey label="↓" title="Next command" color={colors.fg} onPress={() => browseHistory(1)} />
        {QUICK_COMMANDS.map((c) => (
          <QuickKey key={c} label={c} title={`Run: ${c}`} color={colors.fg} onPress={() => submit(c)} />
        ))}
      </div>
    </div>
  );
}

function QuickKey({ label, title, color, onPress }: { label: string; title: string; color: string; onPress: () => void }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className="min-h-[34px] shrink-0 rounded-[3px] border px-3 text-[13px] active:opacity-60"
      style={{ color, borderColor: `${color}66` }}
      // Keep focus (and the phone keyboard, if it's open) on the prompt
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        onPress();
      }}
    >
      {label}
    </button>
  );
}
