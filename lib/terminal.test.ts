import { describe, expect, it } from "vitest";
import { PROJECTS } from "@/data/projects";
import { COLOR_SCHEMES, complete, runCommand, type CommandContext } from "./terminal";

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
    expect(run("rm -rf /").output[0]).toContain("is not recognized");
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
