import { describe, expect, it } from "vitest";
import { BROWSER_HOME, hostOf, normalizeUrl, wrap } from "./text";

describe("wrap", () => {
  it("wraps at the width and indents continuation lines", () => {
    expect(wrap("one two three four", 9, "  ")).toEqual(["one two", "  three", "  four"]);
  });

  it("keeps a single long word on its own line", () => {
    expect(wrap("supercalifragilistic word", 5)).toEqual(["supercalifragilistic", "word"]);
  });
});

describe("normalizeUrl", () => {
  it("adds https to bare hosts", () => {
    expect(normalizeUrl("linedrift.bekirsaliv.dk")).toBe("https://linedrift.bekirsaliv.dk/");
  });

  it("keeps http and https URLs", () => {
    expect(normalizeUrl("http://example.com/a?b=1")).toBe("http://example.com/a?b=1");
  });

  it("refuses other schemes and falls back to the home page", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBe(BROWSER_HOME);
    expect(normalizeUrl("file:///C:/Windows")).toBe(BROWSER_HOME);
    expect(normalizeUrl("")).toBe(BROWSER_HOME);
    expect(normalizeUrl("about:blank")).toBe(BROWSER_HOME);
  });
});

describe("hostOf", () => {
  it("strips www and returns the host", () => {
    expect(hostOf("https://www.nordeskcrm.com/login")).toBe("nordeskcrm.com");
  });
});
