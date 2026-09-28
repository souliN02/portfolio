import { describe, expect, it } from "vitest";
import { CalcError, evaluate, formatNumber } from "./calc";

describe("evaluate", () => {
  it("follows the usual precedence", () => {
    expect(evaluate("2 + 3 * 4")).toBe(14);
    expect(evaluate("(2 + 3) * 4")).toBe(20);
    expect(evaluate("10 - 4 - 3")).toBe(3);
    expect(evaluate("2^3^2")).toBe(512);
    expect(evaluate("-2^2")).toBe(-4);
    expect(evaluate("2^-1")).toBe(0.5);
  });

  it("accepts calculator symbols, sqrt and pi", () => {
    expect(evaluate("6 x 7")).toBe(42);
    expect(evaluate("84 ÷ 2")).toBe(42);
    expect(evaluate("17 % 5")).toBe(2);
    expect(evaluate("sqrt(16) + sqrt 9")).toBe(7);
    expect(evaluate("2 * pi")).toBeCloseTo(6.2832, 4);
    expect(evaluate(".5 + 1.")).toBe(1.5);
  });

  it("explains bad input instead of throwing something cryptic", () => {
    expect(() => evaluate("1 / 0")).toThrow("Cannot divide by zero.");
    expect(() => evaluate("(1 + 2")).toThrow(CalcError);
    expect(() => evaluate("2 +")).toThrow(CalcError);
    expect(() => evaluate("alert(1)")).toThrow(CalcError);
    expect(() => evaluate("")).toThrow(CalcError);
    expect(() => evaluate("10^400")).toThrow(CalcError);
  });

  it("formats without float noise", () => {
    expect(formatNumber(evaluate("0.1 + 0.2"))).toBe("0.3");
    expect(formatNumber(1 / 3)).toBe("0.333333333333");
  });
});
