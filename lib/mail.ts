import { PROFILE } from "@/data/profile";

/**
 * Sends mail to Bekir through Resend, for the Outlook Express contact form.
 * Server-only: it reads secrets from the environment.
 *
 * Environment:
 *   RESEND_API_KEY      required; without it nothing is sent and the window
 *                       falls back to opening the visitor's own mail app
 *   CONTACT_TO_EMAIL    optional, defaults to the public profile address
 *   CONTACT_FROM_EMAIL  optional, a sender on a domain verified in Resend.
 *                       Defaults to Resend's test sender, which can only
 *                       deliver to the Resend account owner's own address.
 */

export type MailResult = "sent" | "not_configured" | "failed";

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendMail({ subject, text, replyTo }: { subject: string; text: string; replyTo: string }): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return "not_configured";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Portfolio XP <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO_EMAIL || PROFILE.email],
        reply_to: replyTo,
        subject,
        text,
      }),
    });
    if (!res.ok) {
      console.error(`mail: Resend returned ${res.status}`, await res.text().catch(() => ""));
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("mail: request failed", error);
    return "failed";
  }
}
