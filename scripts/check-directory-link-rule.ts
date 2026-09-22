/**
 * ponytail: one assert for directory↔provider link uniqueness rule.
 * Run: npx tsx scripts/check-directory-link-rule.ts
 */
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Same rule the admin API enforces: one Provider can only link to one DirectoryProvider. */
function canLink(
  listingId: string,
  providerId: string,
  existing: Array<{ id: string; linkedProviderId: string | null }>
) {
  const clash = existing.find(
    (row) => row.linkedProviderId === providerId && row.id !== listingId
  );
  return !clash;
}

const rows = [
  { id: "dir-a", linkedProviderId: "prov-1" },
  { id: "dir-b", linkedProviderId: null }
];

assert(canLink("dir-b", "prov-2", rows), "free provider should link");
assert(!canLink("dir-b", "prov-1", rows), "provider already on dir-a must block");
assert(canLink("dir-a", "prov-1", rows), "re-linking same pair is ok");

console.log("directory-link-rule: ok");
