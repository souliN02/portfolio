"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { sounds } from "@/lib/sounds";
import { CloseGlyph, ErrorIcon, InfoIcon, QuestionIcon, WarningIcon } from "./glyphs";

export interface MessageBoxButton {
  label: string;
  onClick: () => void;
}

interface MessageBoxProps {
  title: string;
  icon?: "info" | "warning" | "error" | "question";
  children: ReactNode;
  buttons: MessageBoxButton[];
  onClose: () => void;
}

const ICONS = { info: InfoIcon, warning: WarningIcon, error: ErrorIcon, question: QuestionIcon };

/** An XP message box, shown modally over the window it belongs to */
export default function MessageBox({ title, icon = "info", children, buttons, onClose }: MessageBoxProps) {
  const titleId = useId();
  const firstButton = useRef<HTMLButtonElement>(null);
  const Icon = ICONS[icon];

  useEffect(() => {
    if (icon === "warning" || icon === "error") sounds.error();
    else sounds.notify();
    firstButton.current?.focus();
  }, [icon]);

  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center p-3"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} className="xp-window flex w-full max-w-[380px] flex-col" data-active="true">
        <div className="xp-titlebar">
          <span id={titleId} className="truncate">
            {title}
          </span>
          <button type="button" className="xp-tbtn xp-tbtn-close" aria-label="Close" onClick={onClose}>
            <CloseGlyph />
          </button>
        </div>
        <div className="bg-[var(--xp-face)] px-4 pb-3 pt-4 text-[11px]">
          <div className="flex gap-4">
            <div className="shrink-0">
              <Icon />
            </div>
            <div className="min-w-0 whitespace-pre-line pt-1 leading-relaxed">{children}</div>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {buttons.map((b, i) => (
              <button key={b.label} ref={i === 0 ? firstButton : undefined} type="button" className="xp-button" onClick={b.onClick}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
