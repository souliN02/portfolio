"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, Link as LinkIcon, Mail } from "lucide-react";
import { appsFor } from "@/data/apps";
import { PROFILE } from "@/data/profile";
import { getProject, groupsFor, projectsFor, type Project } from "@/data/projects";
import { appLink, projectLink } from "@/lib/deepLink";
import { useLang, useStrings } from "@/lib/language";
import type { WinState } from "@/lib/windowManager";
import { BackIcon, ForwardIcon, GitHubMark, UpFolderIcon } from "@/components/ui/glyphs";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { AddressBar, MenuBar, StatusBar, TaskLink, TaskPane, TaskPanel, ToolButton, ToolSeparator, Toolbar } from "./ExplorerChrome";

/** The projects in the desktop's language, and a lookup by id */
function useProjects() {
  const projects = projectsFor(useLang());
  return { projects, find: (id: string | null) => (id ? projects.find((p) => p.id === id) : undefined) };
}

interface Nav {
  stack: (string | null)[];
  index: number;
}

export default function ProjectsExplorer({ win }: { win: WinState }) {
  const api = useDesktop();
  const { setTitle } = api;
  const lang = useLang();
  const t = useStrings();
  const apps = appsFor(lang);
  const { projects, find } = useProjects();
  const [nav, setNav] = useState<Nav>(() => ({ stack: [getProject(win.props.project ?? "")?.id ?? null], index: 0 }));
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const current = nav.stack[nav.index] ?? null;
  const project = find(current);

  const go = useCallback((id: string | null) => {
    setNav((n) => (n.stack[n.index] === id ? n : { stack: [...n.stack.slice(0, n.index + 1), id], index: n.index + 1 }));
  }, []);

  // Re-opened with a project (deep link, terminal, Recycle Bin): navigate there
  useEffect(() => {
    if (win.nonce > 0 && win.props.project && getProject(win.props.project)) go(win.props.project);
  }, [win.nonce, win.props.project, go]);

  useEffect(() => {
    setTitle("projects", project ? project.title : null);
  }, [project, setTitle]);
  useEffect(() => () => setTitle("projects", null), [setTitle]);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 2500);
    return () => clearTimeout(t);
  }, [status]);

  const copyLink = async () => {
    const url = project ? projectLink(window.location.origin, project.id, lang) : appLink(window.location.origin, "projects", lang);
    try {
      await navigator.clipboard.writeText(url);
      setStatus(t.projects.linkCopied);
    } catch {
      setStatus(url);
    }
  };

  const message = () =>
    api.openApp("contact", {
      subject: project ? t.projects.askSubject(project.title) : t.projects.generalSubject,
      message: project ? t.projects.askMessage(project.title) : t.projects.generalMessage,
    });
  const open = (id: string) => {
    setSelected(id);
    go(id);
  };

  return (
    <div className="flex h-full flex-col text-[11px]">
      <MenuBar items={t.menus.explorer} />
      <Toolbar>
        <ToolButton icon={<BackIcon disabled={nav.index === 0} />} label={t.explorer.back} disabled={nav.index === 0} onClick={() => setNav((n) => ({ ...n, index: n.index - 1 }))} />
        <ToolButton
          icon={<ForwardIcon disabled={nav.index >= nav.stack.length - 1} />}
          label={t.explorer.forward}
          showLabel={false}
          disabled={nav.index >= nav.stack.length - 1}
          onClick={() => setNav((n) => ({ ...n, index: n.index + 1 }))}
        />
        <ToolButton icon={<UpFolderIcon />} label={t.explorer.up} showLabel={false} disabled={!project} onClick={() => go(null)} />
        <ToolSeparator />
        <ToolButton icon={<Mail className="h-5 w-5 text-[#2a6ad8]" />} label={t.projects.emailMe} onClick={message} />
        <ToolButton icon={<LinkIcon className="h-5 w-5 text-[#3a64b8]" />} label={t.projects.copyLink} onClick={copyLink} />
      </Toolbar>
      <AddressBar>
        <label className="flex min-w-0 flex-1 items-center gap-1 border border-[var(--xp-input-border)] bg-white pl-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project?.icon ?? apps.projects.icon} alt="" width={16} height={16} className="shrink-0" />
          <span className="sr-only">{t.projects.goToFolder}</span>
          <select
            value={current ?? ""}
            onChange={(e) => go(e.target.value || null)}
            className="min-w-0 flex-1 cursor-pointer truncate bg-white py-[3px] outline-none"
          >
            <option value="">{t.projects.root}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {`${t.projects.root}\\${p.title}`}
              </option>
            ))}
          </select>
        </label>
      </AddressBar>

      <div className="flex min-h-0 flex-1">
        <TaskPane>
          {project ? <ProjectTasks project={project} onUp={() => go(null)} onCopy={copyLink} onMessage={message} /> : <RootTasks selected={selected} onCopy={copyLink} onMessage={message} />}
        </TaskPane>
        <div className="min-w-0 flex-1 overflow-y-auto bg-white">
          {project ? (
            <ProjectDetail key={project.id} project={project} />
          ) : (
            <ProjectTiles selected={selected} onSelect={setSelected} onOpen={open} touch={api.touch} />
          )}
        </div>
      </div>

      <StatusBar>
        <span className="flex-1">{status ?? (project ? project.tagline : selected ? find(selected)?.tagline : t.objects(projects.length))}</span>
        <span className="hidden w-[120px] @md:block">{t.projects.myComputer}</span>
      </StatusBar>
    </div>
  );
}

/* ─── Folder view: projects as tiles, grouped ─── */

function ProjectTiles({
  selected,
  onSelect,
  onOpen,
  touch,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  touch: boolean;
}) {
  const lang = useLang();
  const t = useStrings();
  const { projects } = useProjects();
  let index = 0;
  return (
    <div className="space-y-5 p-4" onClick={(e) => e.target === e.currentTarget && onSelect("")}>
      {groupsFor(lang).map((group) => (
        <section key={group.id}>
          <h2 className="text-[12px] font-bold text-[#0c32a8]">{group.label}</h2>
          <div className="mb-2 mt-1 h-px bg-gradient-to-r from-[#7ba2e7] to-transparent" />
          <ul className="grid grid-cols-1 gap-x-4 gap-y-2 @lg:grid-cols-2 @4xl:grid-cols-3">
            {projects.filter((p) => p.group === group.id).map((p) => {
              const isSelected = selected === p.id;
              return (
                <li key={p.id} className="animate-fadeIn" style={{ animationDelay: `${index++ * 40}ms` }}>
                  <button
                    type="button"
                    className="group flex w-full items-center gap-2 rounded-sm p-1 text-left outline-none"
                    onClick={() => (touch ? onOpen(p.id) : onSelect(p.id))}
                    onDoubleClick={() => onOpen(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onOpen(p.id);
                      }
                    }}
                    onFocus={() => onSelect(p.id)}
                    aria-label={t.projects.openFolder(p.title, p.tagline)}
                  >
                    <span className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.icon} alt="" width={48} height={48} draggable={false} className={isSelected ? "opacity-80" : ""} />
                      {p.flagship && <span className="absolute -right-1 -top-1 rounded-sm bg-[#ffc73c] px-1 text-[8px] font-bold leading-3 text-black ring-1 ring-[#b58a18]">★</span>}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate px-0.5 font-bold ${isSelected ? "bg-[var(--xp-select)] text-white" : "text-black"} group-focus-visible:outline group-focus-visible:outline-1 group-focus-visible:outline-dotted`}>
                        {p.title}
                      </span>
                      <span className="block truncate px-0.5 text-[#6d6d6d]">{p.tagline}</span>
                      <span className="block px-0.5 text-[#6d6d6d]">
                        {p.period} · {p.status}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function RootTasks({ selected, onCopy, onMessage }: { selected: string | null; onCopy: () => void; onMessage: () => void }) {
  const api = useDesktop();
  const t = useStrings();
  const apps = appsFor(useLang());
  const { projects, find } = useProjects();
  const sel = find(selected);
  return (
    <>
      <TaskPanel title={t.projects.tasks}>
        <TaskLink icon={apps.contact.icon} onClick={onMessage}>
          {t.projects.emailAboutWork}
        </TaskLink>
        <TaskLink icon={apps.cv.icon} onClick={() => api.openApp("cv")}>
          {t.projects.viewCv}
        </TaskLink>
        <TaskLink icon={apps.ie.icon} onClick={() => api.openApp("ie")}>
          {t.projects.browseDemos}
        </TaskLink>
        <TaskLink icon="/xp-icons/Internet Properties.ico" onClick={onCopy}>
          {t.projects.copyFolderLink}
        </TaskLink>
      </TaskPanel>
      <OtherPlaces />
      <TaskPanel title={t.details}>
        {sel ? (
          <>
            <p className="font-bold">{sel.title}</p>
            <p>{sel.tagline}</p>
            <p className="text-[#555]">
              {sel.period} · {sel.status}
            </p>
          </>
        ) : (
          <>
            <p className="font-bold">{apps.projects.label}</p>
            <p>{t.projects.count(projects.length, api.touch)}</p>
          </>
        )}
      </TaskPanel>
    </>
  );
}

function ProjectTasks({ project, onUp, onCopy, onMessage }: { project: Project; onUp: () => void; onCopy: () => void; onMessage: () => void }) {
  const api = useDesktop();
  const t = useStrings();
  const apps = appsFor(useLang());
  return (
    <>
      <TaskPanel title={t.projects.tasks}>
        {project.links.map((l) => (
          <TaskLink key={l.href} icon={l.kind === "live" ? "/xp-icons/Earth (fixed).ico" : l.kind === "release" ? "/xp-icons/Disk Image File.ico" : "/xp-icons/File.ico"} href={l.href}>
            {l.kind === "live" ? (l.label.includes(".") ? t.projects.visit(l.label) : t.projects.visitLive) : l.kind === "source" ? t.projects.viewSource : t.projects.download(l.label)}
          </TaskLink>
        ))}
        {project.frameUrl && (
          <TaskLink icon={apps.ie.icon} onClick={() => api.openApp("ie", { url: project.frameUrl })}>
            {t.projects.openInIe}
          </TaskLink>
        )}
        <TaskLink icon={apps.contact.icon} onClick={onMessage}>
          {t.projects.emailAboutProject}
        </TaskLink>
        <TaskLink icon="/xp-icons/Internet Properties.ico" onClick={onCopy}>
          {t.projects.copyProjectLink}
        </TaskLink>
      </TaskPanel>
      <OtherPlaces onUp={onUp} />
      <TaskPanel title={t.details}>
        <p className="font-bold">{project.title}</p>
        <p>{t.projects.fileFolder}</p>
        <p className="text-[#555]">
          {project.period} · {project.status}
        </p>
        <p className="text-[#555]">{t.projects.technologies(project.tech.length)}</p>
      </TaskPanel>
    </>
  );
}

function OtherPlaces({ onUp }: { onUp?: () => void }) {
  const api = useDesktop();
  const t = useStrings();
  const apps = appsFor(useLang());
  return (
    <TaskPanel title={t.otherPlaces}>
      {onUp && (
        <TaskLink icon={apps.projects.icon} onClick={onUp}>
          {apps.projects.label}
        </TaskLink>
      )}
      <TaskLink icon={apps.about.icon} onClick={() => api.openApp("about")}>
        {apps.about.label}
      </TaskLink>
      <TaskLink icon={apps.contact.icon} onClick={() => api.openApp("contact")}>
        {apps.contact.label}
      </TaskLink>
      <TaskLink icon={apps.recycle.icon} onClick={() => api.openApp("recycle")}>
        {apps.recycle.label}
      </TaskLink>
    </TaskPanel>
  );
}

/* ─── Inside a project folder ─── */

function ProjectDetail({ project: p }: { project: Project }) {
  const api = useDesktop();
  const t = useStrings().projects;
  const apps = appsFor(useLang());
  return (
    <article className="animate-fadeIn space-y-3 p-4 text-[12px] leading-relaxed text-[#1b1b1b]">
      <header className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.icon} alt="" width={48} height={48} className="shrink-0" draggable={false} />
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold leading-tight text-[#0c32a8]">{p.title}</h2>
          <p className="text-[#555]">{p.tagline}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
            <span className="rounded-sm border border-[#aca899] bg-[var(--xp-face)] px-1.5">{p.period}</span>
            {p.flagship && <span className="rounded-sm border border-[#b58a18] bg-[#fff1c2] px-1.5">{t.flagship}</span>}
            {p.badges.map((b) => (
              <span key={b} className="rounded-sm border border-[#9db8e0] bg-[#eef3fd] px-1.5">
                {b}
              </span>
            ))}
          </div>
        </div>
      </header>

      <p className="border border-[#d6dff7] bg-[#f5f8fe] p-2">{p.summary}</p>

      {p.image && (
        <a href={p.image.src} target="_blank" rel="noopener noreferrer" title={t.openImage(p.image.alt)} className="block border border-[#aca899] hover:border-[var(--xp-select)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image.src} alt={p.image.alt} width={1280} height={1600} loading="lazy" className="block max-h-[420px] w-full object-cover object-top" />
        </a>
      )}

      {p.media && (
        <div className="grid grid-cols-3 gap-1.5 @lg:grid-cols-5">
          {p.media.map((m) => (
            <a key={m.src} href={m.src} target="_blank" rel="noopener noreferrer" title={m.alt} className="block border border-[#aca899] hover:border-[var(--xp-select)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.src} alt={m.alt} loading="lazy" style={{ aspectRatio: "720 / 1544" }} className="block w-full object-cover" />
            </a>
          ))}
        </div>
      )}

      <div className="grid gap-3 @xl:grid-cols-[3fr_2fr]">
        <fieldset className="xp-groupbox">
          <legend>{t.highlights}</legend>
          <ul className="list-disc space-y-1 pl-4">
            {p.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </fieldset>
        <div className="space-y-3">
          <fieldset className="xp-groupbox">
            <legend>{t.technology}</legend>
            <ul className="flex flex-wrap gap-1 text-[11px]">
              {p.tech.map((t) => (
                <li key={t} className="border border-[#c9c7ba] bg-[var(--xp-face)] px-1.5">
                  {t}
                </li>
              ))}
            </ul>
          </fieldset>
          <fieldset className="xp-groupbox">
            <legend>{t.links}</legend>
            <div className="flex flex-wrap gap-1.5">
              {p.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="xp-button inline-flex items-center gap-1.5">
                  {l.kind === "source" ? <GitHubMark className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5 text-[#2a6ad8]" />}
                  {l.label}
                </a>
              ))}
              {p.frameUrl && (
                <button type="button" className="xp-button inline-flex items-center gap-1.5" onClick={() => api.openApp("ie", { url: p.frameUrl })}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={apps.ie.icon} alt="" width={14} height={14} />
                  {t.openInIeShort}
                </button>
              )}
              {p.links.length === 0 && <p className="text-[#555]">
                  {t.noLink} {PROFILE.email}
                </p>}
            </div>
          </fieldset>
        </div>
      </div>
    </article>
  );
}
