"use client";

import { useState, useEffect, useRef } from "react";
import { Folder, FileText, Terminal, Contact, ChevronDown, Link as LinkIcon } from "lucide-react";

const ICON_SIZE = { w: 80, h: 90 };
const GRID = 20;

const icons = [
  { id: "cv", name: "Bekir's CV", icon: <FileText className="w-8 h-8 text-black" />, window: () => <CVWindow /> },
  { id: "projects", name: "Projekter", icon: <Folder className="w-8 h-8 text-black" />, window: () => <ProjectsWindow /> },
  { id: "about", name: "Om mig", icon: <Terminal className="w-8 h-8 text-black" />, window: () => <AboutWindow /> },
  { id: "contact", name: "Kontakt", icon: <Contact className="w-8 h-8 text-black" />, window: () => <ContactWindow /> },
];

function getDefaultIconPositions() {
  const startX = 24, startY = 24, spacingY = 110;
  const defaults = {};
  icons.forEach((ic, i) => {
    defaults[ic.id] = { x: startX, y: startY + i * spacingY };
  });
  return defaults;
}

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

  const onTaskbarAppClick = () => {
    setIsMinimized(false);
  };

  return (
    <div
      ref={containerRef}
      suppressHydrationWarning
      className="relative w-screen h-screen bg-[url('/xp-wallpaper.jpg')] bg-cover overflow-hidden font-sans select-none"
    >
      {showAudioPrompt && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-200/95 border border-yellow-400 text-yellow-900 px-4 py-2 rounded shadow-md z-50 animate-pulse transition-opacity duration-500 ${bootPlayed ? 'opacity-0' : 'opacity-100'}`}>
          Klik hvor som helst for at aktivere lyd
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

      {/* Desktop Icons */}
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
            Vis gitter
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
              <button onClick={onMinimize} className="w-6 h-6 grid place-items-center hover:bg-blue-700/80 rounded" title="Minimer">_</button>
              <button onClick={onToggleMaximize} className="w-6 h-6 grid place-items-center hover:bg-blue-700/80 rounded" title={isMaximized ? 'Gendan' : 'Maksimér'}>{isMaximized ? '❐' : '▢'}</button>
              <button onClick={onClose} className="w-6 h-6 grid place-items-center hover:bg-red-600/90 rounded" title="Luk">✕</button>
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

      {/* Global styles for animations so you don't touch globals.css */}
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

/** ---------- Fancier Projects (animated accordion + badges + thumbs) ---------- */
function ProjectsWindow() {
  const [openId, setOpenId] = useState(null);
  const panelRefs = useRef({}); // measure height for smooth max-height animation

  const projects = [
    {
      id: "crm-nextjs",
      title: "CRM-system i Next.js",
      period: "2025",
      accent: "from-blue-500 to-indigo-500",
      status: "In-Progress",
      thumb: "/globe.svg", // replace with screenshot later
      summary: "Et internt CRM bygget med Next.js og Prisma med roller, import-requests og webhook-mails.",
      details: [
        "Admin-/brugerroller, godkendelsesflow for import-forespørgsler, CSV-import til Leads/Customers.",
        "Webhook-modul der sender kvitteringer og interne notifikationer.",
        "Designet med enkle, produktive skærme (Admin, Imports, Leads/Customers).",
      ],
      tech: ["Next.js (App Router)", "Prisma", "NextAuth", "PostgreSQL/SQLite", "Tailwind"],
      links: [
        { label: "GitHub", href: "https://github.com/souliN02" },
      ],
    },
    {
      id: "unity-fps",
      title: "Multiplayer FPS i Unity",
      period: "2024–2025",
      accent: "from-emerald-500 to-teal-500",
      status: "Done",
      thumb: "/window.svg",
      summary: "Et FPS-projekt med netværkssynkronisering og gameplay-løkke.",
      details: [
        "Netcode, lobby, basic matchmaking og synkroniseret bevægelse/skyde-mekanik.",
        "Kort-rotation og simpel score/round-structure.",
      ],
      tech: ["Unity", "C#", "Netcode"],
      links: [],
    },
    {
      id: "playwright-scraper",
      title: "Webscraper med Playwright",
      period: "2025",
      accent: "from-orange-500 to-amber-500",
      status: "In-Progress",
      thumb: "/file.svg",
      summary: "Asynkron scraping af CVR-data med batch-kontrol og robust fejlhåndtering.",
      details: [
        "Kører i containere for parallel indsamling.",
        "Genoptager batches og logger fejl til genkørsel.",
      ],
      tech: ["Node.js/Python", "Playwright", "Docker"],
      links: [],
    },
    {
      id: "nexi-nets-payments",
      title: "Betalingssystem med Nexi Nets",
      period: "2025",
      accent: "from-fuchsia-500 to-pink-500",
      status: "Done",
      thumb: "/vercel.svg",
      summary: "Checkout + webhook-flows der sender kundekvittering og intern mail.",
      details: [
        "Validerer events, skriver audit-logs og genererer PDF/HTML-mails.",
        "Håndterer reservation vs. capture med tydelig kommunikation til kunden.",
      ],
      tech: ["Next.js", "Nodemailer", "Nexi Nets API"],
      links: [],
    },
  ];

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="h-full w-full p-1">
      <Bevel className="p-4">
        <SectionTitle icon={Folder} color="blue">Mine Projekter</SectionTitle>

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
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1">{p.summary}</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                  />
                </button>

                {/* Animated Panel */}
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
                        <p className="text-xs font-semibold mb-1">Højdepunkter</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {p.details.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-gray-200/80 bg-white/80 p-3">
                        <p className="text-xs font-semibold mb-2">Teknologi</p>
                        <div className="flex flex-wrap gap-2">
                          {p.tech.map((t, i) => (
                            <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-black/10 shadow-sm">
                              {t}
                            </span>
                          ))}
                        </div>
                        {p.links?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-3 pt-3">
                            {p.links.map((l, i) => (
                              <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-700 underline decoration-dotted hover:no-underline">
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

function AboutWindow() {
  return (
    <div className="h-full w-full p-1">
      <Bevel className="p-4">
        <SectionTitle icon={Terminal} color="green">Om Bekir</SectionTitle>
        <div className="text-gray-800 leading-relaxed space-y-3">
          <p>
            Jeg er nyuddannet datamatiker med passion for{" "}
            <span className="font-semibold text-green-700">backend</span>,{" "}
            <span className="font-semibold text-green-700">sikkerhed</span> og{" "}
            <span className="font-semibold text-green-700">automatisering</span>.
          </p>
          <p>
            Jeg elsker at løse komplekse problemer, lære nye teknologier og bygge løsninger, der er både
            effektive og brugervenlige—med fokus på kvalitet og stabilitet.
          </p>
        </div>
      </Bevel>
    </div>
  );
}

function ContactWindow() {
  return (
    <div className="h-full w-full p-1">
      <Bevel className="p-4">
        <SectionTitle icon={Contact} color="purple">Kontakt</SectionTitle>
        <div className="space-y-2 text-gray-800">
          <p>
            <span className="font-semibold">📱 Telefon:</span>{" "}
            <a href="tel:+4522560477" className="underline decoration-dotted hover:no-underline">
              +45 22560477
            </a>
          </p>
          <p>
            <span className="font-semibold">📧 Email:</span>{" "}
            <a href="mailto:bekirsaliv1@gmail.com" className="text-blue-700 underline decoration-dotted hover:no-underline">
              bekirsaliv1@gmail.com
            </a>
          </p>
          <p>
            <span className="font-semibold">🔗 LinkedIn:</span>{" "}
            <a href="https://www.linkedin.com/in/bekirsaliv02/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline decoration-dotted hover:no-underline">
              linkedin.com/in/bekirsaliv02
            </a>
          </p>
          <p>
            <span className="font-semibold">💻 GitHub:</span>{" "}
            <a href="https://github.com/souliN02" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline decoration-dotted hover:no-underline">
              github.com/souliN02
            </a>
          </p>
        </div>
      </Bevel>
    </div>
  );
}
