import { describe, expect, it } from "vitest";
import { appLink, parseDeepLink, projectLink } from "./deepLink";

describe("parseDeepLink", () => {
  it("returns null when nothing should open", () => {
    expect(parseDeepLink("")).toBeNull();
    expect(parseDeepLink("?utm_source=linkedin")).toBeNull();
    expect(parseDeepLink("?open=nonsense")).toBeNull();
    // A language alone doesn't skip the boot screen
    expect(parseDeepLink("?lang=da")).toBeNull();
  });

  it("opens a single app", () => {
    expect(parseDeepLink("?open=about")).toEqual({ apps: ["about"], project: undefined });
  });

  it("opens several apps and resolves aliases, without duplicates", () => {
    expect(parseDeepLink("?open=resume,mail,cv")?.apps).toEqual(["cv", "contact"]);
  });

  it("opens Explorer at a project, and `project` alone implies Explorer", () => {
    expect(parseDeepLink("?open=projects&project=linedrift")).toMatchObject({ apps: ["projects"], project: "linedrift" });
    expect(parseDeepLink("?project=NORDESK")).toMatchObject({ apps: ["projects"], project: "nordesk" });
  });

  it("ignores unknown projects", () => {
    expect(parseDeepLink("?project=doesnotexist")).toBeNull();
  });

  it("sends old MSN Messenger links to Contact", () => {
    expect(parseDeepLink("?open=msn")?.apps).toEqual(["contact"]);
  });
});

describe("link builders round-trip through the parser", () => {
  it("builds project and app links", () => {
    const p = new URL(projectLink("https://bekirsaliv.dk", "setsaga"));
    expect(parseDeepLink(p.search)).toMatchObject({ apps: ["projects"], project: "setsaga" });
    const a = new URL(appLink("https://bekirsaliv.dk", "contact"));
    expect(parseDeepLink(a.search)?.apps).toEqual(["contact"]);
  });

  it("carries Danish along, and leaves English links clean", () => {
    expect(appLink("https://bekirsaliv.dk", "about", "da")).toBe("https://bekirsaliv.dk/?open=about&lang=da");
    expect(appLink("https://bekirsaliv.dk", "about", "en")).toBe("https://bekirsaliv.dk/?open=about");
    const p = new URL(projectLink("https://bekirsaliv.dk", "nordesk", "da"));
    expect(p.searchParams.get("lang")).toBe("da");
    expect(parseDeepLink(p.search)).toMatchObject({ apps: ["projects"], project: "nordesk" });
  });
});
