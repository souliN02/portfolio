"use client";

import { useState, type ReactNode } from "react";
import { ChevronsGlyph } from "@/components/ui/glyphs";

/* Pieces of the XP Explorer window shared by My Projects, Recycle Bin and Internet Explorer */

/** Decorative, like most XP clones: the menus aren't wired up, so they're hidden from assistive tech */
export function MenuBar({ items }: { items: string[] }) {
  return (
    <div className="xp-menubar max-[480px]:hidden" aria-hidden="true">
      {items.map((m) => (
        <span key={m}>{m}</span>
      ))}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="xp-toolbar overflow-x-auto">{children}</div>;
}

interface ToolButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Show the text label next to the icon (hidden on narrow windows) */
  showLabel?: boolean;
}

export function ToolButton({ icon, label, onClick, disabled, showLabel = true }: ToolButtonProps) {
  return (
    <button type="button" className="xp-tool shrink-0" onClick={onClick} disabled={disabled} title={label} aria-label={label}>
      {icon}
      {showLabel && <span className="hidden @md:inline">{label}</span>}
    </button>
  );
}

export const ToolSeparator = () => <span className="xp-tool-sep" aria-hidden="true" />;

export function AddressBar({ label = "Address", children }: { label?: string; children: ReactNode }) {
  return (
    <div className="xp-addressbar">
      <span className="shrink-0 text-[#6d6d6d]">{label}</span>
      {children}
    </div>
  );
}

export function TaskPane({ children }: { children: ReactNode }) {
  return <nav className="xp-taskpane hidden w-[200px] shrink-0 overflow-y-auto @2xl:block">{children}</nav>;
}

export function TaskPanel({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="xp-taskpanel">
      <button type="button" className="xp-taskpanel-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {title}
        <span className="xp-taskpanel-chevron">
          <ChevronsGlyph open={open} />
        </span>
      </button>
      <div className="xp-taskpanel-body" data-open={open}>
        <div>
          <div className="xp-taskpanel-inner space-y-1.5">{children}</div>
        </div>
      </div>
    </section>
  );
}

interface TaskLinkProps {
  icon?: string;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
}

export function TaskLink({ icon, children, onClick, href }: TaskLinkProps) {
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {icon && <img src={icon} alt="" width={16} height={16} className="mt-px shrink-0" draggable={false} />}
      <span>{children}</span>
    </>
  );
  const cls = "xp-link flex w-full items-start gap-1.5 text-left";
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export function StatusBar({ children }: { children: ReactNode }) {
  return <div className="xp-statusbar shrink-0">{children}</div>;
}
