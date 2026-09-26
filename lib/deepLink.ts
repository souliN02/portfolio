import { resolveApp, type AppId } from "@/data/apps";
import { getProject } from "@/data/projects";

/**
 * Deep links skip the boot and Welcome screens and open windows directly:
 *   /?open=projects&project=linedrift   Explorer, showing LineDrift
 *   /?open=about,contact                 several windows at once
 *   /?project=nordesk                    `project` alone implies Explorer
 *   /?open=contact                       Outlook Express, to e-mail Bekir
 */

export interface DeepLink {
  apps: AppId[];
  project?: string;
}

export function parseDeepLink(search: string): DeepLink | null {
  const params = new URLSearchParams(search);
  const apps: AppId[] = [];
  for (const name of (params.get("open") ?? "").split(",")) {
    const app = resolveApp(name.trim());
    if (app && !apps.includes(app)) apps.push(app);
  }

  const projectId = params.get("project")?.trim().toLowerCase();
  const project = projectId && getProject(projectId) ? projectId : undefined;
  if (project && !apps.includes("projects")) apps.push("projects");

  return apps.length ? { apps, project } : null;
}

export function projectLink(origin: string, id: string): string {
  return `${origin}/?open=projects&project=${encodeURIComponent(id)}`;
}

export function appLink(origin: string, app: AppId): string {
  return `${origin}/?open=${app}`;
}
