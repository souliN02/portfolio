import type { Lang } from "./i18n";

/**
 * Validation and e-mail formatting for the Outlook Express contact form.
 * Shared by the window (instant feedback, in the desktop's language) and the API route (the actual check).
 */

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const CONTACT_LIMITS = { name: 100, email: 200, subject: 150, messageMin: 10, message: 5000 } as const;

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;
export type IdentityErrors = Partial<Record<"name" | "email", string>>;

export type ContactValidation =
  | { ok: true; value: ContactInput; /** The hidden honeypot field was filled in, so it's a bot */ spam: boolean }
  | { ok: false; errors: ContactErrors };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MESSAGES: Record<Lang, Record<"name" | "nameLong" | "email" | "subjectLong" | "messageShort" | "messageLong", string>> = {
  en: {
    name: "Please enter your name.",
    nameLong: "That name is too long.",
    email: "Please enter a valid e-mail address.",
    subjectLong: "That subject is too long.",
    messageShort: "Please write a slightly longer message.",
    messageLong: "That message is too long.",
  },
  da: {
    name: "Skriv dit navn.",
    nameLong: "Navnet er for langt.",
    email: "Skriv en gyldig e-mailadresse.",
    subjectLong: "Emnet er for langt.",
    messageShort: "Skriv en lidt længere meddelelse.",
    messageLong: "Meddelelsen er for lang.",
  },
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const isSpam = (b: Record<string, unknown>) => str(b.website).length > 0;

/** The visitor's name and e-mail, so Bekir can reply */
export function validateIdentity(name: string, email: string, lang: Lang = "en"): IdentityErrors {
  const m = MESSAGES[lang];
  const errors: IdentityErrors = {};
  if (!name) errors.name = m.name;
  else if (name.length > CONTACT_LIMITS.name) errors.name = m.nameLong;
  if (!EMAIL_RE.test(email) || email.length > CONTACT_LIMITS.email) errors.email = m.email;
  return errors;
}

export function validateContact(body: unknown, lang: Lang = "en"): ContactValidation {
  const m = MESSAGES[lang];
  const b = (body ?? {}) as Record<string, unknown>;
  const value: ContactInput = { name: str(b.name), email: str(b.email), subject: str(b.subject), message: str(b.message) };
  const errors: ContactErrors = validateIdentity(value.name, value.email, lang);

  if (value.subject.length > CONTACT_LIMITS.subject) errors.subject = m.subjectLong;

  if (value.message.length < CONTACT_LIMITS.messageMin) errors.message = m.messageShort;
  else if (value.message.length > CONTACT_LIMITS.message) errors.message = m.messageLong;

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value, spam: isSpam(b) };
}

/* ─── The e-mail Bekir receives ─── */

export function contactEmail({ name, email, subject, message }: ContactInput) {
  return {
    subject: `[Portfolio] ${subject || `Message from ${name}`}`,
    text: `From: ${name} <${email}>\nSent from the Outlook Express window on bekirsaliv.dk\n\n${message}`,
    replyTo: email,
  };
}

/** Fallback when the server can't send mail: open the visitor's own mail app, pre-filled */
export function mailtoHref(to: string, input: Partial<ContactInput>): string {
  const subject = input.subject || "Hello Bekir";
  const body = [input.message ?? "", "", input.name ? `${input.name}` : ""].join("\n").trim();
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
