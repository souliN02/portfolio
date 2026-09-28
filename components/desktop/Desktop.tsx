"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { FolderOpen, LayoutGrid, Link as LinkIcon, Mail, RefreshCw, Settings } from "lucide-react";
import { APPS, type AppId } from "@/data/apps";
import { appLink, parseDeepLink, type DeepLink } from "@/lib/deepLink";
import { useIdle } from "@/lib/idle";
import { sounds } from "@/lib/sounds";
import { readJson, readStorage, writeStorage } from "@/lib/storage";
import { isCompactViewport, isTouchDevice, prefersReducedMotion } from "@/lib/viewport";
import { initialWM, wmReducer, type Viewport, type WinState, type WindowProps } from "@/lib/windowManager";
import Menu, { type MenuItem } from "@/components/ui/Menu";
import BootScreen from "@/components/screens/BootScreen";
import WelcomeScreen, { type WelcomeMode } from "@/components/screens/WelcomeScreen";
import SafeToTurnOff from "@/components/screens/SafeToTurnOff";
import ProjectsExplorer from "@/components/windows/ProjectsExplorer";
import SystemProperties from "@/components/windows/SystemProperties";
import Notepad from "@/components/windows/Notepad";
import { DesktopContext, type DesktopApi } from "./DesktopContext";
import DesktopIcons, { defaultPositions, positionsFit, type Positions } from "./DesktopIcons";
import XpWindow from "./XpWindow";
import Taskbar from "./Taskbar";
import StartMenu from "./StartMenu";
import Balloon from "./Balloon";
import TurnOffDialog, { type TurnOffChoice } from "./TurnOffDialog";

/* Heavier or less-used windows load on first open */
const loading = () => <p className="p-3 text-[11px]">Loading...</p>;
const CvViewer = dynamic(() => import("@/components/windows/CvViewer"), { ssr: false, loading });
const OutlookCompose = dynamic(() => import("@/components/windows/OutlookCompose"), { ssr: false, loading });
const InternetExplorer = dynamic(() => import("@/components/windows/InternetExplorer"), { ssr: false, loading });
const Terminal = dynamic(() => import("@/components/windows/Terminal"), { ssr: false, loading });
const Minesweeper = dynamic(() => import("@/components/windows/Minesweeper"), { ssr: false, loading });
const GamesFolder = dynamic(() => import("@/components/windows/GamesFolder"), { ssr: false, loading });
const Solitaire = dynamic(() => import("@/components/windows/Solitaire"), { ssr: false, loading });
const SpiderSolitaire = dynamic(() => import("@/components/windows/SpiderSolitaire"), { ssr: false, loading });
const FreeCell = dynamic(() => import("@/components/windows/FreeCell"), { ssr: false, loading });
const Hearts = dynamic(() => import("@/components/windows/Hearts"), { ssr: false, loading });
const RecycleBin = dynamic(() => import("@/components/windows/RecycleBin"), { ssr: false, loading });
const Screensaver = dynamic(() => import("@/components/screens/Screensaver"), { ssr: false });

type Phase = "init" | "boot" | "welcome" | "desktop" | "off";

const SESSION_KEY = "xp_session";
const ICONS_KEY = "xp_icon_positions_v6";
const OLD_ICON_KEYS = ["xp_icon_positions", "xp_icon_positions_v2", "xp_icon_positions_v3", "xp_icon_positions_v4", "xp_icon_positions_v5"];
const IDLE_MS = 3 * 60 * 1000;

function WindowContent({ win }: { win: WinState }) {
  switch (win.id) {
    case "projects":
      return <ProjectsExplorer win={win} />;
    case "about":
      return <SystemProperties />;
    case "cv":
      return <CvViewer />;
    case "contact":
      return <OutlookCompose win={win} />;
    case "ie":
      return <InternetExplorer win={win} />;
    case "terminal":
      return <Terminal />;
    case "notepad":
      return <Notepad />;
    case "games":
      return <GamesFolder />;
    case "minesweeper":
      return <Minesweeper />;
    case "solitaire":
      return <Solitaire />;
    case "spider":
      return <SpiderSolitaire />;
    case "freecell":
      return <FreeCell />;
    case "hearts":
      return <Hearts />;
    case "recycle":
      return <RecycleBin />;
  }
}

export default function Desktop() {
  const [phase, setPhase] = useState<Phase>("init");
  const [welcomeMode, setWelcomeMode] = useState<WelcomeMode>("login");
  const [wm, dispatch] = useReducer(wmReducer, initialWM);
  const [titles, setTitles] = useState<Partial<Record<AppId, string>>>({});
  const [startOpen, setStartOpen] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [dialog, setDialog] = useState<"turnoff" | "logoff" | null>(null);
  const [balloon, setBalloon] = useState<"queued" | "shown" | null>(null);
  const [binEmpty, setBinEmpty] = useState(false);
  const [positions, setPositions] = useState<Positions | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<AppId | null>(null);
  const [touch, setTouch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingLink = useRef<DeepLink | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { idle, wake, sleep } = useIdle(IDLE_MS, phase === "desktop" && !dialog);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const getViewport = useCallback((): Viewport => {
    const el = containerRef.current;
    return { width: el?.clientWidth ?? window.innerWidth, height: el?.clientHeight ?? window.innerHeight };
  }, []);

  /* ─── First load: deep link > returning visitor > boot ─── */
  useEffect(() => {
    setTouch(isTouchDevice());
    OLD_ICON_KEYS.forEach((k) => writeStorage("local", k, null));
    const link = parseDeepLink(window.location.search);
    if (link) {
      pendingLink.current = link;
      setPhase("desktop");
    } else if (readStorage("session", SESSION_KEY)) {
      setPhase("desktop");
    } else {
      setPhase(prefersReducedMotion() ? "welcome" : "boot");
    }
  }, []);

  /* ─── Entering the desktop: lay out icons and open deep-linked windows ─── */
  useLayoutEffect(() => {
    if (phase !== "desktop") return;
    const vp = getViewport();
    const saved = readJson<Partial<Positions>>("local", ICONS_KEY);
    setPositions(saved && positionsFit(saved, vp) ? saved : defaultPositions(vp));
    const link = pendingLink.current;
    if (link) {
      pendingLink.current = null;
      writeStorage("session", SESSION_KEY, "1");
      for (const id of link.apps) {
        const props = id === "projects" && link.project ? { project: link.project } : undefined;
        dispatch({ type: "open", id, props, viewport: vp, compact: isCompactViewport() });
      }
    }
  }, [phase, getViewport]);

  /* ─── Browser resized or phone rotated: keep windows and icons reachable ─── */
  useEffect(() => {
    if (phase !== "desktop") return;
    const onResize = () => {
      const vp = getViewport();
      dispatch({ type: "fit", viewport: vp });
      // Prefer the saved layout whenever it fits again (e.g. after a phone keyboard closes)
      const saved = readJson<Partial<Positions>>("local", ICONS_KEY);
      setPositions((p) => (saved && positionsFit(saved, vp) ? saved : p && positionsFit(p, vp) ? p : defaultPositions(vp)));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [phase, getViewport]);

  /* ─── Welcome balloon, a moment after first arriving at the desktop ─── */
  useEffect(() => {
    if (phase !== "desktop" || balloon === null) return;
    if (balloon === "queued") {
      const t = setTimeout(() => {
        setBalloon("shown");
        sounds.notify();
      }, 1400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setBalloon(null), 15000);
    return () => clearTimeout(t);
  }, [phase, balloon]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStartOpen(false);
        setMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ─── Window actions ─── */
  const openApp = useCallback(
    (id: AppId, props?: WindowProps) => {
      setStartOpen(false);
      setMenu(null);
      sounds.open();
      dispatch({ type: "open", id, props, viewport: getViewport(), compact: isCompactViewport() });
    },
    [getViewport],
  );

  const closeApp = useCallback((id: AppId) => {
    sounds.close();
    dispatch({ type: "close", id });
  }, []);

  const setTitle = useCallback((id: AppId, title: string | null) => {
    setTitles((t) => (t[id] === (title ?? undefined) ? t : { ...t, [id]: title ?? undefined }));
  }, []);

  const requestTurnOff = useCallback(() => {
    setStartOpen(false);
    setDialog("turnoff");
  }, []);

  const emptyBin = useCallback(() => {
    sounds.emptyBin();
    setBinEmpty(true);
  }, []);

  // Read through a ref, so windows moving around doesn't re-render everything that uses the API
  const windowsRef = useRef(wm.windows);
  windowsRef.current = wm.windows;
  const getOpenApps = useCallback(() => windowsRef.current.map((w) => w.id), []);

  const api = useMemo<DesktopApi>(
    () => ({ openApp, closeApp, setTitle, requestTurnOff, getOpenApps, binEmpty, emptyBin, touch }),
    [openApp, closeApp, setTitle, requestTurnOff, getOpenApps, binEmpty, emptyBin, touch],
  );

  /* ─── Session: log on, log off, shut down ─── */
  const login = () => {
    sounds.startup();
    writeStorage("session", SESSION_KEY, "1");
    setWelcomeMode("welcome");
    later(() => {
      setPhase("desktop");
      setWelcomeMode("login");
      setBalloon("queued");
    }, 900);
  };

  const leaveDesktop = (mode: WelcomeMode, then: Phase, ms: number) => {
    sounds.logoff();
    dispatch({ type: "closeAll" });
    setTitles({});
    setStartOpen(false);
    setBalloon(null);
    setWelcomeMode(mode);
    setPhase("welcome");
    later(() => {
      setWelcomeMode("login");
      setPhase(then);
    }, ms);
  };

  const onTurnOffChoice = (choice: TurnOffChoice) => {
    setDialog(null);
    if (choice === "standby") sleep();
    else if (choice === "turnoff" || choice === "restart") {
      writeStorage("session", SESSION_KEY, null);
      leaveDesktop("shuttingDown", choice === "turnoff" ? "off" : "boot", 2000);
    } else leaveDesktop("loggingOff", "welcome", 1500);
  };

  /* ─── Desktop background: right-click, or long-press on touch screens ─── */
  const arrangeIcons = () => {
    const next = defaultPositions(getViewport());
    setPositions(next);
    writeStorage("local", ICONS_KEY, JSON.stringify(next));
  };

  const copyLink = (id: AppId) => {
    navigator.clipboard?.writeText(appLink(window.location.origin, id)).catch(() => {});
  };

  const desktopMenu: MenuItem[] = [
    { label: "Arrange Icons", icon: LayoutGrid, onClick: arrangeIcons },
    { label: "Refresh", icon: RefreshCw, onClick: () => {} },
    { separator: true },
    { label: "Open My Projects", icon: FolderOpen, onClick: () => openApp("projects") },
    { label: "Contact", icon: Mail, onClick: () => openApp("contact") },
    { separator: true },
    { label: "Properties", icon: Settings, onClick: () => openApp("about") },
  ];

  const iconMenu = (id: AppId): MenuItem[] => [
    { label: "Open", bold: true, onClick: () => openApp(id) },
    ...(id === "recycle" ? [{ label: "Empty Recycle Bin", disabled: binEmpty, onClick: emptyBin }] : []),
    { separator: true },
    { label: "Copy link", icon: LinkIcon, onClick: () => copyLink(id) },
  ];

  const openMenuAt = (clientX: number, clientY: number, items: MenuItem[]) => {
    const rect = containerRef.current?.getBoundingClientRect();
    setStartOpen(false);
    setMenu({ x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0), items });
  };

  const longPress = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const cancelLongPress = () => {
    if (longPress.current) clearTimeout(longPress.current.timer);
    longPress.current = null;
  };
  const onBackgroundPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    setSelectedIcon(null);
    setStartOpen(false);
    setMenu(null);
    if (e.pointerType === "mouse") return;
    const { clientX, clientY } = e;
    cancelLongPress();
    longPress.current = { x: clientX, y: clientY, timer: setTimeout(() => openMenuAt(clientX, clientY, desktopMenu), 500) };
  };

  /* ─── Render ─── */
  if (phase === "init") return <div className="h-dvh w-screen bg-black" />;
  if (phase === "boot") return <BootScreen onFinished={() => setPhase("welcome")} />;
  if (phase === "welcome") return <WelcomeScreen mode={welcomeMode} onLogin={login} onTurnOff={() => setPhase("off")} />;
  if (phase === "off") return <SafeToTurnOff onPowerOn={() => setPhase("boot")} />;

  const viewport = containerRef.current ? getViewport() : { width: 0, height: 0 };

  return (
    <DesktopContext.Provider value={api}>
      <div ref={containerRef} className="relative h-dvh w-screen touch-manipulation overflow-hidden bg-[#3a6ea5] bg-[url('/xp-wallpaper.jpg')] bg-cover bg-center">
        <div className={`absolute inset-0 ${dialog ? "xp-desaturate" : ""}`}>
          {/* Icons */}
          <div
            className="absolute inset-0 select-none"
            onPointerDown={onBackgroundPointerDown}
            onPointerMove={(e) => {
              const lp = longPress.current;
              if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) cancelLongPress();
            }}
            onPointerUp={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onContextMenu={(e) => {
              e.preventDefault();
              if (e.target === e.currentTarget) openMenuAt(e.clientX, e.clientY, desktopMenu);
            }}
          >
            {positions && (
              <DesktopIcons
                positions={positions}
                selected={selectedIcon}
                binEmpty={binEmpty}
                onPositions={(next, persist) => {
                  setPositions(next);
                  if (persist) writeStorage("local", ICONS_KEY, JSON.stringify(next));
                }}
                onSelect={(id) => {
                  setSelectedIcon(id);
                  setStartOpen(false);
                  setMenu(null);
                }}
                onOpen={openApp}
                onMenu={(id, x, y) => openMenuAt(x, y, iconMenu(id))}
              />
            )}
          </div>

          {/* Windows get their own stacking context, so however high their z-index climbs they stay under the taskbar */}
          <div className="pointer-events-none absolute inset-0 isolate z-10 [&>*]:pointer-events-auto">
            {wm.windows.map((w) => (
              <XpWindow
                key={w.id}
                win={w}
                title={titles[w.id] ?? APPS[w.id].title}
                active={wm.activeId === w.id}
                getViewport={getViewport}
                dispatch={dispatch}
                onClose={() => closeApp(w.id)}
                onMinimize={() => {
                  sounds.minimize();
                  dispatch({ type: "minimize", id: w.id });
                }}
                onToggleMax={() => dispatch({ type: "toggleMax", id: w.id })}
                onHelp={() => openApp("notepad")}
              >
                <WindowContent win={w} />
              </XpWindow>
            ))}
          </div>

          {startOpen && (
            <StartMenu
              onOpen={openApp}
              onClose={() => setStartOpen(false)}
              onLogOff={() => {
                setStartOpen(false);
                setDialog("logoff");
              }}
              onTurnOff={requestTurnOff}
            />
          )}

          <Taskbar
            windows={wm.windows}
            activeId={wm.activeId}
            titles={titles}
            startOpen={startOpen}
            onStart={() => {
              sounds.click();
              setMenu(null);
              setStartOpen((o) => !o);
            }}
            onTask={(id) => {
              sounds.click();
              dispatch({ type: "taskbarClick", id });
            }}
            onLaunch={openApp}
            onShowDesktop={() => {
              sounds.minimize();
              dispatch({ type: "minimizeAll" });
            }}
            balloon={
              balloon === "shown" && !startOpen ? (
                <Balloon
                  title="Welcome to Bekir's portfolio"
                  text={`${touch ? "Tap" : "Double-click"} My Projects to see my work, or Contact to send me an e-mail.`}
                  onClick={() => {
                    setBalloon(null);
                    openApp("projects");
                  }}
                  onClose={() => setBalloon(null)}
                />
              ) : null
            }
          />

          {menu && <Menu x={menu.x} y={menu.y} items={menu.items} bounds={viewport} onClose={() => setMenu(null)} />}
        </div>

        {dialog && <TurnOffDialog kind={dialog} onChoose={onTurnOffChoice} onCancel={() => setDialog(null)} />}
        {idle && <Screensaver onWake={wake} />}
      </div>
    </DesktopContext.Provider>
  );
}
