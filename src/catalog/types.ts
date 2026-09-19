export interface CatalogEntry {
  id: string;
  domain: string;
  type: "choice" | "score" | "noul";
  instructions: string;
  /** Shape depends on `type`: Record<label, description> for choice,
   * an ordered array (2+ entries) of situation descriptions for score,
   * omitted for most noul entries. */
  criteria?: Record<string, string> | string[];
  tags: string[];
  notes?: string;
}
