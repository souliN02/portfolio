import { describe, expect, it } from "vitest";
import { APPS, type AppId } from "@/data/apps";
import {
  MIN_VISIBLE,
  TASKBAR_H,
  TITLEBAR_H,
  initialWM,
  wmReducer,
  type WMAction,
  type WMState,
} from "./windowManager";

const vp = { width: 1280, height: 800 };
const run = (actions: WMAction[], state: WMState = initialWM) => actions.reduce(wmReducer, state);
const open = (id: AppId, extra: { props?: Record<string, string> } = {}): WMAction => ({
  type: "open",
  id,
  viewport: vp,
  compact: false,
  ...extra,
});
const win = (s: WMState, id: string) => s.windows.find((w) => w.id === id)!;

describe("opening windows", () => {
  it("adds a window on top and makes it active", () => {
    const s = run([open("projects"), open("about")]);
    expect(s.windows).toHaveLength(2);
    expect(s.activeId).toBe("about");
    expect(win(s, "about").z).toBeGreaterThan(win(s, "projects").z);
  });

  it("re-opening an existing window focuses it instead of duplicating it", () => {
    const s = run([open("projects"), open("about"), open("projects")]);
    expect(s.windows).toHaveLength(2);
    expect(s.activeId).toBe("projects");
    expect(win(s, "projects").z).toBe(s.zTop);
  });

  it("re-opening with props merges them and bumps the nonce", () => {
    const s = run([open("projects"), open("projects", { props: { project: "linedrift" } })]);
    expect(win(s, "projects").props.project).toBe("linedrift");
    expect(win(s, "projects").nonce).toBe(1);
  });

  it("cascades new windows so they don't sit exactly on top of each other", () => {
    const s = run([open("projects"), open("cv")]);
    expect(win(s, "cv").x).not.toBe(win(s, "projects").x);
  });

  it("opens maximized on compact (phone) viewports and fits the restore size to the screen", () => {
    const phone = { width: 390, height: 700 };
    const s = run([{ type: "open", id: "projects", viewport: phone, compact: true }]);
    const w = win(s, "projects");
    expect(w.max).toBe(true);
    expect(w.w).toBeLessThanOrEqual(phone.width);
    expect(w.h).toBeLessThanOrEqual(phone.height - TASKBAR_H);
  });

  it("centers dialogs", () => {
    const s = run([open("about")]);
    const w = win(s, "about");
    expect(w.x).toBe(Math.round((vp.width - APPS.about.w) / 2));
  });
});

describe("closing, minimizing and focus", () => {
  it("closing the active window activates the next window down", () => {
    const s = run([open("projects"), open("about"), { type: "close", id: "about" }]);
    expect(s.windows.map((w) => w.id)).toEqual(["projects"]);
    expect(s.activeId).toBe("projects");
  });

  it("minimizing the active window activates the next visible window", () => {
    const s = run([open("projects"), open("cv"), { type: "minimize", id: "cv" }]);
    expect(win(s, "cv").min).toBe(true);
    expect(s.activeId).toBe("projects");
  });

  it("taskbar click minimizes the active window and restores a minimized one", () => {
    let s = run([open("projects"), { type: "taskbarClick", id: "projects" }]);
    expect(win(s, "projects").min).toBe(true);
    expect(s.activeId).toBeNull();
    s = wmReducer(s, { type: "taskbarClick", id: "projects" });
    expect(win(s, "projects").min).toBe(false);
    expect(s.activeId).toBe("projects");
  });

  it("focusing the window that is already on top returns the same state object", () => {
    const s = run([open("projects")]);
    expect(wmReducer(s, { type: "focus", id: "projects" })).toBe(s);
  });

  it("minimize all clears the active window", () => {
    const s = run([open("projects"), open("cv"), { type: "minimizeAll" }]);
    expect(s.windows.every((w) => w.min)).toBe(true);
    expect(s.activeId).toBeNull();
  });
});

describe("maximize rules", () => {
  it("toggles maximize on normal windows", () => {
    const s = run([open("projects"), { type: "toggleMax", id: "projects" }]);
    expect(win(s, "projects").max).toBe(true);
  });

  it("ignores maximize on dialogs and fixed-size windows", () => {
    const s = run([open("about"), open("minesweeper"), { type: "toggleMax", id: "about" }, { type: "toggleMax", id: "minesweeper" }]);
    expect(win(s, "about").max).toBe(false);
    expect(win(s, "minesweeper").max).toBe(false);
  });
});

describe("clamping", () => {
  it("never lets a window be dragged fully off the left or right edge", () => {
    let s = run([open("projects"), { type: "move", id: "projects", x: -5000, y: 100, viewport: vp }]);
    const w = win(s, "projects");
    expect(w.x + w.w).toBe(MIN_VISIBLE);
    s = wmReducer(s, { type: "move", id: "projects", x: 5000, y: 100, viewport: vp });
    expect(win(s, "projects").x).toBe(vp.width - MIN_VISIBLE);
  });

  it("keeps the title bar above the taskbar and below the top edge", () => {
    let s = run([open("projects"), { type: "move", id: "projects", x: 100, y: 5000, viewport: vp }]);
    expect(win(s, "projects").y).toBe(vp.height - TASKBAR_H - TITLEBAR_H);
    s = wmReducer(s, { type: "move", id: "projects", x: 100, y: -200, viewport: vp });
    expect(win(s, "projects").y).toBe(0);
  });

  it("caps resizing at the desktop size and enforces a minimum", () => {
    let s = run([open("projects"), { type: "resize", id: "projects", w: 9999, h: 9999, viewport: vp }]);
    expect(win(s, "projects").w).toBe(vp.width);
    expect(win(s, "projects").h).toBe(vp.height - TASKBAR_H);
    s = wmReducer(s, { type: "resize", id: "projects", w: 10, h: 10, viewport: vp });
    expect(win(s, "projects").w).toBeGreaterThanOrEqual(280);
  });

  it("does not resize fixed-size windows", () => {
    const s = run([open("minesweeper"), { type: "resize", id: "minesweeper", w: 900, h: 900, viewport: vp }]);
    expect(win(s, "minesweeper").w).toBe(APPS.minesweeper.w);
  });

  it("pulls windows back on screen when the browser shrinks", () => {
    const small = { width: 500, height: 400 };
    const s = run([open("projects"), { type: "move", id: "projects", x: 1100, y: 700, viewport: vp }, { type: "fit", viewport: small }]);
    const w = win(s, "projects");
    expect(w.w).toBeLessThanOrEqual(small.width);
    expect(w.x).toBeLessThanOrEqual(small.width - MIN_VISIBLE);
    expect(w.y).toBeLessThanOrEqual(small.height - TASKBAR_H - TITLEBAR_H);
  });
});
