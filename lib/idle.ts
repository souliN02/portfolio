import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Idle detection for the screensaver. The pointer moving over an iframe
 * (the CV or Internet Explorer) sends no events to this page, so those
 * windows call blockIdle() while hovered to keep the screensaver away.
 */

let blockers = 0;

export function blockIdle(): () => void {
  blockers += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    blockers = Math.max(0, blockers - 1);
  };
}

const ACTIVITY = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

export function useIdle(timeoutMs: number, enabled: boolean): { idle: boolean; wake: () => void; sleep: () => void } {
  const [idle, setIdle] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    last.current = Date.now();
    const bump = () => {
      last.current = Date.now();
    };
    ACTIVITY.forEach((e) => window.addEventListener(e, bump, { capture: true, passive: true }));
    const timer = setInterval(() => {
      const busy = blockers > 0 || document.activeElement?.tagName === "IFRAME";
      if (busy) last.current = Date.now();
      else if (Date.now() - last.current >= timeoutMs) setIdle(true);
    }, 2000);
    return () => {
      ACTIVITY.forEach((e) => window.removeEventListener(e, bump, { capture: true }));
      clearInterval(timer);
    };
  }, [enabled, timeoutMs]);

  const wake = useCallback(() => {
    last.current = Date.now();
    setIdle(false);
  }, []);
  const sleep = useCallback(() => setIdle(true), []);

  return { idle: enabled && idle, wake, sleep };
}
