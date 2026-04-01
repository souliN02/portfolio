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

  function playError() {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, c.currentTime);
    gain.gain.setValueAtTime(0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.35);
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

  return { playClick, playOpen, playClose, playError, playMinimize };
}

/* ─── Constants ─── */

const ICON_SIZE = { w: 80, h: 100 };
const GRID = 20;

/* ─── Desktop icons definition ─── */

const desktopIcons = [
  { id: "cv", name: "Bekir's CV", icon: XP_ICONS.cv, windowType: "cv" },
  { id: "projects", name: "My Projects", icon: XP_ICONS.projects, windowType: "projects" },
  { id: "about", name: "About Me", icon: XP_ICONS.about, windowType: "about" },
  { id: "contact", name: "Contact", icon: XP_ICONS.contact, windowType: "contact" },
  { id: "terminal", name: "Terminal", icon: XP_ICONS.terminal, windowType: "terminal" },
  { id: "minesweeper", name: "Minesweeper", icon: XP_ICONS.minesweeper, windowType: "minesweeper" },
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
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, []);
  return time;
}

/* ═════════════════════════════════════════════
   Main desktop shell
   ═════════════════════════════════════════════ */

export default function XpPortfolio() {
  // Boot screen
  const [booted, setBooted] = useState(false);

  // Window state
  const [openWindow, setOpenWindow] = useState(null); // { id, name, windowType }
  const [windowPos, setWindowPos] = useState({ x: 100, y: 60 });
  const [windowSize, setWindowSize] = useState({ w: 680, h: 480 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const prevBounds = useRef(null);

  // Icons
  const [iconPositions, setIconPositions] = useState(getDefaultIconPositions());
  const [selectedIcon, setSelectedIcon] = useState(null);

  // Audio
  const audioRef = useRef(null);
  const [bootPlayed, setBootPlayed] = useState(false);
  const soundsRef = useRef(null);

  // Refs
  const containerRef = useRef(null);

  // Clock
  const clockTime = useClock();

  // Init sound manager
  useEffect(() => {
    soundsRef.current = createSoundManager();
  }, []);

  // Load saved icon positions (versioned key so layout resets when icons change)
  const STORAGE_KEY = "xp_icon_positions_v2";
  useEffect(() => {
    try {
      // Clear old key
      localStorage.removeItem("xp_icon_positions");
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only use saved positions if all current icons are present
        const allPresent = desktopIcons.every((ic) => parsed[ic.id]);
        if (allPresent) setIconPositions(parsed);
      }
    } catch {}
  }, []);

  // Boot sound
  useEffect(() => {
    audioRef.current = new Audio("/xp-boot.mp3");
    audioRef.current.preload = "auto";
  }, []);

  // Play boot sound after boot screen finishes
  const onBootFinished = useCallback(() => {
    setBooted(true);
    if (!bootPlayed && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setBootPlayed(true);
    }
  }, [bootPlayed]);

  const saveIconPositions = (positions) => {
    setIconPositions(positions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch {}
  };

  /* ─── Icon dragging ─── */
  const dragStateRef = useRef({ id: null, startX: 0, startY: 0, orig: { x: 0, y: 0 }, moved: false });

  const onIconMouseDown = (e, id) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setSelectedIcon(id);
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
    const next = { ...iconPositions, [id]: { x: nx, y: ny } };
    setIconPositions(next);
  };
  const onIconMouseUp = () => {
    const { id } = dragStateRef.current;
    if (id) saveIconPositions({ ...iconPositions });
    dragStateRef.current = { id: null, startX: 0, startY: 0, orig: { x: 0, y: 0 }, moved: false };
    document.removeEventListener("mousemove", onIconMouseMove);
  };

  /* ─── Window move/resize ─── */
  const onWindowMouseDown = (e) => {
    if (isMaximized) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...windowPos };
    const onMove = (me) => {
      setWindowPos({ x: startPos.x + (me.clientX - startX), y: startPos.y + (me.clientY - startY) });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const onResizeMouseDown = (e) => {
    if (isMaximized) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = { ...windowSize };
    const onMove = (me) => {
      setWindowSize({
        w: Math.max(360, startSize.w + (me.clientX - startX)),
        h: Math.max(260, startSize.h + (me.clientY - startY)),
      });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  /* ─── Open / close / min / max ─── */
  const handleDoubleClick = (id) => {
    if (dragStateRef.current.moved) return;
    const icon = desktopIcons.find((i) => i.id === id);
    if (!icon) return;
    soundsRef.current?.playOpen();
    setOpenWindow({ id: icon.id, name: icon.name, windowType: icon.windowType });
    setIsMinimized(false);
    // Reset position for new windows
    if (!openWindow || openWindow.id !== icon.id) {
      setWindowPos({ x: 100, y: 60 });
      setWindowSize({ w: 680, h: 480 });
      setIsMaximized(false);
    }
  };

  const onClose = () => {
    soundsRef.current?.playClose();
    setOpenWindow(null);
    setIsMinimized(false);
    setIsMaximized(false);
  };

  const onMinimize = () => {
    if (!openWindow) return;
    soundsRef.current?.playMinimize();
    setIsMinimized(true);
  };

  const onToggleMaximize = () => {
    if (!openWindow) return;
    if (!isMaximized) {
      prevBounds.current = { pos: { ...windowPos }, size: { ...windowSize } };
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setWindowPos({ x: 0, y: 0 });
        setWindowSize({ w: Math.round(rect.width), h: Math.round(rect.height - 40) });
      }
      setIsMaximized(true);
    } else {
      const b = prevBounds.current;
      if (b) {
        setWindowPos(b.pos);
        setWindowSize(b.size);
      }
      setIsMaximized(false);
    }
  };

  const onTaskbarAppClick = () => {
    soundsRef.current?.playClick();
    setIsMinimized(false);
  };

  // Deselect icon when clicking desktop background
  const onDesktopClick = (e) => {
    if (e.target === e.currentTarget) setSelectedIcon(null);
  };

  /* ─── Render window content ─── */
  function renderWindowContent() {
    if (!openWindow) return null;
    switch (openWindow.windowType) {
      case "cv": return <CVWindow />;
      case "projects": return <ProjectsWindow />;
      case "about": return <AboutWindow />;
      case "contact": return <ContactWindow />;
      case "terminal": return <TerminalWindow onRequestClose={onClose} />;
      case "minesweeper": return <MinesweeperWindow />;
      default: return null;
    }
  }

  /* ─── Boot screen ─── */
  if (!booted) {
    return <BootScreen onFinished={onBootFinished} />;
  }

  return (
    <div
      ref={containerRef}
      suppressHydrationWarning
      className="relative w-screen h-screen bg-[url('/xp-wallpaper.jpg')] bg-cover bg-center overflow-hidden select-none"
      style={{ fontFamily: "Tahoma, Arial, Helvetica, sans-serif" }}
    >
      {/* ─── Desktop icons ─── */}
      <div className="absolute inset-0" onClick={onDesktopClick}>
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
                <img src={icon.icon} alt={icon.name} width={40} height={40} style={{ width: 40, height: 40 }} draggable={false} />
              </div>
              <span
                className={`text-[11px] text-center mt-0.5 px-1 leading-tight xp-icon-label ${
                  isSelected
                    ? "bg-blue-600/70 text-white"
                    : "text-white"
                }`}
                style={{ maxWidth: "78px", wordBreak: "break-word" }}
              >
                {icon.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── XP Taskbar ─── */}
      <div className="absolute bottom-0 left-0 w-full h-[30px] xp-taskbar flex items-center text-white text-[11px] shadow-[0_-1px_4px_rgba(0,0,0,0.4)] z-30">
        {/* Start button */}
        <button
          className="xp-start-btn flex items-center h-full font-bold text-white text-[11px] tracking-wide"
          onClick={() => soundsRef.current?.playClick()}
        >
          <XpFlagSmall />
          <span className="italic">start</span>
        </button>

        {/* Quick launch separator */}
        <div className="w-px h-5 bg-white/20 mx-1" />

        {/* Active window in taskbar */}
        <div className="flex-grow flex items-center gap-1 px-1 overflow-hidden">
          {openWindow && (
            <button
              onClick={onTaskbarAppClick}
              className={`px-2 py-0.5 rounded text-left truncate max-w-[200px] text-[11px] transition ${
                isMinimized
                  ? "bg-blue-800/40 hover:bg-blue-700/50"
                  : "bg-blue-500/50 shadow-inner ring-1 ring-white/20"
              }`}
              title={openWindow.name}
            >
              {openWindow.name}
            </button>
          )}
        </div>

        {/* System tray */}
        <div className="xp-systray flex items-center gap-2 h-full px-3 text-[11px]">
          <span className="text-white/90">{clockTime}</span>
        </div>
      </div>

      {/* ─── Window ─── */}
      {openWindow && !isMinimized && (
        <div
          style={{
            top: `${windowPos.y}px`,
            left: `${windowPos.x}px`,
            width: `${windowSize.w}px`,
            height: `${windowSize.h}px`,
          }}
          className={`absolute z-20 flex flex-col shadow-2xl ${
            isMaximized ? "rounded-none" : "rounded-t-lg"
          }`}
          // Outer blue border like real XP windows
          onMouseDown={() => setSelectedIcon(null)}
        >
          {/* Title bar — authentic XP blue gradient */}
          <div
            onMouseDown={onWindowMouseDown}
            className={`xp-titlebar text-white px-2 py-[3px] font-bold flex items-center justify-between cursor-move select-none text-[12px] ${
              isMaximized ? "" : "rounded-t-lg"
            }`}
          >
            <span className="truncate pr-2 drop-shadow-sm">{openWindow.name}</span>
            <div className="flex items-center gap-[2px]">
              {/* Minimize */}
              <button
                onClick={onMinimize}
                className="w-[21px] h-[21px] rounded-sm grid place-items-center text-[10px] bg-gradient-to-b from-blue-300/80 to-blue-500/80 border border-white/30 hover:from-blue-200 hover:to-blue-400"
                title="Minimize"
              >
                <span className="leading-none mb-[-2px]">_</span>
              </button>
              {/* Maximize */}
              <button
                onClick={onToggleMaximize}
                className="w-[21px] h-[21px] rounded-sm grid place-items-center text-[10px] bg-gradient-to-b from-blue-300/80 to-blue-500/80 border border-white/30 hover:from-blue-200 hover:to-blue-400"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? "❐" : "□"}
              </button>
              {/* Close */}
              <button
                onClick={onClose}
                className="w-[21px] h-[21px] rounded-sm grid place-items-center text-[10px] bg-gradient-to-b from-red-400 to-red-600 border border-red-300/50 hover:from-red-300 hover:to-red-500 ml-[2px]"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Window body */}
          <div className="bg-[#ECE9D8] flex-grow overflow-auto border-x-[3px] border-b-[3px] border-[#0054E3]">
            {openWindow.windowType === "terminal" ? (
              // Terminal gets full height with no padding
              <div className="h-full">{renderWindowContent()}</div>
            ) : (
              <div className="p-3 h-full overflow-auto">{renderWindowContent()}</div>
            )}
          </div>

          {/* Resize handle */}
          {!isMaximized && (
            <div
              onMouseDown={onResizeMouseDown}
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
      )}
    </div>
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

function ProjectsWindow() {
  const [openId, setOpenId] = useState(null);
  const panelRefs = useRef({});

  const projects = [
    {
      id: "crm-nextjs",
      title: "CRM system in Next.js",
      period: "2025",
      accent: "from-blue-500 to-indigo-500",
      status: "Done",
      internship: true,
      thumb: "/globe.svg",
      summary: "An internal CRM built with Next.js and Prisma featuring roles, import requests, and webhook emails.",
      details: [
        "Admin/User roles, approval flow for import requests, CSV import into Leads/Customers.",
        "Webhook module that sends receipts and internal notifications.",
        "Designed with simple, productive screens (Admin, Imports, Leads/Customers).",
      ],
      tech: ["Next.js (App Router)", "Prisma", "NextAuth", "PostgreSQL/SQLite", "Tailwind"],
      links: [{ label: "GitHub", href: "https://github.com/souliN02" }],
    },
    {
      id: "doc-system",
      title: "Internal document system backend",
      period: "2025",
      accent: "from-sky-500 to-cyan-500",
      status: "Done",
      internship: true,
      thumb: "/file.svg",
      summary: "Backend logic for an internal document platform: users can upload files or write content directly; everything is stored in a database.",
      details: [
        "Role- and company-based access so users only see documents for their own company.",
        "Create, update, and view documents with audit-friendly data models.",
        "Upload pipeline and editor writes persisted via API; guarded endpoints and policies.",
      ],
      tech: ["Node.js/Next.js", "Prisma", "PostgreSQL", "RBAC", "File uploads"],
      links: [],
    },
    {
      id: "playwright-scraper",
      title: "Web scraper with Playwright",
      period: "2025",
      accent: "from-orange-500 to-amber-500",
      status: "Done",
      internship: true,
      thumb: "/file.svg",
      summary: "Asynchronous scraping of CVR data with batch control and robust error handling.",
      details: ["Runs in containers for parallel collection.", "Resumes batches and logs failures for re-run."],
      tech: ["Node.js/Python", "Playwright", "Docker"],
      links: [],
    },
    {
      id: "nexi-nets-payments",
      title: "Payment system with Nexi Nets",
      period: "2025",
      accent: "from-fuchsia-500 to-pink-500",
      status: "Done",
      internship: true,
      thumb: "/vercel.svg",
      summary: "Checkout and webhook flows that send customer receipts and internal emails.",
      details: [
        "Validates events, writes audit logs, and generates PDF/HTML emails.",
        "Handles reservation vs capture with clear customer communication.",
      ],
      tech: ["Next.js", "Nodemailer", "Nexi Nets API"],
      links: [],
    },
    {
      id: "unity-fps",
      title: "Multiplayer FPS in Unity",
      period: "2024–2025",
      accent: "from-emerald-500 to-teal-500",
      status: "Personal",
      internship: false,
      thumb: "/window.svg",
      summary: "Personal project exploring authoritative networking and a small gameplay loop.",
      details: [
        "Netcode, lobby, basic matchmaking, and synced movement/shooting mechanics.",
        "Latency experiments, client prediction, and server authority trade-offs.",
      ],
      tech: ["Unity", "C#", "Netcode"],
      links: [],
    },
    {
      id: "jornada-ingles",
      title: "Jornada Inglês Br",
      period: "2025",
      accent: "from-rose-500 to-pink-500",
      status: "Personal",
      internship: false,
      thumb: "/globe.svg",
      summary: "Website for Jornada Inglês Br showcasing company identity, mission, and service offerings.",
      details: [
        "Designed and built a professional landing page showcasing the company's identity, mission, and vision.",
        "Implemented responsive layouts for optimal viewing across desktop and mobile devices.",
        "Created clear service offering sections with engaging visual design and user-friendly navigation.",
      ],
      tech: ["Next.js", "React", "Tailwind CSS"],
      links: [{ label: "Live Site", href: "https://jornadaingles.vercel.app/" }],
    },
  ];

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="h-full w-full">
      <Bevel className="p-3">
        <SectionTitle icon={Code2} color="blue">My Projects</SectionTitle>
        <p className="text-[11px] text-gray-600 mb-2">
          Most projects were built during my internship at CreativeGround. The Unity multiplayer project is personal.
        </p>
        <ul className="space-y-3 text-gray-800">
          {projects.map((p, idx) => {
            const isOpen = openId === p.id;
            const panelId = `panel-${p.id}`;
            return (
              <li
                key={p.id}
                style={{ animationDelay: `${idx * 80}ms` }}
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
                      <img src={p.thumb} alt="" className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-[12px] truncate">{p.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-white/90">{p.period}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${p.status === "Done" ? "bg-green-600 text-white" : "bg-yellow-500 text-black"}`}>
                          {p.status}
                        </span>
                        {p.internship && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">Internship</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{p.summary}</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                  />
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
                              <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-700 underline hover:no-underline">
                                <LinkIcon className="w-3 h-3" /> {l.label}
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
            <p className="text-base font-bold text-green-700">Hi, I&apos;m Bekir</p>
            <p className="mt-1">
              I&apos;m a recent <strong>Computer Science AP (Datamatiker)</strong> graduate from Zealand Academy,
              where I focused on <span className="text-green-700 font-medium">backend development</span>,{" "}
              <span className="text-green-700 font-medium">databases</span>, and{" "}
              <span className="text-green-700 font-medium">software architecture</span>. I enjoy building stable, scalable solutions.
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              Most projects on this site were built during my internship at <strong>CreativeGround</strong>.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { icon: Rocket, text: "Backend & integrations focus" },
              { icon: Activity, text: "Reliable systems & logging" },
              { icon: Code2, text: "Hands-on internship experience" },
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
              <h3 className="font-bold text-green-700 text-[12px]">Technologies & Skills</h3>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                "Next.js (App Router)", "Node.js", "Express", "Prisma ORM",
                "C#", "Unity (Netcode)", "Python (async, Playwright)",
                "Java", "Docker", "SQL (Postgres/SQLite)",
                "REST design", "Auth & Security", "Git/GitHub",
              ].map((skill, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 ring-1 ring-black/10">{skill}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-green-700" />
              <h3 className="font-bold text-green-700 text-[12px]">Education</h3>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
              <li>
                <strong>Computer Science AP (2022–2025)</strong> – Zealand Academy<br />
                Focus: Game development, backend development, databases, and software architecture.
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-green-700" />
              <h3 className="font-bold text-green-700 text-[12px]">Experience</h3>
            </div>
            <ul className="space-y-2 text-[11px]">
              <li>
                <p><strong>CreativeGround — Software Developer Intern</strong></p>
                <p className="text-gray-600">
                  Built an internal CRM (Next.js/Prisma), document system backend, Nexi Nets payment flow, and Playwright scraping pipelines.
                </p>
              </li>
              <li>
                <p><strong>Circle K — Customer Service & Operations</strong></p>
                <p className="text-gray-600">
                  Strengthened communication, ownership, and problem solving in a busy environment.
                </p>
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-green-700" />
              <h3 className="font-bold text-green-700 text-[12px]">Currently interested in</h3>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
              <li>Scalable APIs and clean architecture in Node/Java.</li>
              <li>Automated logging, tracing, and robust error handling.</li>
              <li>DevOps basics: Docker, multi-container setups, CI/CD.</li>
            </ul>
          </div>
        </div>
      </Bevel>
    </div>
  );
}

function ContactWindow() {
  const email = "bekirsaliv1@gmail.com";
  const phone = "+45 22560477";
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
                <LinkIcon className="w-3 h-3" /> GitHub
              </a>
            </div>
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
