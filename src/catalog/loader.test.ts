import { describe, expect, it } from "vitest";
import { getCatalogEntry, listCatalog, loadCatalog } from "./loader.js";

describe("loadCatalog", () => {
  it("loads a non-trivial number of entries from the bundled catalog", () => {
    const catalog = loadCatalog();
    expect(catalog.size).toBeGreaterThan(400);
  });

  it("resolves a known entry with the expected shape", () => {
    const entry = getCatalogEntry("blog-article.topicCategory");
    expect(entry.domain).toBe("blog-article");
    expect(entry.type).toBe("choice");
    expect(typeof entry.instructions).toBe("string");
  });

  it("throws a clear error for an unknown id", () => {
    expect(() => getCatalogEntry("nonexistent.id")).toThrow(/unknown catalog question id/);
  });

  it("memoizes across calls (same Map instance)", () => {
    expect(loadCatalog()).toBe(loadCatalog());
  });
});

describe("listCatalog", () => {
  it("returns the full catalog with no filter", () => {
    expect(listCatalog()).toHaveLength(loadCatalog().size);
  });

  it("filters by domain", () => {
    const entries = listCatalog({ domain: "blog-article" });
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.domain === "blog-article")).toBe(true);
  });

  it("filters by tags, requiring every listed tag to be present", () => {
    const [sample] = listCatalog({ domain: "blog-article" });
    const entries = listCatalog({ tags: sample.tags });
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => sample.tags.every((tag) => entry.tags.includes(tag)))).toBe(
      true,
    );
  });

  it("returns an empty array when no entry matches", () => {
    expect(listCatalog({ domain: "nonexistent-domain" })).toEqual([]);
  });

  it("combines domain and tags filters", () => {
    const [sample] = listCatalog({ domain: "blog-article" });
    const entries = listCatalog({ domain: "blog-article", tags: sample.tags });
    expect(entries).toContainEqual(sample);
    expect(entries.every((entry) => entry.domain === "blog-article")).toBe(true);
  });

  it("filters by an arbitrary predicate", () => {
    const entries = listCatalog({ predicate: (entry) => entry.type === "choice" });
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.type === "choice")).toBe(true);
  });

  it("ANDs the predicate with domain and tags rather than replacing them", () => {
    const entries = listCatalog({
      domain: "blog-article",
      predicate: (entry) => entry.type === "score",
    });
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.domain === "blog-article" && entry.type === "score")).toBe(
      true,
    );
  });
});
