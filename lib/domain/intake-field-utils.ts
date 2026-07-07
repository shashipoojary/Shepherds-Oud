export const INTAKE_OTHER_OPTION = "Other";

export const INTAKE_RELATIONSHIP_FIELD_LABEL = "Your relationship to the person needing care";
export const LEGACY_INTAKE_RELATIONSHIP_FIELD_LABEL = "Your relationship to the senior";

export const INTAKE_AGE_RANGE_OPTIONS = [
  "Under 18",
  "18-39",
  "40-59",
  "60-69",
  "70-79",
  "80-89",
  "90 and above"
] as const;

export const relationshipToPersonNeedingCareOptions = [
  "Self",
  "Child",
  "Spouse or partner",
  "Sibling",
  "Other family member",
  "Professional caregiver",
  INTAKE_OTHER_OPTION
] as const;

/** @deprecated Use relationshipToPersonNeedingCareOptions */
export const relationshipToSeniorOptions = relationshipToPersonNeedingCareOptions;

export const decisionMakerRelationshipOptions = [
  "Self",
  "Child",
  "Spouse or partner",
  "Sibling",
  "Other family member",
  "Legal representative",
  "Shared family decision",
  INTAKE_OTHER_OPTION
] as const;

export function fieldKeyFor(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function otherFieldKey(label: string) {
  return `${fieldKeyFor(label)}-other`;
}

export function splitSelectForForm(storedValue: string | undefined | null, options: readonly string[]) {
  const value = storedValue?.trim() || "";
  if (!value) return { value: "", other: "" };
  if (options.includes(value)) return { value, other: "" };
  return { value: INTAKE_OTHER_OPTION, other: value };
}

export function resolveSelectField(
  form: Record<string, string | string[] | undefined>,
  label: string
) {
  const key = fieldKeyFor(label);
  const selected = String(form[key] || "").trim();
  if (selected === INTAKE_OTHER_OPTION) {
    return String(form[otherFieldKey(label)] || "").trim();
  }
  return selected;
}

export function resolveIntakeRelationship(form: Record<string, string | string[] | undefined>) {
  return (
    resolveSelectField(form, INTAKE_RELATIONSHIP_FIELD_LABEL) ||
    resolveSelectField(form, LEGACY_INTAKE_RELATIONSHIP_FIELD_LABEL)
  );
}

export function migrateIntakeFormKeys(form: Record<string, string | string[] | undefined>) {
  const next = { ...form };
  const newKey = fieldKeyFor(INTAKE_RELATIONSHIP_FIELD_LABEL);
  const legacyKey = fieldKeyFor(LEGACY_INTAKE_RELATIONSHIP_FIELD_LABEL);

  if (!next[newKey] && next[legacyKey]) {
    next[newKey] = next[legacyKey];
  }

  const newOtherKey = otherFieldKey(INTAKE_RELATIONSHIP_FIELD_LABEL);
  const legacyOtherKey = otherFieldKey(LEGACY_INTAKE_RELATIONSHIP_FIELD_LABEL);

  if (!next[newOtherKey] && next[legacyOtherKey]) {
    next[newOtherKey] = next[legacyOtherKey];
  }

  return next;
}

export function splitChipsForForm(storedValues: string[] | undefined, options: readonly string[]) {
  const values = storedValues ?? [];
  const known = values.filter((item) => options.includes(item));
  const custom = values.filter((item) => !options.includes(item));

  if (custom.length === 0) {
    return { selected: known, other: "" };
  }

  return {
    selected: [...known.filter((item) => item !== INTAKE_OTHER_OPTION), INTAKE_OTHER_OPTION],
    other: custom.join(", ")
  };
}

export function resolveChipField(form: Record<string, string | string[] | undefined>, label: string) {
  const key = fieldKeyFor(label);
  const selected = Array.isArray(form[key]) ? form[key] : [];
  const custom = String(form[otherFieldKey(label)] || "").trim();

  if (!selected.includes(INTAKE_OTHER_OPTION)) {
    return selected;
  }

  const withoutOther = selected.filter((item) => item !== INTAKE_OTHER_OPTION);
  if (!custom) return withoutOther;
  const extras = custom
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return [...withoutOther, ...extras];
}

export function selectFieldComplete(
  form: Record<string, string | string[] | undefined>,
  label: string,
  options: readonly string[]
) {
  const key = fieldKeyFor(label);
  const selected = String(form[key] || "").trim();
  if (!selected) return false;
  if (selected === INTAKE_OTHER_OPTION) {
    return Boolean(String(form[otherFieldKey(label)] || "").trim());
  }
  return options.includes(selected) || selected.length > 0;
}

export function chipFieldComplete(form: Record<string, string | string[] | undefined>, label: string) {
  const key = fieldKeyFor(label);
  const selected = Array.isArray(form[key]) ? form[key] : [];
  if (selected.length === 0) return false;
  if (selected.includes(INTAKE_OTHER_OPTION)) {
    return Boolean(String(form[otherFieldKey(label)] || "").trim());
  }
  return true;
}
