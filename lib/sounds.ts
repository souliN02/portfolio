import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "./storage";

/**
 * UI sounds, synthesized with the Web Audio API, plus the startup tune.
 * Volume and mute are shared by every sound and saved per browser, and the
 * tray's volume control subscribes to them through useSoundSettings().
 */

export interface SoundSettings {
  volume: number;
  muted: boolean;
}

const VOLUME_KEY = "xp_volume";
const MUTED_KEY = "xp_muted";
const DEFAULTS: SoundSettings = { volume: 0.7, muted: false };

let settings: SoundSettings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const raw = readStorage("local", VOLUME_KEY);
  const v = raw === null ? NaN : Number(raw);
  settings = {
    volume: Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : DEFAULTS.volume,
    muted: readStorage("local", MUTED_KEY) === "1",
  };
}

function emit(next: SoundSettings) {
  settings = next;
  writeStorage("local", VOLUME_KEY, String(next.volume));
  writeStorage("local", MUTED_KEY, next.muted ? "1" : "0");
  listeners.forEach((l) => l());
}

export function getSoundSettings(): SoundSettings {
  load();
  return settings;
}

export function setVolume(volume: number) {
  emit({ ...getSoundSettings(), volume: Math.min(1, Math.max(0, volume)) });
}

export function setMuted(muted: boolean) {
  emit({ ...getSoundSettings(), muted });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSoundSettings(): SoundSettings {
  return useSyncExternalStore(subscribe, getSoundSettings, () => DEFAULTS);
}

function level(): number {
  const s = getSoundSettings();
  return s.muted ? 0 : s.volume;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

interface Tone {
  freq: number;
  to?: number;
  dur: number;
  delay?: number;
  vol?: number;
  type?: OscillatorType;
}

function play(tones: Tone[]) {
  const master = level();
  if (master <= 0) return;
  const c = audio();
  if (!c) return;
  for (const t of tones) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = t.type ?? "sine";
    const start = c.currentTime + (t.delay ?? 0);
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, start + t.dur * 0.7);
    gain.gain.setValueAtTime((t.vol ?? 0.07) * master, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
    osc.start(start);
    osc.stop(start + t.dur);
  }
}

let startup: HTMLAudioElement | null = null;

export const sounds = {
  click: () => play([{ freq: 1200, to: 800, dur: 0.06, vol: 0.08 }]),
  open: () => play([{ freq: 400, dur: 0.12, vol: 0.06 }, { freq: 600, dur: 0.12, delay: 0.08, vol: 0.06 }]),
  close: () => play([{ freq: 500, to: 300, dur: 0.12, vol: 0.06 }]),
  minimize: () => play([{ freq: 600, to: 350, dur: 0.1, vol: 0.05 }]),
  restore: () => play([{ freq: 350, to: 600, dur: 0.1, vol: 0.05 }]),
  /** Balloon tips and information dialogs */
  notify: () => play([{ freq: 880, dur: 0.22, vol: 0.05, type: "triangle" }, { freq: 1320, dur: 0.3, delay: 0.1, vol: 0.05, type: "triangle" }]),
  /** Error and warning dialogs */
  error: () => play([{ freq: 660, dur: 0.14, vol: 0.06, type: "triangle" }, { freq: 440, dur: 0.28, delay: 0.12, vol: 0.07, type: "triangle" }]),
  logoff: () => play([784, 659, 523, 392].map((freq, i) => ({ freq, dur: 0.35, delay: i * 0.16, vol: 0.05, type: "triangle" as const }))),
  emptyBin: () => play([{ freq: 900, to: 120, dur: 0.35, vol: 0.05, type: "sawtooth" }]),
  /** The XP startup tune. Only works from a click or key press, because of browser autoplay rules */
  startup: () => {
    const master = level();
    if (master <= 0 || typeof window === "undefined") return;
    startup ??= new Audio("/xp-boot.mp3");
    startup.volume = master;
    startup.currentTime = 0;
    startup.play().catch(() => {});
  },
};
