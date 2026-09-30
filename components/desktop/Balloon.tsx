"use client";

import { useStrings } from "@/lib/language";
import { CloseGlyph, InfoIcon } from "@/components/ui/glyphs";

interface BalloonProps {
  title: string;
  text: string;
  onClick: () => void;
  onClose: () => void;
}

/** XP notification-area balloon tip */
export default function Balloon({ title, text, onClick, onClose }: BalloonProps) {
  const t = useStrings();
  return (
    <div role="status" className="xp-balloon absolute bottom-[40px] right-[6px] z-50 w-[290px] max-w-[calc(100vw-12px)] whitespace-normal">
      <button type="button" className="block w-full px-3 pb-3 pt-2 text-left" onClick={onClick}>
        <span className="flex items-center gap-2 pr-5 font-bold">
          <InfoIcon size={16} />
          {title}
        </span>
        <span className="mt-1.5 block leading-snug">{text}</span>
      </button>
      <button type="button" aria-label={t.close} className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-sm border border-[#aca899] text-[#555] hover:bg-[#e04343] hover:text-white" onClick={onClose}>
        <span className="scale-75">
          <CloseGlyph />
        </span>
      </button>
    </div>
  );
}
