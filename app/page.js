"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  Link as LinkIcon,
  Award,
  Briefcase,
  Code2,
  BookOpen,
  Rocket,
  Activity,
  Sparkles,
  Globe,
  Power,
  LogOut,
  Volume2,
  Wifi,
  RefreshCw,
  LayoutGrid,
  Star,
} from "lucide-react";
import BootScreen from "./components/BootScreen";
import TerminalWindow from "./components/TerminalWindow";
import MinesweeperWindow from "./components/MinesweeperWindow";

/* ─── XP Icon paths (authentic .ico files in /xp-icons/) ─── */

const XP_ICONS = {
  cv: "/xp-icons/My Profile Folder.ico",
  projects: "/xp-icons/My Computer.ico",
  about: "/xp-icons/User 1.ico",
  contact: "/xp-icons/Phone.ico",
  terminal: "/xp-icons/System Properties.ico",
  notepad: "/xp-icons/List File.ico",
  minesweeper: "/xp-icons/Minesweeper.ico",
};

/* Small Windows flag for Start button */
function XpFlagSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 100 100" fill="none" className="inline-block mr-1">
      <path d="M2 2 C20 8, 35 2, 46 2 L46 46 C35 46, 20 40, 2 46 Z" fill="#FF0000" />
      <path d="M54 2 C65 2, 80 8, 98 2 L98 46 C80 40, 65 46, 54 46 Z" fill="#00B300" />
      <path d="M2 54 C20 60, 35 54, 46 54 L46 98 C35 98, 20 92, 2 98 Z" fill="#0058E6" />
      <path d="M54 54 C65 54, 80 60, 98 54 L98 98 C80 92, 65 98, 54 98 Z" fill="#FFB900" />
    </svg>
  );
}

/* GitHub mark (lucide's Github icon is deprecated) */
function GitHubMark({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.05.78 2.12 0 1.53-.01 2.77-.01 3.15 0 .31.21.67.8.56C20.71 21.38 24 17.07 24 12 24 5.73 18.77.5 12 .5Z" />
    </svg>
  );
}

/* ─── Sound Manager (Web Audio API) ─── */

function createSoundManager() {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx?.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function playClick() {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.06);
  }

  function playOpen() {
    const c = getCtx();
    if (!c) return;
    // Two-tone ascending "ding" like Windows navigation
    [400, 600].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = "sine";
      const t = c.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  function playClose() {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(500, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.1);
    gain.gain.setValueAtTime(0.06, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.12);
  }

  function playMinimize() {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, c.currentTime + 0.08);
    gain.gain.setValueAtTime(0.05, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.1);
  }

  return { playClick, playOpen, playClose, playMinimize };
}

/* ─── Constants ─── */

const ICON_SIZE = { w: 80, h: 100 };
const GRID = 20;

/* ─── App registry: one entry per launchable window ─── */

const APPS = {
  cv: { title: "Bekir's CV", icon: XP_ICONS.cv, w: 720, h: 540 },
  projects: { title: "My Projects", icon: XP_ICONS.projects, w: 740, h: 560 },
  about: { title: "About Me", icon: XP_ICONS.about, w: 700, h: 580 },
  contact: { title: "Contact", icon: XP_ICONS.contact, w: 660, h: 460 },
  terminal: { title: "Terminal", icon: XP_ICONS.terminal, w: 660, h: 440 },
  notepad: { title: "readme.txt - Notepad", icon: XP_ICONS.notepad, w: 560, h: 460 },
  minesweeper: { title: "Minesweeper", icon: XP_ICONS.minesweeper, w: 380, h: 460 },
};

/* ─── Desktop icons (subset of apps shown on the desktop) ─── */

const desktopIcons = [
  { id: "cv", name: "Bekir's CV" },
  { id: "projects", name: "My Projects" },
  { id: "about", name: "About Me" },
  { id: "contact", name: "Contact" },
  { id: "terminal", name: "Terminal" },
  { id: "notepad", name: "readme.txt" },
  { id: "minesweeper", name: "Minesweeper" },
];

function getDefaultIconPositions() {
  const startX = 20, startY = 16, spacingY = 100;
  const defaults = {};
  desktopIcons.forEach((ic, i) => {
    defaults[ic.id] = { x: startX, y: startY + i * spacingY };
  });
  return defaults;
}

/* ─── Clock hook ─── */

function useClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const iv = setInterval(update, 15000);
    return () => clearInterval(iv);
  }, []);
  const time = now
    ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "";
  const date = now
    ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "";
  return { time, date };
}

/* ═════════════════════════════════════════════
   Main desktop shell
   ═════════════════════════════════════════════ */

export default function XpPortfolio() {
  // Boot screen
  const [booted, setBooted] = useState(false);

  // Multi-window state: array of { id, type, title, x, y, w, h, z, min, max, prev }
  const [windows, setWindows] = useState([]);
  const zTop = useRef(10);
  const [activeId, setActiveId] = useState(null);

  // Shell UI
  const [startOpen, setStartOpen] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y }

  // Icons
  const [iconPositions, setIconPositions] = useState(getDefaultIconPositions());
  const [selectedIcon, setSelectedIcon] = useState(null);
  const iconPosRef = useRef(getDefaultIconPositions());

  // Audio
  const audioRef = useRef(null);
  const [bootPlayed, setBootPlayed] = useState(false);
  const soundsRef = useRef(null);

  // Refs
  const containerRef = useRef(null);

  // Clock
  const { time: clockTime, date: clockDate } = useClock();

  // Init sound manager
  useEffect(() => {
    soundsRef.current = createSoundManager();
  }, []);

  // Load saved icon positions (versioned key so layout resets when icons change)
  const STORAGE_KEY = "xp_icon_positions_v4";
  useEffect(() => {
    try {
      localStorage.removeItem("xp_icon_positions");
      localStorage.removeItem("xp_icon_positions_v2");
      localStorage.removeItem("xp_icon_positions_v3");
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const allPresent = desktopIcons.every((ic) => parsed[ic.id]);
        if (allPresent) {
          setIconPositions(parsed);
          iconPosRef.current = parsed;
        }
      }
    } catch {}
  }, []);

  // Boot sound
  useEffect(() => {
    audioRef.current = new Audio("/xp-boot.mp3");
    audioRef.current.preload = "auto";
  }, []);

  const onBootFinished = useCallback(() => {
    setBooted(true);
    if (!bootPlayed && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setBootPlayed(true);
    }
  }, [bootPlayed]);

  const saveIconPositions = (positions) => {
    iconPosRef.current = positions;
    setIconPositions(positions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch {}
  };

  /* ─── Window manager ─── */

  const focusWindow = useCallback((id) => {
    zTop.current += 1;
    const z = zTop.current;
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, z, min: false } : w)));
    setActiveId(id);
  }, []);

  const openApp = useCallback(
    (type) => {
      setStartOpen(false);
      setCtxMenu(null);
      const meta = APPS[type];
      if (!meta) return;
      soundsRef.current?.playOpen();

      setWindows((prev) => {
        const existing = prev.find((w) => w.type === type);
        zTop.current += 1;
        const z = zTop.current;
        if (existing) {
          setActiveId(existing.id);
          return prev.map((w) => (w.id === type ? { ...w, z, min: false } : w));
        }
        // Cascade new windows so they don't perfectly overlap
        const offset = (prev.length % 6) * 26;
        const rect = containerRef.current?.getBoundingClientRect();
        const maxX = (rect?.width ?? 1200) - meta.w - 20;
        const maxY = (rect?.height ?? 700) - meta.h - 60;
        const x = Math.max(12, Math.min(80 + offset, Math.max(12, maxX)));
        const y = Math.max(12, Math.min(48 + offset, Math.max(12, maxY)));
        setActiveId(type);
        return [
          ...prev,
          { id: type, type, title: meta.title, x, y, w: meta.w, h: meta.h, z, min: false, max: false, prev: null },
        ];
      });
    },
    []
  );

  const closeWindow = useCallback((id) => {
    soundsRef.current?.playClose();
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const minimizeWindow = useCallback((id) => {
    soundsRef.current?.playMinimize();
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, min: true } : w)));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const toggleMaximize = useCallback((id) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (!w.max) {
          const rect = containerRef.current?.getBoundingClientRect();
          return {
            ...w,
            max: true,
            prev: { x: w.x, y: w.y, w: w.w, h: w.h },
            x: 0,
            y: 0,
            w: Math.round(rect?.width ?? window.innerWidth),
            h: Math.round((rect?.height ?? window.innerHeight) - 30),
          };
        }
        const p = w.prev || { x: 80, y: 48, w: APPS[w.type].w, h: APPS[w.type].h };
        return { ...w, max: false, prev: null, ...p };
      })
    );
  }, []);

  const taskbarClick = useCallback(
    (w) => {
      soundsRef.current?.playClick();
      if (activeId === w.id && !w.min) {
        minimizeWindow(w.id);
      } else {
        focusWindow(w.id);
      }
    },
    [activeId, focusWindow, minimizeWindow]
  );

  /* ─── Icon dragging ─── */
  const dragStateRef = useRef({ id: null, startX: 0, startY: 0, orig: { x: 0, y: 0 }, moved: false });

  const onIconMouseDown = (e, id) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setSelectedIcon(id);
    setStartOpen(false);
    setCtxMenu(null);
    soundsRef.current?.playClick();
    const pos = iconPositions[id] || { x: 20, y: 20 };
    dragStateRef.current = { id, startX: e.clientX, startY: e.clientY, orig: { ...pos }, moved: false };
    document.addEventListener("mousemove", onIconMouseMove);
    document.addEventListener("mouseup", onIconMouseUp, { once: true });
  };
  const onIconMouseMove = (e) => {
    const { id, startX, startY, orig } = dragStateRef.current;
    if (!id) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragStateRef.current.moved = true;
    const rawX = orig.x + dx;
    const rawY = orig.y + dy;
    const nx = e.altKey ? rawX : Math.round(rawX / GRID) * GRID;
    const ny = e.altKey ? rawY : Math.round(rawY / GRID) * GRID;
    setIconPositions((prev) => {
      const next = { ...prev, [id]: { x: nx, y: ny } };
      iconPosRef.current = next;
      return next;
    });
  };
  const onIconMouseUp = () => {
    const { id, moved } = dragStateRef.current;
    if (id && moved) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(iconPosRef.current)); } catch {}
    }
    dragStateRef.current = { id: null, startX: 0, startY: 0, orig: { x: 0, y: 0 }, moved: false };
    document.removeEventListener("mousemove", onIconMouseMove);
  };

  /* ─── Window move/resize (per window) ─── */
  const onTitleMouseDown = (e, w) => {
    focusWindow(w.id);
    if (w.max) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { x: w.x, y: w.y };
    const onMove = (me) => {
      const nx = startPos.x + (me.clientX - startX);
      const ny = startPos.y + (me.clientY - startY);
      setWindows((prev) => prev.map((win) => (win.id === w.id ? { ...win, x: nx, y: Math.max(0, ny) } : win)));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const onResizeMouseDown = (e, w) => {
    e.stopPropagation();
    focusWindow(w.id);
    if (w.max) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = { w: w.w, h: w.h };
    const onMove = (me) => {
      const nw = Math.max(360, startSize.w + (me.clientX - startX));
      const nh = Math.max(260, startSize.h + (me.clientY - startY));
      setWindows((prev) => prev.map((win) => (win.id === w.id ? { ...win, w: nw, h: nh } : win)));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  /* ─── Open via desktop icon double-click ─── */
  const handleDoubleClick = (id) => {
    if (dragStateRef.current.moved) return;
    openApp(id);
  };

  // Desktop background interactions
  const onDesktopMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedIcon(null);
      setStartOpen(false);
      setCtxMenu(null);
    }
  };
  const onDesktopContext = (e) => {
    e.preventDefault();
    setStartOpen(false);
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left ?? 0);
    const y = e.clientY - (rect?.top ?? 0);
    setCtxMenu({ x, y });
  };

  const arrangeIcons = () => {
    saveIconPositions(getDefaultIconPositions());
    setCtxMenu(null);
    soundsRef.current?.playClick();
  };

  /* ─── Render a window's content ─── */
  function renderWindowContent(type) {
    switch (type) {
      case "cv": return <CVWindow />;
      case "projects": return <ProjectsWindow />;
      case "about": return <AboutWindow />;
      case "contact": return <ContactWindow />;
      case "terminal": return <TerminalWindow onRequestClose={() => closeWindow("terminal")} onOpenApp={(t) => openApp(t)} />;
      case "notepad": return <NotepadWindow />;
      case "minesweeper": return <MinesweeperWindow />;
      default: return null;
    }
  }

  /* ─── Boot screen ─── */
  if (!booted) {
    return <BootScreen onFinished={onBootFinished} />;
  }

  // Start menu launch list (left column)
  const startApps = [
    { id: "projects", name: "My Projects", desc: "Featured & current work" },
    { id: "about", name: "About Me", desc: "Bio, skills, experience" },
    { id: "cv", name: "Bekir's CV", desc: "Open résumé (PDF)" },
    { id: "contact", name: "Contact", desc: "Email, phone, links" },
    { id: "terminal", name: "Terminal", desc: "Command line" },
    { id: "notepad", name: "readme.txt", desc: "Welcome note" },
    { id: "minesweeper", name: "Minesweeper", desc: "Take a break" },
  ];

  return (
    <div
      ref={containerRef}
      suppressHydrationWarning
      className="relative w-screen h-screen bg-[url('/xp-wallpaper.jpg')] bg-cover bg-center overflow-hidden select-none"
      style={{ fontFamily: "Tahoma, Arial, Helvetica, sans-serif" }}
    >
      {/* ─── Desktop icons ─── */}
      <div
        className="absolute inset-0"
        onMouseDown={onDesktopMouseDown}
        onContextMenu={onDesktopContext}
      >
        {desktopIcons.map((icon) => {
          const pos = iconPositions[icon.id] || { x: 20, y: 20 };
          const isSelected = selectedIcon === icon.id;
          return (
            <div
              key={icon.id}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${ICON_SIZE.w}px`,
                transition: "left 60ms linear, top 60ms linear",
              }}
              onMouseDown={(e) => onIconMouseDown(e, icon.id)}
              onDoubleClick={() => handleDoubleClick(icon.id)}
              className="absolute flex flex-col items-center cursor-pointer group"
            >
              <div
                className={`p-1 rounded ${
                  isSelected ? "bg-blue-600/40 ring-1 ring-blue-400/60" : "bg-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={APPS[icon.id].icon} alt={icon.name} width={40} height={40} style={{ width: 40, height: 40 }} draggable={false} />
              </div>
              <span
                className={`text-[11px] text-center mt-0.5 px-1 leading-tight xp-icon-label ${
                  isSelected ? "bg-blue-600/70 text-white" : "text-white"
                }`}
                style={{ maxWidth: "78px", wordBreak: "break-word" }}
              >
                {icon.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── Desktop right-click context menu ─── */}
      {ctxMenu && (
        <div
          className="absolute z-40 xp-ctxmenu text-[11px] text-black py-1"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <CtxItem icon={LayoutGrid} onClick={arrangeIcons}>Arrange Icons (reset)</CtxItem>
          <CtxItem icon={RefreshCw} onClick={() => setCtxMenu(null)}>Refresh</CtxItem>
          <div className="xp-ctx-sep" />
          <CtxItem icon={Code2} onClick={() => openApp("projects")}>Open My Projects</CtxItem>
          <CtxItem icon={BookOpen} onClick={() => openApp("about")}>Properties (About)</CtxItem>
        </div>
      )}

      {/* ─── Windows ─── */}
      {windows.map((w) => {
        if (w.min) return null;
        const isActive = activeId === w.id;
        return (
          <div
            key={w.id}
            style={{ top: w.y, left: w.x, width: w.w, height: w.h, zIndex: w.z }}
            className={`absolute flex flex-col xp-window animate-winOpen ${w.max ? "rounded-none" : "rounded-t-lg"}`}
            onMouseDown={() => focusWindow(w.id)}
          >
            {/* Title bar */}
            <div
              onMouseDown={(e) => onTitleMouseDown(e, w)}
              onDoubleClick={() => toggleMaximize(w.id)}
              className={`${isActive ? "xp-titlebar" : "xp-titlebar-inactive"} text-white pl-2 pr-1.5 py-[3px] font-bold flex items-center justify-between cursor-move select-none text-[12px] ${
                w.max ? "" : "rounded-t-lg"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate pr-2 drop-shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={APPS[w.type].icon} alt="" width={16} height={16} className="shrink-0" draggable={false} />
                <span className="truncate">{w.title}</span>
              </span>
              <div className="flex items-center gap-[2px]">
                <button
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(w.id); }}
                  className="xp-tbtn"
                  title="Minimize"
                >
                  <span className="leading-none mb-[3px]">_</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(w.id); }}
                  className="xp-tbtn"
                  title={w.max ? "Restore" : "Maximize"}
                >
                  {w.max ? "❐" : "□"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); closeWindow(w.id); }}
                  className="xp-tbtn xp-tbtn-close ml-[2px]"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Window body */}
            <div className="bg-[#ECE9D8] flex-grow overflow-hidden border-x-[3px] border-b-[3px] border-[#0054E3] flex flex-col">
              {w.type === "terminal" || w.type === "notepad" ? (
                <div className="h-full overflow-hidden">{renderWindowContent(w.type)}</div>
              ) : (
                <div className="p-3 h-full overflow-auto">{renderWindowContent(w.type)}</div>
              )}
            </div>

            {/* Resize handle */}
            {!w.max && (
              <div
                onMouseDown={(e) => onResizeMouseDown(e, w)}
                className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize"
                title="Resize"
              >
                <svg width="16" height="16" className="absolute right-0 bottom-0 opacity-50">
                  <path d="M14 16 L16 16 L16 14 Z" fill="#666" />
                  <path d="M10 16 L16 16 L16 10 Z" fill="#999" />
                  <path d="M6 16 L16 16 L16 6 Z" fill="#CCC" />
                </svg>
              </div>
            )}
          </div>
        );
      })}

      {/* ─── Start menu ─── */}
      {startOpen && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setStartOpen(false)} />
          <div className="absolute bottom-[30px] left-0 z-50 w-[320px] xp-startmenu animate-startOpen text-black">
            {/* Header */}
            <div className="xp-startmenu-header flex items-center gap-2 px-3 py-2 text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={XP_ICONS.about} alt="" width={36} height={36} className="rounded ring-1 ring-white/40" draggable={false} />
              <div className="leading-tight">
                <p className="font-bold text-[14px] drop-shadow">Bekir Saliv</p>
                <p className="text-[10px] text-white/80">Full-stack Developer</p>
              </div>
            </div>

            {/* Body: two columns */}
            <div className="flex">
              <div className="w-[58%] bg-white py-1">
                {startApps.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openApp(a.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-[#2F71CD] hover:text-white group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={APPS[a.id].icon} alt="" width={26} height={26} className="shrink-0" draggable={false} />
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold truncate">{a.name}</span>
                      <span className="block text-[10px] text-gray-500 group-hover:text-white/80 truncate">{a.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="w-[42%] xp-startmenu-right py-1">
                <StartLink icon={Globe} href="https://portfolio-bekir.vercel.app">Portfolio</StartLink>
                <StartLink icon={GitHubMark} href="https://github.com/souliN02">GitHub</StartLink>
                <StartLink icon={LinkIcon} href="https://www.linkedin.com/in/bekirsaliv02/">LinkedIn</StartLink>
                <div className="xp-start-sep" />
                <StartLink icon={Star} href="https://nordeskcrm.com">Nordesk CRM</StartLink>
                <StartLink icon={Award} href="/Bekir_CV.pdf">Open CV (PDF)</StartLink>
              </div>
            </div>

            {/* Footer */}
            <div className="xp-startmenu-footer flex items-center justify-end gap-3 px-3 py-1.5 text-white text-[11px]">
              <button className="flex items-center gap-1 hover:underline" onClick={() => setStartOpen(false)}>
                <LogOut className="w-4 h-4" /> Log Off
              </button>
              <button
                className="flex items-center gap-1 hover:underline"
                onClick={() => { setStartOpen(false); setBooted(false); setWindows([]); }}
              >
                <Power className="w-4 h-4" /> Turn Off
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── XP Taskbar ─── */}
      <div className="absolute bottom-0 left-0 w-full h-[30px] xp-taskbar flex items-center text-white text-[11px] shadow-[0_-1px_4px_rgba(0,0,0,0.4)] z-30">
        {/* Start button */}
        <button
          className={`xp-start-btn flex items-center h-full font-bold text-white text-[12px] tracking-wide ${startOpen ? "xp-start-btn-active" : ""}`}
          onClick={() => { soundsRef.current?.playClick(); setStartOpen((s) => !s); setCtxMenu(null); }}
        >
          <XpFlagSmall />
          <span className="italic">start</span>
        </button>

        <div className="w-px h-5 bg-white/20 mx-1" />

        {/* Open windows */}
        <div className="flex-grow flex items-center gap-1 px-1 overflow-x-auto overflow-y-hidden xp-taskbar-apps">
          {windows.map((w) => {
            const isActive = activeId === w.id && !w.min;
            return (
              <button
                key={w.id}
                onClick={() => taskbarClick(w)}
                className={`flex items-center gap-1.5 px-2 h-[24px] rounded-sm text-left truncate min-w-[120px] max-w-[170px] text-[11px] transition ${
                  isActive ? "xp-taskbtn-active" : "xp-taskbtn"
                }`}
                title={w.title}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={APPS[w.type].icon} alt="" width={16} height={16} className="shrink-0" draggable={false} />
                <span className="truncate">{w.title}</span>
              </button>
            );
          })}
        </div>

        {/* System tray */}
        <div className="xp-systray flex items-center gap-2.5 h-full px-2.5 text-[11px]" title={clockDate}>
          <Wifi className="w-3.5 h-3.5 text-white/90" />
          <Volume2 className="w-3.5 h-3.5 text-white/90" />
          <span className="text-white/95 tabular-nums">{clockTime}</span>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   Small shell helpers
   ═════════════════════════════════════════════ */

function CtxItem({ icon: Icon, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1 text-left hover:bg-[#2F71CD] hover:text-white"
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{children}</span>
    </button>
  );
}

function StartLink({ icon: Icon, href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] font-semibold hover:bg-[#2F71CD] hover:text-white"
    >
      {Icon && <Icon className="w-4 h-4 text-blue-800 shrink-0" />}
      <span className="truncate">{children}</span>
    </a>
  );
}

/* ═════════════════════════════════════════════
   Shared UI components
   ═════════════════════════════════════════════ */

function Bevel({ children, className = "" }) {
  return (
    <div
      className={[
        "border",
        "border-b-gray-400 border-r-gray-400",
        "border-t-white border-l-white",
        "bg-white",
        "shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, color = "blue", children }) {
  const colorMap = {
    blue: "from-[#0054E3] to-[#2E8AEF] border-blue-300",
    green: "from-[#1F883D] to-[#3FB950] border-green-300",
    purple: "from-[#6B21A8] to-[#9333EA] border-purple-300",
  };
  const colors = colorMap[color] || colorMap.blue;
  return (
    <div className="mb-3">
      <div className={`text-white text-[11px] font-bold px-3 py-1 bg-gradient-to-r ${colors}`}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-white" />}
          <span>{children}</span>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   Window content components
   ═════════════════════════════════════════════ */

function CVWindow() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="bg-[#ECE9D8] border-b border-gray-300 px-2 py-1 text-[11px] text-gray-700">
        Document Viewer - Bekir_CV.pdf
      </div>
      <div className="flex-grow overflow-auto bg-white">
        <iframe src="/Bekir_CV.pdf" title="Bekir's CV" className="w-full h-full border-none" />
      </div>
    </div>
  );
}

/* ─── Projects ─── */

const PROJECT_GROUPS = [
  { key: "creativeground", label: "Fleeca, formerly CreativeGround (Professional)", color: "from-[#0054E3] to-[#2E8AEF]" },
  { key: "building", label: "Currently building", color: "from-[#1F883D] to-[#3FB950]" },
  { key: "personal", label: "Personal projects", color: "from-[#6B21A8] to-[#9333EA]" },
];

const PROJECTS = [
  {
    id: "nordesk",
    group: "creativeground",
    title: "Nordesk CRM",
    period: "2025",
    accent: "from-blue-600 to-indigo-600",
    icon: Briefcase,
    badges: [{ label: "Flagship", cls: "bg-amber-500 text-black" }, { label: "Production", cls: "bg-green-600 text-white" }],
    summary: "A custom CRM I built end to end, solo, at Fleeca (formerly CreativeGround). Shipped to production with Claude as my primary development partner.",
    details: [
      "Owned the whole build: scoping, UI implementation, server-side logic, and deployment.",
      "Complex UI workflows: forms, tables, filters, and frontend state management.",
      "A real example of AI-assisted development shipping production software, with me owning the quality of what shipped.",
    ],
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "REST APIs"],
    links: [{ label: "nordeskcrm.com", href: "https://nordeskcrm.com", live: true }],
  },
  {
    id: "cvr-tool",
    group: "creativeground",
    title: "CVR Data Integration Tool",
    period: "2025",
    accent: "from-sky-500 to-cyan-500",
    icon: Activity,
    badges: [{ label: "Production", cls: "bg-green-600 text-white" }, { label: "Integration", cls: "bg-blue-600 text-white" }],
    summary: "A Python tool built alongside Nordesk that integrates the Danish CVR business registry and feeds normalized company data into the CRM for lead generation.",
    details: [
      "Ingested and normalized company data across inconsistent schemas.",
      "Handled messy third-party data: malformed responses, missing fields, and rate limits.",
      "Automated a previously manual process and routed clean data into Nordesk's workflows.",
    ],
    tech: ["Python", "REST APIs", "Data normalization"],
    links: [],
  },
  {
    id: "oddslens",
    group: "building",
    title: "OddsLens",
    period: "2026",
    accent: "from-emerald-500 to-teal-500",
    icon: Activity,
    badges: [{ label: "Building", cls: "bg-yellow-500 text-black" }, { label: "Live", cls: "bg-green-600 text-white" }],
    summary: "A football odds tracker that snapshots bookmaker odds over time, computes no-vig consensus probabilities, and flags value.",
    details: [
      "Captures odds snapshots over time to track line movement.",
      "Computes no-vig consensus probabilities across bookmakers.",
      "Flags value where bookmaker odds drift from the consensus.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS"],
    links: [
      { label: "Live demo", href: "https://oddslens-mocha.vercel.app", live: true },
      { label: "GitHub", href: "https://github.com/souliN02/oddslens" },
    ],
  },
  {
    id: "risk-game",
    group: "building",
    title: "Risk (Multiplayer)",
    period: "2026",
    accent: "from-rose-500 to-red-500",
    icon: Rocket,
    badges: [{ label: "Building", cls: "bg-yellow-500 text-black" }, { label: "Live", cls: "bg-green-600 text-white" }],
    summary: "A real-time multiplayer Risk board game with lobbies, classic rules, and a dark UI.",
    details: [
      "Real-time gameplay over Socket.IO with lobby creation and joining.",
      "Classic Risk rules across reinforcement, attack, and fortify phases.",
      "Dark, focused UI built for fast multiplayer sessions.",
    ],
    tech: ["Next.js", "Socket.IO", "TypeScript"],
    links: [
      { label: "Live demo", href: "https://risk-game-seven.vercel.app", live: true },
      { label: "GitHub", href: "https://github.com/souliN02/risk-game" },
    ],
  },
  {
    id: "promptfuzz",
    group: "personal",
    title: "PromptFuzz-CLI",
    period: "2025",
    accent: "from-violet-500 to-purple-600",
    icon: Sparkles,
    badges: [{ label: "Security", cls: "bg-gray-800 text-white" }, { label: "CLI", cls: "bg-blue-600 text-white" }],
    summary: "An LLM red-team fuzzer with 18 mutation strategies for security testing prompts across multiple providers.",
    details: [
      "18 mutation strategies for probing LLM guardrails.",
      "Interactive menu mode plus multi-provider support.",
      "Built for hands-on, authorized LLM security testing.",
    ],
    tech: ["Python", "LLM APIs", "CLI"],
    links: [{ label: "GitHub", href: "https://github.com/souliN02/PromptFuzz-CLI" }],
  },
  {
    id: "xp-portfolio",
    group: "personal",
    title: "Windows XP Portfolio",
    period: "2025",
    accent: "from-amber-500 to-orange-500",
    icon: Code2,
    badges: [{ label: "Live", cls: "bg-green-600 text-white" }],
    summary: "This site. A portfolio styled as a Windows XP desktop, built solo to show personality and frontend creativity.",
    details: [
      "Draggable icons, a multi-window manager with z-index stacking, taskbar, and Start menu.",
      "Boot screen, sound effects, a working terminal, and Minesweeper.",
      "Built with Next.js and Tailwind CSS.",
    ],
    tech: ["Next.js", "React", "Tailwind CSS"],
    links: [
      { label: "Live", href: "https://portfolio-bekir.vercel.app", live: true },
      { label: "GitHub", href: "https://github.com/souliN02/portfolio" },
    ],
  },
  {
    id: "jornada",
    group: "personal",
    title: "Jornada Inglês Br",
    period: "2025",
    accent: "from-pink-500 to-fuchsia-500",
    icon: Globe,
    badges: [{ label: "Live", cls: "bg-green-600 text-white" }],
    summary: "A landing site for Jornada Inglês Br showcasing the company identity, mission, and services.",
    details: [
      "Responsive landing page across desktop and mobile.",
      "Clear service sections with friendly, accessible navigation.",
    ],
    tech: ["Next.js", "React", "Tailwind CSS"],
    links: [{ label: "Live", href: "https://jornadaingles.vercel.app/", live: true }],
  },
];

function ProjectsWindow() {
  const [openId, setOpenId] = useState("nordesk");
  const panelRefs = useRef({});

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  let cardIndex = 0;

  return (
    <div className="h-full w-full">
      <Bevel className="p-3">
        <SectionTitle icon={Code2} color="blue">My Projects</SectionTitle>
        <p className="text-[11px] text-gray-600 mb-3">
          Production work from my time at Fleeca (formerly CreativeGround), the side projects I am building right now, and personal builds.
          I work full-stack and AI-first, using Claude every day as a real part of how I ship.
        </p>

        {PROJECT_GROUPS.map((grp) => {
          const items = PROJECTS.filter((p) => p.group === grp.key);
          if (items.length === 0) return null;
          return (
            <div key={grp.key} className="mb-4 last:mb-0">
              <div className={`inline-block text-white text-[10px] font-bold px-2 py-0.5 rounded-sm bg-gradient-to-r ${grp.color} mb-2`}>
                {grp.label}
              </div>
              <ul className="space-y-2.5 text-gray-800">
                {items.map((p) => {
                  const isOpen = openId === p.id;
                  const panelId = `panel-${p.id}`;
                  const idx = cardIndex++;
                  const Icon = p.icon || Code2;
                  return (
                    <li
                      key={p.id}
                      style={{ animationDelay: `${idx * 60}ms` }}
                      className="animate-fadeIn rounded bg-white ring-1 ring-black/10 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={() => toggle(p.id)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-9 w-9 rounded bg-gradient-to-br ${p.accent} shadow-inner grid place-items-center shrink-0`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[12px] truncate">{p.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-white/90">{p.period}</span>
                              {p.badges.map((b, i) => (
                                <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
                              ))}
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{p.summary}</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`} />
                      </button>

                      <div
                        id={panelId}
                        ref={(el) => (panelRefs.current[p.id] = el)}
                        style={{
                          maxHeight: isOpen ? `${panelRefs.current[p.id]?.scrollHeight ?? 0}px` : "0px",
                          opacity: isOpen ? 1 : 0,
                        }}
                        className="overflow-hidden transition-all duration-300 ease-out"
                      >
                        <div className="px-3 pb-3 space-y-2">
                          <div className="p-2 rounded border border-gray-200 bg-gray-50 text-[11px]">{p.summary}</div>
                          <div className="grid sm:grid-cols-2 gap-2">
                            <div className="rounded border border-gray-200 bg-white p-2">
                              <p className="text-[10px] font-bold mb-1">Highlights</p>
                              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                                {p.details.map((d, i) => <li key={i}>{d}</li>)}
                              </ul>
                            </div>
                            <div className="rounded border border-gray-200 bg-white p-2">
                              <p className="text-[10px] font-bold mb-1">Technology</p>
                              <div className="flex flex-wrap gap-1">
                                {p.tech.map((t, i) => (
                                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 ring-1 ring-black/10">{t}</span>
                                ))}
                              </div>
                              {p.links?.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                  {p.links.map((l, i) => (
                                    <a
                                      key={i}
                                      href={l.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded ${
                                        l.live
                                          ? "bg-blue-600 text-white hover:bg-blue-700"
                                          : "bg-gray-100 text-gray-800 ring-1 ring-black/10 hover:bg-gray-200"
                                      }`}
                                    >
                                      {l.live ? <Globe className="w-3 h-3" /> : <GitHubMark className="w-3 h-3" />} {l.label}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </Bevel>
    </div>
  );
}

function AboutWindow() {
  return (
    <div className="h-full w-full">
      <Bevel className="p-3">
        <SectionTitle icon={BookOpen} color="green">About Bekir</SectionTitle>
        <div className="text-gray-800 leading-relaxed space-y-4 text-[12px]">
          <div className="rounded border border-green-200 bg-white p-3">
            <p className="text-base font-bold text-green-700">Hi, I&apos;m Bekir Saliv</p>
            <p className="mt-1">
              Full-stack developer based in N&aelig;stved, Denmark, working with{" "}
              <span className="text-green-700 font-medium">React, Next.js, TypeScript, Python and C#</span>.
              I build production software with AI-assisted workflows and care about shipping things that are clean,
              maintainable, and genuinely useful.
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              Recent AP graduate in Computer Science (datamatiker). Quick to learn, takes ownership, and ready to build.
            </p>
          </div>

          <div className="rounded border border-emerald-300 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-emerald-800 text-[12px]">AI-first development</h3>
            </div>
            <p className="text-[11px] text-emerald-900">
              I work AI-first. I use Claude every day as a core part of how I develop, for code generation, refactoring,
              debugging, and architectural sparring, while owning the quality of everything that ships. Nordesk is a real
              example: production software built largely with Claude as my primary development partner.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { icon: Rocket, text: "Full-stack, build-first" },
              { icon: Sparkles, text: "AI-native workflow" },
              { icon: Briefcase, text: "Real production experience" },
            ].map(({ icon: I, text }, i) => (
              <div key={i} className="rounded border border-green-200 bg-white p-2 flex items-center gap-2">
                <I className="w-4 h-4 text-green-700 shrink-0" />
                <span className="text-[11px]">{text}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Code2 className="w-4 h-4 text-green-700" />
              <h3 className="font-bold text-green-700 text-[12px]">Tech stack</h3>
            </div>
            <p className="text-[10px] text-gray-500 mb-1">Strong / daily</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {["JavaScript", "TypeScript", "React", "Next.js", "Python", "C# / .NET", "HTML & CSS", "Tailwind CSS", "REST APIs", "Git", "SQL"].map((s, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 ring-1 ring-black/10">{s}</span>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mb-1">AI-assisted</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {["Claude (primary)", "Claude Code", "Cursor"].map((s, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 ring-1 ring-emerald-200 text-emerald-900">{s}</span>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mb-1">Familiar / learning</p>
            <div className="flex flex-wrap gap-1">
              {["Node.js", "PostgreSQL", "WordPress", "Docker", "Azure", "AWS", "GraphQL"].map((s, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 ring-1 ring-black/10 text-gray-600">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-green-700" />
              <h3 className="font-bold text-green-700 text-[12px]">Experience</h3>
            </div>
            <ul className="space-y-2 text-[11px]">
              <li>
                <p><strong>Full Stack Developer, Fleeca</strong> <span className="text-gray-500">(formerly CreativeGround ApS &middot; 2025, Copenhagen)</span></p>
                <p className="text-gray-600">
                  Owned the end-to-end build of Nordesk, a custom CRM in Next.js, from scoping to deployment. Built a Python
                  CVR integration tool that normalized company data to power lead workflows. Used AI tools as an active part of the process.
                </p>
              </li>
              <li>
                <p><strong>Web Developer, Grundejerforeningen Kildeskoven</strong> <span className="text-gray-500">(2024, Roskilde)</span></p>
                <p className="text-gray-600">
                  Designed and delivered a WordPress site for a homeowners&apos; association, from requirements and content
                  structure to theme, plugins, and launch.
                </p>
              </li>
              <li>
                <p><strong>Customer Store Representative, Circle K</strong> <span className="text-gray-500">(2022&ndash;2025, N&aelig;stved)</span></p>
                <p className="text-gray-600">
                  Three years front-of-house: communication, working under pressure, teamwork, and explaining things clearly
                  to non-technical people.
                </p>
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-green-700" />
              <h3 className="font-bold text-green-700 text-[12px]">Education</h3>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
              <li><strong>Computer Science AP (datamatiker), 2022&ndash;2025</strong> &middot; Zealand Academy of Technologies and Business</li>
              <li><strong>Software Development, 2021&ndash;2022</strong> &middot; IT University of Copenhagen</li>
              <li><strong>HTX (Higher Technical Examination), 2018&ndash;2021</strong> &middot; ZBC Ringsted</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-green-700" />
              <h3 className="font-bold text-green-700 text-[12px]">Languages</h3>
            </div>
            <div className="flex flex-wrap gap-1">
              {["English (fluent)", "Danish (fluent)", "Bulgarian (native)"].map((s, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 ring-1 ring-black/10">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </Bevel>
    </div>
  );
}

function NotepadWindow() {
  const text = `readme.txt
==============================

Welcome to Bekir Saliv's portfolio.

I'm a full-stack developer from Naestved, Denmark, working
with React, Next.js, TypeScript, Python and C#. I build
production software AI-first, using Claude every day as a
core part of how I develop.

Getting around:
  - Double-click the desktop icons, or use the Start menu.
  - "My Projects" has my featured and current work.
  - "About Me" has the full bio, skills, and experience.
  - Windows can be dragged, resized, minimized and stacked.
  - Right-click the desktop for more options.

Currently building:
  - OddsLens  : football odds tracker (no-vig value)
  - Risk      : real-time multiplayer board game

Flagship:
  - Nordesk CRM (CreativeGround) -> nordeskcrm.com

Thanks for stopping by.
- Bekir
`;
  return (
    <div className="h-full w-full bg-white">
      <textarea
        readOnly
        value={text}
        spellCheck={false}
        className="w-full h-full resize-none outline-none p-2 text-[12px] leading-5 text-black font-mono bg-white"
      />
    </div>
  );
}

function ContactWindow() {
  const email = "bekirsaliv1@gmail.com";
  const phone = "+45 22 56 04 77";
  const [copied, setCopied] = useState(null);

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  };

  const mailto = `mailto:${email}?subject=${encodeURIComponent("Hello Bekir")}&body=${encodeURIComponent("Hi Bekir,\n\nI'd like to…\n\n—")}`;

  return (
    <div className="h-full w-full">
      <Bevel className="p-3">
        <SectionTitle icon={Award} color="purple">Contact</SectionTitle>

        <div className="mb-2 flex flex-wrap items-center gap-1 text-[10px]">
          <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 ring-1 ring-purple-200">Preferred: Email</span>
          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200">Naestved, Denmark</span>
          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200">Usually replies quickly</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="rounded border border-purple-200 bg-white p-2">
            <p className="text-[10px] text-gray-500">Email</p>
            <p className="font-bold text-gray-900 text-[12px] break-all">{email}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <a href={mailto} className="px-2 py-0.5 text-[10px] rounded bg-purple-600 text-white hover:bg-purple-700">Write email</a>
              <button onClick={() => copy(email, "email")} className="px-2 py-0.5 text-[10px] rounded bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200">Copy</button>
            </div>
          </div>

          <div className="rounded border border-purple-200 bg-white p-2">
            <p className="text-[10px] text-gray-500">Phone</p>
            <a href={`tel:${phone.replace(/\s+/g, "")}`} className="font-bold text-gray-900 text-[12px]">{phone}</a>
            <div className="mt-1 flex flex-wrap gap-1">
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="px-2 py-0.5 text-[10px] rounded bg-gray-800 text-white hover:bg-black">Call</a>
              <button onClick={() => copy(phone, "phone")} className="px-2 py-0.5 text-[10px] rounded bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200">Copy</button>
            </div>
          </div>

          <div className="rounded border border-purple-200 bg-white p-2">
            <p className="text-[10px] text-gray-500">Links</p>
            <div className="mt-0.5 space-y-0.5">
              <a href="https://www.linkedin.com/in/bekirsaliv02/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-700 underline hover:no-underline">
                <LinkIcon className="w-3 h-3" /> LinkedIn
              </a>
              <br />
              <a href="https://github.com/souliN02" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-700 underline hover:no-underline">
                <GitHubMark className="w-3 h-3" /> GitHub
              </a>
            </div>
          </div>

          <div className="rounded border border-purple-200 bg-white p-2">
            <p className="text-[10px] text-gray-500">Portfolio</p>
            <a href="https://portfolio-bekir.vercel.app" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-700 underline hover:no-underline">
              <Globe className="w-3 h-3" /> portfolio-bekir.vercel.app
            </a>
          </div>

          <div className="rounded border border-purple-200 bg-white p-2 sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] text-gray-500">CV</p>
            <p className="text-gray-800 text-[11px]">Need a quick overview?</p>
            <a href="/Bekir_CV.pdf" target="_blank" rel="noopener noreferrer" className="mt-1 inline-block px-2 py-0.5 text-[10px] rounded bg-gray-800 text-white hover:bg-black">Open CV (PDF)</a>
          </div>
        </div>

        {copied && (
          <div className="mt-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-800 ring-1 ring-green-200" aria-live="polite">
            {copied === "email" ? "Email copied!" : "Phone copied!"}
          </div>
        )}
      </Bevel>
    </div>
  );
}
