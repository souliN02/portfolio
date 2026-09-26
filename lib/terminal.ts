import { APPS, APP_IDS, CORNER_ICON, DESKTOP_ICONS, resolveApp, type AppId } from "@/data/apps";
import { EDUCATION, EXPERIENCE, PROFILE, SKILLS, companyLabel } from "@/data/profile";
import { FLAGSHIP, PROJECTS, PROJECT_GROUPS, getProject, projectsInGroup } from "@/data/projects";
import { readmeText } from "@/data/readme";
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
  | { type: "openUrl"; url: string }
  | { type: "color"; index: number }
  | { type: "shutdown" };

export interface CommandContext {
  history: string[];
  colorIndex: number;
  now: Date;
  random: () => number;
}

export interface CommandResult {
  output: string[];
  effect?: TerminalEffect;
}

export const PROMPT = "C:\\Users\\Bekir>";
const WIDTH = 60;

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

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "There are 10 kinds of people: those who understand binary and those who don't.",
  "A SQL query walks into a bar, goes up to two tables and asks: may I join you?",
  "I would tell you a UDP joke, but you might not get it.",
  "It works on my machine. Shipping the machine.",
  "99 little bugs in the code, 99 little bugs. Take one down, patch it around, 127 little bugs in the code.",
];

export function introLines(now: Date): string[] {
  return [
    "Bekir's Portfolio Terminal [Version XP]",
    `(C) ${now.getFullYear()} ${PROFILE.name}. All rights reserved.`,
    "",
    'Type "help" for commands. Tab autocompletes, Up/Down browses history.',
    'Try "open projects", "msg hi bekir!", or "sysinfo".',
    "",
  ];
}

const HELP = [
  "Available commands:",
  "",
  "  Profile:  about, skills, projects, experience, education,",
  "            contact, links, resume",
  "  Actions:  open <app|project|link>, msg <message>,",
  "            cls, echo <text>, exit, shutdown",
  "  System:   dir (ls), tree, cat <file>, pwd, whoami, ver,",
  "            date, time, sysinfo, ping, history, color [name]",
  "  Fun:      joke, coffee, banner, sudo",
  "",
  "  Tab autocompletes. Up/Down browses history.",
];

const section = (title: string) => [`=== ${title} ===`, ""];

function aboutLines(): string[] {
  return [
    ...section("About Bekir"),
    ...wrap(`Hi, I'm ${PROFILE.name}, a ${PROFILE.role.toLowerCase()} based in ${PROFILE.location}.`, WIDTH),
    "",
    ...wrap(
      "I work with React, Next.js, TypeScript, Python and C#, and I build production software AI-first, using Claude every day as a core part of how I develop.",
      WIDTH,
    ),
    "",
    ...wrap(PROFILE.graduate, WIDTH),
    "Type 'projects' to see what I've shipped and what I'm building.",
  ];
}

function skillsLines(): string[] {
  const row = (label: string, items: readonly string[]) => wrap(items.join(", "), WIDTH - 16, " ".repeat(16)).map((l, i) => (i === 0 ? `  ${label.padEnd(14)}${l}` : l));
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

function experienceLines(): string[] {
  const lines = section("Experience");
  for (const e of EXPERIENCE) {
    lines.push(`  ${e.role}, ${companyLabel(e)}`);
    lines.push(`    ${e.period}, ${e.place}`);
    lines.push(...wrap(e.summary, WIDTH - 4, "    ").map((l, i) => (i === 0 ? `    ${l}` : l)));
    lines.push("");
  }
  return lines.slice(0, -1);
}

function educationLines(): string[] {
  const width = Math.max(...EDUCATION.map((e) => e.title.length));
  return [...section("Education"), ...EDUCATION.flatMap((e) => [`  ${e.title.padEnd(width)}  ${e.period}`, `    ${e.school}`])];
}

function desktopEntries(): { name: string; dir: boolean }[] {
  return [...DESKTOP_ICONS, CORNER_ICON].map((id) => ({ name: APPS[id].label, dir: id !== "notepad" }));
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
  entries.forEach((e, i) => {
    const last = i === entries.length - 1;
    lines.push(`${last ? "└──" : "├──"} ${e.name}`);
    const bar = last ? "    " : "│   ";
    if (e.name === APPS.projects.label) {
      PROJECTS.forEach((p, j) => lines.push(`${bar}${j === PROJECTS.length - 1 ? "└──" : "├──"} ${p.title}`));
    }
    if (e.name === APPS.cv.label) lines.push(`${bar}└── Bekir_CV.pdf`);
  });
  return lines;
}

function sysinfoLines(): string[] {
  const building = projectsInGroup("building").map((p) => p.title.split(" ")[0]).join(", ");
  return [
    "        ___________            bekir@portfolio",
    "       |.---------.|           ---------------",
    "       ||  >_     ||           OS:       Portfolio XP (Developer Edition)",
    "       ||         ||           Host:     bekir-saliv",
    "       |'---------'|           Shell:    bekir-term v3.0",
    `        )_________(            Role:     ${PROFILE.role} (AI-first)`,
    `       /___________\\           Location: ${PROFILE.location}`,
    "       |___________|           Stack:    React, Next.js, TS, Python, C#",
    "                               Editor:   Claude Code + Cursor",
    `                               Building: ${building}`,
    `                               Flagship: ${FLAGSHIP.title}`,
    "                               Coffee:   100%",
  ];
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

const PING = [
  "",
  "Pinging 127.0.0.1 with 32 bytes of data:",
  ...Array(4).fill("Reply from 127.0.0.1: bytes=32 time<1ms TTL=128"),
  "",
  "Ping statistics for 127.0.0.1:",
  "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),",
  "Approximate round trip times in milli-seconds:",
  "    Minimum = 0ms, Maximum = 0ms, Average = 0ms",
];

const FILES: Record<string, () => string[]> = {
  "readme.txt": () => readmeText().trimEnd().split("\n"),
};

/** Simple commands that take no arguments and have no effect */
const STATIC: Record<string, (ctx: CommandContext) => string[]> = {
  help: () => HELP,
  about: aboutLines,
  skills: skillsLines,
  projects: projectsLines,
  contact: contactLines,
  links: linksLines,
  experience: experienceLines,
  education: educationLines,
  dir: dirLines,
  ls: dirLines,
  tree: treeLines,
  sysinfo: sysinfoLines,
  coffee: () => COFFEE,
  banner: () => BANNER,
  ping: () => PING,
  pwd: () => ["C:\\Users\\Bekir\\Desktop"],
  whoami: () => [`bekir-saliv (${PROFILE.role}, AI-first)`],
  ver: () => ["", "Bekir's Portfolio Terminal [Version XP]", "Developer Edition - shell v3.0", ""],
  sudo: () => ["Nice try.", "bekir is not in the sudoers file. This incident will be reported."],
  joke: (ctx) => [JOKES[Math.floor(ctx.random() * JOKES.length)]!],
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
  const cmd = first.toLowerCase();
  const args = rest.join(" ");
  const arg1 = (rest[0] ?? "").toLowerCase();

  if (!cmd) return { output: [] };

  const staticCmd = STATIC[cmd];
  if (staticCmd) return { output: staticCmd(ctx) };

  switch (cmd) {
    case "cls":
    case "clear":
      return { output: [], effect: { type: "clear" } };
    case "exit":
      return { output: [], effect: { type: "exit" } };
    case "echo":
      return { output: [args || "ECHO is on."] };
    case "resume":
      return { output: ["Opening Bekir's CV..."], effect: { type: "openApp", app: "cv" } };
    case "shutdown":
      return { output: ["Opening Turn Off Computer..."], effect: { type: "shutdown" } };
    case "open":
    case "start":
      return openTarget(arg1);
    case "msg": {
      if (!args) return { output: ["Usage: msg <message>. Opens Outlook Express with your message ready to send to Bekir."] };
      return { output: ["Opening Outlook Express with your message. Add your name and e-mail there, then click Send."], effect: { type: "openApp", app: "contact", props: { subject: "", message: args.slice(0, 5000) } } };
    }
    case "cat":
    case "type": {
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
  ...Object.keys(STATIC),
  "cls",
  "clear",
  "exit",
  "echo",
  "resume",
  "shutdown",
  "open",
  "start",
  "msg",
  "cat",
  "type",
  "color",
].sort();

export interface Completion {
  /** Replacement input when there is exactly one match */
  value?: string;
  /** All candidates when there are several */
  matches?: string[];
}

export function complete(input: string): Completion {
  const segs = input.split(/\s+/);
  if (segs.length <= 1) {
    const frag = (segs[0] ?? "").toLowerCase();
    if (!frag) return {};
    return pick(ALL_COMMANDS, frag, (m) => `${m} `);
  }
  const base = (segs[0] ?? "").toLowerCase();
  const frag = (segs[segs.length - 1] ?? "").toLowerCase();
  let pool: string[] = [];
  if (base === "open" || base === "start") pool = [...APP_IDS, ...PROJECTS.map((p) => p.id), ...Object.keys(LINKS)];
  else if (base === "cat" || base === "type") pool = Object.keys(FILES);
  else if (base === "color") pool = COLOR_SCHEMES.map((c) => c.id);
  return pick(pool, frag, (m) => [...segs.slice(0, -1), m].join(" ") + " ");
}

function pick(pool: string[], frag: string, build: (match: string) => string): Completion {
  const matches = [...new Set(pool.filter((c) => c.startsWith(frag)))];
  if (matches.length === 1) return { value: build(matches[0]!) };
  if (matches.length > 1) return { matches };
  return {};
}

