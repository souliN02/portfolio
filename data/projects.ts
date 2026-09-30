import { localizePeriod, type Lang } from "@/lib/i18n";

export type ProjectGroupId = "professional" | "building" | "personal";

export interface ProjectLink {
  label: string;
  href: string;
  kind: "live" | "source" | "release";
}

export interface ProjectImage {
  src: string;
  alt: string;
}

export interface Project {
  id: string;
  group: ProjectGroupId;
  title: string;
  period: string;
  /** Short status shown on tiles and in the terminal, e.g. "Production" */
  status: string;
  /** Explorer tile icon */
  icon: string;
  /** One line for tiles, the terminal, and link previews */
  tagline: string;
  /** Explorer shows a Flagship badge first on its own, from `flagship` */
  badges: string[];
  summary: string;
  details: string[];
  tech: string[];
  links: ProjectLink[];
  image?: ProjectImage;
  /** Phone screenshots, shown as a strip */
  media?: ProjectImage[];
  /** Live URL that allows being framed, so it can open inside Internet Explorer */
  frameUrl?: string;
  flagship?: boolean;
  /** The Danish wording, for the language bar. Keep it in step with the English (lib/i18n.test.ts checks) */
  da: ProjectCopy;
}

export interface ProjectCopy {
  /** Only when the name itself translates */
  title?: string;
  status: string;
  tagline: string;
  badges: string[];
  summary: string;
  details: string[];
  imageAlt?: string;
  mediaAlts?: string[];
}

export const PROJECT_GROUPS: { id: ProjectGroupId; label: string; da: string }[] = [
  { id: "professional", label: "Fleeca, formerly CreativeGround (Professional)", da: "Fleeca, tidligere CreativeGround (professionelt)" },
  { id: "building", label: "Currently building", da: "Under udvikling lige nu" },
  { id: "personal", label: "Personal projects", da: "Personlige projekter" },
];

const ICON = (name: string) => `/xp-icons/${name}.ico`;

export const PROJECTS: Project[] = [
  {
    id: "nordesk",
    group: "professional",
    title: "Nordesk CRM",
    period: "2025",
    status: "Production",
    icon: ICON("Manage your Server"),
    tagline: "Custom CRM built end to end, solo, AI-first",
    badges: ["Production"],
    flagship: true,
    summary:
      "A custom CRM I built end to end, solo, at Fleeca (formerly CreativeGround). Shipped to production with Claude as my primary development partner.",
    details: [
      "Owned the whole build: scoping, UI implementation, server-side logic, and deployment.",
      "Complex UI workflows: forms, tables, filters, and frontend state management.",
      "A real example of AI-assisted development shipping production software, with me owning the quality of what shipped.",
    ],
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "REST APIs"],
    links: [{ label: "nordeskcrm.com", href: "https://nordeskcrm.com", kind: "live" }],
    da: {
      status: "I produktion",
      tagline: "Skræddersyet CRM bygget fra ende til anden, alene, AI-first",
      badges: ["I produktion"],
      summary:
        "Et skræddersyet CRM, jeg byggede fra ende til anden, alene, hos Fleeca (tidligere CreativeGround). Sat i produktion med Claude som min primære udviklingspartner.",
      details: [
        "Ejede hele udviklingen: afgrænsning, UI, serverlogik og udrulning.",
        "Komplekse UI-flows: formularer, tabeller, filtre og state management i frontend.",
        "Et konkret eksempel på AI-assisteret udvikling, der leverer produktionssoftware, hvor jeg står inde for kvaliteten af det, der blev leveret.",
      ],
    },
  },
  {
    id: "cvr",
    group: "professional",
    title: "CVR Data Integration Tool",
    period: "2025",
    status: "Production",
    icon: ICON("Network Computers"),
    tagline: "Python integration feeding Danish CVR data into Nordesk",
    badges: ["Production", "Integration"],
    summary:
      "A Python tool built alongside Nordesk that integrates the Danish CVR business registry and feeds normalized company data into the CRM for lead generation.",
    details: [
      "Ingested and normalized company data across inconsistent schemas.",
      "Handled messy third-party data: malformed responses, missing fields, and rate limits.",
      "Automated a previously manual process and routed clean data into Nordesk's workflows.",
    ],
    tech: ["Python", "REST APIs", "Data normalization"],
    links: [],
    da: {
      title: "CVR-integrationsværktøj",
      status: "I produktion",
      tagline: "Python-integration, der fører CVR-data ind i Nordesk",
      badges: ["I produktion", "Integration"],
      summary:
        "Et Python-værktøj bygget sammen med Nordesk, der integrerer CVR-registret og fører normaliserede virksomhedsdata ind i CRM'et til leadgenerering.",
      details: [
        "Indlæste og normaliserede virksomhedsdata på tværs af uensartede skemaer.",
        "Håndterede rodede tredjepartsdata: fejlbehæftede svar, manglende felter og rate limits.",
        "Automatiserede en tidligere manuel proces og sendte rene data videre ind i Nordesks arbejdsgange.",
      ],
    },
  },
  {
    id: "linedrift",
    group: "building",
    title: "LineDrift",
    period: "2026",
    status: "Live",
    icon: ICON("Monitor"),
    tagline: "Football odds tracker with a no-vig value engine",
    badges: ["Data pipeline", "Building", "Live"],
    image: { src: "/linedrift-dashboard.png", alt: "LineDrift dashboard screenshot" },
    frameUrl: "https://linedrift.bekirsaliv.dk",
    summary:
      "A football odds tracker that builds its own historical dataset under a hard constraint of 500 free API credits a month. A scheduled job snapshots bookmaker odds into Postgres every 4 hours, then pure, unit-tested functions compute no-vig fair probabilities and flag prices that beat the market consensus across the Premier League, Danish Superliga, and 2026 FIFA World Cup. An educational analytics and data-engineering project, not a betting product.",
    details: [
      "Constraint-driven data pipeline, not a demo: free odds APIs only expose the current price, so a scheduled GitHub Actions job snapshots odds every 4 hours to build its own history, all inside a 500-credit/month budget that every architectural decision falls out of.",
      "No-vig value engine written test-first as pure functions: implied probability, overround (vig), no-vig fair probabilities, market consensus across 3 or more books, and edge-vs-consensus value flags.",
      "Data integrity by design: odds stored as Postgres numeric (never float) to avoid rounding drift, with Zod validating every external API response at a single boundary.",
      "React Server Components read the database directly, so there is no client fetching on first paint, and GitHub Actions runs the scheduled ingestion because Vercel Hobby cron is limited to daily runs.",
      "Proof it holds up: strict TypeScript with no any, 111 tests, CI (lint, typecheck, test, build) green on every PR, and Lighthouse 94 to 100 across performance, accessibility, best practices, and SEO.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind + shadcn/ui", "Drizzle ORM", "Neon Postgres", "Zod", "Recharts", "Vitest", "GitHub Actions"],
    links: [
      { label: "Live demo", href: "https://linedrift.bekirsaliv.dk", kind: "live" },
      { label: "GitHub", href: "https://github.com/souliN02/linedrift", kind: "source" },
    ],
    da: {
      status: "Live",
      tagline: "Odds-tracker til fodbold med en no-vig value-motor",
      badges: ["Datapipeline", "Under udvikling", "Live"],
      imageAlt: "Skærmbillede af LineDrift-dashboardet",
      summary:
        "En odds-tracker til fodbold, der opbygger sit eget historiske datasæt inden for en hård grænse på 500 gratis API-kreditter om måneden. Et planlagt job gemmer bookmakernes odds i Postgres hver 4. time, og rene, enhedstestede funktioner beregner derefter no-vig fair-sandsynligheder og markerer priser, der slår markedets konsensus i Premier League, Superligaen og VM 2026. Et læringsprojekt inden for analyse og data engineering, ikke et bettingprodukt.",
      details: [
        "En datapipeline drevet af begrænsninger, ikke en demo: gratis odds-API'er viser kun den aktuelle pris, så et planlagt GitHub Actions-job gemmer odds hver 4. time for at opbygge sin egen historik, alt sammen inden for et budget på 500 kreditter om måneden, som hver arkitekturbeslutning udspringer af.",
        "No-vig value-motor skrevet test-first som rene funktioner: implicit sandsynlighed, overround (vig), no-vig fair-sandsynligheder, markedskonsensus på tværs af 3 eller flere bookmakere og value-markeringer ud fra afvigelsen fra konsensus.",
        "Dataintegritet fra starten: odds gemmes som Postgres numeric (aldrig float) for at undgå afrundingsfejl, og Zod validerer alle svar fra eksterne API'er ved én enkelt grænse.",
        "React Server Components læser direkte fra databasen, så klienten ikke henter data ved første visning, og GitHub Actions kører den planlagte indlæsning, fordi cron på Vercel Hobby er begrænset til én kørsel om dagen.",
        "Bevis for, at det holder: strict TypeScript uden any, 111 tests, CI (lint, typecheck, test, build) grøn på hver PR og Lighthouse 94 til 100 på performance, tilgængelighed, best practices og SEO.",
      ],
    },
  },
  {
    id: "risk",
    group: "building",
    title: "Risk (Multiplayer)",
    period: "2026",
    status: "Live",
    icon: ICON("Game Controller"),
    tagline: "Real-time multiplayer Risk over Socket.IO",
    badges: ["Building", "Live"],
    frameUrl: "https://risk-game-seven.vercel.app",
    summary: "A real-time multiplayer Risk board game with lobbies, classic rules, and a dark UI.",
    details: [
      "Real-time gameplay over Socket.IO with lobby creation and joining.",
      "Classic Risk rules across reinforcement, attack, and fortify phases.",
      "Dark, focused UI built for fast multiplayer sessions.",
    ],
    tech: ["Next.js", "Socket.IO", "TypeScript"],
    links: [
      { label: "Live demo", href: "https://risk-game-seven.vercel.app", kind: "live" },
      { label: "GitHub", href: "https://github.com/souliN02/risk-game", kind: "source" },
    ],
    da: {
      title: "Risk (multiplayer)",
      status: "Live",
      tagline: "Risk for flere spillere i realtid over Socket.IO",
      badges: ["Under udvikling", "Live"],
      summary: "Brætspillet Risk for flere spillere i realtid, med lobbyer, klassiske regler og et mørkt UI.",
      details: [
        "Gameplay i realtid over Socket.IO, hvor man kan oprette og deltage i lobbyer.",
        "Klassiske Risk-regler med forstærknings-, angrebs- og befæstningsfaser.",
        "Mørkt, fokuseret UI bygget til hurtige spil med flere spillere.",
      ],
    },
  },
  {
    id: "setsaga",
    group: "personal",
    title: "SetSaga",
    period: "2026",
    status: "v0.1.0",
    icon: ICON("Phone"),
    tagline: "Gamified, offline-first workout tracker (mobile)",
    badges: ["Mobile", "Offline-first", "v0.1.0"],
    summary:
      "A gamified, offline-first workout tracker for Android and iOS, built solo. Log sets, reps and weight; the app turns consistency into XP, levels, streaks, badges and automatically detected personal records.",
    details: [
      "Local-first by design: all data lives in SQLite on the phone. No accounts, no backend, no network calls. Database migrations are bundled and applied on-device.",
      "The gamification engine is pure functions built test-first (211 tests), and all XP, streak, and badge state is derived from the workout data rather than stored, so it can never drift out of sync.",
      "Crash-safe write-through logging: every set is persisted the moment it is confirmed, so killing the app mid-workout loses nothing.",
      'Built AI-first with Claude Code in six planned phases, one PR per phase, CI green on every merge. The README has an "Engineering decisions" section written for technical reviewers.',
    ],
    tech: ["Expo / React Native", "TypeScript (strict)", "SQLite + Drizzle ORM", "Zustand", "Victory Native", "jest-expo", "GitHub Actions"],
    links: [
      { label: "GitHub", href: "https://github.com/souliN02/setsaga", kind: "source" },
      { label: "APK release (v0.1.0)", href: "https://github.com/souliN02/setsaga/releases/tag/v0.1.0", kind: "release" },
    ],
    media: [
      { src: "/setsaga/demo.gif", alt: "SetSaga demo" },
      { src: "/setsaga/home.png", alt: "Home screen with XP and level progress" },
      { src: "/setsaga/workout.png", alt: "Workout logging screen" },
      { src: "/setsaga/charts.png", alt: "Progress charts" },
      { src: "/setsaga/achievements.png", alt: "Achievements and badges" },
    ],
    da: {
      status: "v0.1.0",
      tagline: "Gamificeret træningslog, der virker offline (mobil)",
      badges: ["Mobil", "Offline-first", "v0.1.0"],
      summary:
        "En gamificeret, offline-first træningslog til Android og iOS, bygget alene. Registrér sæt, gentagelser og vægt; appen gør vedholdenhed til XP, levels, streaks, badges og automatisk fundne personlige rekorder.",
      details: [
        "Local-first fra starten: alle data ligger i SQLite på telefonen. Ingen konti, ingen backend, ingen netværkskald. Databasemigreringer følger med appen og køres på enheden.",
        "Gamification-motoren består af rene funktioner bygget test-first (211 tests), og al XP-, streak- og badge-tilstand udledes af træningsdata i stedet for at blive gemt, så den aldrig kan komme ud af sync.",
        "Crash-sikker write-through-logning: hvert sæt gemmes i det øjeblik, det bekræftes, så intet går tabt, hvis appen lukkes midt i en træning.",
        'Bygget AI-first med Claude Code i seks planlagte faser, én PR pr. fase og grøn CI ved hver merge. README\'en har et afsnit med "Engineering decisions", skrevet til tekniske reviewere.',
      ],
      mediaAlts: ["SetSaga-demo", "Startskærm med XP og level-fremskridt", "Skærm til registrering af træning", "Grafer over fremskridt", "Præstationer og badges"],
    },
  },
  {
    id: "promptfuzz",
    group: "personal",
    title: "PromptFuzz-CLI",
    period: "2025",
    status: "CLI",
    icon: ICON("Activate Windows"),
    tagline: "LLM red-team fuzzer with 18 mutation strategies",
    badges: ["Security", "CLI"],
    summary: "An LLM red-team fuzzer with 18 mutation strategies for security testing prompts across multiple providers.",
    details: [
      "18 mutation strategies for probing LLM guardrails.",
      "Interactive menu mode plus multi-provider support.",
      "Built for hands-on, authorized LLM security testing.",
    ],
    tech: ["Python", "LLM APIs", "CLI"],
    links: [{ label: "GitHub", href: "https://github.com/souliN02/PromptFuzz-CLI", kind: "source" }],
    da: {
      status: "CLI",
      tagline: "LLM red-team-fuzzer med 18 mutationsstrategier",
      badges: ["Sikkerhed", "CLI"],
      summary: "En LLM red-team-fuzzer med 18 mutationsstrategier til sikkerhedstest af prompts på tværs af flere udbydere.",
      details: [
        "18 mutationsstrategier til at afprøve LLM-guardrails.",
        "Interaktiv menutilstand og understøttelse af flere udbydere.",
        "Bygget til praktisk, autoriseret sikkerhedstest af LLM'er.",
      ],
    },
  },
  {
    id: "portfolio",
    group: "personal",
    title: "Windows XP Portfolio",
    period: "2025 to 2026",
    status: "Live",
    icon: ICON("Display"),
    tagline: "This site: a Windows XP desktop in the browser",
    badges: ["Live", "TypeScript", "Tested"],
    summary:
      "This site. A portfolio styled as a Windows XP desktop, built solo to show personality and frontend craft. Visitors can explore my work, run my live demos in Internet Explorer, or send me an e-mail from Outlook Express.",
    details: [
      "Window manager written as a pure, unit-tested reducer: z-order stacking, focus, minimize and maximize, and clamping so no window can be lost off screen.",
      "Boot and Welcome screens, Explorer, System Properties, Outlook Express, Internet Explorer, Command Prompt, Recycle Bin, a screensaver, and XP's games: Solitaire, Spider Solitaire, FreeCell, Hearts and Minesweeper, all playable by touch.",
      "Outlook Express delivers messages to my inbox through a Next.js route handler and Resend, with validation shared between client and server, a honeypot, and rate limiting.",
      "Works on phones: windows open full-screen, taps replace double-clicks, and long-press replaces right-click. Deep links open any window directly.",
      "In English and Danish: the language bar in the tray switches, and first-time visitors get the language their browser asks for.",
      "Strict TypeScript, Vitest tests, and CI (lint, typecheck, test, build) on every push.",
    ],
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Resend", "Vitest", "GitHub Actions"],
    links: [
      { label: "Live", href: "https://bekirsaliv.dk", kind: "live" },
      { label: "GitHub", href: "https://github.com/souliN02/portfolio", kind: "source" },
    ],
    da: {
      title: "Windows XP-portfolio",
      status: "Live",
      tagline: "Dette site: et Windows XP-skrivebord i browseren",
      badges: ["Live", "TypeScript", "Testet"],
      summary:
        "Dette site. Et portfolio i form af et Windows XP-skrivebord, bygget alene for at vise personlighed og frontend-håndværk. Besøgende kan udforske mit arbejde, køre mine live-demoer i Internet Explorer eller sende mig en e-mail fra Outlook Express.",
      details: [
        "Vinduesstyring skrevet som en ren, enhedstestet reducer: z-rækkefølge, fokus, minimer og maksimer samt afgrænsning, så intet vindue kan forsvinde ud af skærmen.",
        "Opstarts- og velkomstskærme, Stifinder, Systemegenskaber, Outlook Express, Internet Explorer, Kommandoprompt, Papirkurv, en pauseskærm og XP's spil: Solitaire, Spider Solitaire, FreeCell, Hearts og Minesweeper, som alle kan spilles med touch.",
        "Outlook Express leverer beskeder til min indbakke via en route handler i Next.js og Resend, med validering delt mellem klient og server, en honeypot og rate limiting.",
        "Virker på telefoner: vinduer åbner i fuld skærm, tryk erstatter dobbeltklik, og langt tryk erstatter højreklik. Deep links åbner ethvert vindue direkte.",
        "På engelsk og dansk: sproglinjen i proceslinjen skifter sprog, og nye besøgende får det sprog, deres browser beder om.",
        "Strict TypeScript, Vitest-tests og CI (lint, typecheck, test, build) ved hvert push.",
      ],
    },
  },
  {
    id: "jornada",
    group: "personal",
    title: "Jornada Inglês Br",
    period: "2025",
    status: "Archived",
    icon: ICON("Earth (fixed)"),
    tagline: "Landing site for an English-teaching company",
    badges: ["Archived"],
    summary: "A landing site for Jornada Inglês Br showcasing the company identity, mission, and services.",
    details: ["Responsive landing page across desktop and mobile.", "Clear service sections with friendly, accessible navigation."],
    tech: ["Next.js", "React", "Tailwind CSS"],
    links: [],
    da: {
      status: "Arkiveret",
      tagline: "Landingsside for en virksomhed, der underviser i engelsk",
      badges: ["Arkiveret"],
      summary: "En landingsside for Jornada Inglês Br, der præsenterer virksomhedens identitet, mission og ydelser.",
      details: ["Responsiv landingsside på desktop og mobil.", "Tydelige sektioner om ydelserne med venlig, tilgængelig navigation."],
    },
  },
];

/** A project in the desktop's language. Ids, links and tech names stay as they are */
export function localizeProject(p: Project, lang: Lang): Project {
  if (lang === "en") return p;
  const { da } = p;
  return {
    ...p,
    title: da.title ?? p.title,
    period: localizePeriod(p.period, lang),
    status: da.status,
    tagline: da.tagline,
    badges: da.badges,
    summary: da.summary,
    details: da.details,
    image: p.image && { ...p.image, alt: da.imageAlt ?? p.image.alt },
    media: p.media?.map((m, i) => ({ ...m, alt: da.mediaAlts?.[i] ?? m.alt })),
  };
}

const PROJECTS_DA = PROJECTS.map((p) => localizeProject(p, "da"));

export function projectsFor(lang: Lang): Project[] {
  return lang === "da" ? PROJECTS_DA : PROJECTS;
}

export function groupsFor(lang: Lang): { id: ProjectGroupId; label: string }[] {
  return PROJECT_GROUPS.map((g) => ({ id: g.id, label: lang === "da" ? g.da : g.label }));
}

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function projectsInGroup(group: ProjectGroupId): Project[] {
  return PROJECTS.filter((p) => p.group === group);
}

/** The best external link for a project: live site first, then source */
export function primaryLink(p: Project): ProjectLink | undefined {
  return p.links.find((l) => l.kind === "live") ?? p.links[0];
}

export const FLAGSHIP = PROJECTS.find((p) => p.flagship) ?? PROJECTS[0]!;
