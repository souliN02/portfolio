"use client";

import { useEffect, useRef, type ComponentType } from "react";
import { LogOut, Moon, Power, RotateCcw, Users } from "lucide-react";
import type { UiStrings } from "@/data/ui";
import { useStrings } from "@/lib/language";
import { XpFlag } from "@/components/ui/glyphs";

export type TurnOffChoice = "standby" | "turnoff" | "restart" | "switch" | "logoff";

interface TurnOffDialogProps {
  kind: "turnoff" | "logoff";
  onChoose: (choice: TurnOffChoice) => void;
  onCancel: () => void;
}

type Label = keyof Omit<UiStrings["turnOff"], "turnoffTitle" | "logoffTitle">;

const OPTIONS: Record<TurnOffDialogProps["kind"], { choice: TurnOffChoice; label: Label; icon: ComponentType<{ className?: string }>; color: string }[]> = {
  turnoff: [
    { choice: "standby", label: "standby", icon: Moon, color: "from-[#ffd86b] to-[#e0a100]" },
    { choice: "turnoff", label: "turnoff", icon: Power, color: "from-[#ff8a6a] to-[#d0321a]" },
    { choice: "restart", label: "restart", icon: RotateCcw, color: "from-[#8fe06a] to-[#2d9a1a]" },
  ],
  logoff: [
    { choice: "switch", label: "switchUser", icon: Users, color: "from-[#8ec5ff] to-[#1d62d8]" },
    { choice: "logoff", label: "logoff", icon: LogOut, color: "from-[#ffc46b] to-[#e07a00]" },
  ],
};

/** The XP "Turn off computer" and "Log Off Windows" dialogs */
export default function TurnOffDialog({ kind, onChoose, onCancel }: TurnOffDialogProps) {
  const first = useRef<HTMLButtonElement>(null);
  const strings = useStrings();
  const t = strings.turnOff;
  const title = kind === "turnoff" ? t.turnoffTitle : t.logoffTitle;
  useEffect(() => first.current?.focus(), []);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="w-[320px] max-w-full overflow-hidden rounded-[3px] shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
        <div className="flex h-[44px] items-center justify-between bg-gradient-to-b from-[#0a2a8e] to-[#00309c] px-3 text-[15px] text-white [font-family:var(--xp-title-font)]">
          {title}
          <XpFlag size={26} />
        </div>
        <div className="flex justify-evenly bg-gradient-to-b from-[#7c9ee8] to-[#5a7edc] px-3 pb-5 pt-6">
          {OPTIONS[kind].map((o, i) => (
            <button key={o.choice} ref={i === 0 ? first : undefined} type="button" className="group flex w-[80px] flex-col items-center gap-1.5 rounded text-[11px] text-white outline-none focus-visible:ring-1 focus-visible:ring-white" onClick={() => onChoose(o.choice)}>
              <span className={`grid h-[34px] w-[34px] place-items-center rounded-[4px] border border-white/80 bg-gradient-to-b ${o.color} shadow group-hover:brightness-110`}>
                <o.icon className="h-5 w-5 text-white" />
              </span>
              {t[o.label]}
            </button>
          ))}
        </div>
        <div className="flex h-[40px] items-center justify-end bg-gradient-to-b from-[#00309c] to-[#0a2a8e] px-3">
          <button type="button" className="xp-button" onClick={onCancel}>
            {strings.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
