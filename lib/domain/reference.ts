/** Short human-friendly reference from a cuid (matches family email + success page). */
export function formatReference(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function matchesReferenceQuery(id: string, query: string) {
  const q = query.trim().toUpperCase();
  if (!q) return true;
  return id.toUpperCase().includes(q) || formatReference(id).includes(q);
}

export function matchesListSearch(query: string, ...fields: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field?.toLowerCase().includes(q));
}
