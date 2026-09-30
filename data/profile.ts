import { localizePeriod, type Lang } from "@/lib/i18n";

/**
 * Public profile facts. Every window, the terminal, the plain /simple page,
 * and the JSON-LD block are generated from this file
 * and data/projects.ts, so copy only needs to change in one place.
 * The Danish wording for the language bar sits next to the English it translates.
 */

export const SITE_URL = "https://bekirsaliv.dk";

export const PROFILE = {
  name: "Bekir Saliv",
  role: "Full-stack Developer",
  tagline: "Full-stack. AI-first.",
  location: "Næstved, Denmark",
  city: "Næstved",
  countryCode: "DK",
  email: "bekirsaliv1@gmail.com",
  phone: "+45 22 56 04 77",
  cvPath: "/Bekir_CV.pdf",
  links: {
    portfolio: SITE_URL,
    github: "https://github.com/souliN02",
    linkedin: "https://www.linkedin.com/in/bekirsaliv02/",
  },
  /** One or two sentences, used for meta descriptions and the Start menu */
  summary:
    "Full-stack developer working with React, Next.js, TypeScript, Python and C#, building production software AI-first with Claude.",
  bio: "Full-stack developer based in Næstved, Denmark, working with React, Next.js, TypeScript, Python and C#. I build production software with AI-assisted workflows and care about shipping things that are clean, maintainable, and genuinely useful.",
  graduate:
    "Recent AP graduate in Computer Science (datamatiker). Quick to learn, takes ownership, and ready to build.",
  aiFirst:
    "I work AI-first. I use Claude every day as a core part of how I develop, for code generation, refactoring, debugging, and architectural sparring, while owning the quality of everything that ships. Nordesk is a real example: production software built largely with Claude as my primary development partner.",
  highlights: ["Full-stack, build-first", "AI-native workflow", "Real production experience"],
} as const;

/** The parts of PROFILE that the desktop shows in Danish */
interface ProfileCopy {
  role: string;
  location: string;
  bio: string;
  graduate: string;
  aiFirst: string;
  highlights: readonly string[];
}

const PROFILE_DA: ProfileCopy = {
  role: "Full-stack-udvikler",
  location: "Næstved, Danmark",
  bio: "Full-stack-udvikler fra Næstved, der arbejder med React, Next.js, TypeScript, Python og C#. Jeg bygger produktionssoftware med AI-assisterede arbejdsgange og går op i at levere noget, der er rent, vedligeholdbart og reelt brugbart.",
  graduate: "Nyuddannet datamatiker (AP). Lærer hurtigt, tager ejerskab og er klar til at bygge.",
  aiFirst:
    "Jeg arbejder AI-first. Jeg bruger Claude hver dag som en fast del af min udvikling, til kodegenerering, refaktorering, fejlfinding og sparring om arkitektur, og jeg står selv inde for kvaliteten af alt, der bliver leveret. Nordesk er et konkret eksempel: produktionssoftware bygget i høj grad med Claude som min primære udviklingspartner.",
  highlights: ["Full-stack og byggeorienteret", "AI-native arbejdsgang", "Reel produktionserfaring"],
};

export type LocalProfile = Omit<typeof PROFILE, keyof ProfileCopy> & ProfileCopy;

export function profileFor(lang: Lang): LocalProfile {
  return lang === "da" ? { ...PROFILE, ...PROFILE_DA } : PROFILE;
}

export const SKILLS = {
  strong: ["JavaScript", "TypeScript", "React", "Next.js", "Python", "C# / .NET", "HTML & CSS", "Tailwind CSS", "REST APIs", "Git", "SQL"],
  ai: ["Claude (primary)", "Claude Code", "Cursor"],
  learning: ["Node.js", "PostgreSQL", "WordPress", "Docker", "Azure", "AWS", "GraphQL"],
} as const;

/** Tool names stay as they are; only the few words around them change */
const SKILL_WORDS_DA: Record<string, string> = { "Claude (primary)": "Claude (primært)" };

export function skillsFor(lang: Lang): Record<keyof typeof SKILLS, readonly string[]> {
  if (lang === "en") return SKILLS;
  const tr = (items: readonly string[]) => items.map((s) => SKILL_WORDS_DA[s] ?? s);
  return { strong: tr(SKILLS.strong), ai: tr(SKILLS.ai), learning: tr(SKILLS.learning) };
}

export interface Experience {
  role: string;
  company: string;
  companyNote?: string;
  period: string;
  place: string;
  summary: string;
  da: { role: string; companyNote?: string; place: string; summary: string };
}

export const EXPERIENCE: Experience[] = [
  {
    role: "Full Stack Developer",
    company: "Fleeca",
    companyNote: "formerly CreativeGround ApS",
    period: "2025",
    place: "Copenhagen",
    summary:
      "Owned the end-to-end build of Nordesk, a custom CRM in Next.js, from scoping to deployment. Built a Python CVR integration tool that normalized company data to power lead workflows. Used AI tools as an active part of the process.",
    da: {
      role: "Full-stack-udvikler",
      companyNote: "tidligere CreativeGround ApS",
      place: "København",
      summary:
        "Stod for hele udviklingen af Nordesk, et skræddersyet CRM i Next.js, fra afgrænsning til udrulning. Byggede et Python-værktøj til CVR-integration, der normaliserede virksomhedsdata til brug i lead-flows. Brugte AI-værktøjer som en aktiv del af processen.",
    },
  },
  {
    role: "Web Developer",
    company: "Grundejerforeningen Kildeskoven",
    period: "2024",
    place: "Roskilde",
    summary:
      "Designed and delivered a WordPress site for a homeowners' association, from requirements and content structure to theme, plugins, and launch.",
    da: {
      role: "Webudvikler",
      place: "Roskilde",
      summary: "Designede og leverede et WordPress-site til en grundejerforening, fra krav og indholdsstruktur til tema, plugins og lancering.",
    },
  },
  {
    role: "Customer Store Representative",
    company: "Circle K",
    period: "2022 to 2025",
    place: "Næstved",
    summary:
      "Three years front-of-house: communication, working under pressure, teamwork, and explaining things clearly to non-technical people.",
    da: {
      role: "Butiksmedarbejder",
      place: "Næstved",
      summary: "Tre år ved disken: kommunikation, arbejde under pres, samarbejde og at forklare ting klart for folk uden teknisk baggrund.",
    },
  },
];

export function experienceFor(lang: Lang): Experience[] {
  if (lang === "en") return EXPERIENCE;
  return EXPERIENCE.map((e) => ({ ...e, ...e.da, period: localizePeriod(e.period, lang) }));
}

export interface Education {
  title: string;
  period: string;
  school: string;
  da: { title: string; school: string };
}

export const EDUCATION: Education[] = [
  {
    title: "Computer Science AP (datamatiker)",
    period: "2022 to 2025",
    school: "Zealand Academy of Technologies and Business",
    da: { title: "Datamatiker (AP)", school: "Zealand, Sjællands Erhvervsakademi" },
  },
  { title: "Software Development", period: "2021 to 2022", school: "IT University of Copenhagen", da: { title: "Softwareudvikling", school: "IT-Universitetet i København" } },
  { title: "HTX (Higher Technical Examination)", period: "2018 to 2021", school: "ZBC Ringsted", da: { title: "HTX (højere teknisk eksamen)", school: "ZBC Ringsted" } },
];

export function educationFor(lang: Lang): Education[] {
  if (lang === "en") return EDUCATION;
  return EDUCATION.map((e) => ({ ...e, ...e.da, period: localizePeriod(e.period, lang) }));
}

export const LANGUAGES = [
  { name: "English", level: "Fluent", da: { name: "Engelsk", level: "Flydende" } },
  { name: "Danish", level: "Fluent", da: { name: "Dansk", level: "Flydende" } },
  { name: "Bulgarian", level: "Native", da: { name: "Bulgarsk", level: "Modersmål" } },
] as const;

export function languagesFor(lang: Lang): { name: string; level: string }[] {
  return LANGUAGES.map((l) => (lang === "da" ? l.da : l));
}

export function companyLabel(e: Experience): string {
  return e.companyNote ? `${e.company} (${e.companyNote})` : e.company;
}
