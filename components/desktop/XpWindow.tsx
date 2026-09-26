"use client";

import { useEffect, useId, useRef, type Dispatch, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { APPS } from "@/data/apps";
import { TASKBAR_H, isMaximizable, isResizable, type Viewport, type WMAction, type WinState } from "@/lib/windowManager";
import { CloseGlyph, HelpGlyph, MaximizeGlyph, MinimizeGlyph, RestoreGlyph } from "@/components/ui/glyphs";

interface XpWindowProps {
  win: WinState;
  title: string;
  active: boolean;
  getViewport: () => Viewport;
  dispatch: Dispatch<WMAction>;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMax: () => void;
  onHelp: () => void;
  children: ReactNode;
}

type Gesture = { kind: "move" | "e" | "s" | "se"; startX: number; startY: number; x: number; y: number; w: number; h: number };

export default function XpWindow({ win, title, active, getViewport, dispatch, onClose, onMinimize, onToggleMax, onHelp, children }: XpWindowProps) {
  const meta = APPS[win.id];
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const maximizable = isMaximizable(win.id);
  const resizable = isResizable(win.id) && !win.max;

  // Move keyboard focus into a newly opened window, unless its content already took it
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (ref.current && !ref.current.contains(document.activeElement)) ref.current.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const begin = (kind: Gesture["kind"]) => (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if (kind === "move" && (e.target as HTMLElement).closest("button")) return;
    dispatch({ type: "focus", id: win.id });
    if (win.max || (kind !== "move" && !resizable)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { kind, startX: e.clientX, startY: e.clientY, x: win.x, y: win.y, w: win.w, h: win.h };
    document.documentElement.classList.add("xp-dragging");
  };

  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    const viewport = getViewport();
    if (g.kind === "move") dispatch({ type: "move", id: win.id, x: g.x + dx, y: g.y + dy, viewport });
    else dispatch({ type: "resize", id: win.id, w: g.kind === "s" ? g.w : g.w + dx, h: g.kind === "e" ? g.h : g.h + dy, viewport });
  };

  const end = () => {
    gesture.current = null;
    document.documentElement.classList.remove("xp-dragging");
  };

  const handlers = (kind: Gesture["kind"]) => ({ onPointerDown: begin(kind), onPointerMove: move, onPointerUp: end, onPointerCancel: end });

  return (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-active={active}
      data-max={win.max}
      className="xp-window absolute flex flex-col outline-none animate-winOpen"
      style={
        win.max
          ? { top: 0, left: 0, width: "100%", height: `calc(100% - ${TASKBAR_H}px)`, zIndex: win.z, display: win.min ? "none" : undefined }
          : { top: win.y, left: win.x, width: win.w, height: win.h, zIndex: win.z, display: win.min ? "none" : undefined }
      }
      onPointerDownCapture={() => {
        if (!active) dispatch({ type: "focus", id: win.id });
      }}
    >
      <div className="xp-titlebar cursor-default touch-none select-none" {...handlers("move")} onDoubleClick={(e) => !(e.target as HTMLElement).closest("button") && maximizable && onToggleMax()}>
        <span className="flex min-w-0 items-center gap-1.5">
          {/* Double-clicking the window icon closes it, as in XP */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.icon}
            alt=""
            width={16}
            height={16}
            className="shrink-0"
            draggable={false}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />
          <span id={titleId} className="truncate">
            {title}
          </span>
        </span>
        <span className="flex items-center gap-[2px]">
          {meta.dialog ? (
            <button type="button" className="xp-tbtn" aria-label="Help" title="Help" onClick={onHelp}>
              <HelpGlyph />
            </button>
          ) : (
            <>
              <button type="button" className="xp-tbtn" aria-label="Minimize" title="Minimize" onClick={onMinimize}>
                <MinimizeGlyph />
              </button>
              {maximizable && (
                <button type="button" className="xp-tbtn" aria-label={win.max ? "Restore" : "Maximize"} title={win.max ? "Restore" : "Maximize"} onClick={onToggleMax}>
                  {win.max ? <RestoreGlyph /> : <MaximizeGlyph />}
                </button>
              )}
            </>
          )}
          <button type="button" className="xp-tbtn xp-tbtn-close ml-[2px]" aria-label="Close" title="Close" onClick={onClose}>
            <CloseGlyph />
          </button>
        </span>
      </div>

      <div className="@container relative min-h-0 flex-1 overflow-hidden bg-[var(--xp-face)]">{children}</div>

      {resizable && (
        <>
          <div className="absolute right-0 top-8 bottom-4 w-[5px] cursor-e-resize touch-none" {...handlers("e")} aria-hidden="true" />
          <div className="absolute bottom-0 left-2 right-4 h-[5px] cursor-s-resize touch-none" {...handlers("s")} aria-hidden="true" />
          <div className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize touch-none pointer-coarse:h-7 pointer-coarse:w-7" {...handlers("se")} title="Resize" aria-hidden="true">
            <svg width="12" height="12" className="absolute bottom-[4px] right-[4px] opacity-60" aria-hidden="true">
              <path d="M11 3v8H3M11 7v4H7" fill="none" stroke="#fff" strokeWidth="1.2" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
