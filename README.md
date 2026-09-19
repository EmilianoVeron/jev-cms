# jev-cms

An on-demand question catalog for [Jev](https://typesafe.ai) (TypeSafe's System One model),
built around CMS-style content. Install it, pick a question by id from the bundled catalog,
and resolve it against your own content — however you want to use the answer.

```ts
import { createJevCatalog } from "@em.vrn/jev-cms";

const jev = createJevCatalog({ apiKey: "your-typesafe-api-key" });

const fit = await jev.choice("event-listing.audienceFitClarity", myEventDescription);
// fit: { choice, confidence, probabilities } — the real SDK response

const ready = await jev.noul("blog-article.readyToPublish", myDraftText);
// ready: { noul } — probability of "yes", 0-1
```

No server to run, no webhook, no CMS-specific config — just an API key and a question id.

## Install

```bash
npm install @em.vrn/jev-cms
```

## API

```ts
function createJevCatalog(config: { apiKey: string }): {
  choice(id: string, content: EntryType): Promise<ChoiceResponse>;
  score(id: string, content: EntryType): Promise<ScoreResponse>;
  noul(id: string, content: EntryType): Promise<NoulResponse>;
  list(filter?: { domain?: string; tags?: string[]; predicate?: (entry: CatalogEntry) => boolean }): CatalogEntry[];
};
```

- **`apiKey`** — required, no environment-variable fallback. This is a library other apps
  depend on; assuming a specific env var name (`TYPESAFE_API_KEY` or anything else) would be
  presumptuous about how the consuming app manages its own secrets. Read your own env var and
  pass it in explicitly.
- **`content`** — the text (or structured object/array) to evaluate; passed straight through
  as the Jev `state`.
- **`choice`/`score`/`noul`** mirror the catalog entry's own type. Calling the wrong one for a
  given id — e.g. `.noul()` on a Choice-typed question — throws immediately, before any Jev
  call is made, rather than doing something unexpected. An unknown id also throws immediately.
- Return values are the actual `@typesafe-ai/sdk` response types (`ChoiceResponse` has
  `choice`/`confidence`/`probabilities`; `ScoreResponse` has `score`/`confidence`; `NoulResponse`
  has `noul`) — nothing is unwrapped or simplified, so you get everything Jev returns.
- **`list(filter?)`** — discover catalog entries without grepping the JSON files. Omit `filter`
  (or pass `{}`) for the full catalog; `domain` matches exactly; `tags` requires an entry to have
  *every* listed tag (narrows the result, rather than broadening it); `predicate` is an arbitrary
  `(entry: CatalogEntry) => boolean` for anything `domain`/`tags` can't express (matching on
  `type`, `id`, or `instructions` text, for example). All three AND together:

  ```ts
  jev.list({ domain: "blog-article", tags: ["quality"] });
  // → every blog-article entry tagged "quality"

  jev.list({ domain: "blog-article", predicate: (e) => e.type === "score" });
  // → every blog-article entry that's a Score question
  ```

## The catalog

`catalog/` holds 1000 candidate questions across 25 CMS-relevant content-type domains
(blog articles, e-commerce products, support tickets, reviews, job postings, and more),
grounded in real CMS market-share research rather than guesswork. See **`catalog/README.md`**
for the full domain list, question counts, entry schema, and research sources.

The catalog is plain JSON data, not executable code — browse or grep it directly to find
question ids for your content type:

```bash
grep -l "readyToPublish" catalog/*.json
```

Every question is a genuine judgment call Jev can meaningfully answer — never a deterministic
fact (word count, meta tags, broken links) that your own code should check instead. See the
[`jev` skill](https://github.com/EmilianoVeron/jev-skill)'s guidance if you're evaluating whether
a question you want to add belongs here.

## Testing

```bash
npm test
```

- `src/catalog/loader.test.ts` — catalog loading and id lookup.
- `src/catalog/client.test.ts` — `choice`/`score`/`noul` resolution, wrong-type and unknown-id
  errors, with `TypeSafeClient` mocked (no real API calls in the suite).
