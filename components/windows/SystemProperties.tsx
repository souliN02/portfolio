"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { EDUCATION, EXPERIENCE, LANGUAGES, PROFILE, SKILLS } from "@/data/profile";
import { XpFlag } from "@/components/ui/glyphs";
import { useDesktop } from "@/components/desktop/DesktopContext";

const TABS = ["General", "Skills", "Experience", "Education"] as const;
type Tab = (typeof TABS)[number];

/** "About Me", presented as the XP System Properties dialog */
export default function SystemProperties() {
  const api = useDesktop();
  const [tab, setTab] = useState<Tab>("General");
  const baseId = useId();

  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = TABS.indexOf(tab);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length]!;
    setTab(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <div
      className="flex h-full flex-col p-2 text-[11px]"
      onKeyDown={(e) => {
        if (e.key === "Escape") api.closeApp("about");
      }}
    >
      <div role="tablist" aria-label="System Properties" className="xp-tablist" onKeyDown={onTabKey}>
        {TABS.map((t) => (
          <button
            key={t}
            id={`${baseId}-tab-${t}`}
            type="button"
            role="tab"
            aria-selected={tab === t}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab === t ? 0 : -1}
            className="xp-tab"
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`} className="xp-tabpanel min-h-0 flex-1 overflow-y-auto p-3" tabIndex={0}>
        {tab === "General" && <GeneralTab />}
        {tab === "Skills" && <SkillsTab />}
        {tab === "Experience" && <ExperienceTab />}
        {tab === "Education" && <EducationTab />}
      </div>
      <div className="mt-2 flex justify-end gap-1.5">
        <button type="button" className="xp-button" onClick={() => api.closeApp("about")}>
          OK
        </button>
        <button type="button" className="xp-button" onClick={() => api.closeApp("about")}>
          Cancel
        </button>
        <button type="button" className="xp-button" disabled>
          Apply
        </button>
      </div>
    </div>
  );
}

function GeneralTab() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 @sm:flex-row">
        <div className="flex shrink-0 flex-col items-center gap-1 pt-1 @sm:w-[130px]">
          <XpFlag size={72} />
          <p className="text-center font-bold leading-tight">
            Portfolio <span className="italic text-[#ff6a00]">XP</span>
          </p>
          <p className="text-center text-[10px] text-[#555]">Developer Edition</p>
        </div>
        <dl className="min-w-0 flex-1 space-y-2.5">
          <div>
            <dt>System:</dt>
            <dd className="pl-4">
              Portfolio XP
              <br />
              Developer Edition
              <br />
              Version 2026
            </dd>
          </div>
          <div>
            <dt>Registered to:</dt>
            <dd className="pl-4">
              <strong>{PROFILE.name}</strong>
              <br />
              {PROFILE.location}
              <br />
              <a className="xp-link break-all" href={`mailto:${PROFILE.email}`}>
                {PROFILE.email}
              </a>
            </dd>
          </div>
          <div>
            <dt>Computer:</dt>
            <dd className="pl-4">
              {PROFILE.role}
              <br />
              React, Next.js, TypeScript
              <br />
              Python, C# / .NET
              <br />
              AI-first with Claude
            </dd>
          </div>
        </dl>
      </div>

      <fieldset className="xp-groupbox">
        <legend>About Bekir</legend>
        <p className="leading-relaxed">{PROFILE.bio}</p>
        <p className="mt-1.5 leading-relaxed text-[#444]">{PROFILE.graduate}</p>
      </fieldset>
      <fieldset className="xp-groupbox">
        <legend>AI-first development</legend>
        <p className="leading-relaxed">{PROFILE.aiFirst}</p>
      </fieldset>
      <ul className="grid gap-1 @sm:grid-cols-3">
        {PROFILE.highlights.map((h) => (
          <li key={h} className="flex items-center gap-1.5">
            <span className="grid h-3.5 w-3.5 place-items-center border border-[#1c5180] bg-white text-[9px] font-bold leading-none text-[#21a121]" aria-hidden="true">
              ✓
            </span>
            {h}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkillList({ items, tone }: { items: readonly string[]; tone?: "ai" | "muted" }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 @sm:grid-cols-3">
      {items.map((s) => (
        <li key={s} className={`flex items-center gap-1.5 ${tone === "muted" ? "text-[#555]" : ""}`}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone === "ai" ? "bg-[#21a121]" : tone === "muted" ? "bg-[#9aa0a6]" : "bg-[#316ac5]"}`} aria-hidden="true" />
          {s}
        </li>
      ))}
    </ul>
  );
}

function SkillsTab() {
  return (
    <div className="space-y-3">
      <fieldset className="xp-groupbox">
        <legend>Strong / daily</legend>
        <SkillList items={SKILLS.strong} />
      </fieldset>
      <fieldset className="xp-groupbox">
        <legend>AI-assisted development</legend>
        <SkillList items={SKILLS.ai} tone="ai" />
      </fieldset>
      <fieldset className="xp-groupbox">
        <legend>Familiar / learning</legend>
        <SkillList items={SKILLS.learning} tone="muted" />
      </fieldset>
      <fieldset className="xp-groupbox">
        <legend>Languages</legend>
        <ul className="space-y-0.5">
          {LANGUAGES.map((l) => (
            <li key={l.name}>
              {l.name} <span className="text-[#555]">({l.level})</span>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  );
}

function ExperienceTab() {
  return (
    <div className="space-y-3">
      {EXPERIENCE.map((e) => (
        <fieldset key={e.company} className="xp-groupbox">
          <legend>{e.role}</legend>
          <p>
            <strong>{e.company}</strong>
            {e.companyNote && <span className="text-[#555]"> ({e.companyNote})</span>}
          </p>
          <p className="text-[#555]">
            {e.period} · {e.place}
          </p>
          <p className="mt-1 leading-relaxed">{e.summary}</p>
        </fieldset>
      ))}
    </div>
  );
}

function EducationTab() {
  return (
    <div className="space-y-3">
      {EDUCATION.map((e) => (
        <fieldset key={e.title} className="xp-groupbox">
          <legend>{e.period}</legend>
          <p className="font-bold">{e.title}</p>
          <p className="text-[#555]">{e.school}</p>
        </fieldset>
      ))}
      <p className="text-[#555]">
        Full CV:{" "}
        <a className="xp-link" href={PROFILE.cvPath} target="_blank" rel="noopener noreferrer">
          Bekir_CV.pdf
        </a>
      </p>
    </div>
  );
}
