import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadJSON, saveJSON } from "./storage";

beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  });
});

describe("storage", () => {
  it("saveJSON rồi loadJSON trả đúng", () => {
    saveJSON("k", { a: 1 });
    expect(loadJSON("k", null)).toEqual({ a: 1 });
  });
  it("loadJSON key trống → fallback", () => {
    expect(loadJSON("missing", "def")).toBe("def");
  });
  it("loadJSON JSON hỏng → fallback (không throw)", () => {
    localStorage.setItem("bad", "{not json");
    expect(loadJSON("bad", 42)).toBe(42);
  });
});
