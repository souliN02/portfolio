import { APPS, APP_IDS, CORNER_ICON, DESKTOP_ICONS, GAMES, resolveApp, type AppId } from "@/data/apps";
import { EDUCATION, EXPERIENCE, LANGUAGES, PROFILE, SKILLS, companyLabel } from "@/data/profile";
import { FLAGSHIP, PROJECTS, PROJECT_GROUPS, getProject, projectsInGroup } from "@/data/projects";
import { readmeText } from "@/data/readme";
import { CalcError, evaluate, formatNumber } from "./calc";
import { BEST_KIND, GAME_IDS, type GameStats } from "./gameStats";
import { wrap } from "./text";

/**
 * The Command Prompt's command engine. Pure: it returns the lines to print
 * plus an optional effect (open a window, open a URL, clear the screen...),
 * and the component carries the effect out.
 */

export type TerminalEffect =
  | { type: "clear" }
  | { type: "exit" }
  | { type: "openApp"; app: AppId; props?: Record<string, string> }
  | { type: "closeApps"; apps: AppId[] }
  | { type: "openUrl"; url: string }
  | { type: "color"; index: number }
  | { type: "title"; text: string | null }
  | { type: "shutdown" };

export interface CommandContext {
  history: string[];
  colorIndex: number;
  now: Date;
  random: () => number;
  /** Characters that fit on one line. Output wraps to it, so a phone gets narrower text */
  columns?: number;
  /** Windows open on the desktop, for tasklist and taskkill */
  openApps?: AppId[];
  /** Game statistics, for highscores */
  stats?: GameStats;
}

export interface CommandResult {
  output: string[];
  effect?: TerminalEffect;
  /** Words in the output that run a command when tapped or clicked, mapped to that command */
  links?: Record<string, string>;
}

export const PROMPT = "C:\\Users\\Bekir>";
const WIDTH = 60;

/** Line width for wrapped text: 60 on a desktop, narrower on a phone */
const width = (ctx: CommandContext) => Math.max(30, Math.min(WIDTH, (ctx.columns ?? Infinity) - 2));

export const COLOR_SCHEMES = [
  { id: "default", bg: "#000000", fg: "#C0C0C0", name: "Default (Silver on Black)" },
  { id: "matrix", bg: "#000000", fg: "#00FF00", name: "Matrix (Green on Black)" },
  { id: "classic", bg: "#000080", fg: "#FFFF00", name: "Classic (Yellow on Navy)" },
  { id: "cyan", bg: "#000000", fg: "#00FFFF", name: "Cyan on Black" },
  { id: "amber", bg: "#1a1200", fg: "#FFB000", name: "Amber CRT" },
  { id: "red", bg: "#1a1a2e", fg: "#e94560", name: "Retro Red" },
] as const;

const LINKS: Record<string, { url: string; label: string }> = {
  github: { url: PROFILE.links.github, label: "GitHub" },
  linkedin: { url: PROFILE.links.linkedin, label: "LinkedIn" },
};

const pick = <T>(items: readonly T[], random: () => number): T => items[Math.floor(random() * items.length)]!;

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "There are 10 kinds of people: those who understand binary and those who don't.",
  "A SQL query walks into a bar, goes up to two tables and asks: may I join you?",
  "I would tell you a UDP joke, but you might not get it.",
  "It works on my machine. Shipping the machine.",
  "99 little bugs in the code, 99 little bugs. Take one down, patch it around, 127 little bugs in the code.",
];

const FORTUNES = [
  ["Programs must be written for people to read, and only incidentally for machines to execute.", "Harold Abelson"],
  ["Simplicity is prerequisite for reliability.", "Edsger W. Dijkstra"],
  ["Make it work, make it right, make it fast.", "Kent Beck"],
  ["Talk is cheap. Show me the code.", "Linus Torvalds"],
  ["Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", "Martin Fowler"],
  ["Premature optimization is the root of all evil.", "Donald Knuth"],
  ["First, solve the problem. Then, write the code.", "John Johnson"],
] as const;

const EIGHT_BALL = [
  "It is certain.",
  "Without a doubt.",
  "You may rely on it.",
  "Most likely.",
  "Outlook good.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Cannot predict now.",
  "Don't count on it.",
  "My sources say no.",
  "Very doubtful.",
];

export function introLines(now: Date): string[] {
  return [
    "Bekir's Portfolio Terminal [Version XP]",
    `(C) ${now.getFullYear()} ${PROFILE.name}. All rights reserved.`,
    "",
    "Type 'help' for commands, or try 'projects',",
    "'games', 'hire' or 'msg hi bekir!'.",
    "",
  ];
}

/* ─── help ─── */

const HELP_GROUPS: [string, string[]][] = [
  ["Profile", ["about", "skills", "projects", "experience", "education", "languages", "contact", "links", "resume", "hire"]],
  ["Actions", ["open <app|project|link>", "msg <message>", "cls", "echo <text>", "title <text>", "exit", "shutdown"]],
  ["Games", ["games", "play <game>", "highscores"]],
  ["System", ["dir (ls)", "tree", "cd <folder>", "cat <file>", "pwd", "whoami", "hostname", "ver", "date", "time", "sysinfo", "ipconfig", "ping [host]", "tasklist", "taskkill <name>", "history", "color [name]"]],
  ["Fun", ["calc <sum>", "joke", "fortune", "8ball <question>", "flip", "roll [2d6]", "cowsay <text>", "hack", "coffee", "banner", "git log", "sudo"]],
];

/** One line per command for `help <command>`: usage, then what it does */
const DOCS: Record<string, [string, string]> = {
  help: ["help [command]", "Lists every command, or explains one."],
  about: ["about", "Who I am, in a few lines."],
  skills: ["skills", "The languages and tools I work with."],
  projects: ["projects", "What I've shipped and what I'm building."],
  experience: ["experience", "Where I've worked."],
  education: ["education", "Where I've studied."],
  languages: ["languages", "The languages I speak."],
  contact: ["contact", "E-mail, phone and profiles."],
  links: ["links", "GitHub, LinkedIn and my live work."],
  resume: ["resume", "Opens my CV."],
  hire: ["hire", "Why I'd be a good hire, and how to reach me."],
  open: ["open <target>", "Opens an app, a project, or a link. 'open' alone lists them."],
  msg: ["msg <message>", "Drafts an e-mail to me with your message."],
  cls: ["cls", "Clears the screen (so does Ctrl+L)."],
  echo: ["echo <text>", "Prints the text back."],
  title: ["title [text]", "Sets this window's title. Leave it out to reset it."],
  exit: ["exit", "Closes the Command Prompt."],
  shutdown: ["shutdown", "Opens the Turn Off Computer dialog."],
  games: ["games", "Lists the games in the Games folder."],
  play: ["play <game>", "Starts a game, e.g. 'play solitaire'."],
  highscores: ["highscores", "Your games won and best results, saved in this browser."],
  dir: ["dir", "Lists the desktop, cmd style (ls works too)."],
  tree: ["tree", "Shows the desktop as a tree."],
  cd: ["cd <folder>", "Opens a folder or app, e.g. 'cd games'."],
  cat: ["cat <file>", "Prints a file, e.g. 'cat readme.txt' (type works too)."],
  pwd: ["pwd", "Prints the current folder."],
  whoami: ["whoami", "Prints who's logged in."],
  hostname: ["hostname", "Prints this computer's name."],
  ver: ["ver", "Prints the shell version."],
  date: ["date", "Prints today's date."],
  time: ["time", "Prints the current time."],
  sysinfo: ["sysinfo", "System information, neofetch style."],
  ipconfig: ["ipconfig", "Shows the network settings."],
  ping: ["ping [host]", "Sends four pings. Without a host it pings this machine."],
  tasklist: ["tasklist", "Lists the programs running on the desktop."],
  taskkill: ["taskkill /im <name>", "Closes a running program, e.g. 'taskkill /im winmine.exe'."],
  history: ["history", "Lists the commands you've typed."],
  color: ["color [name]", "Changes the colors, or cycles through them."],
  calc: ["calc <sum>", "Works out a sum, e.g. 'calc (2 + 3) * 4'."],
  joke: ["joke", "A programming joke."],
  fortune: ["fortune", "A quote worth remembering."],
  "8ball": ["8ball <question>", "Asks the Magic 8 Ball a yes or no question."],
  flip: ["flip", "Flips a coin."],
  roll: ["roll [dice]", "Rolls dice: 'roll', 'roll 2d6', 'roll d20'."],
  cowsay: ["cowsay <text>", "A cow says it for you."],
  hack: ["hack", "Hacks the mainframe. Probably."],
  coffee: ["coffee", "Makes coffee."],
  banner: ["banner", "My name, big."],
  git: ["git log | git status", "My career, as a Git history."],
  sudo: ["sudo <command>", "You wish."],
};

/** Other names for the same command */
const ALIASES: Record<string, string> = {
  ls: "dir",
  clear: "cls",
  type: "cat",
  start: "open",
  man: "help",
  chdir: "cd",
  systeminfo: "sysinfo",
  neofetch: "sysinfo",
  winver: "ver",
  stats: "highscores",
  scores: "highscores",
  hireme: "hire",
  coin: "flip",
  dice: "roll",
  fortunes: "fortune",
};

/** Keep each command in one piece when wrapping a comma-separated list */
function wrapItems(items: string[], w: number): string[] {
  const lines: string[] = [];
  let line = "";
  items.forEach((item, i) => {
    const piece = item + (i < items.length - 1 ? "," : "");
    if (line && line.length + 1 + piece.length > w) {
      lines.push(line);
      line = piece;
    } else line = line ? `${line} ${piece}` : piece;
  });
  if (line) lines.push(line);
  return lines;
}

function helpResult(ctx: CommandContext): CommandResult {
  const w = width(ctx);
  const lines = ["Available commands:", ""];
  for (const [label, cmds] of HELP_GROUPS) {
    wrapItems(cmds, w - 12).forEach((l, i) => lines.push(i === 0 ? `  ${`${label}:`.padEnd(10)}${l}` : `${" ".repeat(12)}${l}`));
  }
  lines.push("", "  Click or tap a command to run it, or type", "  'help <command>' for details.");
  // Each listed command links to itself without its arguments: "open <app>" runs "open", "dir (ls)" has two
  const links: Record<string, string> = {};
  for (const item of HELP_GROUPS.flatMap(([, cmds]) => cmds)) {
    const name = item.split(/ [<[(]/)[0]!;
    links[name] = name;
    const alias = /\((\w+)\)/.exec(item)?.[1];
    if (alias) links[alias] = alias;
  }
  return { output: lines, links };
}

function helpFor(name: string): string[] {
  const doc = DOCS[ALIASES[name] ?? name];
  if (!doc) return [`There's no command called '${name}'. Type 'help' to see them all.`];
  const also = Object.entries(ALIASES)
    .filter(([, target]) => target === (ALIASES[name] ?? name))
    .map(([alias]) => alias);
  return [`  ${doc[0]}`, `    ${doc[1]}`, ...(also.length ? [`    Also: ${also.join(", ")}`] : [])];
}

/* ─── Profile ─── */

const section = (title: string) => [`=== ${title} ===`, ""];

function aboutLines(ctx: CommandContext): string[] {
  const w = width(ctx);
  return [
    ...section("About Bekir"),
    ...wrap(`Hi, I'm ${PROFILE.name}, a ${PROFILE.role.toLowerCase()} based in ${PROFILE.location}.`, w),
    "",
    ...wrap("I work with React, Next.js, TypeScript, Python and C#, and I build production software AI-first, using Claude every day as a core part of how I develop.", w),
    "",
    ...wrap(PROFILE.graduate, w),
    ...wrap("Type 'projects' to see what I've shipped and what I'm building.", w),
  ];
}

function skillsLines(ctx: CommandContext): string[] {
  const w = width(ctx);
  const row = (label: string, items: readonly string[]) => wrap(items.join(", "), w - 16, " ".repeat(16)).map((l, i) => (i === 0 ? `  ${label.padEnd(14)}${l}` : l));
  return [...section("Tech stack"), ...row("Strong/daily:", SKILLS.strong), ...row("AI-assisted:", SKILLS.ai), ...row("Learning:", SKILLS.learning)];
}

function projectsLines(): string[] {
  const lines = section("Projects");
  let n = 1;
  const width = Math.max(...PROJECTS.map((p) => p.title.length + (p.flagship ? 11 : 0)));
  for (const group of PROJECT_GROUPS) {
    lines.push(`  ${group.label}:`);
    for (const p of projectsInGroup(group.id)) {
      const title = p.flagship ? `${p.title} (flagship)` : p.title;
      lines.push(`    ${String(n++).padStart(1)}. ${title.padEnd(width)}  [${p.period}] ${p.status}`);
    }
    lines.push("");
  }
  lines.push(`  Try 'open ${FLAGSHIP.id}' or 'open linedrift' for the details,`);
  lines.push("  or 'msg' me a question about any of them.");
  return lines;
}

function contactLines(): string[] {
  return [
    ...section("Contact"),
    `  Email:     ${PROFILE.email}`,
    `  Phone:     ${PROFILE.phone}`,
    `  Location:  ${PROFILE.location}`,
    `  Portfolio: ${PROFILE.links.portfolio}`,
    `  LinkedIn:  ${PROFILE.links.linkedin}`,
    `  GitHub:    ${PROFILE.links.github}`,
    "",
    "  Or type 'open contact' to write me an e-mail.",
  ];
}

function linksLines(): string[] {
  const flagship = FLAGSHIP.links[0];
  return [
    ...section("Links"),
    `  Portfolio: ${PROFILE.links.portfolio}`,
    `  GitHub:    ${PROFILE.links.github}`,
    `  LinkedIn:  ${PROFILE.links.linkedin}`,
    ...(flagship ? [`  ${FLAGSHIP.title}: ${flagship.href}`] : []),
    "",
    "  Click a link above, or use 'open <name>'.",
  ];
}

function experienceLines(ctx: CommandContext): string[] {
  const w = width(ctx);
  const lines = section("Experience");
  for (const e of EXPERIENCE) {
    lines.push(...wrap(`${e.role}, ${companyLabel(e)}`, w - 2, "    ").map((l, i) => (i === 0 ? `  ${l}` : l)));
    lines.push(`    ${e.period}, ${e.place}`);
    lines.push(...wrap(e.summary, w - 4, "    ").map((l, i) => (i === 0 ? `    ${l}` : l)));
    lines.push("");
  }
  return lines.slice(0, -1);
}

function educationLines(): string[] {
  const width = Math.max(...EDUCATION.map((e) => e.title.length));
  return [...section("Education"), ...EDUCATION.flatMap((e) => [`  ${e.title.padEnd(width)}  ${e.period}`, `    ${e.school}`])];
}

function languagesLines(): string[] {
  const pad = Math.max(...LANGUAGES.map((l) => l.name.length));
  return [...section("Languages"), ...LANGUAGES.map((l) => `  ${l.name.padEnd(pad)}  ${l.level}`)];
}

function hireLines(ctx: CommandContext): string[] {
  return [
    ...section("Why hire Bekir?"),
    ...PROFILE.highlights.map((h) => `  + ${h}`),
    "",
    ...wrap(`${FLAGSHIP.title} is the proof: ${FLAGSHIP.tagline.charAt(0).toLowerCase()}${FLAGSHIP.tagline.slice(1)}.`, width(ctx) - 2).map((l) => `  ${l}`),
    "",
    ...[
      ["resume", "my CV"],
      [`open ${FLAGSHIP.id}`, "the flagship project"],
      ["open contact", "send me an e-mail"],
    ].map(([cmd, what]) => `  ${`'${cmd}'`.padEnd(17)}${what}`),
  ];
}

/* ─── The desktop as a file system ─── */

function desktopEntries(): { id: AppId; name: string; dir: boolean }[] {
  return [...DESKTOP_ICONS, CORNER_ICON].map((id) => ({ id, name: APPS[id].label, dir: id !== "notepad" }));
}

function dirLines(): string[] {
  const entries = desktopEntries();
  const files = entries.filter((e) => !e.dir).length;
  return [
    " Volume in drive C has no label.",
    " Volume Serial Number is B3K1-R002",
    "",
    " Directory of C:\\Users\\Bekir\\Desktop",
    "",
    "09/25/2026  10:00 AM    <DIR>          .",
    "09/25/2026  10:00 AM    <DIR>          ..",
    ...entries.map((e) => `09/25/2026  10:00 AM    ${e.dir ? "<DIR>         " : "         1,024"} ${e.name}`),
    `               ${files} File(s)          1,024 bytes`,
    `               ${entries.length - files + 2} Dir(s)   42,069 bytes free`,
  ];
}

function treeLines(): string[] {
  const entries = desktopEntries();
  const lines = ["C:\\Users\\Bekir\\Desktop"];
  const children: Partial<Record<AppId, string[]>> = {
    projects: PROJECTS.map((p) => p.title),
    cv: ["Bekir_CV.pdf"],
    games: GAMES.map((id) => APPS[id].label),
  };
  entries.forEach((e, i) => {
    const last = i === entries.length - 1;
    lines.push(`${last ? "└──" : "├──"} ${e.name}`);
    const bar = last ? "    " : "│   ";
    const kids = children[e.id] ?? [];
    kids.forEach((k, j) => lines.push(`${bar}${j === kids.length - 1 ? "└──" : "├──"} ${k}`));
  });
  return lines;
}

function sysinfoLines(ctx: CommandContext): string[] {
  const building = projectsInGroup("building").map((p) => p.title.split(" ")[0]).join(", ");
  const info = [
    "bekir@portfolio",
    "---------------",
    "OS:       Portfolio XP (Developer Edition)",
    "Host:     bekir-saliv",
    "Shell:    bekir-term v3.1",
    `Role:     ${PROFILE.role} (AI-first)`,
    `Location: ${PROFILE.location}`,
    "Stack:    React, Next.js, TS, Python, C#",
    "Editor:   Claude Code + Cursor",
    `Building: ${building}`,
    `Flagship: ${FLAGSHIP.title}`,
    "Coffee:   100%",
  ];
  // The picture only fits beside the details on a wide screen
  const w = width(ctx);
  if (w < WIDTH) return info.flatMap((l) => (l.length <= w ? [l] : wrap(l, w, " ".repeat(10))));
  const art = [
    "        ___________     ",
    "       |.---------.|    ",
    "       ||  >_     ||    ",
    "       ||         ||    ",
    "       |'---------'|    ",
    "        )_________(     ",
    "       /___________\\    ",
    "       |___________|    ",
  ];
  return info.map((l, i) => `${(art[i] ?? "").padEnd(31)}${l}`);
}

/* ─── Programs on the desktop, as processes ─── */

const EXE: Record<AppId, string> = {
  projects: "explorer.exe",
  about: "rundll32.exe",
  cv: "AcroRd32.exe",
  contact: "msimn.exe",
  ie: "iexplore.exe",
  terminal: "cmd.exe",
  notepad: "notepad.exe",
  games: "explorer.exe",
  minesweeper: "winmine.exe",
  solitaire: "sol.exe",
  spider: "spider.exe",
  freecell: "freecell.exe",
  hearts: "mshearts.exe",
  recycle: "explorer.exe",
};

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** Stable, believable PIDs (Windows PIDs are multiples of 4) and memory use */
const pid = (exe: string) => 1000 + (hash(exe) % 2000) * 4;
const mem = (exe: string) => `${(2000 + (hash(`${exe}!`) % 28000)).toLocaleString("en-US")} K`;

function processes(openApps: AppId[] = []): string[] {
  // The shell always runs; Explorer windows (My Projects, Games, Recycle Bin) all live inside it
  const running = new Set(["explorer.exe", "cmd.exe", ...openApps.map((id) => EXE[id])]);
  return [...running];
}

function tasklistLines(ctx: CommandContext): string[] {
  const row = (name: string, p: string, m: string) => `${name.padEnd(20)}${p.padStart(6)}${m.padStart(11)}`;
  return [
    "",
    row("Image Name", "PID", "Mem Usage"),
    `${"=".repeat(19)} ${"=".repeat(5)} ${"=".repeat(10)}`,
    row("System Idle Process", "0", "16 K"),
    ...processes(ctx.openApps).map((exe) => row(exe, String(pid(exe)), mem(exe))),
    "",
    "  Close one with 'taskkill /im <name>'.",
  ];
}

function taskkill(args: string[], ctx: CommandContext): CommandResult {
  let name = "";
  let byPid: number | null = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!.toLowerCase();
    if (a === "/im") name = (args[++i] ?? "").toLowerCase();
    else if (a === "/pid") byPid = Number(args[++i]);
    else if (!a.startsWith("/")) name ||= a;
  }
  if (!name && byPid === null) {
    return { output: ["ERROR: Invalid syntax. Neither /FI nor /PID nor /IM were specified.", "Try 'taskkill /im winmine.exe', after 'tasklist'."] };
  }
  const running = processes(ctx.openApps);
  const alias = resolveApp(name.replace(/\.exe$/, ""));
  const exe = running.find((e) => (byPid !== null ? pid(e) === byPid : e.toLowerCase() === name || e.toLowerCase() === `${name}.exe` || (alias && EXE[alias] === e)));
  if (!exe) return { output: [`ERROR: The process "${byPid ?? name}" not found.`] };
  const apps = (ctx.openApps ?? []).filter((id) => EXE[id] === exe);
  const output = [`SUCCESS: The process "${exe}" with PID ${pid(exe)} has been terminated.`];
  if (exe === "explorer.exe") output.push("Explorer restarted itself. Its windows didn't.");
  if (exe === "cmd.exe") return { output, effect: { type: "exit" } };
  return { output, effect: apps.length ? { type: "closeApps", apps } : undefined };
}

function ipconfigLines(): string[] {
  return [
    "",
    "Windows IP Configuration",
    "",
    "Ethernet adapter Local Area Connection:",
    "",
    "   DNS Suffix . . . . : bekirsaliv.dk",
    "   IP Address . . . . : 192.168.0.42",
    "   Subnet Mask. . . . : 255.255.255.0",
    "   Default Gateway. . : 192.168.0.1",
  ];
}

function pingLines(host: string, ctx: CommandContext): string[] {
  const local = !host || host === "localhost" || host === "127.0.0.1";
  const target = local ? "127.0.0.1" : host;
  const times = Array.from({ length: 4 }, () => (local ? 0 : 8 + Math.floor(ctx.random() * 30)));
  const t = (ms: number) => (ms ? `time=${ms}ms` : "time<1ms");
  return [
    "",
    `Pinging ${target} with 32 bytes of data:`,
    ...times.map((ms) => `Reply from ${target}: bytes=32 ${t(ms)} TTL=${local ? 128 : 54}`),
    "",
    `Ping statistics for ${target}:`,
    "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),",
    "Approximate round trip times in milli-seconds:",
    `    Minimum = ${Math.min(...times)}ms, Maximum = ${Math.max(...times)}ms, Average = ${Math.round(times.reduce((a, b) => a + b, 0) / 4)}ms`,
  ];
}

/* ─── Games ─── */

function gamesResult(ctx: CommandContext): CommandResult {
  const pad = Math.max(...GAMES.map((id) => APPS[id].label.length)) + 2;
  const rows = GAMES.flatMap((id) => wrap(APPS[id].desc, width(ctx) - pad - 2, " ".repeat(pad + 2)).map((l, i) => (i === 0 ? `  ${APPS[id].label.padEnd(pad)}${l}` : l)));
  return {
    output: [...section("Games"), ...rows, "", "  Click or tap a game, or 'play <game>'."],
    links: Object.fromEntries(GAMES.map((id) => [APPS[id].label, `play ${id}`])),
  };
}

function highscoreLines(ctx: CommandContext): string[] {
  if (!ctx.stats) return ["No statistics yet."];
  const stats = ctx.stats;
  const rows = GAME_IDS.map((id) => {
    const s = stats[id];
    const best = s.best === undefined ? "-" : `${s.best} ${BEST_KIND[id].unit}`;
    return `  ${APPS[id].label.padEnd(18)}${`${s.won}/${s.played}`.padStart(10)}  ${best}`;
  });
  return [...section("Game statistics"), `  ${"Game".padEnd(18)}${"Won/Played".padStart(10)}  Best`, ...rows, "", "  Saved in this browser. Try 'games'."];
}

/* ─── Fun ─── */

function rollLines(spec: string, ctx: CommandContext): string[] {
  const m = /^(\d*)d(\d+)$/i.exec(spec || "1d6");
  const count = Number(m?.[1] || 1);
  const sides = Number(m?.[2]);
  if (!m || count < 1 || count > 20 || sides < 2 || sides > 1000) return ["Usage: roll [dice], like 'roll', 'roll 2d6' or 'roll d20' (up to 20 dice)."];
  const rolls = Array.from({ length: count }, () => 1 + Math.floor(ctx.random() * sides));
  const total = rolls.reduce((a, b) => a + b, 0);
  return [count === 1 ? `You rolled a ${total}.` : `You rolled ${rolls.join(" + ")} = ${total}.`];
}

function cowsayLines(text: string, ctx: CommandContext): string[] {
  const lines = wrap(text || "Moo. Try 'cowsay hello'.", Math.min(36, width(ctx) - 6));
  const len = Math.max(...lines.map((l) => l.length));
  const bubble =
    lines.length === 1
      ? [`< ${lines[0]} >`]
      : lines.map((l, i) => {
          const [a, b] = i === 0 ? ["/", "\\"] : i === lines.length - 1 ? ["\\", "/"] : ["|", "|"];
          return `${a} ${l.padEnd(len)} ${b}`;
        });
  return [
    ` ${"_".repeat(len + 2)}`,
    ...bubble,
    ` ${"-".repeat(len + 2)}`,
    "        \\   ^__^",
    "         \\  (oo)\\_______",
    "            (__)\\       )\\/\\",
    "                ||----w |",
    "                ||     ||",
  ];
}

const HACK = [
  "Initializing hack.exe...",
  "Bypassing firewall........... done",
  "Decrypting mainframe......... done",
  "Downloading more RAM......... 100%",
  "Reading Bekir's secrets...",
  "",
  "ACCESS GRANTED",
  "",
  "Secret #1: He really does use Claude every day.",
  "Secret #2: He's open to new opportunities.",
  "",
  "Exploit it with 'open contact'.",
];

function gitLines(sub: string, ctx: CommandContext): string[] {
  if (sub === "status") {
    return [
      "On branch main",
      "Your branch is up to date with 'origin/main'.",
      "",
      "Changes not staged for commit:",
      "        modified:   career (open to new roles)",
      "",
      "no changes added to commit (try 'open contact')",
    ];
  }
  if (sub !== "log") return [`git: '${sub || ""}' is not a git command. Try 'git log' or 'git status'.`];
  const start = (period: string) => Number(/\d{4}/.exec(period)?.[0] ?? 0);
  const commits = [
    ...EXPERIENCE.map((e) => ({ year: start(e.period), text: `feat: ${e.role} at ${companyLabel(e)}` })),
    ...EDUCATION.map((e) => ({ year: start(e.period), text: `learn: ${e.title}, ${e.school}` })),
  ].sort((a, b) => b.year - a.year);
  const w = width(ctx);
  return commits.flatMap((c, i) => {
    const last = i === commits.length - 1;
    const sha = hash(c.text).toString(16).padStart(8, "0").slice(0, 7);
    return [`* ${sha}${i === 0 ? " (HEAD -> main)" : ""} ${c.year}`, ...wrap(c.text, w - 6).map((l) => `${last ? " " : "|"}     ${l}`)];
  });
}

const COFFEE = [
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
];

const BANNER = [
  " ____  _____ _  _____ ____  ",
  "| __ )| ____| |/ /_ _|  _ \\ ",
  "|  _ \\|  _| | ' / | || |_) |",
  "| |_) | |___| . \\ | ||  _ < ",
  "|____/|_____|_|\\_\\___|_| \\_\\",
  "",
  `      ${PROFILE.tagline}`,
];

const FILES: Record<string, () => string[]> = {
  "readme.txt": () => readmeText().trimEnd().split("\n"),
};

/** Simple commands that take no arguments and have no effect */
const STATIC: Record<string, (ctx: CommandContext) => string[]> = {
  about: aboutLines,
  skills: skillsLines,
  projects: projectsLines,
  contact: contactLines,
  links: linksLines,
  experience: experienceLines,
  education: educationLines,
  languages: languagesLines,
  hire: hireLines,
  dir: dirLines,
  tree: treeLines,
  sysinfo: sysinfoLines,
  ipconfig: ipconfigLines,
  tasklist: tasklistLines,
  highscores: highscoreLines,
  coffee: () => COFFEE,
  banner: () => BANNER,
  hack: () => HACK,
  pwd: () => ["C:\\Users\\Bekir\\Desktop"],
  whoami: () => [`bekir-saliv (${PROFILE.role}, AI-first)`],
  hostname: () => ["BEKIR-XP"],
  ver: () => ["", "Bekir's Portfolio Terminal [Version XP]", "Developer Edition - shell v3.1", ""],
  sudo: () => ["Nice try.", "bekir is not in the sudoers file. This incident will be reported."],
  joke: (ctx) => wrap(pick(JOKES, ctx.random), width(ctx)),
  fortune: (ctx) => {
    const [quote, author] = pick(FORTUNES, ctx.random);
    return [...wrap(`"${quote}"`, width(ctx)), `    - ${author}`];
  },
  flip: (ctx) => [ctx.random() < 0.5 ? "Heads." : "Tails."],
  date: (ctx) => [`The current date is: ${ctx.now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`],
  time: (ctx) => [`The current time is: ${ctx.now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`],
  history: (ctx) => (ctx.history.length ? ctx.history.map((c, i) => `  ${String(i + 1).padStart(3, " ")}  ${c}`) : ["No commands in history yet."]),
};

const OPEN_USAGE = () => [
  "Usage: open <target>",
  `  Apps:     ${APP_IDS.join(", ")}`,
  `  Projects: ${PROJECTS.map((p) => p.id).join(", ")}`,
  `  Links:    ${Object.keys(LINKS).join(", ")}`,
];

function openTarget(target: string): CommandResult {
  if (!target) return { output: OPEN_USAGE() };
  const project = getProject(target);
  if (project) {
    return { output: [`Opening ${project.title} in My Projects...`], effect: { type: "openApp", app: "projects", props: { project: project.id } } };
  }
  const app = resolveApp(target);
  if (app) return { output: [`Opening ${APPS[app].label}...`], effect: { type: "openApp", app } };
  const link = LINKS[target];
  if (link) return { output: [`Opening ${link.label}: ${link.url}`], effect: { type: "openUrl", url: link.url } };
  return { output: [`Cannot open '${target}'. Type 'open' to list targets.`] };
}

export function runCommand(raw: string, ctx: CommandContext): CommandResult {
  const trimmed = raw.trim();
  const [first = "", ...rest] = trimmed.split(/\s+/);
  const typed = first.toLowerCase();
  const cmd = ALIASES[typed] ?? typed;
  const args = rest.join(" ");
  const arg1 = (rest[0] ?? "").toLowerCase();

  if (!cmd) return { output: [] };

  const staticCmd = STATIC[cmd];
  if (staticCmd) return { output: staticCmd(ctx) };

  switch (cmd) {
    case "help":
      return arg1 ? { output: helpFor(arg1) } : helpResult(ctx);
    case "cls":
      return { output: [], effect: { type: "clear" } };
    case "exit":
      return { output: [], effect: { type: "exit" } };
    case "echo":
      return { output: [args || "ECHO is on."] };
    case "title":
      return { output: [], effect: { type: "title", text: args.slice(0, 80) || null } };
    case "resume":
      return { output: ["Opening Bekir's CV..."], effect: { type: "openApp", app: "cv" } };
    case "shutdown":
      return { output: ["Opening Turn Off Computer..."], effect: { type: "shutdown" } };
    case "open":
      return openTarget(arg1);
    case "cd": {
      if (!arg1) return { output: ["C:\\Users\\Bekir\\Desktop"] };
      if (arg1 === "." || arg1 === "desktop") return { output: [] };
      const app = resolveApp(arg1.replace(/[\\/]+$/, ""));
      if (app) return { output: [`Opening ${APPS[app].label}...`], effect: { type: "openApp", app } };
      if (arg1.startsWith("..") || arg1.startsWith("\\") || arg1.startsWith("/") || arg1.startsWith("c:")) return { output: ["Access is denied."] };
      return { output: ["The system cannot find the path specified."] };
    }
    case "games":
      return gamesResult(ctx);
    case "play": {
      if (!arg1) return gamesResult(ctx);
      const app = resolveApp(arg1);
      if (app && (GAMES as readonly AppId[]).includes(app)) return { output: [`Starting ${APPS[app].label}...`], effect: { type: "openApp", app } };
      return { output: [`There's no game called '${args}'. Type 'games' to see them all.`] };
    }
    case "taskkill":
      return taskkill(rest, ctx);
    case "ping":
      return { output: pingLines(arg1, ctx) };
    case "msg": {
      if (!args) return { output: ["Usage: msg <message>. Opens Outlook Express with your message ready to send to Bekir."] };
      return { output: ["Opening Outlook Express with your message. Add your name and e-mail there, then click Send."], effect: { type: "openApp", app: "contact", props: { subject: "", message: args.slice(0, 5000) } } };
    }
    case "cat": {
      if (!arg1) return { output: ["Usage: cat <file>. Try 'cat readme.txt'."] };
      const file = FILES[arg1.endsWith(".txt") ? arg1 : `${arg1}.txt`];
      if (file) return { output: file() };
      const asCommand = STATIC[arg1];
      if (asCommand) return { output: asCommand(ctx) };
      return { output: [`The system cannot find the file '${arg1}'.`] };
    }
    case "color": {
      let index = (ctx.colorIndex + 1) % COLOR_SCHEMES.length;
      if (arg1) {
        index = COLOR_SCHEMES.findIndex((c) => c.id === arg1);
        if (index < 0) return { output: [`Unknown scheme '${arg1}'.`, `Options: ${COLOR_SCHEMES.map((c) => c.id).join(", ")}`] };
      }
      return { output: [`Color scheme: ${COLOR_SCHEMES[index]!.name}`], effect: { type: "color", index } };
    }
    case "calc": {
      if (!args) return { output: ["Usage: calc <sum>, like 'calc (2 + 3) * 4'."] };
      try {
        return { output: [`${args} = ${formatNumber(evaluate(args))}`] };
      } catch (e) {
        if (e instanceof CalcError) return { output: [e.message] };
        throw e;
      }
    }
    case "8ball": {
      if (!args) return { output: ["Ask me a yes or no question, like '8ball will it compile?'"] };
      // The 8 Ball has opinions about one question in particular
      if (/\b(hire|hiring|job|interview|bekir)\b/i.test(args)) return { output: ["It is certain.", "(Make it happen with 'open contact'.)"] };
      return { output: [pick(EIGHT_BALL, ctx.random)] };
    }
    case "roll":
      return { output: rollLines(arg1, ctx) };
    case "cowsay":
      return { output: cowsayLines(args, ctx) };
    case "git":
      return { output: gitLines(arg1, ctx) };
    case "vim":
    case "vi":
    case "nano":
    case "emacs":
    case "edit":
      return { output: [`No ${typed} here, so nobody gets stuck in it. Opening Notepad...`], effect: { type: "openApp", app: "notepad" } };
    case "rm":
    case "del":
    case "erase":
    case "rmdir":
    case "rd":
      return { output: /-rf|\/s\b/i.test(args) ? ["Nice try. Everything important is on GitHub anyway."] : ["Access is denied."] };
    case "format":
      return { output: ["WARNING, ALL DATA ON NON-REMOVABLE DISK", "DRIVE C: WILL BE LOST!", "Proceed with Format (Y/N)? N", "", "Format cancelled. That was close."] };
  }

  return {
    output: [
      `'${trimmed}' is not recognized as an internal or external command,`,
      "operable program or batch file.",
      "Type 'help' to see what I can do.",
    ],
  };
}

export const ALL_COMMANDS = [
  ...new Set([
    ...Object.keys(STATIC),
    ...Object.keys(DOCS),
    ...Object.keys(ALIASES),
    "exit",
    "vim",
    "nano",
    "edit",
    "del",
    "rm",
    "format",
  ]),
].sort();

/** Commands that can be tapped or clicked when they appear 'in quotes' in any output */
export function isCommandText(text: string): boolean {
  const first = text.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return ALL_COMMANDS.includes(first) && !/[<[]/.test(text);
}

export interface Completion {
  /** Replacement input when there is exactly one match */
  value?: string;
  /** All candidates when there are several */
  matches?: string[];
}

export function complete(input: string, ctx: Pick<CommandContext, "openApps"> = {}): Completion {
  const segs = input.split(/\s+/);
  if (segs.length <= 1) {
    const frag = (segs[0] ?? "").toLowerCase();
    if (!frag) return {};
    return choose(ALL_COMMANDS, frag, (m) => `${m} `);
  }
  const typed = (segs[0] ?? "").toLowerCase();
  const base = ALIASES[typed] ?? typed;
  const frag = (segs[segs.length - 1] ?? "").toLowerCase();
  let pool: string[] = [];
  if (base === "open") pool = [...APP_IDS, ...PROJECTS.map((p) => p.id), ...Object.keys(LINKS)];
  else if (base === "cd") pool = [...APP_IDS];
  else if (base === "play") pool = [...GAMES];
  else if (base === "cat") pool = Object.keys(FILES);
  else if (base === "color") pool = COLOR_SCHEMES.map((c) => c.id);
  else if (base === "help") pool = ALL_COMMANDS;
  else if (base === "git") pool = ["log", "status"];
  else if (base === "taskkill") pool = ["/im", ...processes(ctx.openApps).map((e) => e.toLowerCase())];
  return choose(pool, frag, (m) => [...segs.slice(0, -1), m].join(" ") + " ");
}

function choose(pool: string[], frag: string, build: (match: string) => string): Completion {
  const matches = [...new Set(pool.filter((c) => c.startsWith(frag)))];
  if (matches.length === 1) return { value: build(matches[0]!) };
  if (matches.length > 1) return { matches };
  return {};
}
