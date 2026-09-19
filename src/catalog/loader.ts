import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CatalogEntry } from "./types.js";

/**
 * Walks up from this module's directory to find the package root (the
 * nearest ancestor with a package.json), rather than hardcoding a relative
 * path — that stays correct whether this runs from `src/` (dev, via tsx),
 * `dist/src/` (built), or `node_modules/@em.vrn/jev-cms/dist/src/` (installed
 * as a dependency), all of which put `catalog/` at a different relative depth.
 */
function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(join(dir, "package.json"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error("jev-cms: could not locate package root (no package.json found above " + startDir + ")");
    }
    dir = parent;
  }
}

let cache: Map<string, CatalogEntry> | undefined;

/** Loads and memoizes the full catalog (all domain JSON files) into an
 * id -> entry map. The catalog is static data shipped with the package, so
 * loading it once per process is safe and avoids re-parsing 25 files on
 * every call. */
export function loadCatalog(): Map<string, CatalogEntry> {
  if (cache) {
    return cache;
  }

  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const packageRoot = findPackageRoot(moduleDir);
  const catalogDir = join(packageRoot, "catalog");

  const entries = new Map<string, CatalogEntry>();
  for (const file of readdirSync(catalogDir)) {
    if (!file.endsWith(".json")) {
      continue;
    }
    const parsed = JSON.parse(readFileSync(join(catalogDir, file), "utf-8")) as CatalogEntry[];
    for (const entry of parsed) {
      entries.set(entry.id, entry);
    }
  }

  cache = entries;
  return entries;
}

export function getCatalogEntry(id: string): CatalogEntry {
  const entry = loadCatalog().get(id);
  if (!entry) {
    throw new Error(`jev-cms: unknown catalog question id "${id}"`);
  }
  return entry;
}

export interface CatalogFilter {
  domain?: string;
  /** Entry must have every tag listed here (AND, not OR) — narrows a
   * result set rather than broadening it, matching how filters typically
   * compose when you already know roughly what you're looking for. */
  tags?: string[];
  /** Arbitrary predicate for filtering criteria `domain`/`tags` can't
   * express (e.g. matching on `type`, `id`, or `instructions` text).
   * Applied last, after `domain` and `tags` narrow the set down — ANDed
   * with them, not a replacement for them. */
  predicate?: (entry: CatalogEntry) => boolean;
}

/** Lists catalog entries matching an optional domain/tags/predicate filter,
 * for discovering question ids without grepping the JSON files directly.
 * With no filter (or `{}`), returns the entire catalog. */
export function listCatalog(filter: CatalogFilter = {}): CatalogEntry[] {
  const { domain, tags, predicate } = filter;
  const entries = [...loadCatalog().values()];
  return entries.filter((entry) => {
    if (domain !== undefined && entry.domain !== domain) {
      return false;
    }
    if (tags !== undefined && !tags.every((tag) => entry.tags.includes(tag))) {
      return false;
    }
    if (predicate !== undefined && !predicate(entry)) {
      return false;
    }
    return true;
  });
}
