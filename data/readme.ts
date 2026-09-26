import { hostOf } from "@/lib/text";
import { SITE_URL } from "./profile";
import { FLAGSHIP, primaryLink, projectsInGroup } from "./projects";

/** readme.txt, shown in Notepad and by `cat readme.txt` in the terminal */
export function readmeText(touch = false): string {
  const building = projectsInGroup("building");
  const pad = Math.max(...building.map((p) => p.title.length));
  const flagshipLink = primaryLink(FLAGSHIP);

  return `readme.txt
==============================

Welcome to Bekir Saliv's portfolio.

I'm a full-stack developer from Næstved, Denmark, working
with React, Next.js, TypeScript, Python and C#. I build
production software AI-first, using Claude every day as a
core part of how I develop.

Getting around:
  - ${touch ? "Tap" : "Double-click"} the desktop icons, or use the Start menu.
  - "My Projects" has my featured and current work.
  - "About Me" has the full bio, skills, and experience.
  - "Contact" sends an e-mail straight to my inbox.
  - Windows can be dragged, resized, minimized and stacked.
  - ${touch ? "Long-press" : "Right-click"} the desktop for more options.
  - Prefer plain text? ${hostOf(SITE_URL)}/simple

Currently building:
${building.map((p) => `  - ${p.title.padEnd(pad)} : ${p.tagline}`).join("\n")}

Flagship:
  - ${FLAGSHIP.title} (Fleeca, formerly CreativeGround)${flagshipLink ? ` -> ${hostOf(flagshipLink.href)}` : ""}

Thanks for stopping by.
- Bekir
`;
}
