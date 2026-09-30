import type { Lang } from "@/lib/i18n";
import { hostOf } from "@/lib/text";
import { SITE_URL } from "./profile";
import { FLAGSHIP, localizeProject, primaryLink, projectsFor } from "./projects";

/** readme.txt, shown in Notepad and by `cat readme.txt` in the terminal (always English there) */
export function readmeText(touch = false, lang: Lang = "en"): string {
  const building = projectsFor(lang).filter((p) => p.group === "building");
  const pad = Math.max(...building.map((p) => p.title.length));
  const buildingLines = building.map((p) => `  - ${p.title.padEnd(pad)} : ${p.tagline}`).join("\n");
  const flagship = localizeProject(FLAGSHIP, lang);
  const flagshipLink = primaryLink(FLAGSHIP);
  const to = flagshipLink ? ` -> ${hostOf(flagshipLink.href)}` : "";
  const plain = `${hostOf(SITE_URL)}/simple`;

  if (lang === "da") {
    return `readme.txt
==============================

Velkommen til Bekir Salivs portfolio.

Jeg er full-stack-udvikler fra Næstved og arbejder med
React, Next.js, TypeScript, Python og C#. Jeg bygger
produktionssoftware AI-first og bruger Claude hver dag
som en fast del af min udvikling.

Sådan kommer du rundt:
  - ${touch ? "Tryk på" : "Dobbeltklik på"} ikonerne, eller brug menuen Start.
  - "Mine projekter" viser mit udvalgte og aktuelle arbejde.
  - "Om mig" har min bio, mine kompetencer og min erfaring.
  - "Kontakt" sender en e-mail direkte til min indbakke.
  - Vinduer kan trækkes, ændres, minimeres og stables.
  - ${touch ? "Hold fingeren på" : "Højreklik på"} skrivebordet for flere muligheder.
  - Klik på DA i proceslinjen for at skifte til engelsk.
  - Foretrækker du ren tekst? ${plain} (på engelsk)

Under udvikling lige nu:
${buildingLines}

Flagskib:
  - ${flagship.title} (Fleeca, tidligere CreativeGround)${to}

Tak fordi du kiggede forbi.
- Bekir
`;
  }

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
  - Click EN in the taskbar to read it all in Danish.
  - Prefer plain text? ${plain}

Currently building:
${buildingLines}

Flagship:
  - ${flagship.title} (Fleeca, formerly CreativeGround)${to}

Thanks for stopping by.
- Bekir
`;
}
