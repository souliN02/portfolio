"use client";

import { useState, useEffect, useRef } from "react";
import { Folder, FileText, Terminal, Contact } from "lucide-react";

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
  const [windowSize, setWindowSize] = useState({ w: 600, h: 400 });
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
    const MIN_W = 360, MIN_H = 240;
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
    <div ref={containerRef} suppressHydrationWarning className="relative w-screen h-screen bg-[url('/xp-wallpaper.jpg')] bg-cover overflow-hidden font-sans select-none">
      {showAudioPrompt && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-200 border border-yellow-400 text-yellow-900 px-4 py-2 rounded shadow-md z-50 animate-pulse transition-opacity duration-500 ${bootPlayed ? 'opacity-0' : 'opacity-100'}`}>
          Klik hvor som helst for at aktivere lyd
        </div>
      )}

      {showGrid && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 1px, transparent 1px, transparent ${GRID}px), repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 1px, transparent 1px, transparent ${GRID}px)`,
            opacity: 0.35,
          }}
        />
      )}

      <div className="absolute inset-0">
        {icons.map((icon) => {
          const pos = iconPositions[icon.id] || { x: 24, y: 24 };
          return (
            <div
              key={icon.id}
              style={{ left: `${pos.x}px`, top: `${pos.y}px`, width: `${ICON_SIZE.w}px`, transition: 'left 60ms linear, top 60ms linear' }}
              onMouseDown={(e) => onIconMouseDown(e, icon.id)}
              onDoubleClick={() => handleDoubleClick(icon.id)}
              className="absolute flex flex-col items-center cursor-pointer text-white hover:opacity-80"
            >
              <div className="bg-white p-2 rounded shadow-md">{icon.icon}</div>
              <span className="text-sm text-center mt-1 bg-blue-700 bg-opacity-60 px-1 rounded select-none">
                {icon.name}
              </span>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-10 bg-blue-800 flex items-center px-2 sm:px-4 text-white font-bold gap-2">
        <div className="bg-blue-500 px-3 py-1 rounded cursor-default">Start</div>
        {openWindow && (
          <button
            onClick={onTaskbarAppClick}
            className={`px-2 py-1 rounded border border-blue-400 bg-blue-600 hover:bg-blue-500 ${isMinimized ? '' : 'ring-2 ring-white/40'}`}
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

      {openWindow && !isMinimized && (
        <div
          ref={windowRef}
          style={{ top: `${windowPos.y}px`, left: `${windowPos.x}px`, width: `${windowSize.w}px`, height: `${windowSize.h}px` }}
          className={`absolute z-20 bg-gray-100 border-2 border-gray-700 shadow-xl flex flex-col ${isMaximized ? 'rounded-none' : ''}`}
        >
          <div
            onMouseDown={onWindowMouseDown}
            className="bg-blue-800 text-white px-2 sm:px-3 py-1 font-bold flex items-center justify-between cursor-move select-none"
          >
            <span className="truncate pr-2">{openWindow.name}</span>
            <div className="flex items-center gap-1">
              <button onClick={onMinimize} className="w-6 h-6 grid place-items-center hover:bg-blue-700 rounded" title="Minimer">_</button>
              <button onClick={onToggleMaximize} className="w-6 h-6 grid place-items-center hover:bg-blue-700 rounded" title={isMaximized ? 'Gendan' : 'Maksimér'}>{isMaximized ? '❐' : '▢'}</button>
              <button onClick={onClose} className="w-6 h-6 grid place-items-center hover:bg-red-600 rounded" title="Luk">✕</button>
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
        "bg-gradient-to-b from-gray-50 to-gray-200",
        "shadow-inner",
        "rounded-sm",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, color = "blue", children }) {
  const colorMap = {
    blue: "from-blue-600 to-blue-500 border-blue-300",
    green: "from-green-600 to-green-500 border-green-300",
    purple: "from-purple-600 to-purple-500 border-purple-300",
  };
  const colors = colorMap[color] || colorMap.blue;
  return (
    <div className={`mb-3`}>
      <div className={`text-white text-sm font-semibold px-3 py-1 rounded-t-sm bg-gradient-to-r ${colors}`}>
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

function ProjectsWindow() {
  return (
    <div className="h-full w-full p-1">
      <Bevel className="p-4">
        <SectionTitle icon={Folder} color="blue">Mine Projekter</SectionTitle>
        <ul className="space-y-2 text-gray-800">
          <li className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/70 transition">
            <Folder className="w-4 h-4 text-blue-700" />
            <span>Multiplayer FPS i Unity</span>
          </li>
          <li className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/70 transition">
            <Folder className="w-4 h-4 text-blue-700" />
            <span>Webscraper med Playwright</span>
          </li>
          <li className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/70 transition">
            <Folder className="w-4 h-4 text-blue-700" />
            <span>Betalingssystem med Nexi Nets</span>
          </li>
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
            <a
              href="https://www.linkedin.com/in/bekirsaliv02/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline decoration-dotted hover:no-underline"
            >
              linkedin.com/in/bekirsaliv02
            </a>
          </p>
          <p>
            <span className="font-semibold">💻 GitHub:</span>{" "}
            <a
              href="https://github.com/souliN02"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline decoration-dotted hover:no-underline"
            >
              github.com/souliN02
            </a>
          </p>
        </div>
      </Bevel>
    </div>
  );
}
