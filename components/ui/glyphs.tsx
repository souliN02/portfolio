/* Small inline SVGs: the Windows flag, title-bar glyphs, message-box icons and toolbar arrows */

export function XpFlag({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <path d="M2 2 C20 8, 35 2, 46 2 L46 46 C35 46, 20 40, 2 46 Z" fill="#FF0000" />
      <path d="M54 2 C65 2, 80 8, 98 2 L98 46 C80 40, 65 46, 54 46 Z" fill="#00B300" />
      <path d="M2 54 C20 60, 35 54, 46 54 L46 98 C35 98, 20 92, 2 98 Z" fill="#0058E6" />
      <path d="M54 54 C65 54, 80 60, 98 54 L98 98 C80 92, 65 98, 54 98 Z" fill="#FFB900" />
    </svg>
  );
}

/* lucide's Github icon is deprecated, so the mark is inlined */
export function GitHubMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.05.78 2.12 0 1.53-.01 2.77-.01 3.15 0 .31.21.67.8.56C20.71 21.38 24 17.07 24 12 24 5.73 18.77.5 12 .5Z" />
    </svg>
  );
}

/* ─── Title bar ─── */
const glyph = { width: 11, height: 11, viewBox: "0 0 11 11", "aria-hidden": true } as const;

export const MinimizeGlyph = () => (
  <svg {...glyph}>
    <rect x="1" y="7.5" width="6" height="2.5" fill="currentColor" />
  </svg>
);
export const MaximizeGlyph = () => (
  <svg {...glyph}>
    <rect x="1" y="1" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <rect x="1" y="1" width="9" height="2.4" fill="currentColor" />
  </svg>
);
export const RestoreGlyph = () => (
  <svg {...glyph}>
    <path d="M3.5 3.5V1h6.5v6H7.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <rect x="3.5" y="1" width="6.5" height="1.8" fill="currentColor" />
    <rect x="1" y="4" width="6.5" height="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <rect x="1" y="4" width="6.5" height="1.8" fill="currentColor" />
  </svg>
);
export const CloseGlyph = () => (
  <svg {...glyph}>
    <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
export const HelpGlyph = () => (
  <svg {...glyph}>
    <path d="M3.2 3.8a2.3 2.3 0 1 1 3.3 2c-.7.4-1 .8-1 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="5.5" cy="9.6" r="1" fill="currentColor" />
  </svg>
);

/* ─── Message box icons (32px) ─── */
export function InfoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <radialGradient id="info-g" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#8ec5ff" />
          <stop offset="1" stopColor="#0a4fc6" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#info-g)" stroke="#0a3a93" />
      <circle cx="16" cy="9.5" r="2.2" fill="#fff" />
      <rect x="13.8" y="13" width="4.4" height="11" rx="1.2" fill="#fff" />
    </svg>
  );
}

export function WarningIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3 30 28H2Z" fill="#ffd21f" stroke="#8a6d00" strokeLinejoin="round" />
      <rect x="14.5" y="11" width="3" height="10" rx="1" fill="#000" />
      <circle cx="16" cy="24.2" r="1.7" fill="#000" />
    </svg>
  );
}

export function ErrorIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <radialGradient id="err-g" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ff8a7a" />
          <stop offset="1" stopColor="#c01508" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#err-g)" stroke="#7d0d05" />
      <path d="M10.5 10.5l11 11M21.5 10.5l-11 11" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export function QuestionIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <radialGradient id="q-g" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#8ec5ff" />
          <stop offset="1" stopColor="#0a4fc6" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#q-g)" stroke="#0a3a93" />
      <path d="M11.5 12.5a4.5 4.5 0 1 1 6.3 4.1c-1.2.6-1.8 1.3-1.8 2.6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="24" r="1.9" fill="#fff" />
    </svg>
  );
}

/* ─── Toolbar icons ─── */
function RoundArrow({ dir, size = 26, disabled }: { dir: "left" | "right"; size?: number; disabled?: boolean }) {
  const id = `arrow-${dir}-${disabled ? "d" : "e"}`;
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor={disabled ? "#e6e6e6" : "#9be07a"} />
          <stop offset="1" stopColor={disabled ? "#9c9c9c" : "#2a8c12"} />
        </radialGradient>
      </defs>
      <circle cx="13" cy="13" r="11.5" fill={`url(#${id})`} stroke={disabled ? "#8a8a8a" : "#1e6b0c"} />
      <path
        d={dir === "left" ? "M15.5 7.5 9.5 13l6 5.5M9.8 13h8" : "M10.5 7.5 16.5 13l-6 5.5M16.2 13h-8"}
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const BackIcon = ({ disabled }: { disabled?: boolean }) => <RoundArrow dir="left" disabled={disabled} />;
export const ForwardIcon = ({ disabled }: { disabled?: boolean }) => <RoundArrow dir="right" disabled={disabled} />;

export function UpFolderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 6.5h7l2 2h11v12H2Z" fill="#f5d36a" stroke="#b58a18" />
      <path d="M2 10h20v10.5H2Z" fill="#fbe596" stroke="#b58a18" />
      <path d="M12 19v-7m-3.2 3 3.2-3.2 3.2 3.2" fill="none" stroke="#2a8c12" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="1" y="1" width="16" height="16" rx="3" fill="#2f9a1a" stroke="#1e6b0c" />
      <path d="M5 9h7m-3-3.2L12.2 9 9 12.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RefreshIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path d="M17.5 8.5A7 7 0 1 0 18 13" fill="none" stroke="#2a8c12" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M18.8 3.5v5.5h-5.5" fill="none" stroke="#2a8c12" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path d="M3 11 11 3.5 19 11" fill="none" stroke="#b33a1a" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M5.5 9.5V19h11V9.5" fill="#f3e3b5" stroke="#8a6d2a" />
      <rect x="9.3" y="13" width="3.4" height="6" fill="#8a5a2a" />
    </svg>
  );
}

export function NewWindowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2" y="4" width="13" height="13" fill="#fff" stroke="#3a64b8" />
      <rect x="2" y="4" width="13" height="3" fill="#3a78e0" />
      <path d="M11 2h7v7M18 2l-7 7" fill="none" stroke="#2a8c12" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronsGlyph({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ transform: open ? undefined : "rotate(180deg)" }}>
      <path d="M2 5 5 2l3 3M2 8.5 5 5.5l3 3" fill="none" stroke="#215dc6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
