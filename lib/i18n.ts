/**
 * The desktop speaks English and Danish. English is the source text; the
 * Danish sits next to it in data/. These helpers are pure so the choice of
 * language can be tested; lib/language.ts holds the live setting.
 */

export const LANGS = ["en", "da"] as const;
export type Lang = (typeof LANGS)[number];

/** The visitor's own pick from the language bar (localStorage) */
export const LANG_KEY = "xp_lang";

/** Intl locale for dates and times */
export const LOCALES: Record<Lang, string> = { en: "en-US", da: "da-DK" };

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/** A ?lang= link wins, then the visitor's own pick, then the first browser language the site speaks */
export function pickLang({ search = "", saved = null, browser = [] }: { search?: string; saved?: string | null; browser?: readonly string[] }): Lang {
  const query = new URLSearchParams(search).get("lang")?.trim().toLowerCase();
  if (isLang(query)) return query;
  if (isLang(saved)) return saved;
  for (const tag of browser) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLang(base)) return base;
  }
  return "en";
}

/** "2022 to 2025" reads "2022 til 2025" in Danish */
export function localizePeriod(period: string, lang: Lang): string {
  return lang === "da" ? period.replace(/ to /g, " til ") : period;
}

/** An ISO date and time as Explorer shows it: 3/14/2023 11:52 PM, or 14.3.2023 23.52 */
export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const locale = LOCALES[lang];
  return `${d.toLocaleDateString(locale)} ${d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}`;
}
