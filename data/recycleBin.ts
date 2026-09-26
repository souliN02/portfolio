export interface BinItem {
  name: string;
  kind: "file" | "folder";
  from: string;
  deleted: string;
  size: string;
  note: string;
  /** Optional button that takes you somewhere real */
  action?: { label: string; project: string };
}

export const BIN_ITEMS: BinItem[] = [
  {
    name: "portfolio_v1_final_FINAL(2).html",
    kind: "file",
    from: "C:\\Users\\Bekir\\Desktop",
    deleted: "3/14/2023 11:52 PM",
    size: "48 KB",
    note: "My first portfolio. It had a marquee tag and a visitor counter. It was replaced by one with a Start menu.",
  },
  {
    name: "OddsLens",
    kind: "folder",
    from: "C:\\Projects",
    deleted: "7/1/2026 8:44 PM",
    size: "2.1 MB",
    note: "The first version of my odds tracker. It was rebuilt from scratch as LineDrift, with a proper data pipeline and 111 tests.",
    action: { label: "Show LineDrift", project: "linedrift" },
  },
  {
    name: "node_modules",
    kind: "folder",
    from: "C:\\Projects\\portfolio",
    deleted: "9/25/2026 9:03 AM",
    size: "2.4 GB",
    note: "Restoring this would fill most of your disk. Try npm install instead.",
  },
  {
    name: "tabs-vs-spaces.txt",
    kind: "file",
    from: "C:\\Users\\Bekir\\Documents",
    deleted: "1/9/2024 4:20 PM",
    size: "1 KB",
    note: "Resolved: whatever the formatter says.",
  },
  {
    name: "bugs.txt",
    kind: "file",
    from: "C:\\Projects\\portfolio",
    deleted: "9/25/2026 9:05 AM",
    size: "0 KB",
    note: "Empty. All bugs fixed. (There are always more.)",
  },
  {
    name: "TODO.txt",
    kind: "file",
    from: "C:\\Users\\Bekir\\Desktop",
    deleted: "8/8/2025 6:30 PM",
    size: "1 KB",
    note: "1. Build a portfolio.\n2. Make it look like Windows XP.\n3. Add Minesweeper.\nAll done.",
  },
];
