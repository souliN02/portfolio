import { describe, expect, it } from "vitest";
import { PROJECTS } from "@/data/projects";
import { APPS, GAMES } from "@/data/apps";
import { readStats } from "./gameStats";
import { COLOR_SCHEMES, complete, isCommandText, runCommand, type CommandContext } from "./terminal";

const ctx: CommandContext = { history: [], colorIndex: 0, now: new Date("2026-09-25T10:00:00"), random: () => 0 };
const run = (cmd: string, extra: Partial<CommandContext> = {}) => runCommand(cmd, { ...ctx, ...extra });

describe("runCommand", () => {
  it("lists every project from the shared data", () => {
    const text = run("projects").output.join("\n");
    for (const p of PROJECTS) expect(text).toContain(p.title);
  });

  it("never mentions the old company name without the new one", () => {
    for (const cmd of ["about", "projects", "experience", "cat readme.txt", "sysinfo", "links"]) {
      const text = run(cmd).output.join("\n");
      if (text.includes("CreativeGround")) expect(text).toContain("Fleeca");
    }
  });

  it("uses no em dashes in any output", () => {
    for (const cmd of ["help", "about", "skills", "projects", "contact", "links", "experience", "education", "cat readme.txt", "sysinfo", "open"]) {
      expect(run(cmd).output.join("\n")).not.toContain("—");
    }
  });

  it("opens a project inside My Projects", () => {
    expect(run("open linedrift").effect).toEqual({ type: "openApp", app: "projects", props: { project: "linedrift" } });
  });

  it("opens apps by name or alias, and links in a new tab", () => {
    expect(run("start outlook").effect).toEqual({ type: "openApp", app: "contact" });
    expect(run("open github").effect).toMatchObject({ type: "openUrl" });
    expect(run("open nowhere").output[0]).toContain("Cannot open");
  });

  it("drafts a message to Bekir in Outlook Express", () => {
    expect(run("msg Hi Bekir!").effect).toEqual({ type: "openApp", app: "contact", props: { subject: "", message: "Hi Bekir!" } });
    expect(run("msg").effect).toBeUndefined();
  });

  it("cycles and sets color schemes", () => {
    expect(run("color", { colorIndex: COLOR_SCHEMES.length - 1 }).effect).toEqual({ type: "color", index: 0 });
    expect(run("color amber").effect).toEqual({ type: "color", index: COLOR_SCHEMES.findIndex((c) => c.id === "amber") });
    expect(run("color nope").effect).toBeUndefined();
  });

  it("reports unknown commands like cmd.exe", () => {
    expect(run("frobnicate").output[0]).toContain("is not recognized");
  });

  it("shows history", () => {
    expect(run("history", { history: ["help", "about"] }).output).toEqual(["    1  help", "    2  about"]);
  });
});

describe("complete", () => {
  it("completes a unique command", () => {
    expect(complete("sysi")).toEqual({ value: "sysinfo " });
  });

  it("lists several matches", () => {
    expect(complete("c").matches).toEqual(expect.arrayContaining(["cat", "clear", "cls", "coffee", "color", "contact"]));
  });

  it("completes open targets, including projects", () => {
    expect(complete("open linedr")).toEqual({ value: "open linedrift " });
    expect(complete("open min")).toEqual({ value: "open minesweeper " });
  });
});

describe("help", () => {
  it("lists every group and makes the listed commands tappable", () => {
    const { output, links } = run("help");
    for (const group of ["Profile:", "Actions:", "Games:", "System:", "Fun:"]) expect(output.join("\n")).toContain(group);
    expect(links).toMatchObject({ about: "about", open: "open", ls: "ls", "git log": "git log", "8ball": "8ball" });
    expect(links).not.toHaveProperty("type");
  });

  it("explains one command, including its aliases", () => {
    expect(run("help taskkill").output.join("\n")).toContain("taskkill /im <name>");
    expect(run("man ls").output.join("\n")).toContain("Also: ls");
    expect(run("help nope").output[0]).toContain("no command called");
  });
});

describe("phone-width output", () => {
  const stats = readStats();
  it("wraps to the columns available", () => {
    const tooLong: string[] = [];
    for (const cmd of ["help", "about", "skills", "experience", "sysinfo", "hire", "git log", "games", "tasklist", "ipconfig", "highscores", "cowsay the quick brown fox jumps over the lazy dog", "fortune", "joke"]) {
      for (const line of run(cmd, { columns: 44, stats }).output) if (line.length > 44) tooLong.push(`${cmd}: ${line}`);
    }
    expect(tooLong).toEqual([]);
  });

  it("keeps columns lined up when it drops the picture", () => {
    expect(run("sysinfo", { columns: 44 }).output).toContain("OS:       Portfolio XP (Developer Edition)");
  });

  it("keeps the desktop layout when there's room", () => {
    expect(run("sysinfo", { columns: 100 }).output[0]).toMatch(/^\s+_{11}\s+bekir@portfolio$/);
  });
});

describe("games", () => {
  it("lists every game, each linked to play it", () => {
    const { output, links } = run("games");
    for (const id of GAMES) {
      expect(output.join("\n")).toContain(APPS[id].label);
      expect(links?.[APPS[id].label]).toBe(`play ${id}`);
    }
  });

  it("plays games by name or alias, and nothing else", () => {
    expect(run("play sol").effect).toEqual({ type: "openApp", app: "solitaire" });
    expect(run("play spider solitaire").effect).toEqual({ type: "openApp", app: "spider" });
    expect(run("play projects").effect).toBeUndefined();
    expect(run("play").links).toBeDefined();
  });

  it("shows statistics from the games", () => {
    const stats = { ...readStats(), minesweeper: { played: 4, won: 2, best: 37 } };
    expect(run("highscores", { stats }).output.join("\n")).toMatch(/Minesweeper\s+2\/4\s+37 seconds/);
  });
});

describe("processes", () => {
  const openApps = ["projects", "minesweeper", "games", "terminal"] as const;
  it("lists running programs, with Explorer windows sharing one process", () => {
    const text = run("tasklist", { openApps: [...openApps] }).output.join("\n");
    expect(text).toContain("winmine.exe");
    expect(text).toContain("csrss.exe");
    expect(text.match(/explorer\.exe/g)).toHaveLength(1);
    expect(text).not.toContain("sol.exe");
  });

  it("taskkill closes by image name, alias or PID", () => {
    const ctxApps = { openApps: [...openApps] };
    expect(run("taskkill /im winmine.exe", ctxApps).effect).toEqual({ type: "closeApps", apps: ["minesweeper"] });
    expect(run("taskkill minesweeper", ctxApps).effect).toEqual({ type: "closeApps", apps: ["minesweeper"] });
    const pid = /winmine\.exe\s+(\d+)/.exec(run("tasklist", ctxApps).output.join("\n"))![1];
    expect(run(`taskkill /pid ${pid}`, ctxApps).effect).toEqual({ type: "closeApps", apps: ["minesweeper"] });
    expect(run("taskkill /im cmd.exe", ctxApps).effect).toEqual({ type: "exit" });
    expect(run("taskkill /im sol.exe", ctxApps).output[0]).toContain("not found");
    expect(run("taskkill").output[0]).toContain("Invalid syntax");
  });

  it("blue-screens when a critical process or Explorer is ended", () => {
    const explorer = run("taskkill /f /im explorer.exe", { openApps: [...openApps] });
    expect(explorer.output[0]).toContain("SUCCESS");
    expect(explorer.effect).toEqual({ type: "crash", crash: { stop: "CRITICAL_OBJECT_TERMINATION", file: "EXPLORER.EXE" } });
    expect(run("taskkill /im csrss.exe").effect).toMatchObject({ type: "crash", crash: { file: "CSRSS.EXE" } });
    expect(run("taskkill winlogon").effect).toMatchObject({ type: "crash", crash: { file: "WINLOGON.EXE" } });
  });

  it("formats drive C: straight into a blue screen", () => {
    const format = run("format c:");
    expect(format.output.join(" ")).toContain("Proceed with Format (Y/N)? Y");
    expect(format.effect).toEqual({ type: "crash", crash: { stop: "UNMOUNTABLE_BOOT_VOLUME", file: "FORMAT.COM" } });
    expect(run("FORMAT C").effect?.type).toBe("crash");
    expect(run("format").effect).toBeUndefined();
    expect(run("format d:").output).toEqual(["Invalid drive specification."]);
  });
});

describe("more commands", () => {
  it("calculates safely", () => {
    expect(run("calc (2 + 3) * 4").output).toEqual(["(2 + 3) * 4 = 20"]);
    expect(run("calc 1/0").output).toEqual(["Cannot divide by zero."]);
    expect(run("calc process.exit()").output[0]).toContain("don't understand");
  });

  it("sets and resets the window title", () => {
    expect(run("title My shell").effect).toEqual({ type: "title", text: "My shell" });
    expect(run("title").effect).toEqual({ type: "title", text: null });
  });

  it("tells my career as a git log, newest first", () => {
    const log = run("git log").output.join("\n");
    expect(log).toContain("Fleeca");
    expect(log.indexOf("2025")).toBeLessThan(log.indexOf("2018"));
    expect(run("git status").output.join("\n")).toContain("open to new roles");
    expect(run("git push").output[0]).toContain("not a git command");
  });

  it("opens folders with cd, and keeps visitors on the desktop", () => {
    expect(run("cd games").effect).toEqual({ type: "openApp", app: "games" });
    expect(run("cd ..").output).toEqual(["Access is denied."]);
    expect(run("cd nowhere").output[0]).toContain("cannot find the path");
  });

  it("answers aliases and jokes", () => {
    expect(run("ls").output.join("\n")).toContain("Directory of");
    expect(run("clear").effect).toEqual({ type: "clear" });
    expect(run("vim").effect).toEqual({ type: "openApp", app: "notepad" });
    expect(run("rm -rf /").output[0]).toContain("Nice try");
    expect(run("roll 2d6", { random: () => 0.5 }).output).toEqual(["You rolled 4 + 4 = 8."]);
    expect(run("roll 99d6").output[0]).toContain("Usage");
    expect(run("8ball should I hire Bekir?").output[0]).toBe("It is certain.");
  });

  it("recognizes quoted commands in output as tappable", () => {
    expect(isCommandText("open contact")).toBe(true);
    expect(isCommandText("help <command>")).toBe(false);
    expect(isCommandText("origin/main")).toBe(false);
  });

  it("uses no em dashes in the new commands either", () => {
    for (const cmd of ["hire", "games", "tasklist", "ipconfig", "git log", "git status", "hack", "highscores", "languages", "fortune", "format c:"]) {
      expect(run(cmd, { stats: readStats() }).output.join("\n")).not.toContain("—");
    }
  });
});

describe("complete, for new commands", () => {
  it("completes games, git and taskkill targets", () => {
    expect(complete("play fr")).toEqual({ value: "play freecell " });
    expect(complete("git st")).toEqual({ value: "git status " });
    expect(complete("taskkill /im winm", { openApps: ["minesweeper"] })).toEqual({ value: "taskkill /im winmine.exe " });
    expect(complete("taskkill /im win", { openApps: ["minesweeper"] }).matches).toEqual(["winlogon.exe", "winmine.exe"]);
  });
});
