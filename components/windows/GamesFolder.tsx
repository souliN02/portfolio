"use client";

import { useState } from "react";
import { APPS, GAMES, type AppId } from "@/data/apps";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { AddressBar, MenuBar, StatusBar, TaskLink, TaskPane, TaskPanel } from "./ExplorerChrome";

/** XP kept its games in Start > All Programs > Games; here they live in a folder on the desktop */
export default function GamesFolder() {
  const api = useDesktop();
  const [selected, setSelected] = useState<AppId | null>(null);
  const sel = selected ? APPS[selected] : null;

  return (
    <div className="flex h-full flex-col text-[11px]">
      <MenuBar items={["File", "Edit", "View", "Favorites", "Tools", "Help"]} />
      <AddressBar>
        <div className="flex min-w-0 flex-1 items-center gap-1 border border-[var(--xp-input-border)] bg-white px-1 py-[3px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={APPS.games.icon} alt="" width={16} height={16} />
          <span className="truncate">C:\Documents and Settings\All Users\Start Menu\Programs\Games</span>
        </div>
      </AddressBar>

      <div className="flex min-h-0 flex-1">
        <TaskPane>
          <TaskPanel title="Game Tasks">
            {sel && selected ? (
              <TaskLink icon={sel.icon} onClick={() => api.openApp(selected)}>
                Play {sel.label}
              </TaskLink>
            ) : (
              <p className="text-[#555]">Select a game to see its details.</p>
            )}
          </TaskPanel>
          <TaskPanel title="Other Places">
            <TaskLink icon={APPS.projects.icon} onClick={() => api.openApp("projects")}>
              My Projects
            </TaskLink>
            <TaskLink icon={APPS.terminal.icon} onClick={() => api.openApp("terminal")}>
              Command Prompt
            </TaskLink>
          </TaskPanel>
          <TaskPanel title="Details">
            <p className="font-bold">{sel?.label ?? "Games"}</p>
            <p>{sel ? sel.desc : `${GAMES.length} games`}</p>
          </TaskPanel>
        </TaskPane>

        <div
          className="grid min-w-0 flex-1 auto-rows-min content-start gap-1 overflow-auto bg-white p-2 [grid-template-columns:repeat(auto-fill,minmax(88px,1fr))]"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          role="list"
          aria-label="Games"
        >
          {GAMES.map((id) => {
            const isSel = selected === id;
            return (
              <button
                key={id}
                type="button"
                role="listitem"
                className="flex flex-col items-center gap-1 rounded-sm p-1.5 text-center outline-none focus-visible:outline-1 focus-visible:outline-dotted pointer-coarse:py-3"
                // Touch screens open on a tap, as on the desktop; a mouse selects, then double-clicks
                onClick={() => (api.touch ? api.openApp(id) : setSelected(id))}
                onDoubleClick={() => api.openApp(id)}
                onFocus={() => setSelected(id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    api.openApp(id);
                  }
                }}
                aria-label={`${APPS[id].label}: ${APPS[id].desc}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={APPS[id].icon} alt="" width={32} height={32} draggable={false} />
                <span className={`px-0.5 leading-tight ${isSel ? "bg-[var(--xp-select)] text-white" : ""}`}>{APPS[id].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <StatusBar>
        <span className="flex-1">{sel ? sel.desc : `${GAMES.length} objects`}</span>
      </StatusBar>
    </div>
  );
}
