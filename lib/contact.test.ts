import { afterEach, describe, expect, it, vi } from "vitest";
import { contactEmail, mailtoHref, validateContact, validateIdentity } from "./contact";
import { sendMail } from "./mail";

describe("validateContact", () => {
  const good = { name: "Ada", email: "ada@example.com", subject: "Role", message: "We'd love to talk to you." };

  it("accepts a valid message and flags the honeypot", () => {
    expect(validateContact(good)).toEqual({ ok: true, value: good, spam: false });
    expect(validateContact({ ...good, website: "http://spam" })).toMatchObject({ ok: true, spam: true });
  });

  it("reports each invalid field", () => {
    const r = validateContact({ name: "", email: "nope", message: "short" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "message", "name"]);
  });
});

describe("validateIdentity", () => {
  it("needs a name and a real-looking e-mail", () => {
    expect(validateIdentity("Ada", "ada@example.com")).toEqual({});
    expect(Object.keys(validateIdentity("", "ada@example"))).toEqual(["name", "email"]);
  });
});

describe("e-mail formatting", () => {
  it("sets reply-to to the visitor and falls back to a default subject", () => {
    const mail = contactEmail({ name: "Ada", email: "ada@example.com", subject: "", message: "Hello there, Bekir." });
    expect(mail).toMatchObject({ subject: "[Portfolio] Message from Ada", replyTo: "ada@example.com" });
    expect(mail.text).toContain("Hello there, Bekir.");
  });

  it("builds a pre-filled mailto link", () => {
    expect(mailtoHref("me@x.dk", { subject: "Hi there", message: "Hello", name: "Ada" })).toBe("mailto:me@x.dk?subject=Hi%20there&body=Hello%0A%0AAda");
  });
});

describe("sendMail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does nothing without an API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await sendMail({ subject: "s", text: "t", replyTo: "a@b.dk" })).toBe("not_configured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to Resend with reply-to set, and reports failures", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_TO_EMAIL", "inbox@x.dk");
    const fetchSpy = vi.fn().mockResolvedValueOnce(new Response("{}", { status: 200 })).mockResolvedValueOnce(new Response("nope", { status: 422 }));
    vi.stubGlobal("fetch", fetchSpy);
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await sendMail({ subject: "s", text: "t", replyTo: "a@b.dk" })).toBe("sent");
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(init.body)).toMatchObject({ to: ["inbox@x.dk"], reply_to: "a@b.dk", subject: "s" });

    expect(await sendMail({ subject: "s", text: "t", replyTo: "a@b.dk" })).toBe("failed");
  });
});
