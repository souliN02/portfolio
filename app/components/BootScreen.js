"use client";

import { useState, useEffect, useRef } from "react";

export default function BootScreen({ onFinished }) {
  const [fadeOut, setFadeOut] = useState(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  // After ~3.5s, start fade out
  useEffect(() => {
    const t = setTimeout(() => setFadeOut(true), 3500);
    return () => clearTimeout(t);
  }, []);

  // When faded out, notify parent
  useEffect(() => {
    if (fadeOut) {
      const t = setTimeout(() => onFinishedRef.current?.(), 700);
      return () => clearTimeout(t);
    }
  }, [fadeOut]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Name */}
        <p className="text-white/50 text-sm tracking-[0.35em] uppercase"
          style={{ fontFamily: "Tahoma, Arial, sans-serif" }}>
          Bekir Saliv
        </p>

        {/* Logo row */}
        <div className="flex items-center gap-4">
          <svg width={56} height={56} viewBox="0 0 100 100" fill="none">
            <path d="M2 2 C20 8, 35 2, 46 2 L46 46 C35 46, 20 40, 2 46 Z" fill="#FF0000" />
            <path d="M54 2 C65 2, 80 8, 98 2 L98 46 C80 40, 65 46, 54 46 Z" fill="#00B300" />
            <path d="M2 54 C20 60, 35 54, 46 54 L46 98 C35 98, 20 92, 2 98 Z" fill="#0058E6" />
            <path d="M54 54 C65 54, 80 60, 98 54 L98 98 C80 92, 65 98, 54 98 Z" fill="#FFB900" />
          </svg>
          <div>
            <p className="text-white text-2xl font-bold tracking-wide"
              style={{ fontFamily: "Tahoma, Arial, sans-serif" }}>
              Portfolio
              <span className="text-[#FF6600] ml-1.5 font-extrabold italic">XP</span>
            </p>
            <p className="text-white/40 text-xs tracking-[0.15em]"
              style={{ fontFamily: "Tahoma, Arial, sans-serif" }}>
              Developer Edition
            </p>
          </div>
        </div>

        {/* Original XP loading animation */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/db6dw1k-47c4d90d-f5b5-4b31-a06e-2c2c0dc30501-ezgif.com-crop.gif"
          alt="Loading"
          className="mt-6"
          draggable={false}
        />
      </div>

      <p className="absolute bottom-6 text-white/20 text-[10px]">
        Bekir Saliv &middot; Portfolio Edition
      </p>
    </div>
  );
}
