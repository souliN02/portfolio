import { useSyncExternalStore } from "react";
import { UI, type UiStrings } from "@/data/ui";
import { LANG_KEY, pickLang, type Lang } from "./i18n";
import { readStorage, writeStorage } from "./storage";

/**
 * The live language setting. It's picked once per page load (see pickLang),
 * the tray's language bar changes it, and every window subscribes through useLang().
 */

let lang: Lang = "en";
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  lang = pickLang({ search: window.location.search, saved: readStorage("local", LANG_KEY), browser: navigator.languages ?? [navigator.language] });
}

export function getLang(): Lang {
  load();
  return lang;
}

/** The visitor's own pick: remembered, and it beats the browser's language next time */
export function setLang(next: Lang) {
  load();
  writeStorage("local", LANG_KEY, next);
  if (next === lang) return;
  lang = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => "en");
}

export function useStrings(): UiStrings {
  return UI[useLang()];
}
