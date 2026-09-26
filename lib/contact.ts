/**
 * Validation and e-mail formatting for the Outlook Express contact form.
 * Shared by the window (instant feedback) and the API route (the actual check).
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

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const isSpam = (b: Record<string, unknown>) => str(b.website).length > 0;

/** The visitor's name and e-mail, so Bekir can reply */
export function validateIdentity(name: string, email: string): IdentityErrors {
  const errors: IdentityErrors = {};
  if (!name) errors.name = "Please enter your name.";
  else if (name.length > CONTACT_LIMITS.name) errors.name = "That name is too long.";
  if (!EMAIL_RE.test(email) || email.length > CONTACT_LIMITS.email) errors.email = "Please enter a valid e-mail address.";
  return errors;
}

export function validateContact(body: unknown): ContactValidation {
  const b = (body ?? {}) as Record<string, unknown>;
  const value: ContactInput = { name: str(b.name), email: str(b.email), subject: str(b.subject), message: str(b.message) };
  const errors: ContactErrors = validateIdentity(value.name, value.email);

  if (value.subject.length > CONTACT_LIMITS.subject) errors.subject = "That subject is too long.";

  if (value.message.length < CONTACT_LIMITS.messageMin) errors.message = "Please write a slightly longer message.";
  else if (value.message.length > CONTACT_LIMITS.message) errors.message = "That message is too long.";

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
