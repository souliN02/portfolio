import { APPS, type AppId } from "@/data/apps";

/**
 * The desktop's window manager as a pure reducer: stacking order, focus,
 * minimize/maximize, and clamping so a window can never be dragged, resized,
 * or left (after the browser shrinks) somewhere it can't be grabbed again.
 */

export const TASKBAR_H = 30;
export const TITLEBAR_H = 28;
/** How much of a window must stay on screen horizontally so its title bar can be grabbed */
export const MIN_VISIBLE = 64;
export const MIN_W = 280;
export const MIN_H = 180;
const CASCADE_STEP = 26;

export interface Viewport {
  width: number;
  height: number;
}

/** Extra data a window is opened with, e.g. which project Explorer should show */
export type WindowProps = Record<string, string | undefined>;

export interface WinState {
  id: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  min: boolean;
  max: boolean;
  props: WindowProps;
  /** Bumped whenever the window is re-opened with new props, so content can react */
  nonce: number;
}

export interface WMState {
  windows: WinState[];
  zTop: number;
  activeId: AppId | null;
}

export const initialWM: WMState = { windows: [], zTop: 10, activeId: null };

export type WMAction =
  | { type: "open"; id: AppId; viewport: Viewport; compact: boolean; props?: WindowProps }
  | { type: "close"; id: AppId }
  | { type: "closeAll" }
  | { type: "focus"; id: AppId }
  | { type: "minimize"; id: AppId }
  | { type: "minimizeAll" }
  | { type: "toggleMax"; id: AppId }
  | { type: "taskbarClick"; id: AppId }
  | { type: "move"; id: AppId; x: number; y: number; viewport: Viewport }
  | { type: "resize"; id: AppId; w: number; h: number; viewport: Viewport }
  | { type: "fit"; viewport: Viewport };

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));

export function clampSize(w: number, h: number, vp: Viewport): { w: number; h: number } {
  const availH = vp.height - TASKBAR_H;
  return {
    w: Math.round(clamp(w, Math.min(MIN_W, vp.width), vp.width)),
    h: Math.round(clamp(h, Math.min(MIN_H, availH), availH)),
  };
}

export function clampPosition(x: number, y: number, w: number, vp: Viewport): { x: number; y: number } {
  return {
    x: Math.round(clamp(x, MIN_VISIBLE - w, vp.width - MIN_VISIBLE)),
    y: Math.round(clamp(y, 0, vp.height - TASKBAR_H - TITLEBAR_H)),
  };
}

/** Keep a whole window inside the desktop when it fits (used when opening) */
function fitInside(x: number, y: number, w: number, h: number, vp: Viewport) {
  return {
    x: Math.round(clamp(x, 0, vp.width - w)),
    y: Math.round(clamp(y, 0, vp.height - TASKBAR_H - h)),
  };
}

export function isMaximizable(id: AppId): boolean {
  const meta = APPS[id];
  return !meta.dialog && meta.maximizable !== false;
}

export function isResizable(id: AppId): boolean {
  const meta = APPS[id];
  return !meta.dialog && meta.resizable !== false;
}

/** The visible window on top, optionally ignoring one */
export function topVisible(windows: WinState[], exclude?: AppId): AppId | null {
  let best: WinState | null = null;
  for (const w of windows) {
    if (w.min || w.id === exclude) continue;
    if (!best || w.z > best.z) best = w;
  }
  return best?.id ?? null;
}

function update(state: WMState, id: AppId, patch: (w: WinState) => WinState): WMState {
  return { ...state, windows: state.windows.map((w) => (w.id === id ? patch(w) : w)) };
}

function focus(state: WMState, id: AppId): WMState {
  const win = state.windows.find((w) => w.id === id);
  if (!win) return state;
  if (state.activeId === id && !win.min && win.z === state.zTop) return state;
  const z = state.zTop + 1;
  return { ...update(state, id, (w) => ({ ...w, z, min: false })), zTop: z, activeId: id };
}

function minimize(state: WMState, id: AppId): WMState {
  const next = update(state, id, (w) => ({ ...w, min: true }));
  return { ...next, activeId: state.activeId === id ? topVisible(next.windows, id) : state.activeId };
}

export function wmReducer(state: WMState, action: WMAction): WMState {
  switch (action.type) {
    case "open": {
      const existing = state.windows.find((w) => w.id === action.id);
      if (existing) {
        const focused = focus(state, action.id);
        if (!action.props) return focused;
        return update(focused, action.id, (w) => ({ ...w, props: { ...w.props, ...action.props }, nonce: w.nonce + 1 }));
      }
      const meta = APPS[action.id];
      const vp = action.viewport;
      const { w, h } = clampSize(meta.w, meta.h, vp);
      let pos;
      if (meta.dialog) {
        pos = fitInside((vp.width - w) / 2, (vp.height - TASKBAR_H - h) / 2, w, h, vp);
      } else {
        const offset = (state.windows.length % 6) * CASCADE_STEP;
        pos = fitInside(80 + offset, 40 + offset, w, h, vp);
      }
      const z = state.zTop + 1;
      const win: WinState = {
        id: action.id,
        ...pos,
        w,
        h,
        z,
        min: false,
        // Phones: every window opens full-screen
        max: action.compact,
        props: action.props ?? {},
        nonce: 0,
      };
      return { windows: [...state.windows, win], zTop: z, activeId: action.id };
    }

    case "close": {
      if (!state.windows.some((w) => w.id === action.id)) return state;
      const windows = state.windows.filter((w) => w.id !== action.id);
      return { ...state, windows, activeId: state.activeId === action.id ? topVisible(windows) : state.activeId };
    }

    case "closeAll":
      return { ...state, windows: [], activeId: null };

    case "focus":
      return focus(state, action.id);

    case "minimize":
      return minimize(state, action.id);

    case "minimizeAll":
      return { ...state, windows: state.windows.map((w) => ({ ...w, min: true })), activeId: null };

    case "toggleMax": {
      if (!isMaximizable(action.id)) return state;
      return focus(update(state, action.id, (w) => ({ ...w, max: !w.max })), action.id);
    }

    case "taskbarClick": {
      const win = state.windows.find((w) => w.id === action.id);
      if (!win) return state;
      return state.activeId === action.id && !win.min ? minimize(state, action.id) : focus(state, action.id);
    }

    case "move":
      return update(state, action.id, (w) => (w.max ? w : { ...w, ...clampPosition(action.x, action.y, w.w, action.viewport) }));

    case "resize":
      return update(state, action.id, (w) => {
        if (w.max || !isResizable(w.id)) return w;
        const size = clampSize(action.w, action.h, action.viewport);
        return { ...w, ...size, ...clampPosition(w.x, w.y, size.w, action.viewport) };
      });

    case "fit":
      return {
        ...state,
        windows: state.windows.map((w) => {
          const size = clampSize(w.w, w.h, action.viewport);
          return { ...w, ...size, ...clampPosition(w.x, w.y, size.w, action.viewport) };
        }),
      };
  }
}
