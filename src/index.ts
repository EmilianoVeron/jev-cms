/**
 * Library entry point. Deliberately independent of server.ts/config.ts —
 * importing this must never require STRAPI_URL/WEBHOOK_SECRET/any CMS
 * config, and must never start a server as a side effect. The webhook
 * pipeline is run via `npm start`, not imported.
 */
export { createJevCatalog } from "./catalog/client.js";
export type { JevCatalogClient, JevCatalogConfig } from "./catalog/client.js";
export type { CatalogEntry } from "./catalog/types.js";
export type { CatalogFilter } from "./catalog/loader.js";
