"use client";

import { useState, useEffect, useRef } from "react";
import {
  Folder,
  FileText,
  Terminal,
  Contact,
  ChevronDown,
  Link as LinkIcon,
  Award,
  Briefcase,
  Code2,
  BookOpen,
  Rocket,
  Activity,
} from "lucide-react";

const ICON_SIZE = { w: 80, h: 90 };
const GRID = 20;

// Desktop icons (double-click to open a window)
const icons = [
  { id: "cv", name: "Bekir's CV", icon: <FileText className="w-8 h-8 text-black" />, window: () => <CVWindow /> },
  { id: "projects", name: "Projects", icon: <Folder className="w-8 h-8 text-black" />, window: () => <ProjectsWindow /> },
  { id: "about", name: "About me", icon: <Terminal className="w-8 h-8 text-black" />, window: () => <AboutWindow /> },
  { id: "contact", name: "Contact", icon: <Contact className="w-8 h-8 text-black" />, window: () => <ContactWindow /> },
];

function getDefaultIconPositions() {
  const startX = 24, startY = 24, spacingY = 110;
  const defaults = {};
  icons.forEach((ic, i) => {
    defaults[ic.id] = { x: startX, y: startY + i * spacingY };
  });
  return defaults;
}

// Desktop shell: wallpaper, icons, single window, taskbar
export default function XpPortfolio() {
  const [openWindow, setOpenWindow] = useState(null);
  const [windowPos, setWindowPos] = useState({ x: 120, y: 120 });
  const [windowSize, setWindowSize] = useState({ w: 640, h: 460 });
  const [showAudioPrompt, setShowAudioPrompt] = useState(true);
  const [iconPositions, setIconPositions] = useState(getDefaultIconPositions());
  const [showGrid, setShowGrid] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const prevBounds = useRef(null);

  const containerRef = useRef(null);
  const windowRef = useRef(null);
  const audioRef = useRef(null);
  const [bootPlayed, setBootPlayed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("xp_icon_positions");
      if (saved) setIconPositions(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    audioRef.current = new Audio("/xp-boot.mp3");
    audioRef.current.preload = "auto";
  }, []);

  // Play boot sound after first interaction
  useEffect(() => {
    if (bootPlayed) return;
    const tryPlay = async () => {
      if (bootPlayed) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          const ctx = new AC();
          await ctx.resume().catch(() => {});
        }
        await audioRef.current?.play();
        setBootPlayed(true);
        setTimeout(() => setShowAudioPrompt(false), 300);
        window.removeEventListener("pointerdown", tryPlay);
        window.removeEventListener("keydown", tryPlay);
        document.removeEventListener("visibilitychange", tryPlay);
      } catch (_) {}
    };
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("keydown", tryPlay);
    document.addEventListener("visibilitychange", tryPlay);
    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, [bootPlayed]);

  const saveIconPositions = (positions) => {
    setIconPositions(positions);
    try {
      localStorage.setItem("xp_icon_positions", JSON.stringify(positions));
    } catch {}
  };

  // Icon dragging
  const dragStateRef = useRef({ id: null, startX: 0, startY: 0, orig: { x: 0, y: 0 } });
  const onIconMouseDown = (e, id) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const pos = iconPositions[id] || { x: 24, y: 24 };
    dragStateRef.current = { id, startX: e.clientX, startY: e.clientY, orig: { ...pos } };
    document.addEventListener("mousemove", onIconMouseMove);
    document.addEventListener("mouseup", onIconMouseUp, { once: true });
  };
  const onIconMouseMove = (e) => {
    const { id, startX, startY, orig } = dragStateRef.current;
    if (!id) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
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
    dragStateRef.current = { id: null, startX: 0, startY: 0, orig: { x: 0, y: 0 } };
    document.removeEventListener("mousemove", onIconMouseMove);
  };

  // Window move/resize
  const onWindowMouseDown = (e) => {
    if (isMaximized) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...windowPos };
    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      setWindowPos({ x: startPos.x + dx, y: startPos.y + dy });
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
    const MIN_W = 360, MIN_H = 260;
    const onMove = (me) => {
      const dw = me.clientX - startX;
      const dh = me.clientY - startY;
      setWindowSize({ w: Math.max(MIN_W, startSize.w + dw), h: Math.max(MIN_H, startSize.h + dh) });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Open/close/minimize/maximize
  const handleDoubleClick = (id) => {
    const icon = icons.find((i) => i.id === id);
    setOpenWindow(icon);
    setIsMinimized(false);
  };

  const onClose = () => {
    setOpenWindow(null);
    setIsMinimized(false);
    setIsMaximized(false);
  };
  const onMinimize = () => {
    if (!openWindow) return;
    setIsMinimized(true);
  };
  const onToggleMaximize = () => {
    if (!openWindow) return;
    if (!isMaximized) {
      prevBounds.current = { pos: { ...windowPos }, size: { ...windowSize } };
      const taskbarH = 40;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setWindowPos({ x: 0, y: 0 });
        setWindowSize({ w: Math.round(rect.width), h: Math.round(rect.height - taskbarH) });
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

  const onTaskbarAppClick = () => setIsMinimized(false);

  return (
    <div
      ref={containerRef}
      suppressHydrationWarning
      className="relative w-screen h-screen bg-[url('/xp-wallpaper.jpg')] bg-cover overflow-hidden font-sans select-none"
    >
      {showAudioPrompt && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-200/95 border border-yellow-400 text-yellow-900 px-4 py-2 rounded shadow-md z-50 animate-pulse transition-opacity duration-500 ${bootPlayed ? 'opacity-0' : 'opacity-100'}`}>
          Click anywhere to enable sound
        </div>
      )}

      {showGrid && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0, rgba(255,255,255,0.12) 1px, transparent 1px, transparent ${GRID}px), repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0, rgba(255,255,255,0.12) 1px, transparent 1px, transparent ${GRID}px)`,
            opacity: 0.33,
          }}
        />
      )}

      {/* Desktop icons */}
      <div className="absolute inset-0">
        {icons.map((icon) => {
          const pos = iconPositions[icon.id] || { x: 24, y: 24 };
          return (
            <div
              key={icon.id}
              style={{ left: `${pos.x}px`, top: `${pos.y}px`, width: `${ICON_SIZE.w}px`, transition: 'left 60ms linear, top 60ms linear' }}
              onMouseDown={(e) => onIconMouseDown(e, icon.id)}
              onDoubleClick={() => handleDoubleClick(icon.id)}
              className="absolute flex flex-col items-center cursor-pointer text-white hover:opacity-90"
            >
              <div className="bg-white p-2 rounded shadow-md ring-1 ring-black/10">{icon.icon}</div>
              <span className="text-sm text-center mt-1 bg-blue-700/70 px-1 rounded select-none">
                {icon.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-r from-blue-900 to-blue-700 flex items-center px-2 sm:px-4 text-white font-bold gap-2 shadow-[0_-2px_8px_rgba(0,0,0,0.35)]">
        <div className="bg-blue-500/90 px-3 py-1 rounded border border-blue-300/30 shadow hover:bg-blue-400/90 transition">
          Start
        </div>
        {openWindow && (
          <button
            onClick={onTaskbarAppClick}
            className={`px-2 py-1 rounded border border-blue-300/30 bg-blue-600/80 hover:bg-blue-500/80 shadow ${isMinimized ? '' : 'ring-2 ring-white/40'}`}
            title={openWindow.name}
          >
            {openWindow.name}
          </button>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs font-normal">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" className="accent-yellow-300" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
            Show grid
          </label>
        </div>
      </div>

      {/* Window */}
      {openWindow && !isMinimized && (
        <div
          ref={windowRef}
          style={{ top: `${windowPos.y}px`, left: `${windowPos.x}px`, width: `${windowSize.w}px`, height: `${windowSize.h}px` }}
          className={`absolute z-20 bg-white/90 backdrop-blur border-2 border-gray-700 shadow-2xl flex flex-col ${isMaximized ? 'rounded-none' : 'rounded-md'}`}
        >
          <div
            onMouseDown={onWindowMouseDown}
            className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-2 sm:px-3 py-1 font-bold flex items-center justify-between cursor-move select-none rounded-t-md"
          >
            <span className="truncate pr-2">{openWindow.name}</span>
            <div className="flex items-center gap-1">
              <button onClick={onMinimize} className="w-6 h-6 grid place-items-center hover:bg-blue-700/80 rounded" title="Minimize">_</button>
              <button onClick={onToggleMaximize} className="w-6 h-6 grid place-items-center hover:bg-blue-700/80 rounded" title={isMaximized ? 'Restore' : 'Maximize'}>{isMaximized ? '❐' : '▢'}</button>
              <button onClick={onClose} className="w-6 h-6 grid place-items-center hover:bg-red-600/90 rounded" title="Close">✕</button>
            </div>
          </div>
          <div className="p-4 overflow-auto flex-grow">{openWindow.window()}</div>

          {!isMaximized && (
            <div
              onMouseDown={onResizeMouseDown}
              className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize bg-transparent"
              title="Resize"
            >
              <svg width="16" height="16" className="absolute right-0 bottom-0 opacity-40">
                <path d="M0 16 L16 16 L16 0 Z" fill="#64748b" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Global animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out both; }
      `}</style>
    </div>
  );
}

// Bevel frame
function Bevel({ children, className = "" }) {
  return (
    <div
      className={[
        "border",
        "border-b-gray-500 border-r-gray-500",
        "border-t-white border-l-white",
        "bg-gradient-to-b from-gray-50/90 to-gray-200/80",
        "shadow-inner",
        "rounded-md",
        "ring-1 ring-black/5",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// Section header strip
function SectionTitle({ icon: Icon, color = "blue", children }) {
  const colorMap = {
    blue: "from-blue-700 to-blue-500 border-blue-300",
    green: "from-green-700 to-green-500 border-green-300",
    purple: "from-purple-700 to-purple-500 border-purple-300",
  };
  const colors = colorMap[color] || colorMap.blue;
  return (
    <div className={`mb-3`}>
      <div className={`text-white text-sm font-semibold px-3 py-1 rounded-t-md bg-gradient-to-r ${colors} shadow`}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-white" />}
          <span>{children}</span>
        </div>
      </div>
      <div className="h-[1px] w-full bg-white/60" />
    </div>
  );
}

// CV window
function CVWindow() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="bg-gray-200 border-b p-2 text-sm font-mono text-gray-800">Microsoft Word - Bekir_CV.pdf</div>
      <div className="flex-grow overflow-auto bg-white">
        <iframe src="/Bekir_CV.pdf" title="Bekir's CV" className="w-full h-full border-none"></iframe>
      </div>
    </div>
  );
}

// Projects window (accordion)
function ProjectsWindow() {
  const [openId, setOpenId] = useState(null);
  const panelRefs = useRef({});

  // Most projects were built during my internship unless noted otherwise.
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
  ];

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="h-full w-full p-1">
      <Bevel className="p-4">
        <SectionTitle icon={Folder} color="blue">My Projects</SectionTitle>

        <p className="text-xs text-gray-600 mb-2">
          Most projects were built during my internship at CreativeGround. The Unity multiplayer project is personal.
        </p>

        <ul className="space-y-4 text-gray-800">
          {projects.map((p, idx) => {
            const isOpen = openId === p.id;
            const panelId = `panel-${p.id}`;
            return (
              <li
                key={p.id}
                style={{ animationDelay: `${idx * 100}ms` }}
                className="animate-fadeIn rounded-xl bg-white/70 backdrop-blur ring-1 ring-black/5 shadow hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <button
                  onClick={() => toggle(p.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-md bg-gradient-to-br ${p.accent} shadow-inner grid place-items-center`}>
                      <img src={p.thumb} alt="" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{p.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-900/80 text-white/90">{p.period}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "Done" ? "bg-green-600 text-white" : "bg-yellow-500 text-black"}`}>
                          {p.status}
                        </span>
                        {p.internship && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/90 text-white/90">
                            Internship
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1">{p.summary}</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                  />
                </button>

                {/* Animated panel */}
                <div
                  id={panelId}
                  ref={(el) => (panelRefs.current[p.id] = el)}
                  style={{
                    maxHeight: isOpen ? `${panelRefs.current[p.id]?.scrollHeight ?? 0}px` : "0px",
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? "translateY(0)" : "translateY(-4px)",
                  }}
                  className="overflow-hidden transition-all duration-300 ease-out"
                >
                  <div className="px-4 pt-0 pb-3 space-y-3">
                    <div className="p-3 rounded-lg border border-gray-200/80 bg-white/90 shadow-sm">
                      <p className="text-sm">{p.summary}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-gray-200/80 bg-white/80 p-3">
                        <p className="text-xs font-semibold mb-1">Highlights</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {p.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-gray-200/80 bg-white/80 p-3">
                        <p className="text-xs font-semibold mb-2">Technology</p>
                        <div className="flex flex-wrap gap-2">
                          {p.tech.map((t, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-1 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-black/10 shadow-sm"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        {p.links?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-3 pt-3">
                            {p.links.map((l, i) => (
                              <a
                                key={i}
                                href={l.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-700 underline decoration-dotted hover:no-underline"
                              >
                                <LinkIcon className="w-4 h-4" /> {l.label}
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

// About window
function AboutWindow() {
  return (
    <div className="h-full w-full p-1">
      <Bevel className="p-4">
        <SectionTitle icon={Terminal} color="green">About Bekir</SectionTitle>
        <div className="text-gray-800 leading-relaxed space-y-6">
          {/* Intro */}
          <div className="rounded-md border border-green-200/70 bg-white/80 p-3 shadow-sm">
            <p className="text-lg font-semibold text-green-700">Hi, I’m Bekir</p>
            <p className="mt-2">
              I’m a recent <span className="font-semibold">Computer Science AP (Datamatiker)</span> graduate from Zealand Academy,
              where I focused on <span className="text-green-700 font-medium">backend development</span>,{" "}
              <span className="text-green-700 font-medium">databases</span>, and{" "}
              <span className="text-green-700 font-medium">software architecture</span>. I enjoy building stable, scalable solutions with a good developer and user experience.
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Most of the projects on this site were built during my internship at <span className="font-medium">CreativeGround</span>. The Unity multiplayer project is personal.
            </p>
          </div>

          {/* Highlights */}
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: Rocket, text: "Backend and integrations focus" },
              { icon: Activity, text: "Reliable systems and logging" },
              { icon: Code2, text: "Hands-on experience from internship work" },
            ].map(({ icon: I, text }, i) => (
              <div key={i} className="rounded-md border border-green-200/70 bg-white/80 p-3 flex items-center gap-2 shadow-sm">
                <I className="w-4 h-4 text-green-700" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="w-5 h-5 text-green-700" />
              <h3 className="font-semibold text-green-700">Technologies & Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "Next.js (App Router)", "Node.js", "Express", "Prisma ORM",
                "C#", "Unity (Netcode)", "Python (async, Playwright)",
                "Java", "Docker", "SQL (Postgres/SQLite)",
                "REST design", "Auth & Security", "Git/GitHub",
              ].map((skill, i) => (
                <span
                  key={i}
                  className="text-[12px] px-2 py-1 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-black/10 shadow-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-green-700" />
              <h3 className="font-semibold text-green-700">Education</h3>
            </div>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>
                <strong>Computer Science AP (2022–2025)</strong> – Zealand Academy
                <br />
                Focus: Game development, backend development, databases, and software architecture.
              </li>
            </ul>
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-green-700" />
              <h3 className="font-semibold text-green-700">Experience</h3>
            </div>
            <ul className="space-y-3 text-sm">
              <li>
                <p><strong>CreativeGround — Software Developer Intern</strong></p>
                <p className="text-gray-600">
                  Built an internal CRM (Next.js/Prisma), the backend for an internal document system (users can upload or write;
                  data stored in a database), and a Nexi Nets payment flow. Implemented role- and company-based access so users
                  only see documents for their own company. Also worked on Playwright-based scraping pipelines.
                </p>
              </li>
              <li>
                <p><strong>Circle K — Customer Service & Operations</strong></p>
                <p className="text-gray-600">
                  Strengthened communication, ownership, and problem solving in a busy environment — good habits for operations and support.
                </p>
              </li>
            </ul>
          </div>

          {/* Current interests */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-700" />
              <h3 className="font-semibold text-green-700">Currently interested in</h3>
            </div>
            <ul className="list-disc pl-6 space-y-1 text-sm">
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

// Contact window (keeps layout, adds cards, copy feedback, and quick actions)
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

  const mailto = `mailto:${email}?subject=${encodeURIComponent(
    "Hello Bekir"
  )}&body=${encodeURIComponent("Hi Bekir,\n\nI’d like to…\n\n—")}`;

  return (
    <div className="h-full w-full p-1">
      <Bevel className="p-4">
        <SectionTitle icon={Contact} color="purple">Contact</SectionTitle>

        {/* Small hint row */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 ring-1 ring-purple-200">
            Preferred: Email
          </span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200">
            Usually replies quickly
          </span>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Email */}
          <div className="rounded-md border border-purple-200 bg-white/90 shadow-sm p-3">
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-semibold text-gray-900 break-all">{email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={mailto}
                className="px-2 py-1 text-sm rounded bg-purple-600 text-white hover:bg-purple-700"
              >
                Write email
              </a>
              <button
                onClick={() => copy(email, "email")}
                className="px-2 py-1 text-sm rounded bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Phone */}
          <div className="rounded-md border border-purple-200 bg-white/90 shadow-sm p-3">
            <p className="text-xs text-gray-500">Phone</p>
            <a href={`tel:${phone.replace(/\s+/g, "")}`} className="font-semibold text-gray-900">
              {phone}
            </a>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="px-2 py-1 text-sm rounded bg-gray-800 text-white hover:bg-black"
              >
                Call
              </a>
              <button
                onClick={() => copy(phone, "phone")}
                className="px-2 py-1 text-sm rounded bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Links */}
          <div className="rounded-md border border-purple-200 bg-white/90 shadow-sm p-3">
            <p className="text-xs text-gray-500">Links</p>
            <div className="mt-1 space-y-1">
              <a
                href="https://www.linkedin.com/in/bekirsaliv02/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-blue-700 underline decoration-dotted hover:no-underline"
              >
                <LinkIcon className="w-4 h-4" />
                linkedin.com/in/bekirsaliv02
              </a>
              <br />
              <a
                href="https://github.com/souliN02"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-blue-700 underline decoration-dotted hover:no-underline"
              >
                <LinkIcon className="w-4 h-4" />
                github.com/souliN02
              </a>
            </div>
          </div>

          {/* CV */}
          <div className="rounded-md border border-purple-200 bg-white/90 shadow-sm p-3 sm:col-span-2 lg:col-span-1">
            <p className="text-xs text-gray-500">CV</p>
            <p className="text-gray-800">Need a quick overview?</p>
            <a
              href="/Bekir_CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block px-2 py-1 text-sm rounded bg-gray-800 text-white hover:bg-black"
            >
              Open CV (PDF)
            </a>
          </div>
        </div>

        {/* Copy feedback */}
        {copied && (
          <div
            className="mt-3 inline-flex items-center gap-2 text-xs px-2 py-1 rounded bg-green-100 text-green-800 ring-1 ring-green-200"
            aria-live="polite"
          >
            {copied === "email" ? "Email copied" : "Phone copied"}
          </div>
        )}
      </Bevel>
    </div>
  );
}
