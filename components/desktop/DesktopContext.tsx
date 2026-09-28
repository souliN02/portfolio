"use client";

import { createContext, useContext } from "react";
import type { AppId } from "@/data/apps";
import type { WindowProps } from "@/lib/windowManager";

/** What window contents can ask the desktop to do */
export interface DesktopApi {
  openApp: (id: AppId, props?: WindowProps) => void;
  closeApp: (id: AppId) => void;
  /** Override a window's title bar and taskbar text (Explorer shows the current folder, IE the page) */
  setTitle: (id: AppId, title: string | null) => void;
  requestTurnOff: () => void;
  /** Apps with an open window, oldest first (the terminal's tasklist) */
  getOpenApps: () => AppId[];
  binEmpty: boolean;
  emptyBin: () => void;
  /** Coarse pointer: taps instead of double-clicks, long-press instead of right-click */
  touch: boolean;
}

export const DesktopContext = createContext<DesktopApi | null>(null);

export function useDesktop(): DesktopApi {
  const api = useContext(DesktopContext);
  if (!api) throw new Error("useDesktop must be used inside the desktop");
  return api;
}
