"use client";

import { readmeText } from "@/data/readme";
import { useLang, useStrings } from "@/lib/language";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { MenuBar } from "./ExplorerChrome";

export default function Notepad() {
  const { touch } = useDesktop();
  const lang = useLang();
  const t = useStrings();
  return (
    <div className="flex h-full flex-col bg-white">
      <MenuBar items={t.menus.notepad} />
      <label htmlFor="notepad-text" className="sr-only">
        readme.txt
      </label>
      <textarea
        id="notepad-text"
        readOnly
        value={readmeText(touch, lang)}
        spellCheck={false}
        className="min-h-0 w-full flex-1 resize-none bg-white p-2 font-mono text-[12px] leading-5 text-black outline-none"
      />
    </div>
  );
}
