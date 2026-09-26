import { contactEmail, validateContact } from "@/lib/contact";
import { mailConfigured, sendMail } from "@/lib/mail";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

/** POST /api/contact: the Outlook Express message, e-mailed to Bekir (see lib/mail.ts for setup) */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const perHour = createRateLimiter({ limit: 5, windowMs: 60 * 60_000 });

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(req: Request) {
  // Not set up: the window falls back to the visitor's own mail app
  if (!mailConfigured()) return json({ error: "Mail is not configured." }, 503);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }
  const check = validateContact(body);
  if (!check.ok) return json({ errors: check.errors }, 400);
  // Pretend success to bots that filled in the honeypot
  if (check.spam) return json({ ok: true }, 200);

  const limit = perHour(clientIp(req));
  if (!limit.ok) return json({ error: "Too many messages." }, 429, { "Retry-After": String(limit.retryAfter) });

  const result = await sendMail(contactEmail(check.value));
  return result === "sent" ? json({ ok: true }, 200) : json({ error: "The message could not be sent." }, 502);
}
