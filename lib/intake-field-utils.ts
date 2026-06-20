export const INTAKE_OTHER_OPTION = "Other";

export const relationshipToSeniorOptions = [
  "Self",
  "Child",
  "Spouse or partner",
  "Sibling",
  "Other family member",
  "Professional caregiver",
  INTAKE_OTHER_OPTION
] as const;

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
