"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, Link as LinkIcon, Mail } from "lucide-react";
import { APPS } from "@/data/apps";
import { PROFILE } from "@/data/profile";
import { PROJECTS, PROJECT_GROUPS, getProject, projectsInGroup, type Project } from "@/data/projects";
import { appLink, projectLink } from "@/lib/deepLink";
import type { WinState } from "@/lib/windowManager";
import { BackIcon, ForwardIcon, GitHubMark, UpFolderIcon } from "@/components/ui/glyphs";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { AddressBar, MenuBar, StatusBar, TaskLink, TaskPane, TaskPanel, ToolButton, ToolSeparator, Toolbar } from "./ExplorerChrome";

const ROOT_PATH = "C:\\Users\\Bekir\\My Projects";

interface Nav {
  stack: (string | null)[];
  index: number;
}

export default function ProjectsExplorer({ win }: { win: WinState }) {
  const api = useDesktop();
  const { setTitle } = api;
  const [nav, setNav] = useState<Nav>(() => ({ stack: [getProject(win.props.project ?? "")?.id ?? null], index: 0 }));
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const current = nav.stack[nav.index] ?? null;
  const project = current ? getProject(current) : undefined;

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
    const url = project ? projectLink(window.location.origin, project.id) : appLink(window.location.origin, "projects");
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied to the clipboard");
    } catch {
      setStatus(url);
    }
  };

  const message = () =>
    api.openApp("contact", {
      subject: project ? `Question about ${project.title}` : "Your projects",
      message: project ? `Hi Bekir,\n\nI have a question about ${project.title}: ` : "Hi Bekir,\n\nI've been looking at your projects. ",
    });
  const open = (id: string) => {
    setSelected(id);
    go(id);
  };

  return (
    <div className="flex h-full flex-col text-[11px]">
      <MenuBar items={["File", "Edit", "View", "Favorites", "Tools", "Help"]} />
      <Toolbar>
        <ToolButton icon={<BackIcon disabled={nav.index === 0} />} label="Back" disabled={nav.index === 0} onClick={() => setNav((n) => ({ ...n, index: n.index - 1 }))} />
        <ToolButton
          icon={<ForwardIcon disabled={nav.index >= nav.stack.length - 1} />}
          label="Forward"
          showLabel={false}
          disabled={nav.index >= nav.stack.length - 1}
          onClick={() => setNav((n) => ({ ...n, index: n.index + 1 }))}
        />
        <ToolButton icon={<UpFolderIcon />} label="Up" showLabel={false} disabled={!project} onClick={() => go(null)} />
        <ToolSeparator />
        <ToolButton icon={<Mail className="h-5 w-5 text-[#2a6ad8]" />} label="E-mail me" onClick={message} />
        <ToolButton icon={<LinkIcon className="h-5 w-5 text-[#3a64b8]" />} label="Copy link" onClick={copyLink} />
      </Toolbar>
      <AddressBar>
        <label className="flex min-w-0 flex-1 items-center gap-1 border border-[var(--xp-input-border)] bg-white pl-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project?.icon ?? APPS.projects.icon} alt="" width={16} height={16} className="shrink-0" />
          <span className="sr-only">Go to folder</span>
          <select
            value={current ?? ""}
            onChange={(e) => go(e.target.value || null)}
            className="min-w-0 flex-1 cursor-pointer truncate bg-white py-[3px] outline-none"
          >
            <option value="">{ROOT_PATH}</option>
            {PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>
                {`${ROOT_PATH}\\${p.title}`}
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
        <span className="flex-1">{status ?? (project ? project.tagline : selected ? getProject(selected)?.tagline : `${PROJECTS.length} objects`)}</span>
        <span className="hidden w-[120px] @md:block">My Computer</span>
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
  let index = 0;
  return (
    <div className="space-y-5 p-4" onClick={(e) => e.target === e.currentTarget && onSelect("")}>
      {PROJECT_GROUPS.map((group) => (
        <section key={group.id}>
          <h2 className="text-[12px] font-bold text-[#0c32a8]">{group.label}</h2>
          <div className="mb-2 mt-1 h-px bg-gradient-to-r from-[#7ba2e7] to-transparent" />
          <ul className="grid grid-cols-1 gap-x-4 gap-y-2 @lg:grid-cols-2 @4xl:grid-cols-3">
            {projectsInGroup(group.id).map((p) => {
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
                    aria-label={`${p.title}: ${p.tagline}. Open folder.`}
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
  const sel = selected ? getProject(selected) : undefined;
  return (
    <>
      <TaskPanel title="Project Tasks">
        <TaskLink icon={APPS.contact.icon} onClick={onMessage}>
          E-mail me about my work
        </TaskLink>
        <TaskLink icon={APPS.cv.icon} onClick={() => api.openApp("cv")}>
          View my CV
        </TaskLink>
        <TaskLink icon={APPS.ie.icon} onClick={() => api.openApp("ie")}>
          Browse live demos
        </TaskLink>
        <TaskLink icon="/xp-icons/Internet Properties.ico" onClick={onCopy}>
          Copy link to this folder
        </TaskLink>
      </TaskPanel>
      <OtherPlaces />
      <TaskPanel title="Details">
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
            <p className="font-bold">My Projects</p>
            <p>
              {PROJECTS.length} projects. Double-click a folder to open it{api.touch ? " (tap on touch screens)" : ""}.
            </p>
          </>
        )}
      </TaskPanel>
    </>
  );
}

function ProjectTasks({ project, onUp, onCopy, onMessage }: { project: Project; onUp: () => void; onCopy: () => void; onMessage: () => void }) {
  const api = useDesktop();
  return (
    <>
      <TaskPanel title="Project Tasks">
        {project.links.map((l) => (
          <TaskLink key={l.href} icon={l.kind === "live" ? "/xp-icons/Earth (fixed).ico" : l.kind === "release" ? "/xp-icons/Disk Image File.ico" : "/xp-icons/File.ico"} href={l.href}>
            {l.kind === "live" ? (l.label.includes(".") ? `Visit ${l.label}` : "Visit the live site") : l.kind === "source" ? "View source on GitHub" : `Download ${l.label}`}
          </TaskLink>
        ))}
        {project.frameUrl && (
          <TaskLink icon={APPS.ie.icon} onClick={() => api.openApp("ie", { url: project.frameUrl })}>
            Open in Internet Explorer
          </TaskLink>
        )}
        <TaskLink icon={APPS.contact.icon} onClick={onMessage}>
          E-mail me about this project
        </TaskLink>
        <TaskLink icon="/xp-icons/Internet Properties.ico" onClick={onCopy}>
          Copy link to this project
        </TaskLink>
      </TaskPanel>
      <OtherPlaces onUp={onUp} />
      <TaskPanel title="Details">
        <p className="font-bold">{project.title}</p>
        <p>File Folder</p>
        <p className="text-[#555]">
          {project.period} · {project.status}
        </p>
        <p className="text-[#555]">{project.tech.length} technologies</p>
      </TaskPanel>
    </>
  );
}

function OtherPlaces({ onUp }: { onUp?: () => void }) {
  const api = useDesktop();
  return (
    <TaskPanel title="Other Places">
      {onUp && (
        <TaskLink icon={APPS.projects.icon} onClick={onUp}>
          My Projects
        </TaskLink>
      )}
      <TaskLink icon={APPS.about.icon} onClick={() => api.openApp("about")}>
        About Me
      </TaskLink>
      <TaskLink icon={APPS.contact.icon} onClick={() => api.openApp("contact")}>
        Contact
      </TaskLink>
      <TaskLink icon={APPS.recycle.icon} onClick={() => api.openApp("recycle")}>
        Recycle Bin
      </TaskLink>
    </TaskPanel>
  );
}

/* ─── Inside a project folder ─── */

function ProjectDetail({ project: p }: { project: Project }) {
  const api = useDesktop();
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
            {p.badges.map((b) => (
              <span key={b} className={`rounded-sm border px-1.5 ${b === "Flagship" ? "border-[#b58a18] bg-[#fff1c2]" : "border-[#9db8e0] bg-[#eef3fd]"}`}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </header>

      <p className="border border-[#d6dff7] bg-[#f5f8fe] p-2">{p.summary}</p>

      {p.image && (
        <a href={p.image.src} target="_blank" rel="noopener noreferrer" title={`Open ${p.image.alt}`} className="block border border-[#aca899] hover:border-[var(--xp-select)]">
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
          <legend>Highlights</legend>
          <ul className="list-disc space-y-1 pl-4">
            {p.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </fieldset>
        <div className="space-y-3">
          <fieldset className="xp-groupbox">
            <legend>Technology</legend>
            <ul className="flex flex-wrap gap-1 text-[11px]">
              {p.tech.map((t) => (
                <li key={t} className="border border-[#c9c7ba] bg-[var(--xp-face)] px-1.5">
                  {t}
                </li>
              ))}
            </ul>
          </fieldset>
          <fieldset className="xp-groupbox">
            <legend>Links</legend>
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
                  <img src={APPS.ie.icon} alt="" width={14} height={14} />
                  Open in IE
                </button>
              )}
              {p.links.length === 0 && <p className="text-[#555]">No public link. Ask me about it: {PROFILE.email}</p>}
            </div>
          </fieldset>
        </div>
      </div>
    </article>
  );
}
