"use client";

import { useEffect, useRef, useState } from "react";
import { APPS } from "@/data/apps";
import type { UiStrings } from "@/data/ui";
import { PROFILE } from "@/data/profile";
import { PROJECTS, localizeProject, primaryLink, projectsFor } from "@/data/projects";
import type { Lang } from "@/lib/i18n";
import { blockIdle } from "@/lib/idle";
import { useLang, useStrings } from "@/lib/language";
import { BROWSER_HOME, hostOf, normalizeUrl } from "@/lib/text";
import type { WinState } from "@/lib/windowManager";
import { BackIcon, ForwardIcon, GoIcon, HomeIcon, NewWindowIcon, RefreshIcon, XpFlag } from "@/components/ui/glyphs";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { AddressBar, MenuBar, StatusBar, ToolButton, ToolSeparator, Toolbar } from "./ExplorerChrome";

const HOME = BROWSER_HOME;
const FRAMEABLE = PROJECTS.filter((p) => p.frameUrl);
const FRAMEABLE_URLS = new Set(FRAMEABLE.map((p) => p.frameUrl));

function pageTitle(url: string, t: UiStrings["ie"], lang: Lang): string {
  if (url === HOME) return t.homeTitle;
  const project = FRAMEABLE.find((p) => p.frameUrl && url.startsWith(p.frameUrl));
  return project ? localizeProject(project, lang).title : hostOf(url);
}

export default function InternetExplorer({ win }: { win: WinState }) {
  const { setTitle } = useDesktop();
  const lang = useLang();
  const strings = useStrings();
  const t = strings.ie;
  const [nav, setNav] = useState(() => ({ stack: [normalizeUrl(win.props.url)], index: 0 }));
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(nav.stack[0] !== HOME);
  const [reloadKey, setReloadKey] = useState(0);
  const releaseIdle = useRef<(() => void) | null>(null);

  const url = nav.stack[nav.index] ?? HOME;

  const go = (target: string) => {
    const next = normalizeUrl(target);
    setDraft(null);
    setNav((n) => (n.stack[n.index] === next ? n : { stack: [...n.stack.slice(0, n.index + 1), next], index: n.index + 1 }));
    setLoading(next !== HOME);
  };

  // Re-opened with a URL (from My Projects or the terminal)
  const lastNonce = useRef(win.nonce);
  useEffect(() => {
    if (win.nonce === lastNonce.current) return;
    lastNonce.current = win.nonce;
    if (win.props.url) {
      const next = normalizeUrl(win.props.url);
      setDraft(null);
      setNav((n) => ({ stack: [...n.stack.slice(0, n.index + 1), next], index: n.index + 1 }));
      setLoading(next !== HOME);
    }
  }, [win.nonce, win.props.url]);

  useEffect(() => {
    setTitle("ie", `${pageTitle(url, t, lang)} - Internet Explorer`);
  }, [url, t, lang, setTitle]);
  useEffect(
    () => () => {
      setTitle("ie", null);
      releaseIdle.current?.();
    },
    [setTitle],
  );

  const step = (delta: number) => {
    const index = Math.min(Math.max(0, nav.index + delta), nav.stack.length - 1);
    setDraft(null);
    setNav({ ...nav, index });
    setLoading((nav.stack[index] ?? HOME) !== HOME);
  };

  const showInfoBar = url !== HOME && !FRAMEABLE_URLS.has(url.replace(/\/$/, ""));

  return (
    <div className="flex h-full flex-col text-[11px]">
      <div className="flex items-stretch bg-[var(--xp-face)]">
        <div className="min-w-0 flex-1">
          <MenuBar items={strings.menus.explorer} />
        </div>
        <div className="grid w-[38px] shrink-0 place-items-center border-l border-[#d8d2bd] bg-white" aria-hidden="true">
          <XpFlag size={22} className={loading ? "animate-pulse" : ""} />
        </div>
      </div>
      <Toolbar>
        <ToolButton icon={<BackIcon disabled={nav.index === 0} />} label={strings.explorer.back} disabled={nav.index === 0} onClick={() => step(-1)} />
        <ToolButton icon={<ForwardIcon disabled={nav.index >= nav.stack.length - 1} />} label={strings.explorer.forward} showLabel={false} disabled={nav.index >= nav.stack.length - 1} onClick={() => step(1)} />
        <ToolButton
          icon={<RefreshIcon />}
          label={t.refresh}
          showLabel={false}
          onClick={() => {
            setReloadKey((k) => k + 1);
            setLoading(url !== HOME);
          }}
        />
        <ToolButton icon={<HomeIcon />} label={t.home} showLabel={false} onClick={() => go(HOME)} />
        <ToolSeparator />
        <ToolButton icon={<NewWindowIcon />} label={t.newWindow} disabled={url === HOME} onClick={() => window.open(url, "_blank", "noopener")} />
      </Toolbar>
      <AddressBar>
        <form
          className="flex min-w-0 flex-1 items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            go(draft ?? url);
          }}
        >
          <label className="flex min-w-0 flex-1 items-center gap-1 border border-[var(--xp-input-border)] bg-white pl-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={APPS.ie.icon} alt="" width={16} height={16} className="shrink-0" />
            <span className="sr-only">{strings.explorer.address}</span>
            <input
              className="min-w-0 flex-1 py-[3px] outline-none"
              value={draft ?? (url === HOME ? "about:home" : url)}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="url"
            />
          </label>
          <button type="submit" className="xp-tool !h-6 shrink-0" aria-label={t.go}>
            <GoIcon />
            <span className="hidden @md:inline">{t.go}</span>
          </button>
        </form>
      </AddressBar>
      <div className="xp-addressbar !gap-1 overflow-x-auto">
        <span className="shrink-0 text-[#6d6d6d]">{t.links}</span>
        <LinkButton onClick={() => go(HOME)}>{t.home}</LinkButton>
        {FRAMEABLE.map((p) => (
          <LinkButton key={p.id} onClick={() => go(p.frameUrl!)}>
            {localizeProject(p, lang).title}
          </LinkButton>
        ))}
        <LinkButton onClick={() => window.open(PROFILE.links.github, "_blank", "noopener")}>GitHub ↗</LinkButton>
      </div>

      {showInfoBar && (
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 border-b border-[#aca899] bg-[#ffffe1] px-2 py-1 text-left hover:bg-[#316ac5] hover:text-white"
          onClick={() => window.open(url, "_blank", "noopener")}
        >
          <span aria-hidden="true">ⓘ</span>
          {t.blocked}
        </button>
      )}

      <div
        className="relative min-h-0 flex-1 bg-white"
        onPointerEnter={() => {
          releaseIdle.current?.();
          releaseIdle.current = blockIdle();
        }}
        onPointerLeave={() => {
          releaseIdle.current?.();
          releaseIdle.current = null;
        }}
      >
        {url === HOME ? (
          <HomePage onOpen={go} />
        ) : (
          <iframe
            key={`${reloadKey}-${url}`}
            src={url}
            title={pageTitle(url, t, lang)}
            className="h-full w-full border-0"
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>

      <StatusBar>
        <span className="flex-1">{loading ? t.opening(url) : t.done}</span>
        <span className="flex w-[110px] items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/xp-icons/Earth (fixed).ico" alt="" width={14} height={14} />
          {t.zone}
        </span>
      </StatusBar>
    </div>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="xp-tool !h-5 shrink-0 !px-1.5 pointer-coarse:!h-9">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={APPS.ie.icon} alt="" width={12} height={12} />
      {children}
    </button>
  );
}

/** The built-in home page: an early-2000s personal homepage listing the live projects */
function HomePage({ onOpen }: { onOpen: (url: string) => void }) {
  const t = useStrings().ie;
  const projects = projectsFor(useLang());
  const framed = projects.filter((p) => p.frameUrl);
  const others = projects.filter((p) => !p.frameUrl && p.id !== "portfolio" && primaryLink(p)?.kind === "live");
  return (
    <div className="h-full overflow-y-auto bg-[#f3f6fc] font-[Verdana,Tahoma,sans-serif] text-[11px]">
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#0a3a9c] via-[#2d6ae0] to-[#8fb7f5] px-4 py-3 text-white">
        <XpFlag size={32} />
        <div>
          <h1 className="text-[18px] font-bold leading-tight">{t.homeTitle}</h1>
          <p className="text-white/85">{t.tagline}</p>
        </div>
      </div>
      <div className="mx-auto max-w-[720px] space-y-4 p-4">
        <p>
          {t.introStart} <strong>{t.openHere}</strong> {t.introEnd}
        </p>
        <div className="grid gap-3 @xl:grid-cols-2">
          {framed.map((p) => (
            <div key={p.id} className="border border-[#9db8e0] bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.icon} alt="" width={32} height={32} />
                <div>
                  <h2 className="font-bold text-[#0c32a8]">{p.title}</h2>
                  <p className="text-[#555]">{p.tagline}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                <button type="button" className="xp-button" onClick={() => onOpen(p.frameUrl!)}>
                  {t.openHere}
                </button>
                <a className="xp-button inline-flex items-center" href={p.frameUrl} target="_blank" rel="noopener noreferrer">
                  {t.newTab}
                </a>
              </div>
            </div>
          ))}
        </div>
        {others.length > 0 && (
          <div>
            <h2 className="mb-1 font-bold text-[#0c32a8]">{t.more}</h2>
            <p className="mb-1 text-[#555]">{t.moreNote}</p>
            <ul className="list-disc space-y-0.5 pl-5">
              {others.map((p) => {
                const link = primaryLink(p)!;
                return (
                  <li key={p.id}>
                    <a className="text-[#0000ee] underline visited:text-[#551a8b] pointer-coarse:inline-block pointer-coarse:py-2" href={link.href} target="_blank" rel="noopener noreferrer">
                      {p.title}
                    </a>{" "}
                    <span className="text-[#555]">({hostOf(link.href)})</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <p className="border-t border-[#c9d6ee] pt-2 text-center text-[10px] text-[#777]">
          {t.footer}
        </p>
      </div>
    </div>
  );
}
