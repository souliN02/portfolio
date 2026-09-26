import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows up to the limit, then blocks until the window slides", () => {
    const check = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(check("a", 0).ok).toBe(true);
    expect(check("a", 100).ok).toBe(true);
    const blocked = check("a", 200);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(1);
    expect(check("a", 1001).ok).toBe(true);
  });

  it("tracks keys separately", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(check("a", 0).ok).toBe(true);
    expect(check("b", 0).ok).toBe(true);
    expect(check("a", 1).ok).toBe(false);
  });

  it("keeps memory bounded", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    check("a", 0);
    check("b", 0);
    check("c", 0);
    // "a" was evicted, so it is allowed again
    expect(check("a", 1).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first forwarded address", () => {
    const req = new Request("https://x.dk", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("falls back when no header is present", () => {
    expect(clientIp(new Request("https://x.dk"))).toBe("unknown");
  });
});
