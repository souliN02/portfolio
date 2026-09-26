"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { APPS } from "@/data/apps";
import { PROFILE } from "@/data/profile";
import { blockIdle } from "@/lib/idle";
import { StatusBar, ToolButton, Toolbar } from "./ExplorerChrome";

export default function CvViewer() {
  // Many phone browsers can't show a PDF inside a page; offer to open it instead
  const [inlinePdf, setInlinePdf] = useState(true);
  const releaseIdle = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (navigator.pdfViewerEnabled === false) setInlinePdf(false);
    return () => releaseIdle.current?.();
  }, []);

  return (
    <div className="flex h-full flex-col text-[11px]">
      <Toolbar>
        <ToolButton icon={<ExternalLink className="h-4 w-4 text-[#3a64b8]" />} label="Open in new tab" onClick={() => window.open(PROFILE.cvPath, "_blank", "noopener")} />
        <a href={PROFILE.cvPath} download="Bekir_Saliv_CV.pdf" className="xp-tool shrink-0" aria-label="Download">
          <Download className="h-4 w-4 text-[#2a8c12]" />
          <span className="hidden @md:inline">Download</span>
        </a>
      </Toolbar>
      <div
        className="min-h-0 flex-1 bg-[#7a7a7a]"
        onPointerEnter={() => {
          releaseIdle.current?.();
          releaseIdle.current = blockIdle();
        }}
        onPointerLeave={() => {
          releaseIdle.current?.();
          releaseIdle.current = null;
        }}
      >
        {inlinePdf ? (
          <iframe src={PROFILE.cvPath} title="Bekir's CV" className="h-full w-full border-0" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-white p-4 text-center text-[12px] text-[#333]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={APPS.cv.icon} alt="" width={48} height={48} draggable={false} />
            <p>This browser can&apos;t preview PDFs inside the page.</p>
            <a href={PROFILE.cvPath} target="_blank" rel="noopener noreferrer" className="xp-button inline-flex items-center font-bold">
              Open Bekir_CV.pdf
            </a>
          </div>
        )}
      </div>
      <StatusBar>
        <span className="flex-1">Bekir_CV.pdf</span>
        <span>PDF Document</span>
      </StatusBar>
    </div>
  );
}
