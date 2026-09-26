/**
 * Public profile facts. Every window, the terminal, the plain /simple page,
 * and the JSON-LD block are generated from this file
 * and data/projects.ts, so copy only needs to change in one place.
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

export const SKILLS = {
  strong: ["JavaScript", "TypeScript", "React", "Next.js", "Python", "C# / .NET", "HTML & CSS", "Tailwind CSS", "REST APIs", "Git", "SQL"],
  ai: ["Claude (primary)", "Claude Code", "Cursor"],
  learning: ["Node.js", "PostgreSQL", "WordPress", "Docker", "Azure", "AWS", "GraphQL"],
} as const;

export interface Experience {
  role: string;
  company: string;
  companyNote?: string;
  period: string;
  place: string;
  summary: string;
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
  },
  {
    role: "Web Developer",
    company: "Grundejerforeningen Kildeskoven",
    period: "2024",
    place: "Roskilde",
    summary:
      "Designed and delivered a WordPress site for a homeowners' association, from requirements and content structure to theme, plugins, and launch.",
  },
  {
    role: "Customer Store Representative",
    company: "Circle K",
    period: "2022 to 2025",
    place: "Næstved",
    summary:
      "Three years front-of-house: communication, working under pressure, teamwork, and explaining things clearly to non-technical people.",
  },
];

export interface Education {
  title: string;
  period: string;
  school: string;
}

export const EDUCATION: Education[] = [
  { title: "Computer Science AP (datamatiker)", period: "2022 to 2025", school: "Zealand Academy of Technologies and Business" },
  { title: "Software Development", period: "2021 to 2022", school: "IT University of Copenhagen" },
  { title: "HTX (Higher Technical Examination)", period: "2018 to 2021", school: "ZBC Ringsted" },
];

export const LANGUAGES = [
  { name: "English", level: "Fluent" },
  { name: "Danish", level: "Fluent" },
  { name: "Bulgarian", level: "Native" },
] as const;

export function companyLabel(e: Experience): string {
  return e.companyNote ? `${e.company} (${e.companyNote})` : e.company;
}
