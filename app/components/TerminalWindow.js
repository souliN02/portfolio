"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const INTRO_LINES = [
  "Bekir's Portfolio Terminal [Version XP]",
  "(C) 2025 Bekir Saliv. All rights reserved.",
  "",
  'Type "help" for a list of commands.',
  "",
];

const COMMANDS = {
  help: () => [
    "Available commands:",
    "  help        - Show this help message",
    "  about       - About Bekir",
    "  skills      - List technical skills",
    "  projects    - List projects",
    "  contact     - Show contact information",
    "  education   - Show education",
    "  experience  - Show work experience",
    "  dir         - List desktop contents",
    "  cls         - Clear the screen",
    "  echo [text] - Echo text back",
    "  date        - Show current date",
    "  time        - Show current time",
    "  whoami      - Who are you?",
    "  ver         - Show version",
    "  color       - Change color scheme",
    "  tree        - Show file tree",
    "  ping        - Ping localhost",
    "  exit        - Close terminal",
  ],
  about: () => [
    "=== About Bekir ===",
    "",
    "Hi, I'm Bekir — a recent Computer Science AP (Datamatiker)",
    "graduate from Zealand Academy.",
    "",
    "I focus on backend development, databases, and software",
    "architecture. I enjoy building stable, scalable solutions.",
    "",
    "Most projects on this site were built during my internship",
    "at CreativeGround. The Unity multiplayer project is personal.",
  ],
  skills: () => [
    "=== Technologies & Skills ===",
    "",
    "  Languages:    C#, Java, Python, JavaScript/TypeScript",
    "  Frameworks:   Next.js (App Router), Express, Unity",
    "  Databases:    PostgreSQL, SQLite, Prisma ORM",
    "  Tools:        Docker, Git/GitHub, Playwright",
    "  Other:        REST APIs, Auth & Security, Netcode",
  ],
  projects: () => [
    "=== Projects ===",
    "",
    "  1. CRM system in Next.js          [2025] [Internship]",
    "  2. Internal document system        [2025] [Internship]",
    "  3. Web scraper with Playwright     [2025] [Internship]",
    "  4. Payment system (Nexi Nets)      [2025] [Internship]",
    "  5. Multiplayer FPS in Unity        [2024] [Personal]",
    "  6. Jornada Ingles Br               [2025] [Personal]",
    "",
    "  Double-click the Projects icon on the desktop for details.",
  ],
  contact: () => [
    "=== Contact ===",
    "",
    "  Email:    bekirsaliv1@gmail.com",
    "  Phone:    +45 22560477",
    "  LinkedIn: linkedin.com/in/bekirsaliv02",
    "  GitHub:   github.com/souliN02",
  ],
  education: () => [
    "=== Education ===",
    "",
    "  Computer Science AP (Datamatiker)  2022-2025",
    "  Zealand Academy",
    "  Focus: Game dev, backend, databases, software architecture",
  ],
  experience: () => [
    "=== Experience ===",
    "",
    "  CreativeGround - Software Developer Intern",
    "    Built CRM, document system, payment flows,",
    "    and scraping pipelines.",
    "",
    "  Circle K - Customer Service & Operations",
    "    Communication, ownership, problem solving.",
  ],
  dir: () => [
    " Volume in drive C has no label.",
    " Volume Serial Number is B3K1-R002",
    "",
    " Directory of C:\\Users\\Bekir\\Desktop",
    "",
    "04/01/2026  10:00 AM    <DIR>          .",
    "04/01/2026  10:00 AM    <DIR>          ..",
    "04/01/2026  10:00 AM    <DIR>          Bekir's CV",
    "04/01/2026  10:00 AM    <DIR>          Projects",
    "04/01/2026  10:00 AM    <DIR>          About me",
    "04/01/2026  10:00 AM    <DIR>          Contact",
    "04/01/2026  10:00 AM    <DIR>          Terminal",
    "04/01/2026  10:00 AM    <DIR>          Minesweeper",
    "               0 File(s)              0 bytes",
    "               8 Dir(s)   42,069 bytes free",
  ],
  ver: () => [
    "",
    "Bekir's Portfolio Terminal [Version XP]",
    "Developer Edition",
    "",
  ],
  whoami: () => ["C:\\Users\\Bekir"],
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
    "│   ├── CRM System",
    "│   ├── Document System",
    "│   ├── Web Scraper",
    "│   ├── Payment System",
    "│   ├── Multiplayer FPS",
    "│   └── Jornada Ingles",
    "├── About me",
    "├── Contact",
    "├── Terminal",
    "└── Minesweeper",
  ],
  ping: () => {
    return [
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
    ];
  },
};

const COLOR_SCHEMES = [
  { bg: "#000000", fg: "#C0C0C0", name: "Default (Silver on Black)" },
  { bg: "#000000", fg: "#00FF00", name: "Matrix (Green on Black)" },
  { bg: "#000080", fg: "#FFFF00", name: "Classic (Yellow on Navy)" },
  { bg: "#000000", fg: "#00FFFF", name: "Cyan on Black" },
  { bg: "#1a1a2e", fg: "#e94560", name: "Retro Red" },
];

export default function TerminalWindow({ onRequestClose }) {
  const [lines, setLines] = useState([...INTRO_LINES]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [colorIdx, setColorIdx] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const colors = COLOR_SCHEMES[colorIdx];

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const processCommand = useCallback(
    (raw) => {
      const trimmed = raw.trim();
      const promptLine = `C:\\Users\\Bekir> ${trimmed}`;
      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
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

      if (cmd === "echo") {
        output = [args || "ECHO is on."];
      } else if (cmd === "color") {
        const nextIdx = (colorIdx + 1) % COLOR_SCHEMES.length;
        setColorIdx(nextIdx);
        output = [`Color scheme changed to: ${COLOR_SCHEMES[nextIdx].name}`];
      } else if (COMMANDS[cmd]) {
        output = COMMANDS[cmd](args);
      } else {
        output = [
          `'${trimmed}' is not recognized as an internal or external command,`,
          `operable program or batch file.`,
        ];
      }

      setLines((prev) => [...prev, promptLine, ...output, ""]);
    },
    [colorIdx, onRequestClose]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) {
        setHistory((prev) => [...prev, input]);
        setHistoryIdx(-1);
      }
      processCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx =
          historyIdx === -1
            ? history.length - 1
            : Math.max(0, historyIdx - 1);
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
            {line}
          </div>
        ))}

        {/* Input line */}
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
      </div>
    </div>
  );
}
