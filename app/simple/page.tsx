import type { Metadata } from "next";
import Link from "next/link";
import { EDUCATION, EXPERIENCE, LANGUAGES, PROFILE, SKILLS, companyLabel } from "@/data/profile";
import { PROJECT_GROUPS, projectsInGroup } from "@/data/projects";

export const metadata: Metadata = {
  title: `${PROFILE.name} | Plain text portfolio`,
  description: `${PROFILE.summary} A fast, accessible, plain text version of the portfolio.`,
  alternates: { canonical: "/simple" },
};

/**
 * The whole portfolio as a plain, server-rendered page: for recruiters in a hurry,
 * screen readers, applicant tracking systems, search engines, and printing.
 */
export default function SimplePage() {
  return (
    <div className="min-h-dvh bg-white text-[#1b1b1b] [font-family:system-ui,-apple-system,'Segoe_UI',Roboto,sans-serif]">
      <main className="mx-auto max-w-3xl px-5 py-10 text-[15px] leading-relaxed">
        <p className="mb-8 text-[13px]">
          <Link href="/" className="text-[#1d4fbf] underline">
            ← Open the Windows XP desktop version
          </Link>
        </p>

        <header className="mb-10">
          <h1 className="text-[32px] font-bold leading-tight">{PROFILE.name}</h1>
          <p className="mt-1 text-[18px] text-[#444]">
            {PROFILE.role} · {PROFILE.location}
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
            <li>
              <a className="text-[#1d4fbf] underline" href={`mailto:${PROFILE.email}`}>
                {PROFILE.email}
              </a>
            </li>
            <li>
              <a className="text-[#1d4fbf] underline" href={`tel:${PROFILE.phone.replace(/\s+/g, "")}`}>
                {PROFILE.phone}
              </a>
            </li>
            <li>
              <a className="text-[#1d4fbf] underline" href={PROFILE.links.linkedin}>
                LinkedIn
              </a>
            </li>
            <li>
              <a className="text-[#1d4fbf] underline" href={PROFILE.links.github}>
                GitHub
              </a>
            </li>
            <li>
              <a className="text-[#1d4fbf] underline" href={PROFILE.cvPath}>
                CV (PDF)
              </a>
            </li>
          </ul>
        </header>

        <Section title="About">
          <p>{PROFILE.bio}</p>
          <p className="mt-3">{PROFILE.graduate}</p>
          <p className="mt-3">{PROFILE.aiFirst}</p>
        </Section>

        <Section title="Projects">
          {PROJECT_GROUPS.map((group) => (
            <div key={group.id} className="mb-8">
              <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#666]">{group.label}</h3>
              <div className="space-y-6">
                {projectsInGroup(group.id).map((p) => (
                  <article key={p.id}>
                    <h4 className="text-[18px] font-semibold">
                      {p.title} <span className="text-[14px] font-normal text-[#666]">({p.period})</span>
                    </h4>
                    <p className="mt-1">{p.summary}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {p.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[14px] text-[#555]">
                      <span className="font-medium">Tech:</span> {p.tech.join(", ")}
                    </p>
                    {p.links.length > 0 && (
                      <p className="mt-1 flex flex-wrap gap-x-4 text-[14px]">
                        {p.links.map((l) => (
                          <a key={l.href} className="text-[#1d4fbf] underline" href={l.href}>
                            {l.label}
                          </a>
                        ))}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section title="Experience">
          <div className="space-y-5">
            {EXPERIENCE.map((e) => (
              <article key={e.company}>
                <h3 className="font-semibold">
                  {e.role}, {companyLabel(e)}
                </h3>
                <p className="text-[14px] text-[#666]">
                  {e.period} · {e.place}
                </p>
                <p className="mt-1">{e.summary}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Education">
          <ul className="space-y-2">
            {EDUCATION.map((e) => (
              <li key={e.title}>
                <span className="font-semibold">{e.title}</span>, {e.school} <span className="text-[#666]">({e.period})</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Skills">
          <dl className="space-y-2">
            <div>
              <dt className="inline font-semibold">Strong / daily: </dt>
              <dd className="inline">{SKILLS.strong.join(", ")}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">AI-assisted development: </dt>
              <dd className="inline">{SKILLS.ai.join(", ")}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Familiar / learning: </dt>
              <dd className="inline">{SKILLS.learning.join(", ")}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Languages: </dt>
              <dd className="inline">{LANGUAGES.map((l) => `${l.name} (${l.level})`).join(", ")}</dd>
            </div>
          </dl>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 border-b border-[#ddd] pb-1 text-[22px] font-bold">{title}</h2>
      {children}
    </section>
  );
}
