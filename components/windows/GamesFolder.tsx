"use client";

import { useState } from "react";
import { appsFor, gameList, webGameUrl, type GameEntry } from "@/data/apps";
import { useLang, useStrings } from "@/lib/language";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { AddressBar, MenuBar, StatusBar, TaskLink, TaskPane, TaskPanel } from "./ExplorerChrome";

/** XP kept its games in Start > All Programs > Games; here they live in a folder on the desktop, with Ordet among them */
export default function GamesFolder() {
  const api = useDesktop();
  const [selected, setSelected] = useState<string | null>(null);
  const t = useStrings();
  const lang = useLang();
  const apps = appsFor(lang);
  const games = gameList(lang);
  const sel = games.find((g) => g.id === selected) ?? null;

  // XP's games open a window; a web game opens its own site in a new tab
  const play = (game: GameEntry) => {
    if (game.web) window.open(webGameUrl(game.web, lang), "_blank", "noopener,noreferrer");
    else if (game.app) api.openApp(game.app);
  };
  const describe = (game: GameEntry) => (game.web ? `${game.desc}. ${t.games.newTab}` : game.desc);

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
            {sel ? (
              <TaskLink icon={sel.icon} onClick={() => play(sel)}>
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
            <p>{sel ? describe(sel) : t.games.count(games.length)}</p>
          </TaskPanel>
        </TaskPane>

        <div
          className="grid min-w-0 flex-1 auto-rows-min content-start gap-1 overflow-auto bg-white p-2 [grid-template-columns:repeat(auto-fill,minmax(88px,1fr))]"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          role="list"
          aria-label={apps.games.label}
        >
          {games.map((game) => {
            const isSel = selected === game.id;
            return (
              <button
                key={game.id}
                type="button"
                role="listitem"
                className="flex flex-col items-center gap-1 rounded-sm p-1.5 text-center outline-none focus-visible:outline-1 focus-visible:outline-dotted pointer-coarse:py-3"
                // Touch screens open on a tap, as on the desktop; a mouse selects, then double-clicks
                onClick={() => (api.touch ? play(game) : setSelected(game.id))}
                onDoubleClick={() => play(game)}
                onFocus={() => setSelected(game.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    play(game);
                  }
                }}
                aria-label={`${game.label}: ${describe(game)}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={game.icon} alt="" width={32} height={32} draggable={false} />
                <span className={`px-0.5 leading-tight ${isSel ? "bg-[var(--xp-select)] text-white" : ""}`}>{game.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <StatusBar>
        <span className="flex-1">{sel ? describe(sel) : t.objects(games.length)}</span>
      </StatusBar>
    </div>
  );
}
