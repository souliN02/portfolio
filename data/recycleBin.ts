export interface BinItem {
  name: string;
  kind: "file" | "folder";
  from: string;
  /** ISO date and time, shown in the visitor's language */
  deleted: string;
  size: string;
  note: string;
  /** Optional button that takes you somewhere real */
  action?: { label: string; project: string };
  da: { note: string; action?: string };
}

export const BIN_ITEMS: BinItem[] = [
  {
    name: "portfolio_v1_final_FINAL(2).html",
    kind: "file",
    from: "C:\Users\Bekir\Desktop",
    deleted: "2023-03-14T23:52",
    size: "48 KB",
    note: "My first portfolio. It had a marquee tag and a visitor counter. It was replaced by one with a Start menu.",
    da: { note: "Mit første portfolio. Det havde et marquee-tag og en besøgstæller. Det blev erstattet af et med en Start-menu." },
  },
  {
    name: "OddsLens",
    kind: "folder",
    from: "C:\Projects",
    deleted: "2026-07-01T20:44",
    size: "2.1 MB",
    note: "The first version of my odds tracker. It was rebuilt from scratch as LineDrift, with a proper data pipeline and 111 tests.",
    action: { label: "Show LineDrift", project: "linedrift" },
    da: { note: "Den første version af min odds-tracker. Den blev bygget forfra som LineDrift, med en ordentlig datapipeline og 111 tests.", action: "Vis LineDrift" },
  },
  {
    name: "node_modules",
    kind: "folder",
    from: "C:\Projects\portfolio",
    deleted: "2026-09-25T09:03",
    size: "2.4 GB",
    note: "Restoring this would fill most of your disk. Try pnpm install instead.",
    da: { note: "Hvis du gendanner den, fylder den det meste af din disk. Prøv pnpm install i stedet." },
  },
  {
    name: "tabs-vs-spaces.txt",
    kind: "file",
    from: "C:\Users\Bekir\Documents",
    deleted: "2024-01-09T16:20",
    size: "1 KB",
    note: "Resolved: whatever the formatter says.",
    da: { note: "Afgjort: det, formatteren siger." },
  },
  {
    name: "bugs.txt",
    kind: "file",
    from: "C:\Projects\portfolio",
    deleted: "2026-09-25T09:05",
    size: "0 KB",
    note: "Empty. All bugs fixed. (There are always more.)",
    da: { note: "Tom. Alle fejl er rettet. (Der er altid flere.)" },
  },
  {
    name: "TODO.txt",
    kind: "file",
    from: "C:\Users\Bekir\Desktop",
    deleted: "2025-08-08T18:30",
    size: "1 KB",
    note: "1. Build a portfolio.\n2. Make it look like Windows XP.\n3. Add Minesweeper.\nAll done.",
    da: { note: "1. Byg et portfolio.\n2. Få det til at ligne Windows XP.\n3. Tilføj Minesweeper.\nAlt er gjort." },
  },
];
