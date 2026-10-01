import type { Lang } from "@/lib/i18n";

export const APP_IDS = [
  "projects",
  "about",
  "cv",
  "contact",
  "ie",
  "terminal",
  "notepad",
  "games",
  "minesweeper",
  "solitaire",
  "spider",
  "freecell",
  "hearts",
  "recycle",
] as const;

export type AppId = (typeof APP_IDS)[number];

export interface AppMeta {
  title: string;
  /** Label under the desktop icon and in the Start menu */
  label: string;
  /** Start menu second line */
  desc: string;
  icon: string;
  w: number;
  h: number;
  /** Dialogs (System Properties) have no minimize/maximize and a fixed size */
  dialog?: boolean;
  resizable?: boolean;
  maximizable?: boolean;
}

const XP = (name: string) => `/xp-icons/${name}.ico`;
const EXTRA = (name: string) => `/xp-icons/extra/${name}.svg`;

export const APPS: Record<AppId, AppMeta> = {
  projects: { title: "My Projects", label: "My Projects", desc: "Featured and current work", icon: XP("My Computer"), w: 800, h: 580 },
  about: { title: "System Properties", label: "About Me", desc: "Bio, skills, experience", icon: XP("User 1"), w: 500, h: 560, dialog: true },
  cv: { title: "Bekir_CV.pdf", label: "Bekir's CV", desc: "Open résumé (PDF)", icon: XP("My Profile Folder"), w: 720, h: 560 },
  contact: { title: "New Message", label: "Contact", desc: "Send me an e-mail", icon: EXTRA("mail"), w: 680, h: 540 },
  ie: { title: "Internet Explorer", label: "Internet Explorer", desc: "Browse my live projects", icon: EXTRA("ie"), w: 940, h: 640 },
  terminal: { title: "Command Prompt", label: "Terminal", desc: "Command line", icon: EXTRA("cmd"), w: 680, h: 440 },
  notepad: { title: "readme.txt - Notepad", label: "readme.txt", desc: "Welcome note", icon: XP("List File"), w: 560, h: 460 },
  games: { title: "Games", label: "Games", desc: "Solitaire, FreeCell and more", icon: XP("Game Controller"), w: 560, h: 420 },
  minesweeper: { title: "Minesweeper", label: "Minesweeper", desc: "Find the mines", icon: XP("Minesweeper"), w: 320, h: 440, resizable: false, maximizable: false },
  solitaire: { title: "Solitaire", label: "Solitaire", desc: "The classic card game", icon: EXTRA("solitaire"), w: 640, h: 540 },
  spider: { title: "Spider Solitaire", label: "Spider Solitaire", desc: "Two decks, ten piles", icon: EXTRA("spider"), w: 780, h: 580 },
  freecell: { title: "FreeCell", label: "FreeCell", desc: "Every deal numbered", icon: XP("Freecell"), w: 640, h: 540 },
  hearts: { title: "Hearts", label: "Hearts", desc: "Avoid the Queen of Spades", icon: XP("Hearts"), w: 640, h: 580 },
  recycle: { title: "Recycle Bin", label: "Recycle Bin", desc: "Deleted items", icon: EXTRA("recycle-full"), w: 680, h: 440 },
};

/** Danish wording for the language bar. The games keep their English names, since the games themselves stay English */
const APPS_DA: Record<AppId, Pick<AppMeta, "title" | "label" | "desc">> = {
  projects: { title: "Mine projekter", label: "Mine projekter", desc: "Udvalgte og aktuelle projekter" },
  about: { title: "Systemegenskaber", label: "Om mig", desc: "Bio, kompetencer, erfaring" },
  cv: { title: "Bekir_CV.pdf", label: "Bekirs CV", desc: "Åbn CV (PDF, på engelsk)" },
  contact: { title: "Ny meddelelse", label: "Kontakt", desc: "Send mig en e-mail" },
  ie: { title: "Internet Explorer", label: "Internet Explorer", desc: "Se mine live-projekter" },
  terminal: { title: "Kommandoprompt", label: "Terminal", desc: "Kommandolinje (engelsk)" },
  notepad: { title: "readme.txt - Notesblok", label: "readme.txt", desc: "Velkomstbesked" },
  games: { title: "Spil", label: "Spil", desc: "Solitaire, FreeCell og flere" },
  minesweeper: { title: "Minesweeper", label: "Minesweeper", desc: "Find minerne" },
  solitaire: { title: "Solitaire", label: "Solitaire", desc: "Det klassiske kortspil" },
  spider: { title: "Spider Solitaire", label: "Spider Solitaire", desc: "To kortspil, ti bunker" },
  freecell: { title: "FreeCell", label: "FreeCell", desc: "Hvert spil er nummereret" },
  hearts: { title: "Hearts", label: "Hearts", desc: "Undgå spar dame" },
  recycle: { title: "Papirkurv", label: "Papirkurv", desc: "Slettede elementer" },
};

const APPS_IN_DA = Object.fromEntries(APP_IDS.map((id) => [id, { ...APPS[id], ...APPS_DA[id] }])) as Record<AppId, AppMeta>;

/** APPS with titles, labels and descriptions in the desktop's language */
export function appsFor(lang: Lang): Record<AppId, AppMeta> {
  return lang === "da" ? APPS_IN_DA : APPS;
}

export const RECYCLE_EMPTY_ICON = EXTRA("recycle-empty");

/** Everything in the Games folder, in the order XP's Games menu listed them */
export const GAMES = ["freecell", "hearts", "minesweeper", "solitaire", "spider"] as const satisfies readonly AppId[];

/** Icons in the desktop's left-hand column(s), top to bottom */
export const DESKTOP_ICONS: AppId[] = ["projects", "about", "cv", "contact", "ie", "terminal", "notepad", "games"];

/** Recycle Bin sits in the bottom-right corner, as on a real XP desktop */
export const CORNER_ICON: AppId = "recycle";

export function isAppId(value: string): value is AppId {
  return (APP_IDS as readonly string[]).includes(value);
}

/** Names people might type in a deep link or the terminal */
export const APP_ALIASES: Record<string, AppId> = {
  projects: "projects",
  project: "projects",
  work: "projects",
  explorer: "projects",
  about: "about",
  me: "about",
  cv: "cv",
  resume: "cv",
  contact: "contact",
  mail: "contact",
  email: "contact",
  outlook: "contact",
  ie: "ie",
  iexplore: "ie",
  internet: "ie",
  browser: "ie",
  // MSN Messenger was merged into Contact; old links still land somewhere useful
  messenger: "contact",
  msn: "contact",
  chat: "contact",
  message: "contact",
  terminal: "terminal",
  cmd: "terminal",
  notepad: "notepad",
  readme: "notepad",
  games: "games",
  game: "games",
  minesweeper: "minesweeper",
  mines: "minesweeper",
  winmine: "minesweeper",
  solitaire: "solitaire",
  sol: "solitaire",
  klondike: "solitaire",
  spider: "spider",
  spidersolitaire: "spider",
  freecell: "freecell",
  hearts: "hearts",
  mshearts: "hearts",
  recycle: "recycle",
  bin: "recycle",
  trash: "recycle",
};

export function resolveApp(name: string): AppId | undefined {
  return APP_ALIASES[name.toLowerCase()];
}
