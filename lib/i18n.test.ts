import { describe, expect, it } from "vitest";
import { APP_IDS, appsFor } from "@/data/apps";
import { EDUCATION, EXPERIENCE, educationFor, experienceFor, profileFor } from "@/data/profile";
import { PROJECTS, groupsFor, projectsFor } from "@/data/projects";
import { readmeText } from "@/data/readme";
import { BIN_ITEMS } from "@/data/recycleBin";
import { UI } from "@/data/ui";
import { formatDateTime, localizePeriod, pickLang } from "./i18n";

describe("pickLang", () => {
  it("follows the first browser language the site speaks", () => {
    expect(pickLang({ browser: ["da-DK", "en"] })).toBe("da");
    expect(pickLang({ browser: ["en-GB", "da"] })).toBe("en");
    expect(pickLang({ browser: ["de-DE", "da"] })).toBe("da");
    expect(pickLang({ browser: ["sv-SE"] })).toBe("en");
    expect(pickLang({})).toBe("en");
  });

  it("lets a saved pick beat the browser, and a ?lang= link beat both", () => {
    expect(pickLang({ saved: "en", browser: ["da"] })).toBe("en");
    expect(pickLang({ search: "?lang=da", saved: "en", browser: ["en"] })).toBe("da");
    expect(pickLang({ search: "?open=about&lang=DA" })).toBe("da");
  });

  it("ignores languages it doesn't speak", () => {
    expect(pickLang({ search: "?lang=fr", saved: "klingon", browser: ["da"] })).toBe("da");
  });
});

describe("formatting", () => {
  it("writes year ranges the Danish way", () => {
    expect(localizePeriod("2022 to 2025", "da")).toBe("2022 til 2025");
    expect(localizePeriod("2022 to 2025", "en")).toBe("2022 to 2025");
    expect(localizePeriod("2026", "da")).toBe("2026");
  });

  it("formats Recycle Bin dates per language", () => {
    // Newer ICU puts a narrow no-break space before PM
    const plain = (s: string) => s.replace(/\s/g, " ");
    expect(plain(formatDateTime("2023-03-14T23:52", "en"))).toBe("3/14/2023 11:52 PM");
    expect(plain(formatDateTime("2023-03-14T23:52", "da"))).toBe("14.3.2023 23.52");
  });
});

/** Every string a UI dictionary holds, with its functions called on sample arguments */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") return strings((value as (...a: unknown[]) => unknown)("X", 2));
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

function danishCopy(): string[] {
  return [
    ...strings(UI.da),
    ...strings(profileFor("da")),
    ...strings(experienceFor("da")),
    ...strings(educationFor("da")),
    ...strings(projectsFor("da")),
    ...strings(groupsFor("da")),
    ...strings(appsFor("da")),
    ...BIN_ITEMS.flatMap((b) => strings(b.da)),
    readmeText(false, "da"),
    readmeText(true, "da"),
  ];
}

describe("the Danish copy", () => {
  it("keeps every project in step with the English", () => {
    for (const p of PROJECTS) {
      expect(p.da.details, p.id).toHaveLength(p.details.length);
      expect(p.da.badges, p.id).toHaveLength(p.badges.length);
      if (p.media) expect(p.da.mediaAlts, p.id).toHaveLength(p.media.length);
      if (p.image) expect(p.da.imageAlt, p.id).toBeTruthy();
    }
  });

  it("translates every window name and the employer consistently", () => {
    const apps = appsFor("da");
    for (const id of APP_IDS) expect(apps[id].label, id).toBeTruthy();
    expect(apps.projects.label).toBe("Mine projekter");
    const text = danishCopy().join("\n");
    if (text.includes("CreativeGround")) expect(text).toContain("tidligere CreativeGround");
    expect(text).not.toContain("formerly");
  });

  it("covers every job and school", () => {
    expect(experienceFor("da")).toHaveLength(EXPERIENCE.length);
    expect(educationFor("da").map((e) => e.period)).toEqual(EDUCATION.map((e) => localizePeriod(e.period, "da")));
  });

  it("uses no em dashes", () => {
    for (const s of danishCopy()) expect(s).not.toContain("—");
    for (const s of strings(UI.en)) expect(s).not.toContain("—");
  });

  it("leaves English untouched when English is picked", () => {
    expect(projectsFor("en")).toBe(PROJECTS);
    expect(readmeText(false, "en")).toBe(readmeText());
  });
});
