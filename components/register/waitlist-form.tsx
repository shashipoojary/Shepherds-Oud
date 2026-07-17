"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { careTypeOptions, dutchProvinces, facilityTypes } from "@/lib/config/content";
import { useLocale } from "@/components/i18n/locale-provider";
import { optionLabel } from "@/lib/i18n/ui";
import { formatFieldErrorSummary, parseZodFieldErrors, waitlistFieldLabel } from "@/lib/client/api-field-errors";
import { INTAKE_AGE_RANGE_OPTIONS } from "@/lib/domain/intake-field-utils";
import { cn } from "@/lib/core/utils";

type WaitlistFormProps = {
  type: "FAMILY" | "FACILITY";
};

const fieldClass = (hasError: boolean) =>
  cn(
    "w-full rounded-lg border-[1.5px] bg-white px-3.5 py-2.5 text-[15px] text-neutral-900 outline-none transition focus:border-sage-600",
    hasError ? "border-red-500 ring-1 ring-red-200" : "border-stone-200"
  );

export function WaitlistForm({ type }: WaitlistFormProps) {
  const { locale, ui } = useLocale();
  const w = ui.waitlist;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    contactName: "",
    email: "",
    phone: "",
    city: "",
    province: dutchProvinces[0],
    message: "",
    relationship: "",
    ageRange: "",
    careTypes: [] as string[],
    facilityName: "",
    facilityType: facilityTypes[0],
    bedsTotal: "",
    services: [] as string[],
    registrationNumber: ""
  });

  function toggleChip(field: "careTypes" | "services", value: string) {
    setForm((current) => {
      const list = current[field];
      return {
        ...current,
        [field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      };
    });
  }

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const payload =
      type === "FAMILY"
        ? {
            type,
            contactName: form.contactName,
            email: form.email,
            phone: form.phone || undefined,
            city: form.city || undefined,
            province: form.province || undefined,
            message: form.message || undefined,
            relationship: form.relationship || undefined,
            ageRange: form.ageRange || undefined,
            careTypes: form.careTypes
          }
        : {
            type,
            contactName: form.contactName,
            email: form.email,
            phone: form.phone || undefined,
            city: form.city || undefined,
            province: form.province || undefined,
            message: form.message || undefined,
            facilityName: form.facilityName,
            facilityType: form.facilityType,
            bedsTotal: form.bedsTotal ? Number(form.bedsTotal) : undefined,
            services: form.services,
            registrationNumber: form.registrationNumber.trim()
          };

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        const apiErrors = parseZodFieldErrors(data);
        if (Object.keys(apiErrors).length) {
          setFieldErrors(apiErrors);
          setError(
            formatFieldErrorSummary(apiErrors, (key) => waitlistFieldLabel(key, locale)) ||
              data.error ||
              w.fixFields
          );
        } else {
          setError(data.error || w.saveFailed);
        }
        setLoading(false);
        return;
      }

      router.push(type === "FAMILY" ? "/register/success?type=family" : "/register/success?type=facility");
    } catch {
      setError(w.saveFailed);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      {type === "FACILITY" ? (
        <Field label={w.facilityName} error={fieldErrors.facilityName}>
          <input
            className={fieldClass(Boolean(fieldErrors.facilityName))}
            value={form.facilityName}
            onChange={(e) => {
              clearFieldError("facilityName");
              setForm({ ...form, facilityName: e.target.value });
            }}
            required
          />
        </Field>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={type === "FACILITY" ? w.contactPerson : w.yourName} error={fieldErrors.contactName}>
          <input
            className={fieldClass(Boolean(fieldErrors.contactName))}
            value={form.contactName}
            onChange={(e) => {
              clearFieldError("contactName");
              setForm({ ...form, contactName: e.target.value });
            }}
            required
          />
        </Field>
        <Field label={w.email} error={fieldErrors.email}>
          <input
            type="email"
            className={fieldClass(Boolean(fieldErrors.email))}
            value={form.email}
            onChange={(e) => {
              clearFieldError("email");
              setForm({ ...form, email: e.target.value });
            }}
            required
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={w.phone} error={fieldErrors.phone}>
          <input
            className={fieldClass(Boolean(fieldErrors.phone))}
            value={form.phone}
            onChange={(e) => {
              clearFieldError("phone");
              setForm({ ...form, phone: e.target.value });
            }}
            placeholder="+31 6 ..."
          />
        </Field>
        <Field label={w.city} error={fieldErrors.city}>
          <input
            className={fieldClass(Boolean(fieldErrors.city))}
            value={form.city}
            onChange={(e) => {
              clearFieldError("city");
              setForm({ ...form, city: e.target.value });
            }}
            placeholder={w.cityPlaceholder}
          />
        </Field>
      </div>

      <Field label={w.province} error={fieldErrors.province}>
        <CustomSelect value={form.province} onChange={(value) => setForm({ ...form, province: value })} options={dutchProvinces} />
      </Field>

      {type === "FAMILY" ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={w.relationship} error={fieldErrors.relationship}>
              <input
                className={fieldClass(Boolean(fieldErrors.relationship))}
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                placeholder={w.relationshipPlaceholder}
              />
            </Field>
            <Field label={w.ageRange} error={fieldErrors.ageRange}>
              <CustomSelect
                value={form.ageRange}
                onChange={(value) => setForm({ ...form, ageRange: value })}
                options={[...INTAKE_AGE_RANGE_OPTIONS]}
                formatOption={(value) => optionLabel(locale, value)}
                placeholder={w.agePlaceholder}
              />
            </Field>
          </div>
          <ChipField
            label={w.careTypes}
            options={careTypeOptions}
            selected={form.careTypes}
            onToggle={(value) => toggleChip("careTypes", value)}
            formatOption={(value) => optionLabel(locale, value)}
          />
        </>
      ) : (
        <>
          <Field label={w.facilityType} error={fieldErrors.facilityType}>
            <CustomSelect
              value={form.facilityType}
              onChange={(value) => setForm({ ...form, facilityType: value })}
              options={facilityTypes}
              formatOption={(value) => optionLabel(locale, value)}
            />
          </Field>
          <Field label={w.registrationNumber} error={fieldErrors.registrationNumber}>
            <input
              className={fieldClass(Boolean(fieldErrors.registrationNumber))}
              value={form.registrationNumber}
              onChange={(e) => {
                clearFieldError("registrationNumber");
                setForm({ ...form, registrationNumber: e.target.value });
              }}
              placeholder={w.registrationPlaceholder}
              required
            />
            <span className="text-xs text-neutral-500">{w.registrationHint}</span>
          </Field>
          <Field label={w.bedsOptional} error={fieldErrors.bedsTotal}>
            <input
              type="number"
              min="0"
              className={fieldClass(Boolean(fieldErrors.bedsTotal))}
              value={form.bedsTotal}
              onChange={(e) => setForm({ ...form, bedsTotal: e.target.value })}
            />
          </Field>
          <ChipField
            label={w.services}
            options={careTypeOptions}
            selected={form.services}
            onToggle={(value) => toggleChip("services", value)}
            formatOption={(value) => optionLabel(locale, value)}
          />
        </>
      )}

      <Field label={w.message} error={fieldErrors.message}>
        <textarea
          className={cn(fieldClass(Boolean(fieldErrors.message)), "min-h-28")}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder={w.messagePlaceholder}
        />
      </Field>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {w.submitting}
          </>
        ) : (
          w.submit
        )}
      </Button>
    </form>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-neutral-800">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </label>
  );
}

function ChipField({
  label,
  options,
  selected,
  onToggle,
  formatOption
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  formatOption?: (value: string) => string;
}) {
  const format = formatOption ?? ((value: string) => value);
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-neutral-800">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip key={option} selected={selected.includes(option)} onClick={() => onToggle(option)}>
            {format(option)}
          </Chip>
        ))}
      </div>
    </div>
  );
}
