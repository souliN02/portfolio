/** Wrap text to a column width, indenting continuation lines (for fixed-width output) */
export function wrap(text: string, width: number, indent = ""): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.map((l, i) => (i === 0 ? l : indent + l));
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const BROWSER_HOME = "about:home";

/** Turn whatever was typed into Internet Explorer's address bar into an http(s) URL, or the home page */
export function normalizeUrl(input: string | undefined): string {
  const raw = (input ?? "").trim();
  if (!raw || raw.startsWith("about:")) return BROWSER_HOME;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : BROWSER_HOME;
  } catch {
    return BROWSER_HOME;
  }
}
