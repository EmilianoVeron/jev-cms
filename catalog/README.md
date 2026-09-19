# jev-cms question catalog

A reference library of candidate Jev (TypeSafe System One) questions, organized by content
domain. **This is not loaded by the running service.** `jev-cms`'s `defaultQuestions.ts` and
`defaultDecide.ts` are unaffected by anything in this directory — batching all of these into
one live call would be enormous on tokens and mostly irrelevant to any single piece of
content. This catalog exists so a `jev-cms` user (or a future adapter/config) can pick and
choose specific questions relevant to their own content type, on demand — via `jev.choice()` /
`.score()` / `.noul()` by id, or `jev.list({ domain, tags })` to discover ids; see the
package README for both.

## Why these domains

Domain selection was grounded in actual CMS market research (W3Techs-style usage data,
September 2026), not assumption:

- **WordPress** holds roughly 59–63% of the "known CMS" market (~33–41% of all websites) —
  content types: blog posts/pages, and via WooCommerce, e-commerce products.
- **Shopify** (~7.7% of known-CMS share) and other hosted platforms (Wix ~6.1%, Squarespace
  ~3.5%) are predominantly e-commerce and small-business site builders — product listings,
  category pages, landing pages.
- **Drupal/Joomla** skew toward government, enterprise, and community/multilingual sites —
  informed the knowledge-base, legal/policy, and forum domains.
- **Headless CMSs** (Contentful, Sanity, Strapi, Payload, Storyblok) are growing fastest among
  developers building custom content models — typically blog/article, marketing/landing
  pages, and documentation content, which is why those domains got deeper coverage.
- Cross-cutting domains (comment moderation, SEO-adjacent judgment calls, localization
  quality) were added because they apply across almost every content type above rather than
  being tied to one.

Sources: [MobiLoud CMS Market Share 2026](https://www.mobiloud.com/blog/cms-market-share/),
[Colorlib CMS Market Share 2026](https://colorlib.com/wp/cms-market-share/),
[Sanity: Top Headless CMS Platforms 2026](https://www.sanity.io/top-5-headless-cms-platforms-2026).

## Entry schema

Each domain file is a JSON array of entries shaped as:

```ts
{
  id: string;            // dot-namespaced, e.g. "blog-article.titleMatchesContent"
  domain: string;         // matches the filename (without .json)
  type: "choice" | "score" | "noul";
  instructions: string;   // the question text, referencing `content` as the state field name
  criteria?:               // shape depends on type:
    | Record<string, string>   // choice: label -> description
    | string[];                 // score: ordered array of 2-10 situation descriptions
                                 // (omitted for most noul entries)
  tags: string[];          // e.g. "quality", "compliance", "moderation", "seo-adjacent", "completeness", "classification"
  notes?: string;
}
```

To actually use an entry with the real SDK, map it to the corresponding builder:
`choice(instructions, criteria)`, `score(instructions, criteria)`, or `noul(instructions)`
from `@typesafe-ai/sdk` — this catalog intentionally stores plain data, not executed builder
calls, so it can be filtered/searched without importing code.

## Domains (1000 questions total across 25 files)

| File | Count | Description |
|---|---|---|
| `blog-article.json` | 67 | Blog posts / long-form articles |
| `ecommerce-product.json` | 67 | Individual product listings |
| `knowledge-base-article.json` | 55 | Help-center / support docs |
| `support-ticket.json` | 55 | Customer support tickets/threads |
| `user-review-rating.json` | 50 | Product/service reviews and ratings |
| `ecommerce-category.json` | 45 | Store category/collection pages |
| `job-posting.json` | 45 | Job listings |
| `landing-page-marketing-copy.json` | 45 | Marketing/conversion landing pages |
| `comment-moderation.json` | 42 | Cross-cutting: moderation for any UGC |
| `forum-community-post.json` | 42 | Forum/community discussion posts |
| `real-estate-listing.json` | 40 | Property listings |
| `recipe-food-content.json` | 38 | Recipes/food content |
| `event-listing.json` | 37 | Event listings |
| `email-newsletter.json` | 36 | Marketing/editorial emails |
| `seo-adjacent-judgment.json` | 34 | Cross-cutting: SEO-relevant judgment calls |
| `video-description.json` | 32 | Video titles/descriptions |
| `case-study-testimonial.json` | 31 | Customer case studies/testimonials |
| `legal-policy-page.json` | 31 | ToS, privacy policy, etc. |
| `localization-translation-quality.json` | 31 | Cross-cutting: translated content quality |
| `course-lms-content.json` | 30 | Lessons, quizzes, assignments |
| `press-release.json` | 30 | Press releases/announcements |
| `user-profile-bio.json` | 30 | Author/team/user bios |
| `faq-entry.json` | 29 | Individual FAQ entries |
| `podcast-show-notes.json` | 29 | Podcast episode show notes |
| `portfolio-project-page.json` | 29 | Portfolio/case project pages |

The catalog started at 515 questions built to genuinely non-redundant, atomic-judgment-call
standards (per the `jev` skill's guidance — one job per question, no deterministic facts, no
near-duplicates within or across domains) and was later deepened to 1000 under the same bar,
rather than padded to hit a round number. Deeper domains (blog-article, ecommerce-product,
support-ticket, knowledge-base-article) reflect where the market research showed the heaviest
real-world content volume; every domain now has enough depth (29+) to be useful on its own.

## Explicitly excluded

Deterministic, code-checkable facts never became questions here, per the `jev` skill's core
rule ("if a regex or a lookup solves it, don't spend a question on it"): word/character
counts, whether a meta description or alt text is present, whether a link is broken, exact
date comparisons, and similar. Those belong in your adapter or `decide()` logic, not in a Jev
call.
