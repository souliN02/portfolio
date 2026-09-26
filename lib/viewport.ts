/** Phones (portrait or landscape): windows open full-screen and icons wrap into columns */
export const COMPACT_QUERY = "(max-width: 639px), (max-height: 499px)";

const matches = (query: string) => typeof window !== "undefined" && window.matchMedia(query).matches;

export const isCompactViewport = () => matches(COMPACT_QUERY);
export const isTouchDevice = () => matches("(pointer: coarse)");
export const prefersReducedMotion = () => matches("(prefers-reduced-motion: reduce)");
