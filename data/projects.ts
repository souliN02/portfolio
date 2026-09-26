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
}

export const PROJECT_GROUPS: { id: ProjectGroupId; label: string }[] = [
  { id: "professional", label: "Fleeca, formerly CreativeGround (Professional)" },
  { id: "building", label: "Currently building" },
  { id: "personal", label: "Personal projects" },
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
    badges: ["Flagship", "Production"],
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
      "Boot and Welcome screens, Explorer, System Properties, Outlook Express, Internet Explorer, Command Prompt, Minesweeper, Recycle Bin, and a screensaver.",
      "Outlook Express delivers messages to my inbox through a Next.js route handler and Resend, with validation shared between client and server, a honeypot, and rate limiting.",
      "Works on phones: windows open full-screen, taps replace double-clicks, and long-press replaces right-click. Deep links open any window directly.",
      "Strict TypeScript, Vitest tests, and CI (lint, typecheck, test, build) on every push.",
    ],
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Resend", "Vitest", "GitHub Actions"],
    links: [
      { label: "Live", href: "https://bekirsaliv.dk", kind: "live" },
      { label: "GitHub", href: "https://github.com/souliN02/portfolio", kind: "source" },
    ],
  },
  {
    id: "jornada",
    group: "personal",
    title: "Jornada Inglês Br",
    period: "2025",
    status: "Live",
    icon: ICON("Earth (fixed)"),
    tagline: "Landing site for an English-teaching company",
    badges: ["Live"],
    summary: "A landing site for Jornada Inglês Br showcasing the company identity, mission, and services.",
    details: ["Responsive landing page across desktop and mobile.", "Clear service sections with friendly, accessible navigation."],
    tech: ["Next.js", "React", "Tailwind CSS"],
    links: [{ label: "Live", href: "https://jornadaingles.vercel.app/", kind: "live" }],
  },
];

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
