"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const INTRO_LINES = [
  "Bekir's Portfolio Terminal [Version XP]",
  "(C) 2026 Bekir Saliv. All rights reserved.",
  "",
  'Type "help" for commands. Use Tab to autocomplete, Up/Down for history.',
  'Tip: try "open projects", "sysinfo", or "joke".',
  "",
];

/* Things the `open` / `start` command can launch */
const OPEN_TARGETS = {
  // Desktop apps (open a window on the desktop)
  projects: { app: "projects", label: "My Projects" },
  about: { app: "about", label: "About Me" },
  cv: { app: "cv", label: "Bekir's CV" },
  resume: { app: "cv", label: "Bekir's CV" },
  contact: { app: "contact", label: "Contact" },
  notepad: { app: "notepad", label: "readme.txt" },
  readme: { app: "notepad", label: "readme.txt" },
  minesweeper: { app: "minesweeper", label: "Minesweeper" },
  // External links (open in a new tab)
  nordesk: { url: "https://nordeskcrm.com", label: "Nordesk CRM" },
  linedrift: { url: "https://linedrift.vercel.app", label: "LineDrift" },
  risk: { url: "https://risk-game-seven.vercel.app", label: "Risk (Multiplayer)" },
  setsaga: { url: "https://github.com/souliN02/setsaga", label: "SetSaga" },
  promptfuzz: { url: "https://github.com/souliN02/PromptFuzz-CLI", label: "PromptFuzz-CLI" },
  jornada: { url: "https://jornadaingles.vercel.app/", label: "Jornada Inglês Br" },
  portfolio: { url: "https://portfolio-bekir.vercel.app", label: "Portfolio" },
  github: { url: "https://github.com/souliN02", label: "GitHub" },
  linkedin: { url: "https://www.linkedin.com/in/bekirsaliv02/", label: "LinkedIn" },
};

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "There are 10 kinds of people: those who understand binary and those who don't.",
  "A SQL query walks into a bar, goes up to two tables and asks: may I join you?",
  "I would tell you a UDP joke, but you might not get it.",
  "It works on my machine. Shipping the machine.",
  "99 little bugs in the code, 99 little bugs. Take one down, patch it around, 127 little bugs in the code.",
];

const COMMANDS = {
  about: () => [
    "=== About Bekir ===",
    "",
    "Hi, I'm Bekir Saliv, a full-stack developer based in",
    "Naestved, Denmark.",
    "",
    "I work with React, Next.js, TypeScript, Python and C#,",
    "and I build production software AI-first, using Claude",
    "every day as a core part of how I develop.",
    "",
    "Recent Computer Science AP (datamatiker) graduate.",
    "Type 'projects' to see what I've shipped and what I'm",
    "building now.",
  ],
  skills: () => [
    "=== Tech stack ===",
    "",
    "  Strong/daily: JavaScript, TypeScript, React, Next.js,",
    "                Python, C#/.NET, HTML/CSS, Tailwind,",
    "                REST APIs, Git, SQL",
    "  AI-assisted:  Claude (primary), Claude Code, Cursor",
    "  Learning:     Node.js, PostgreSQL, Docker, Azure,",
    "                AWS, GraphQL",
  ],
  projects: () => [
    "=== Projects ===",
    "",
    "  Fleeca (formerly CreativeGround):",
    "    1. Nordesk CRM (flagship)      [2025] nordeskcrm.com",
    "    2. CVR Data Integration Tool   [2025] Python",
    "",
    "  Currently building:",
    "    3. LineDrift (football odds)   [2026] live",
    "    4. Risk multiplayer game       [2026] live",
    "",
    "  Personal:",
    "    5. SetSaga (workout tracker)   [2026] APK on GitHub",
    "    6. PromptFuzz-CLI (LLM fuzzer) [2025]",
    "    7. Windows XP Portfolio        [2025] this site",
    "    8. Jornada Ingles Br           [2025] live",
    "",
    "  Try 'open nordesk', 'open linedrift', or 'open risk'.",
    "  Or double-click the Projects icon for full details.",
  ],
  contact: () => [
    "=== Contact ===",
    "",
    "  Email:     bekirsaliv1@gmail.com",
    "  Phone:     +45 22 56 04 77",
    "  Location:  Naestved, Denmark",
    "  Portfolio: https://portfolio-bekir.vercel.app",
    "  LinkedIn:  https://linkedin.com/in/bekirsaliv02",
    "  GitHub:    https://github.com/souliN02",
  ],
  links: () => [
    "=== Links ===",
    "",
    "  Portfolio: https://portfolio-bekir.vercel.app",
    "  GitHub:    https://github.com/souliN02",
    "  LinkedIn:  https://www.linkedin.com/in/bekirsaliv02/",
    "  Nordesk:   https://nordeskcrm.com",
    "",
    "  Click a link above, or use 'open <name>'.",
  ],
  education: () => [
    "=== Education ===",
    "",
    "  Computer Science AP (datamatiker)   2022-2025",
    "    Zealand Academy of Technologies and Business",
    "  Software Development                2021-2022",
    "    IT University of Copenhagen",
    "  HTX (Higher Technical Examination)  2018-2021",
    "    ZBC Ringsted",
  ],
  experience: () => [
    "=== Experience ===",
    "",
    "  Full Stack Developer, Fleeca (formerly CreativeGround)",
    "    2025, Copenhagen",
    "    Built Nordesk CRM end to end plus a Python CVR",
    "    integration tool. AI-first workflow.",
    "",
    "  Web Developer, Grundejerforeningen Kildeskoven",
    "    2024, Roskilde. Delivered a WordPress site.",
    "",
    "  Customer Store Representative, Circle K",
    "    2022-2025, Naestved.",
  ],
  dir: () => [
    " Volume in drive C has no label.",
    " Volume Serial Number is B3K1-R002",
    "",
    " Directory of C:\\Users\\Bekir\\Desktop",
    "",
    "06/16/2026  10:00 AM    <DIR>          .",
    "06/16/2026  10:00 AM    <DIR>          ..",
    "06/16/2026  10:00 AM    <DIR>          Bekir's CV",
    "06/16/2026  10:00 AM    <DIR>          Projects",
    "06/16/2026  10:00 AM    <DIR>          About me",
    "06/16/2026  10:00 AM    <DIR>          Contact",
    "06/16/2026  10:00 AM    <DIR>          Terminal",
    "06/16/2026  10:00 AM         1,024     readme.txt",
    "06/16/2026  10:00 AM    <DIR>          Minesweeper",
    "               1 File(s)          1,024 bytes",
    "               8 Dir(s)   42,069 bytes free",
  ],
  ver: () => [
    "",
    "Bekir's Portfolio Terminal [Version XP]",
    "Developer Edition - shell v2.0",
    "",
  ],
  whoami: () => ["bekir-saliv (Full-stack Developer, AI-first)"],
  pwd: () => ["C:\\Users\\Bekir\\Desktop"],
  date: () => {
    const d = new Date();
    return [
      `The current date is: ${d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
    ];
  },
  time: () => {
    const d = new Date();
    return [
      `The current time is: ${d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`,
    ];
  },
  tree: () => [
    "C:\\Users\\Bekir\\Desktop",
    "├── Bekir's CV",
    "│   └── Bekir_CV.pdf",
    "├── Projects",
    "│   ├── Nordesk CRM",
    "│   ├── CVR Integration Tool",
    "│   ├── LineDrift",
    "│   ├── Risk (Multiplayer)",
    "│   ├── SetSaga",
    "│   ├── PromptFuzz-CLI",
    "│   ├── XP Portfolio",
    "│   └── Jornada Ingles",
    "├── About me",
    "├── Contact",
    "├── Terminal",
    "├── readme.txt",
    "└── Minesweeper",
  ],
  sysinfo: () => [
    "        ___________            bekir@portfolio",
    "       |.---------.|           ---------------",
    "       ||  >_     ||           OS:       Portfolio XP (Developer Edition)",
    "       ||         ||           Host:     bekir-saliv",
    "       |'---------'|           Shell:    bekir-term v2.0",
    "        )_________(            Role:     Full-stack Developer (AI-first)",
    "       /___________\\           Location: Naestved, Denmark",
    "       |___________|           Stack:    React, Next.js, TS, Python, C#",
    "                               Editor:   Claude Code + Cursor",
    "                               Building: LineDrift, Risk",
    "                               Flagship: Nordesk CRM",
    "                               Coffee:   100%",
  ],
  coffee: () => [
    "        (  )   (   )  )",
    "         ) (   )  (  (",
    "         ( )  (    ) )",
    "         _____________",
    "        <_____________> ___",
    "        |             |/ _ \\",
    "        |               | | |",
    "        |               |_| |",
    "     ___|             |\\___/",
    "    /    \\___________/    \\",
    "    \\_____________________/",
    "",
    "    Here's your coffee. Back to building.",
  ],
  banner: () => [
    " ____  _____ _  _____ ____  ",
    "| __ )| ____| |/ /_ _|  _ \\ ",
    "|  _ \\|  _| | ' / | || |_) |",
    "| |_) | |___| . \\ | ||  _ < ",
    "|____/|_____|_|\\_\\___|_| \\_\\",
    "",
    "      Full-stack. AI-first.",
  ],
  sudo: () => [
    "Nice try.",
    "bekir is not in the sudoers file. This incident will be reported.",
  ],
  ping: () => [
    "",
    "Pinging 127.0.0.1 with 32 bytes of data:",
    "Reply from 127.0.0.1: bytes=32 time<1ms TTL=128",
    "Reply from 127.0.0.1: bytes=32 time<1ms TTL=128",
    "Reply from 127.0.0.1: bytes=32 time<1ms TTL=128",
    "Reply from 127.0.0.1: bytes=32 time<1ms TTL=128",
    "",
    "Ping statistics for 127.0.0.1:",
    "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),",
    "Approximate round trip times in milli-seconds:",
    "    Minimum = 0ms, Maximum = 0ms, Average = 0ms",
  ],
};

/* Files readable via cat / type */
const FILES = {
  "readme.txt": [
    "Welcome to Bekir Saliv's portfolio.",
    "",
    "Full-stack developer from Naestved, Denmark. AI-first,",
    "building with React, Next.js, TypeScript, Python and C#.",
    "",
    "Currently building: LineDrift, Risk.",
    "Flagship: Nordesk CRM -> nordeskcrm.com",
    "",
    "Type 'help' to look around.",
  ],
};

const COLOR_SCHEMES = [
  { id: "default", bg: "#000000", fg: "#C0C0C0", name: "Default (Silver on Black)" },
  { id: "matrix", bg: "#000000", fg: "#00FF00", name: "Matrix (Green on Black)" },
  { id: "classic", bg: "#000080", fg: "#FFFF00", name: "Classic (Yellow on Navy)" },
  { id: "cyan", bg: "#000000", fg: "#00FFFF", name: "Cyan on Black" },
  { id: "amber", bg: "#1a1200", fg: "#FFB000", name: "Amber CRT" },
  { id: "red", bg: "#1a1a2e", fg: "#e94560", name: "Retro Red" },
];

/* Help text lists every command (also drives Tab-completion) */
const HELP_LINES = [
  "Available commands:",
  "",
  "  Profile:  about, skills, projects, experience, education",
  "            contact, links, resume",
  "  System:   dir (ls), tree, cat <file>, pwd, whoami, ver,",
  "            date, time, sysinfo, ping, history, color [name]",
  "  Actions:  open <target>, cls (clear), echo <text>, exit",
  "  Fun:      joke, coffee, banner, sudo",
  "",
  "  Tab autocompletes. Up/Down scrolls history.",
];

/* Every command name, for Tab-completion */
const ALL_COMMANDS = [
  "help", "about", "skills", "projects", "experience", "education",
  "contact", "links", "resume", "dir", "ls", "tree", "cat", "type",
  "pwd", "whoami", "ver", "date", "time", "sysinfo", "ping", "history",
  "color", "open", "start", "cls", "clear", "echo", "exit",
  "joke", "coffee", "banner", "sudo",
];

const LINK_RE =
  /((?:https?:\/\/|www\.)[^\s)]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

/* Persistence + typewriter tuning */
const HIST_KEY = "xp_term_history";
const COLOR_KEY = "xp_term_color";
const CHAR_DELAY = 9; // ms between character chunks within a line
const LINE_DELAY = 16; // ms before a new line starts printing
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);

export default function TerminalWindow({ onRequestClose, onOpenApp }) {
  const [lines, setLines] = useState([...INTRO_LINES]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [colorIdx, setColorIdx] = useState(0);
  const [typed, setTyped] = useState([]); // lines currently being typed out
  const [pending, setPending] = useState(null); // { out, idx, char, speed }
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const historyRef = useRef([]);

  const colors = COLOR_SCHEMES[colorIdx];

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines, typed]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Restore color scheme + command history from a previous session
  useEffect(() => {
    try {
      const c = localStorage.getItem(COLOR_KEY);
      if (c) {
        const i = COLOR_SCHEMES.findIndex((s) => s.id === c);
        if (i >= 0) setColorIdx(i);
      }
      const h = localStorage.getItem(HIST_KEY);
      if (h) {
        const arr = JSON.parse(h);
        if (Array.isArray(arr)) {
          setHistory(arr);
          historyRef.current = arr;
        }
      }
    } catch {}
  }, []);

  // Refocus the input once printing finishes
  useEffect(() => {
    if (!pending) inputRef.current?.focus();
  }, [pending]);

  // Typewriter engine: reveal `pending.out` one chunk at a time
  useEffect(() => {
    if (!pending) return;
    const { out, idx, char, speed } = pending;
    const target = out[idx] ?? "";
    const t = setTimeout(
      () => {
        const nextChar = Math.min(target.length, char + speed);
        setTyped([...out.slice(0, idx), target.slice(0, nextChar)]);
        if (nextChar >= target.length) {
          if (idx + 1 >= out.length) {
            setLines((prev) => [...prev, ...out]);
            setTyped([]);
            setPending(null);
          } else {
            setPending({ out, idx: idx + 1, char: 0, speed });
          }
        } else {
          setPending({ out, idx, char: nextChar, speed });
        }
      },
      char === 0 ? LINE_DELAY : CHAR_DELAY
    );
    return () => clearTimeout(t);
  }, [pending]);

  // Instantly finish any in-progress printing
  const flushTyping = useCallback(() => {
    setPending((cur) => {
      if (cur) {
        setLines((prev) => [...prev, ...cur.out]);
        setTyped([]);
      }
      return null;
    });
  }, []);

  // Render a line, turning URLs and emails into clickable links
  const renderInline = useCallback(
    (line) => {
      if (!line) return line;
      const out = [];
      let last = 0;
      let m;
      LINK_RE.lastIndex = 0;
      while ((m = LINK_RE.exec(line)) !== null) {
        if (m.index > last) out.push(line.slice(last, m.index));
        const token = m[0];
        const href = token.includes("@")
          ? `mailto:${token}`
          : token.startsWith("http")
          ? token
          : `https://${token}`;
        out.push(
          <a
            key={out.length}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-75"
            style={{ color: colors.fg }}
            onClick={(e) => e.stopPropagation()}
          >
            {token}
          </a>
        );
        last = m.index + token.length;
      }
      if (last < line.length) out.push(line.slice(last));
      return out.length ? out : line;
    },
    [colors.fg]
  );

  const processCommand = useCallback(
    (raw) => {
      const trimmed = raw.trim();
      const promptLine = `C:\\Users\\Bekir> ${trimmed}`;
      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const arg1 = (parts[1] || "").toLowerCase();
      const args = parts.slice(1).join(" ");

      let output = [];

      if (cmd === "") {
        setLines((prev) => [...prev, promptLine]);
        return;
      }
      if (cmd === "cls" || cmd === "clear") {
        setLines([]);
        return;
      }
      if (cmd === "exit") {
        onRequestClose?.();
        return;
      }

      if (cmd === "help") {
        output = HELP_LINES;
      } else if (cmd === "echo") {
        output = [args || "ECHO is on."];
      } else if (cmd === "ls") {
        output = COMMANDS.dir();
      } else if (cmd === "resume") {
        if (onOpenApp) {
          onOpenApp("cv");
          output = ["Opening Bekir's CV..."];
        } else {
          window.open("/Bekir_CV.pdf", "_blank", "noopener");
          output = ["Opening /Bekir_CV.pdf ..."];
        }
      } else if (cmd === "history") {
        const h = historyRef.current;
        output = h.length
          ? h.map((c, i) => `  ${String(i + 1).padStart(3, " ")}  ${c}`)
          : ["No commands in history yet."];
      } else if (cmd === "cat" || cmd === "type") {
        if (!arg1) {
          output = ["Usage: cat <file>. Try 'cat readme.txt'."];
        } else {
          const key = arg1.endsWith(".txt") ? arg1 : `${arg1}.txt`;
          const file = FILES[key] || FILES[arg1];
          if (file) output = file;
          else if (COMMANDS[arg1]) output = COMMANDS[arg1]();
          else output = [`The system cannot find the file '${arg1}'.`];
        }
      } else if (cmd === "color") {
        let chosen = -1;
        if (arg1) {
          chosen = COLOR_SCHEMES.findIndex((c) => c.id === arg1);
          if (chosen < 0) {
            output = [
              `Unknown scheme '${arg1}'.`,
              `Options: ${COLOR_SCHEMES.map((c) => c.id).join(", ")}`,
            ];
          }
        } else {
          chosen = (colorIdx + 1) % COLOR_SCHEMES.length;
        }
        if (chosen >= 0) {
          setColorIdx(chosen);
          try { localStorage.setItem(COLOR_KEY, COLOR_SCHEMES[chosen].id); } catch {}
          output = [`Color scheme: ${COLOR_SCHEMES[chosen].name}`];
        }
      } else if (cmd === "joke") {
        output = [JOKES[Math.floor(Math.random() * JOKES.length)]];
      } else if (cmd === "open" || cmd === "start") {
        if (!arg1) {
          output = [
            "Usage: open <target>",
            `Apps:  ${Object.entries(OPEN_TARGETS).filter(([, v]) => v.app).map(([k]) => k).join(", ")}`,
            `Links: ${Object.entries(OPEN_TARGETS).filter(([, v]) => v.url).map(([k]) => k).join(", ")}`,
          ];
        } else {
          const t = OPEN_TARGETS[arg1];
          if (!t) {
            output = [`Cannot open '${arg1}'. Type 'open' to list targets.`];
          } else if (t.app) {
            if (onOpenApp) {
              onOpenApp(t.app);
              output = [`Opening ${t.label}...`];
            } else {
              output = [`Cannot launch ${t.label} from here.`];
            }
          } else if (t.url) {
            window.open(t.url, "_blank", "noopener");
            output = [`Opening ${t.label}: ${t.url}`];
          }
        }
      } else if (COMMANDS[cmd]) {
        output = COMMANDS[cmd](args);
      } else {
        output = [
          `'${trimmed}' is not recognized as an internal or external command,`,
          `operable program or batch file.`,
          `Type 'help' to see what I can do.`,
        ];
      }

      // Echo the command instantly, then type the output out character by character
      setLines((prev) => [...prev, promptLine]);
      const out = [...output, ""];
      const total = out.reduce((n, l) => n + l.length, 0);
      const speed = Math.max(1, Math.ceil(total / 220));
      setTyped([]);
      setPending({ out, idx: 0, char: 0, speed });
    },
    [colorIdx, onRequestClose, onOpenApp]
  );

  // Tab-completion: complete the command, or the target after open/start/cat
  const handleTab = () => {
    const value = input;
    const segs = value.split(/\s+/);
    if (segs.length <= 1) {
      const frag = segs[0].toLowerCase();
      if (!frag) return;
      const matches = ALL_COMMANDS.filter((c) => c.startsWith(frag));
      if (matches.length === 1) {
        setInput(matches[0] + " ");
      } else if (matches.length > 1) {
        setLines((prev) => [...prev, `C:\\Users\\Bekir> ${value}`, "  " + matches.join("   "), ""]);
      }
      return;
    }
    const base = segs[0].toLowerCase();
    const frag = segs[segs.length - 1].toLowerCase();
    let pool = [];
    if (base === "open" || base === "start") pool = Object.keys(OPEN_TARGETS);
    else if (base === "cat" || base === "type") pool = Object.keys(FILES);
    else if (base === "color") pool = COLOR_SCHEMES.map((c) => c.id);
    if (pool.length === 0) return;
    const matches = pool.filter((c) => c.startsWith(frag));
    if (matches.length === 1) {
      segs[segs.length - 1] = matches[0];
      setInput(segs.join(" ") + " ");
    } else if (matches.length > 1) {
      setLines((prev) => [...prev, `C:\\Users\\Bekir> ${value}`, "  " + matches.join("   "), ""]);
    }
  };

  const handleKeyDown = (e) => {
    // While output is printing, any key skips to the end (modifiers ignored)
    if (pending) {
      if (MODIFIER_KEYS.has(e.key)) return;
      e.preventDefault();
      flushTyping();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      handleTab();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) {
        const nextHist = [...historyRef.current, input].slice(-100);
        historyRef.current = nextHist;
        setHistory(nextHist);
        setHistoryIdx(-1);
        try { localStorage.setItem(HIST_KEY, JSON.stringify(nextHist)); } catch {}
      }
      processCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx !== -1) {
        const newIdx = historyIdx + 1;
        if (newIdx >= history.length) {
          setHistoryIdx(-1);
          setInput("");
        } else {
          setHistoryIdx(newIdx);
          setInput(history[newIdx]);
        }
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div
      className="h-full w-full flex flex-col font-mono text-sm"
      style={{ backgroundColor: colors.bg, color: colors.fg }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Scrollable output */}
      <div ref={scrollRef} className="flex-grow overflow-auto p-2 pb-0">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap leading-5 min-h-[20px]">
            {renderInline(line)}
          </div>
        ))}

        {/* Lines currently being typed out */}
        {typed.map((line, i) => {
          const isLast = i === typed.length - 1;
          return (
            <div key={`t${i}`} className="whitespace-pre-wrap leading-5 min-h-[20px]">
              {renderInline(line)}
              {pending && isLast && <span className="terminal-cursor">▮</span>}
            </div>
          );
        })}

        {/* Input line (hidden while printing) */}
        {!pending && (
          <div className="flex items-center leading-5">
            <span className="whitespace-pre">C:\Users\Bekir&gt;&nbsp;</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow bg-transparent outline-none border-none caret-current"
              style={{ color: colors.fg, caretColor: colors.fg }}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        )}
      </div>
    </div>
  );
}
