"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { appsFor } from "@/data/apps";
import { PROFILE, educationFor, experienceFor, languagesFor, profileFor, skillsFor } from "@/data/profile";
import { useLang, useStrings } from "@/lib/language";
import { XpFlag } from "@/components/ui/glyphs";
import { useDesktop } from "@/components/desktop/DesktopContext";

const TABS = ["general", "skills", "experience", "education"] as const;
type Tab = (typeof TABS)[number];

/** "About Me", presented as the XP System Properties dialog */
export default function SystemProperties() {
  const api = useDesktop();
  const [tab, setTab] = useState<Tab>("general");
  const lang = useLang();
  const t = useStrings();
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
      <div role="tablist" aria-label={appsFor(lang).about.title} className="xp-tablist" onKeyDown={onTabKey}>
        {TABS.map((id) => (
          <button
            key={id}
            id={`${baseId}-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab === id ? 0 : -1}
            className="xp-tab"
            onClick={() => setTab(id)}
          >
            {t.about.tabs[id]}
          </button>
        ))}
      </div>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`} className="xp-tabpanel min-h-0 flex-1 overflow-y-auto p-3" tabIndex={0}>
        {tab === "general" && <GeneralTab />}
        {tab === "skills" && <SkillsTab />}
        {tab === "experience" && <ExperienceTab />}
        {tab === "education" && <EducationTab />}
      </div>
      <div className="mt-2 flex justify-end gap-1.5">
        <button type="button" className="xp-button" onClick={() => api.closeApp("about")}>
          {t.ok}
        </button>
        <button type="button" className="xp-button" onClick={() => api.closeApp("about")}>
          {t.cancel}
        </button>
        <button type="button" className="xp-button" disabled>
          {t.apply}
        </button>
      </div>
    </div>
  );
}

function GeneralTab() {
  const lang = useLang();
  const t = useStrings().about;
  const profile = profileFor(lang);
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
            <dt>{t.system}</dt>
            <dd className="pl-4">
              Portfolio XP
              <br />
              Developer Edition
              <br />
              Version 2026
            </dd>
          </div>
          <div>
            <dt>{t.registeredTo}</dt>
            <dd className="pl-4">
              <strong>{PROFILE.name}</strong>
              <br />
              {profile.location}
              <br />
              <a className="xp-link break-all" href={`mailto:${PROFILE.email}`}>
                {PROFILE.email}
              </a>
            </dd>
          </div>
          <div>
            <dt>{t.computer}</dt>
            <dd className="pl-4">
              {profile.role}
              <br />
              React, Next.js, TypeScript
              <br />
              Python, C# / .NET
              <br />
              {t.aiWithClaude}
            </dd>
          </div>
        </dl>
      </div>

      <fieldset className="xp-groupbox">
        <legend>{t.aboutBekir}</legend>
        <p className="leading-relaxed">{profile.bio}</p>
        <p className="mt-1.5 leading-relaxed text-[#444]">{profile.graduate}</p>
      </fieldset>
      <fieldset className="xp-groupbox">
        <legend>{t.aiFirst}</legend>
        <p className="leading-relaxed">{profile.aiFirst}</p>
      </fieldset>
      <ul className="grid gap-1 @sm:grid-cols-3">
        {profile.highlights.map((h) => (
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
  const lang = useLang();
  const t = useStrings().about;
  const skills = skillsFor(lang);
  return (
    <div className="space-y-3">
      <fieldset className="xp-groupbox">
        <legend>{t.strong}</legend>
        <SkillList items={skills.strong} />
      </fieldset>
      <fieldset className="xp-groupbox">
        <legend>{t.ai}</legend>
        <SkillList items={skills.ai} tone="ai" />
      </fieldset>
      <fieldset className="xp-groupbox">
        <legend>{t.learning}</legend>
        <SkillList items={skills.learning} tone="muted" />
      </fieldset>
      <fieldset className="xp-groupbox">
        <legend>{t.languages}</legend>
        <ul className="space-y-0.5">
          {languagesFor(lang).map((l) => (
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
  const lang = useLang();
  return (
    <div className="space-y-3">
      {experienceFor(lang).map((e) => (
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
  const lang = useLang();
  const t = useStrings().about;
  return (
    <div className="space-y-3">
      {educationFor(lang).map((e) => (
        <fieldset key={e.title} className="xp-groupbox">
          <legend>{e.period}</legend>
          <p className="font-bold">{e.title}</p>
          <p className="text-[#555]">{e.school}</p>
        </fieldset>
      ))}
      <p className="text-[#555]">
        {t.fullCv}{" "}
        <a className="xp-link" href={PROFILE.cvPath} target="_blank" rel="noopener noreferrer">
          Bekir_CV.pdf
        </a>
      </p>
    </div>
  );
}
