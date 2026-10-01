"use client";

import { useState } from "react";
import { GAMES, appsFor, type AppId } from "@/data/apps";
import { useLang, useStrings } from "@/lib/language";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { AddressBar, MenuBar, StatusBar, TaskLink, TaskPane, TaskPanel } from "./ExplorerChrome";

/** XP kept its games in Start > All Programs > Games; here they live in a folder on the desktop */
export default function GamesFolder() {
  const api = useDesktop();
  const [selected, setSelected] = useState<AppId | null>(null);
  const t = useStrings();
  const apps = appsFor(useLang());
  const sel = selected ? apps[selected] : null;

  return (
    <div className="flex h-full flex-col text-[11px]">
      <MenuBar items={t.menus.explorer} />
      <AddressBar>
        <div className="flex min-w-0 flex-1 items-center gap-1 border border-[var(--xp-input-border)] bg-white px-1 py-[3px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={apps.games.icon} alt="" width={16} height={16} />
          <span className="truncate">{t.games.path}</span>
        </div>
      </AddressBar>

      <div className="flex min-h-0 flex-1">
        <TaskPane>
          <TaskPanel title={t.games.tasks}>
            {sel && selected ? (
              <TaskLink icon={sel.icon} onClick={() => api.openApp(selected)}>
                {t.games.play(sel.label)}
              </TaskLink>
            ) : (
              <p className="text-[#555]">{t.games.select}</p>
            )}
          </TaskPanel>
          <TaskPanel title={t.otherPlaces}>
            <TaskLink icon={apps.projects.icon} onClick={() => api.openApp("projects")}>
              {apps.projects.label}
            </TaskLink>
            <TaskLink icon={apps.terminal.icon} onClick={() => api.openApp("terminal")}>
              {apps.terminal.title}
            </TaskLink>
          </TaskPanel>
          <TaskPanel title={t.details}>
            <p className="font-bold">{sel?.label ?? apps.games.label}</p>
            <p>{sel ? sel.desc : t.games.count(GAMES.length)}</p>
          </TaskPanel>
        </TaskPane>

        <div
          className="grid min-w-0 flex-1 auto-rows-min content-start gap-1 overflow-auto bg-white p-2 [grid-template-columns:repeat(auto-fill,minmax(88px,1fr))]"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          role="list"
          aria-label={apps.games.label}
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
                aria-label={`${apps[id].label}: ${apps[id].desc}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={apps[id].icon} alt="" width={32} height={32} draggable={false} />
                <span className={`px-0.5 leading-tight ${isSel ? "bg-[var(--xp-select)] text-white" : ""}`}>{apps[id].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <StatusBar>
        <span className="flex-1">{sel ? sel.desc : t.objects(GAMES.length)}</span>
      </StatusBar>
    </div>
  );
}
