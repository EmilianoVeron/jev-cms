import {
  choice,
  noul,
  score,
  TypeSafeClient,
  type ChoiceResponse,
  type EntryType,
  type NoulResponse,
  type Question,
  type ScoreResponse,
} from "@typesafe-ai/sdk";
import { getCatalogEntry, listCatalog, type CatalogFilter } from "./loader.js";
import type { CatalogEntry } from "./types.js";

export interface JevCatalogConfig {
  /** Required, no fallback to any environment variable — this is a
   * published library used inside other people's apps, which may already
   * use `TYPESAFE_API_KEY` (or any other name) for something else. */
  apiKey: string;
}

export interface JevCatalogClient {
  choice(id: string, content: EntryType): Promise<ChoiceResponse>;
  score(id: string, content: EntryType): Promise<ScoreResponse>;
  noul(id: string, content: EntryType): Promise<NoulResponse>;
  /** Discover catalog entries by domain, tags, and/or an arbitrary
   * predicate, e.g. `jev.list({ domain: "blog-article", tags: ["quality"] })`
   * or `jev.list({ predicate: (e) => e.type === "score" })`, without
   * grepping the bundled JSON files. */
  list(filter?: CatalogFilter): CatalogEntry[];
}

function assertType(entry: CatalogEntry, expected: CatalogEntry["type"]): void {
  if (entry.type !== expected) {
    throw new Error(
      `jev-cms: catalog question "${entry.id}" is type "${entry.type}", not "${expected}" — ` +
        `call .${entry.type}() instead of .${expected}() for this id.`,
    );
  }
}

function buildQuestion(entry: CatalogEntry, expected: CatalogEntry["type"]): Question {
  if (expected === "choice") {
    if (!entry.criteria || Array.isArray(entry.criteria)) {
      throw new Error(`jev-cms: catalog entry "${entry.id}" is missing choice criteria`);
    }
    return choice(entry.instructions, entry.criteria);
  }
  if (expected === "score") {
    if (!Array.isArray(entry.criteria) || entry.criteria.length < 2) {
      throw new Error(`jev-cms: catalog entry "${entry.id}" needs at least 2 score criteria`);
    }
    return score(entry.instructions, entry.criteria as [string, string, ...string[]]);
  }
  return noul(entry.instructions);
}

async function resolve(
  client: TypeSafeClient,
  id: string,
  expected: CatalogEntry["type"],
  content: EntryType,
) {
  const entry = getCatalogEntry(id);
  assertType(entry, expected);
  const question = buildQuestion(entry, expected);
  const response = await client.systemOne({ state: content, questions: { [id]: question } });
  return response.answers[id];
}

/**
 * Resolve specific questions from jev-cms's bundled catalog (see
 * catalog/README.md) against your own content, independent of the Strapi
 * webhook pipeline — no CMS config, webhook secret, or running server
 * needed, just an API key.
 *
 * @example
 * const jev = createJevCatalog({ apiKey: process.env.MY_TYPESAFE_KEY! });
 * const fit = await jev.choice("event-listing.audienceFitClarity", myEventText);
 */
export function createJevCatalog(config: JevCatalogConfig): JevCatalogClient {
  const client = new TypeSafeClient({ apiKey: config.apiKey });

  return {
    choice: (id, content) => resolve(client, id, "choice", content) as Promise<ChoiceResponse>,
    score: (id, content) => resolve(client, id, "score", content) as Promise<ScoreResponse>,
    noul: (id, content) => resolve(client, id, "noul", content) as Promise<NoulResponse>,
    list: (filter) => listCatalog(filter),
  };
}
