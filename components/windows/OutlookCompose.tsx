"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Copy, Link as LinkIcon, Phone, Send } from "lucide-react";
import { APPS } from "@/data/apps";
import { PROFILE } from "@/data/profile";
import { CONTACT_LIMITS, mailtoHref, validateContact, type ContactErrors } from "@/lib/contact";
import { sounds } from "@/lib/sounds";
import type { WinState } from "@/lib/windowManager";
import { GitHubMark } from "@/components/ui/glyphs";
import MessageBox from "@/components/ui/MessageBox";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { MenuBar, StatusBar, ToolButton, ToolSeparator, Toolbar } from "./ExplorerChrome";

const EMPTY = { name: "", email: "", subject: "", message: "", website: "" };
type Box = { icon: "info" | "warning" | "error"; title: string; text: string };

/** "Contact", presented as an Outlook Express New Message window */
export default function OutlookCompose({ win }: { win: WinState }) {
  const api = useDesktop();
  const [form, setForm] = useState(() => ({ ...EMPTY, subject: win.props.subject ?? "", message: win.props.message ?? "" }));
  const [errors, setErrors] = useState<ContactErrors>({});
  const [sending, setSending] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Re-opened from "E-mail me about this project" or the terminal's msg command: fill in what was passed
  const lastNonce = useRef(win.nonce);
  useEffect(() => {
    if (win.nonce === lastNonce.current) return;
    lastNonce.current = win.nonce;
    const { subject, message } = win.props;
    setForm((f) => ({ ...f, subject: subject ?? f.subject, message: message ?? f.message }));
  }, [win.nonce, win.props]);

  useEffect(() => {
    if (!status || sending) return;
    const t = setTimeout(() => setStatus(null), 2500);
    return () => clearTimeout(t);
  }, [status, sending]);

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${what} copied to the clipboard`);
    } catch {
      setStatus(text);
    }
  };

  const send = async () => {
    const check = validateContact(form);
    if (!check.ok) {
      setErrors(check.errors);
      sounds.error();
      return;
    }
    setErrors({});
    setSending(true);
    setStatus("Sending message...");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        setForm(EMPTY);
        setBox({ icon: "info", title: "Outlook Express", text: "Your message has been sent.\nBekir usually replies within a day or two." });
      } else if (res.status === 503) {
        // Mail isn't configured on the server: hand the message to the visitor's own mail app
        window.location.href = mailtoHref(PROFILE.email, check.value);
        setBox({ icon: "info", title: "Outlook Express", text: `Opening your e-mail program with the message filled in.\nIf nothing happens, write to ${PROFILE.email}.` });
      } else if (res.status === 429) {
        setBox({ icon: "warning", title: "Outlook Express", text: "You've sent several messages already. Please wait a little while and try again." });
      } else {
        const data = (await res.json().catch(() => null)) as { errors?: ContactErrors } | null;
        if (data?.errors) setErrors(data.errors);
        setBox({ icon: "error", title: "Outlook Express", text: `The message could not be sent.\nPlease try again, or write to ${PROFILE.email}.` });
      }
    } catch {
      setBox({ icon: "error", title: "Outlook Express", text: `Outlook Express could not connect to the server.\nCheck your connection, or write to ${PROFILE.email}.` });
    } finally {
      setSending(false);
      setStatus(null);
    }
  };

  const tel = `tel:${PROFILE.phone.replace(/\s+/g, "")}`;

  return (
    <div className="relative flex h-full flex-col text-[11px]">
      <MenuBar items={["File", "Edit", "View", "Insert", "Format", "Tools", "Message", "Help"]} />
      <Toolbar>
        <button type="button" className="xp-tool shrink-0 flex-col !gap-0 !px-2" onClick={send} disabled={sending} aria-label="Send">
          <Send className="h-5 w-5 text-[#2a6ad8]" />
          <span>Send</span>
        </button>
        <ToolSeparator />
        <ToolButton icon={<Copy className="h-4 w-4 text-[#3a64b8]" />} label="Copy address" onClick={() => copy(PROFILE.email, "E-mail address")} />
        <ToolButton icon={<Phone className="h-4 w-4 text-[#2a8c12]" />} label="Call" onClick={() => (window.location.href = tel)} />
        <ToolButton
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img src={APPS.cv.icon} alt="" width={18} height={18} />
          }
          label="Open CV"
          onClick={() => api.openApp("cv")}
        />
        <ToolButton icon={<LinkIcon className="h-4 w-4 text-[#0a66c2]" />} label="LinkedIn" showLabel={false} onClick={() => window.open(PROFILE.links.linkedin, "_blank", "noopener")} />
        <ToolButton icon={<GitHubMark className="h-4 w-4" />} label="GitHub" showLabel={false} onClick={() => window.open(PROFILE.links.github, "_blank", "noopener")} />
      </Toolbar>

      <div className="flex min-h-0 flex-1">
        <form
          className="flex min-w-0 flex-1 flex-col"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div className="space-y-1 border-b border-[#d8d2bd] px-2 py-1.5">
            <HeaderRow label="To:">
              <div className="flex min-h-[21px] items-center gap-1 border border-[var(--xp-input-border)] bg-white px-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/xp-icons/User 1.ico" alt="" width={14} height={14} />
                <span className="truncate">
                  {PROFILE.name} &lt;{PROFILE.email}&gt;
                </span>
              </div>
            </HeaderRow>
            <HeaderRow label="Your name:" htmlFor="oe-name" error={errors.name}>
              <input id="oe-name" className="xp-input w-full" value={form.name} onChange={set("name")} maxLength={CONTACT_LIMITS.name} autoComplete="name" aria-invalid={!!errors.name} />
            </HeaderRow>
            <HeaderRow label="Your e-mail:" htmlFor="oe-email" error={errors.email}>
              <input
                id="oe-email"
                type="email"
                className="xp-input w-full"
                value={form.email}
                onChange={set("email")}
                maxLength={CONTACT_LIMITS.email}
                autoComplete="email"
                placeholder="So Bekir can reply"
                aria-invalid={!!errors.email}
              />
            </HeaderRow>
            <HeaderRow label="Subject:" htmlFor="oe-subject" error={errors.subject}>
              <input id="oe-subject" className="xp-input w-full" value={form.subject} onChange={set("subject")} maxLength={CONTACT_LIMITS.subject} aria-invalid={!!errors.subject} />
            </HeaderRow>
            {/* Honeypot: invisible to people, tempting to bots */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
              </label>
            </div>
          </div>
          <label htmlFor="oe-message" className="sr-only">
            Message
          </label>
          <textarea
            id="oe-message"
            className="min-h-[120px] flex-1 resize-none bg-white p-2 font-[Arial,sans-serif] text-[13px] leading-snug outline-none"
            placeholder="Hi Bekir,"
            value={form.message}
            onChange={set("message")}
            maxLength={CONTACT_LIMITS.message}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "oe-message-error" : undefined}
          />
          {errors.message && (
            <p id="oe-message-error" className="bg-white px-2 pb-1 text-[#c4271c]">
              {errors.message}
            </p>
          )}
        </form>

        <aside className="hidden w-[200px] shrink-0 overflow-y-auto border-l border-[#d8d2bd] bg-white @min-[600px]:block" aria-label="Other ways to reach me">
          <p className="border-b border-[#d8d2bd] bg-[var(--xp-face)] px-2 py-1 font-bold">Contacts</p>
          <ul className="space-y-2 p-2">
            <Contact icon="/xp-icons/User 1.ico" title={PROFILE.name} sub={PROFILE.location} />
            <Contact icon={APPS.contact.icon} title="E-mail" sub={PROFILE.email} onClick={() => copy(PROFILE.email, "E-mail address")} action="Copy" />
            <Contact icon="/xp-icons/Phone.ico" title="Phone" sub={PROFILE.phone} href={tel} action="Call" />
            <Contact icon="/xp-icons/Earth (fixed).ico" title="LinkedIn" sub="bekirsaliv02" href={PROFILE.links.linkedin} action="Open" />
            <Contact icon="/xp-icons/Network Computers.ico" title="GitHub" sub="souliN02" href={PROFILE.links.github} action="Open" />
            <Contact icon={APPS.cv.icon} title="CV" sub="Bekir_CV.pdf" href={PROFILE.cvPath} action="Open" />
          </ul>
          <p className="px-2 pb-2 text-[#555]">Prefers e-mail. Usually replies quickly.</p>
        </aside>
      </div>

      <StatusBar>
        <span className="flex-1" aria-live="polite">
          {status ?? `Or call ${PROFILE.phone}`}
        </span>
        <span className="hidden @md:block">Working Online</span>
      </StatusBar>

      {box && (
        <MessageBox title={box.title} icon={box.icon} buttons={[{ label: "OK", onClick: () => setBox(null) }]} onClose={() => setBox(null)}>
          {box.text}
        </MessageBox>
      )}
    </div>
  );
}

function HeaderRow({ label, htmlFor, error, children }: { label: string; htmlFor?: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[76px_1fr] items-start gap-1">
      <label htmlFor={htmlFor} className="pt-[4px] text-right">
        {label}
      </label>
      <div className="min-w-0">
        {children}
        {error && <p className="mt-0.5 text-[#c4271c]">{error}</p>}
      </div>
    </div>
  );
}

function Contact({ icon, title, sub, href, onClick, action }: { icon: string; title: string; sub: string; href?: string; onClick?: () => void; action?: string }) {
  return (
    <li className="flex items-start gap-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" width={16} height={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="break-all text-[#555]">{sub}</p>
        {action &&
          (href ? (
            <a className="xp-link" href={href} target={href.startsWith("tel:") ? undefined : "_blank"} rel="noopener noreferrer">
              {action}
            </a>
          ) : (
            <button type="button" className="xp-link" onClick={onClick}>
              {action}
            </button>
          ))}
      </div>
    </li>
  );
}
