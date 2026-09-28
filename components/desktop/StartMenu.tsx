"use client";

import { useEffect, useRef, type ComponentType, type KeyboardEvent } from "react";
import { FileText, Globe, Link as LinkIcon, LogOut, Power, Star } from "lucide-react";
import { APPS, type AppId } from "@/data/apps";
import { PROFILE } from "@/data/profile";
import { FLAGSHIP, primaryLink } from "@/data/projects";
import { GitHubMark } from "@/components/ui/glyphs";

interface StartMenuProps {
  onOpen: (id: AppId) => void;
  onClose: () => void;
  onLogOff: () => void;
  onTurnOff: () => void;
}

/* Pinned at the top, as XP pinned Internet and E-mail */
const PINNED: { id: AppId; name: string; desc: string }[] = [
  { id: "ie", name: "Internet", desc: "Internet Explorer" },
  { id: "contact", name: "E-mail", desc: "Outlook Express" },
];
const PROGRAMS: AppId[] = ["projects", "about", "cv", "terminal", "notepad", "games"];

export default function StartMenu({ onOpen, onClose, onLogOff, onTurnOff }: StartMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const flagshipLink = primaryLink(FLAGSHIP);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>(".xp-start-item")?.focus({ preventScroll: true });
  }, []);

  // Up/Down move between items, as in the real Start menu
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(ref.current?.querySelectorAll<HTMLElement>(".xp-start-item") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onPointerDown={onClose} aria-hidden="true" />
      <div ref={ref} role="menu" aria-label="Start menu" className="xp-startmenu animate-startOpen absolute bottom-[30px] left-0 z-50 w-[380px] max-w-full text-black" onKeyDown={onKeyDown}>
        <div className="xp-startmenu-header flex items-center gap-2 px-2 pb-2.5 pt-2 text-white">
          <span className="grid h-[42px] w-[42px] place-items-center rounded-[3px] border-2 border-white/80 bg-gradient-to-br from-[#fff] to-[#cfe0fb] shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/xp-icons/User 1.ico" alt="" width={32} height={32} draggable={false} />
          </span>
          <div className="leading-tight [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
            <p className="text-[14px] font-bold">{PROFILE.name}</p>
            <p className="text-[10px] text-white/85">{PROFILE.role}</p>
          </div>
        </div>

        <div className="flex">
          <div className="w-[56%] bg-white py-1.5">
            {PINNED.map((p) => (
              <Item key={p.id} icon={APPS[p.id].icon} name={p.name} desc={p.desc} bold onClick={() => onOpen(p.id)} />
            ))}
            <div className="xp-start-sep" />
            {PROGRAMS.map((id) => (
              <Item key={id} icon={APPS[id].icon} name={APPS[id].label} desc={APPS[id].desc} onClick={() => onOpen(id)} />
            ))}
          </div>
          <div className="xp-startmenu-right w-[44%] py-1.5">
            <LinkItem icon={GitHubMark} href={PROFILE.links.github}>
              GitHub
            </LinkItem>
            <LinkItem icon={LinkIcon} href={PROFILE.links.linkedin}>
              LinkedIn
            </LinkItem>
            {flagshipLink && (
              <LinkItem icon={Star} href={flagshipLink.href}>
                {FLAGSHIP.title}
              </LinkItem>
            )}
            <LinkItem icon={FileText} href={PROFILE.cvPath}>
              CV (PDF)
            </LinkItem>
            <div className="xp-start-sep" />
            <button type="button" className="xp-start-item flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] font-bold text-[#0a246a]" onClick={() => onOpen("recycle")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={APPS.recycle.icon} alt="" width={20} height={20} />
              Recycle Bin
            </button>
            <LinkItem icon={Globe} href="/simple" newTab={false}>
              Plain text version
            </LinkItem>
          </div>
        </div>

        <div className="xp-startmenu-footer flex items-center justify-end gap-1 px-2 py-1.5 text-[11px] text-white">
          <FooterButton onClick={onLogOff} tone="orange" icon={LogOut}>
            Log Off
          </FooterButton>
          <FooterButton onClick={onTurnOff} tone="red" icon={Power}>
            Turn Off Computer
          </FooterButton>
        </div>
      </div>
    </>
  );
}

function Item({ icon, name, desc, bold, onClick }: { icon: string; name: string; desc: string; bold?: boolean; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="xp-start-item flex w-full items-center gap-2 px-2 py-[5px] text-left">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" width={30} height={30} className="shrink-0" draggable={false} />
      <span className="min-w-0">
        <span className={`block truncate text-[11px] ${bold ? "font-bold" : ""}`}>{name}</span>
        <span className="xp-start-desc block truncate text-[10px] text-[#6d6d6d]">{desc}</span>
      </span>
    </button>
  );
}

function LinkItem({ icon: Icon, href, newTab = true, children }: { icon: ComponentType<{ className?: string }>; href: string; newTab?: boolean; children: string }) {
  return (
    <a
      role="menuitem"
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className="xp-start-item flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] font-bold text-[#0a246a]"
    >
      <Icon className="h-[18px] w-[18px] shrink-0 text-[#1d4fbf]" />
      <span className="truncate">{children}</span>
    </a>
  );
}

function FooterButton({ onClick, tone, icon: Icon, children }: { onClick: () => void; tone: "orange" | "red"; icon: ComponentType<{ className?: string }>; children: string }) {
  return (
    <button type="button" onClick={onClick} className="xp-start-item flex items-center gap-1.5 rounded-sm px-1.5 py-1 hover:!bg-white/15">
      <span className={`grid h-[22px] w-[22px] place-items-center rounded-[3px] border border-white/70 ${tone === "red" ? "bg-gradient-to-b from-[#f08a6a] to-[#c9321a]" : "bg-gradient-to-b from-[#f5b660] to-[#dc7a12]"}`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </span>
      {children}
    </button>
  );
}
