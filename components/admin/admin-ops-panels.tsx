"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Building2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { ListPager } from "@/components/ui/list-pager";
import { ListSearch } from "@/components/ui/list-search";
import { UnreadDot } from "@/components/ui/unread-dot";
import { DetailList, PanelSection, PanelTopic, panelNoticeTone, SlidePanel, StatusPill, TagList, usePanelMessage } from "@/components/ui/slide-panel";
import type { AdminDashboardData } from "@/lib/data/admin";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { brand } from "@/lib/config/brand";
import { cn } from "@/lib/core/utils";
import { isAdminItemUnread, markAdminItemSeen } from "@/lib/client/admin-item-seen";
import { displayProviderAvailability, formatAvailabilityLastUpdated } from "@/lib/domain/provider-availability";
import {
  PROVIDER_VERIFICATION_STATUSES,
  isProviderMatchable,
  providerVerificationBadgeVariant,
  providerVerificationLabel
} from "@/lib/domain/provider-verification";
import { formatReference } from "@/lib/domain/reference";
import { isResolvedWaitlistStatus, waitlistStatusLabel } from "@/lib/domain/waitlist-status";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/config";
import { recordAction } from "@/lib/client/actions";

type WaitlistEntry = AdminDashboardData["waitlist"][number];

function normalizeRecordLocale(value?: string | null): Locale {
  return value === "en" ? "en" : "nl";
}

function localeLanguageLabel(locale: Locale) {
  return locale === "en" ? "English" : "Dutch";
}

function summarizeAdminList(value: string | string[] | null | undefined, maxVisible = 2) {
  const items = Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (!items.length) return "—";
  if (items.length <= maxVisible) return items.join(", ");
  return `${items.slice(0, maxVisible).join(", ")} +${items.length - maxVisible}`;
}

function canInviteProvider(entry: WaitlistEntry) {
  return entry.type === "FACILITY" && entry.canSendProviderInvite;
}

/** Verified flag stays editable until mark-contacted or any non-revoked invite. */
function isRegistrationVerificationLocked(entry: WaitlistEntry) {
  return (
    entry.status !== "NEW" ||
    entry.providerInviteAttemptsUsed > 0 ||
    entry.hasActivePendingProviderInvite
  );
}

function providerInviteButtonLabel(entry: WaitlistEntry) {
  if (entry.canSendProviderInvite) {
    return entry.providerInviteAttemptsUsed > 0 ? "Re-send invite" : "Invite provider";
  }
  if (entry.hasActivePendingProviderInvite) {
    return "Invite pending";
  }
  if (entry.providerInviteAttemptsRemaining === 0) {
    return "Invite limit reached";
  }
  return "Invite locked";
}

function providerInviteLockMessage(entry: WaitlistEntry) {
  return entry.providerInviteLockReason || "This registration cannot be invited right now.";
}

function formatProviderPriceRange(priceMin: number | null, priceMax: number | null) {
  if (priceMin != null && priceMax != null) {
    return `EUR ${priceMin.toLocaleString("en-GB")} – EUR ${priceMax.toLocaleString("en-GB")} per month`;
  }
  if (priceMin != null) {
    return `From EUR ${priceMin.toLocaleString("en-GB")} per month`;
  }
  if (priceMax != null) {
    return `Up to EUR ${priceMax.toLocaleString("en-GB")} per month`;
  }
  return null;
}

export function ProvidersTable({
  providers,
  itemSeenVersion,
  onMarkItemSeen,
  onSync,
  search,
  onSearchChange,
  pagination,
  onPageChange,
  listPending
}: {
  providers: AdminDashboardData["providerList"];
  itemSeenVersion: number;
  onMarkItemSeen: () => void;
  onSync: () => Promise<boolean>;
  search: string;
  onSearchChange: (value: string) => void;
  pagination: AdminDashboardData["pagination"]["providers"];
  onPageChange: (page: number) => void;
  listPending?: boolean;
}) {
  const [selected, setSelected] = useState<AdminDashboardData["providerList"][number] | null>(null);

  function openProvider(provider: AdminDashboardData["providerList"][number]) {
    markAdminItemSeen("provider", provider.id, provider.createdAtIso, provider.updatedAtIso);
    onMarkItemSeen();
    setSelected(provider);
  }

  useEffect(() => {
    setSelected((current) => {
      if (!current) return null;
      const fresh = providers.find((provider) => provider.id === current.id) ?? null;
      if (fresh) {
        markAdminItemSeen("provider", fresh.id, fresh.createdAtIso, fresh.updatedAtIso);
        onMarkItemSeen();
      }
      return fresh;
    });
  }, [providers, onMarkItemSeen]);

  return (
    <>
      <div className="border-b border-stone-100 px-3 py-3 sm:px-4">
        <ListSearch
          value={search}
          onChange={onSearchChange}
          placeholder="Search providers by name, area, availability, or reference..."
        />
      </div>
      {!providers.length ? (
        <p className="px-5 py-8 text-center text-sm text-ink/50">
          {search ? "No providers match this search." : "No providers yet."}
        </p>
      ) : (
      <table className="w-full min-w-[320px] border-collapse text-left sm:min-w-[520px]">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-3 py-3 sm:px-4">Provider</th>
            <th className="hidden px-4 py-3 sm:table-cell">Type</th>
            <th className="hidden px-4 py-3 md:table-cell">Area</th>
            <th className="hidden px-4 py-3 lg:table-cell">Availability</th>
            <th className="hidden px-4 py-3 xl:table-cell">Beds open</th>
            <th className="whitespace-nowrap px-3 py-3 sm:px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {providers.map((provider) => {
            const isUnread =
              selected?.id !== provider.id &&
              itemSeenVersion >= 0 &&
              isAdminItemUnread("provider", provider.id, provider.createdAtIso, provider.updatedAtIso);
            const availability = displayProviderAvailability(provider);

            return (
            <tr key={provider.id} className="cursor-pointer hover:bg-cream" onClick={() => openProvider(provider)}>
              <td className="min-w-0 max-w-[20rem] px-3 py-3 align-middle text-sm sm:px-4">
                <div className="flex min-w-0 items-center gap-2">
                  {isUnread ? <UnreadDot className="shrink-0" /> : null}
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <strong className="min-w-0 truncate text-ink">{provider.name}</strong>
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <Badge variant={provider.profileComplete ? "softSuccess" : "softPending"}>
                          {provider.profileComplete ? "Active" : "Locked"}
                        </Badge>
                        <Badge variant={providerVerificationBadgeVariant(provider.verificationStatus)}>
                          {provider.verificationLabel || providerVerificationLabel(provider.verificationStatus)}
                        </Badge>
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-neutral-400">
                      Ref {formatReference(provider.id)}
                      <span className="sm:hidden">
                        {" | "}
                        {provider.type} | {provider.area}
                      </span>
                    </p>
                    {!provider.profileComplete ? (
                      <p className="mt-0.5 text-xs text-neutral-500">Complete profile to unlock</p>
                    ) : !provider.matchable ? (
                      <p className="mt-0.5 text-xs text-neutral-500">Needs Verified status to match</p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 align-middle text-sm text-neutral-600 sm:table-cell">{provider.type}</td>
              <td className="hidden px-4 py-3 align-middle text-sm text-neutral-600 md:table-cell">{provider.area}</td>
              <td className="hidden px-4 py-3 align-middle text-sm text-neutral-600 lg:table-cell">{availability}</td>
              <td className="hidden px-4 py-3 align-middle text-sm text-neutral-600 xl:table-cell">
                {provider.bedsOpen ?? "-"}
                {provider.bedsTotal ? ` / ${provider.bedsTotal}` : ""}
              </td>
              <td className="px-3 py-3 align-middle sm:px-4" onClick={(event) => event.stopPropagation()}>
                <IconActionButton label="Open details" icon={ArrowUpRight} onClick={() => openProvider(provider)} />
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      )}

      <ListPager
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        pending={listPending}
        onPageChange={onPageChange}
      />

      <ProviderDetailPanel provider={selected} onClose={() => setSelected(null)} onSync={onSync} />
    </>
  );
}

function ProviderDetailPanel({
  provider,
  onClose,
  onSync
}: {
  provider: AdminDashboardData["providerList"][number] | null;
  onClose: () => void;
  onSync: () => Promise<boolean>;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
  const [adminNotes, setAdminNotes] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<string>("REGISTRATION_RECEIVED");
  const [legalOrganisationName, setLegalOrganisationName] = useState("");
  const [kvkNumber, setKvkNumber] = useState("");
  const [agbCode, setAgbCode] = useState("");
  const [wtzaStatus, setWtzaStatus] = useState("");
  const [roomTypesText, setRoomTypesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingVerification, setSavingVerification] = useState(false);
  const previousProviderIdRef = useRef<string | null>(null);

  const roomTypesFromProvider = (provider?.roomTypes ?? []).join(", ");
  const hasUnsavedAdminNotes = provider ? adminNotes !== (provider.adminNotes ?? "") : false;
  const hasUnsavedVerification = provider
    ? verificationStatus !== (provider.verificationStatus || "REGISTRATION_RECEIVED") ||
      legalOrganisationName !== (provider.legalOrganisationName ?? "") ||
      kvkNumber !== (provider.kvkNumber ?? "") ||
      agbCode !== (provider.agbCode ?? "") ||
      wtzaStatus !== (provider.wtzaStatus ?? "") ||
      roomTypesText !== roomTypesFromProvider
    : false;

  useEffect(() => {
    if (!provider) clearPanelMessage();
  }, [provider, clearPanelMessage]);

  useEffect(() => {
    if (!provider) {
      previousProviderIdRef.current = null;
      setAdminNotes("");
      setVerificationStatus("REGISTRATION_RECEIVED");
      setLegalOrganisationName("");
      setKvkNumber("");
      setAgbCode("");
      setWtzaStatus("");
      setRoomTypesText("");
      return;
    }

    const isNewProvider = previousProviderIdRef.current !== provider.id;
    if (isNewProvider) {
      previousProviderIdRef.current = provider.id;
      setAdminNotes(provider.adminNotes ?? "");
      setVerificationStatus(provider.verificationStatus || "REGISTRATION_RECEIVED");
      setLegalOrganisationName(provider.legalOrganisationName ?? "");
      setKvkNumber(provider.kvkNumber ?? "");
      setAgbCode(provider.agbCode ?? "");
      setWtzaStatus(provider.wtzaStatus ?? "");
      setRoomTypesText((provider.roomTypes ?? []).join(", "));
      return;
    }

    if (!hasUnsavedAdminNotes) {
      setAdminNotes(provider.adminNotes ?? "");
    }
    if (!hasUnsavedVerification) {
      setVerificationStatus(provider.verificationStatus || "REGISTRATION_RECEIVED");
      setLegalOrganisationName(provider.legalOrganisationName ?? "");
      setKvkNumber(provider.kvkNumber ?? "");
      setAgbCode(provider.agbCode ?? "");
      setWtzaStatus(provider.wtzaStatus ?? "");
      setRoomTypesText((provider.roomTypes ?? []).join(", "));
    }
  }, [provider, hasUnsavedAdminNotes, hasUnsavedVerification]);

  const priceRange = provider ? formatProviderPriceRange(provider.priceMin, provider.priceMax) : null;
  const availability = provider ? displayProviderAvailability(provider) : null;
  const bedsSummary =
    provider && (provider.bedsOpen != null || provider.bedsTotal != null)
      ? `${provider.bedsOpen ?? "-"} open | ${provider.bedsTotal ?? "-"} total`
      : null;
  const availabilityUpdatedLabel = provider
    ? formatAvailabilityLastUpdated(provider.updatedAtIso) ?? provider.updatedAt
    : null;

  async function saveAdminNotes() {
    if (!provider) return;
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: adminNotes.trim() || null })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setPanelMessage(payload?.error || "Could not save internal notes.");
        return;
      }
      const ok = await onSync();
      setPanelMessage(ok ? "Internal notes saved." : "Notes saved, but the dashboard could not refresh.");
    } catch {
      setPanelMessage("Could not save internal notes.");
    } finally {
      setSavingNotes(false);
    }
  }

  async function saveVerification() {
    if (!provider) return;
    setSavingVerification(true);
    try {
      const roomTypes = roomTypesText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus,
          legalOrganisationName: legalOrganisationName.trim() || null,
          kvkNumber: kvkNumber.trim() || null,
          agbCode: agbCode.trim() || null,
          wtzaStatus: wtzaStatus.trim() || null,
          roomTypes
        })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setPanelMessage(payload?.error || "Could not save verification details.");
        return;
      }
      const ok = await onSync();
      setPanelMessage(ok ? "Verification details saved." : "Verification saved, but the dashboard could not refresh.");
    } catch {
      setPanelMessage("Could not save verification details.");
    } finally {
      setSavingVerification(false);
    }
  }

  return (
    <SlidePanel
      open={Boolean(provider)}
      onClose={onClose}
      size="xl"
      title={provider?.name || "Provider"}
      subtitle={provider ? `${provider.type} | ${provider.area}` : "Facility profile"}
      notice={panelMessage}
      noticeTone={panelNoticeTone(panelMessage)}
    >
      {provider ? (
        <div className="space-y-5">
          {!provider.profileComplete ? (
            <div className="rounded-lg bg-brand-amber/10 px-4 py-3">
              <p className="text-sm font-semibold text-brand-amber-dark">Provider locked</p>
              <p className="mt-1 text-sm leading-6 text-neutral-700">
                This provider stays locked until their facility profile is complete.
              </p>
              {provider.profileMissingRequirements.length ? (
                <p className="mt-2 text-xs leading-5 text-neutral-600">
                  Missing: {provider.profileMissingRequirements.join(", ")}
                </p>
              ) : null}
            </div>
          ) : !isProviderMatchable(provider.verificationStatus) ? (
            <div className="rounded-lg bg-stone-50 px-4 py-3">
              <p className="text-sm font-semibold text-ink">Not yet matchable</p>
              <p className="mt-1 text-sm leading-6 text-neutral-700">
                Set verification to Verified, Onboarding complete, or Listing live before creating family matches.
              </p>
            </div>
          ) : null}

          <StatusPill className="bg-transparent px-0 py-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <span className="text-xs font-medium text-neutral-500">Verification</span>
                <p className="mt-1 font-semibold text-ink">
                  {provider.verificationLabel || providerVerificationLabel(provider.verificationStatus)}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Availability</span>
                <p className="mt-1 font-semibold text-ink">{availability || "Not set"}</p>
                {availabilityUpdatedLabel ? (
                  <p className="mt-0.5 text-xs text-neutral-500">Last updated {availabilityUpdatedLabel}</p>
                ) : null}
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Beds</span>
                <p className="mt-1 font-semibold text-ink">{bedsSummary || "Not set"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Response time</span>
                <p className="mt-1 font-semibold text-ink">
                  {provider.responseTimeHours ? `${provider.responseTimeHours} hours` : "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Visit availability</span>
                <p className="mt-1 font-semibold text-ink">{provider.visitAvailability || "Visits welcome"}</p>
              </div>
            </div>
          </StatusPill>

          <PanelSection
            step={1}
            title="Verification and registration"
            description="Controls matching eligibility. Listing live is required for public recommendation."
            collapsible
            defaultOpen
          >
            <div className="space-y-3">
              <label className="grid gap-2 text-sm font-medium">
                Verification status
                <select
                  value={verificationStatus}
                  onChange={(event) => setVerificationStatus(event.target.value)}
                  className={adminFieldClass}
                >
                  {PROVIDER_VERIFICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {providerVerificationLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Legal organisation name
                <input
                  value={legalOrganisationName}
                  onChange={(event) => setLegalOrganisationName(event.target.value)}
                  className={adminFieldClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                KvK number
                <input
                  value={kvkNumber}
                  onChange={(event) => setKvkNumber(event.target.value)}
                  className={adminFieldClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                AGB code
                <input
                  value={agbCode}
                  onChange={(event) => setAgbCode(event.target.value)}
                  className={adminFieldClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Wtza status
                <input
                  value={wtzaStatus}
                  onChange={(event) => setWtzaStatus(event.target.value)}
                  className={adminFieldClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Room types (comma-separated)
                <input
                  value={roomTypesText}
                  onChange={(event) => setRoomTypesText(event.target.value)}
                  placeholder="Single room, Shared room"
                  className={adminFieldClass}
                />
              </label>
              <AdminPanelActions>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingVerification || !hasUnsavedVerification}
                  onClick={() => void saveVerification()}
                >
                  {savingVerification ? "Saving..." : "Save verification"}
                </Button>
              </AdminPanelActions>
            </div>
          </PanelSection>

          <div className="divide-y divide-stone-100 border-t border-stone-100">
            <PanelTopic title="Contact" defaultOpen>
              <DetailList
                columns={1}
                items={[
                  { label: "Contact name", value: provider.contactName },
                  { label: "Email", value: provider.email },
                  { label: "Phone", value: provider.phone },
                  { label: "Website", value: provider.website },
                  {
                    label: "UI language (emails)",
                    value: localeLanguageLabel(normalizeRecordLocale(provider.preferredLocale))
                  }
                ]}
              />
            </PanelTopic>
            <PanelTopic title="Location">
              <DetailList
                columns={1}
                items={[
                  { label: "Facility name", value: provider.name },
                  { label: "Type", value: provider.type },
                  { label: "Area", value: provider.area },
                  { label: "City", value: provider.city },
                  { label: "Province", value: provider.province }
                ]}
              />
            </PanelTopic>
            <PanelTopic title="Capacity and pricing">
              <DetailList
                columns={1}
                items={[
                  { label: "Available beds", value: provider.bedsOpen != null ? String(provider.bedsOpen) : null },
                  { label: "Total beds / places", value: provider.bedsTotal != null ? String(provider.bedsTotal) : null },
                  { label: "Availability status", value: provider.availabilityStatus },
                  { label: "Waitlist", value: provider.waitlistText },
                  { label: "Price range", value: priceRange }
                ]}
              />
            </PanelTopic>
            <PanelTopic title="Care profile">
              <DetailList columns={1} items={[{ label: "Dementia capacity", value: provider.dementiaCapacity }]} />
              <div className="mt-2 space-y-3">
                <div>
                  <p className="text-xs font-medium text-neutral-500">Care levels</p>
                  <div className="mt-1.5">
                    <TagList items={provider.careLevels ?? []} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Room types</p>
                  <div className="mt-1.5">
                    <TagList items={provider.roomTypes ?? []} />
                  </div>
                </div>
              </div>
            </PanelTopic>
            <PanelTopic title="Services and languages">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-neutral-500">Services offered</p>
                  <div className="mt-1.5">
                    <TagList items={provider.services ?? []} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Languages spoken</p>
                  <div className="mt-1.5">
                    <TagList items={provider.languages ?? []} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Funding types accepted</p>
                  <div className="mt-1.5">
                    <TagList items={provider.fundingTypes ?? []} />
                  </div>
                </div>
              </div>
            </PanelTopic>
            <PanelTopic title="Quality and accessibility">
              <DetailList
                columns={1}
                items={[
                  { label: "Quality information", value: provider.qualityInfo },
                  { label: "Accessibility notes", value: provider.accessibilityNotes }
                ]}
              />
            </PanelTopic>
            <PanelTopic title="Description">
              <p className="text-sm leading-7 text-neutral-700">{provider.description?.trim() || "-"}</p>
            </PanelTopic>
            <PanelTopic title="Record">
              <DetailList
                columns={1}
                items={[
                  { label: "Provider ID", value: provider.id },
                  { label: "Added", value: provider.createdAt },
                  { label: "Last updated", value: provider.updatedAt }
                ]}
              />
            </PanelTopic>
          </div>

          <PanelSection
            title="Internal notes"
            description="Visible to admins only. Use for vetting notes, referral context, or follow-up reminders."
            collapsible
            defaultOpen={false}
          >
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              placeholder="Add internal notes about this provider..."
              className={`${adminFieldClass} min-h-28 w-full`}
            />
            <AdminPanelActions>
              <Button type="button" size="sm" disabled={savingNotes} onClick={() => void saveAdminNotes()}>
                {savingNotes ? "Saving..." : "Save notes"}
              </Button>
            </AdminPanelActions>
          </PanelSection>

          <PanelSection title="Quick actions">
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={`/providers/${provider.id}`} target="_blank" rel="noreferrer">
                  Public profile
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(provider.id);
                  setPanelMessage(`Copied provider ID for ${provider.name}.`);
                }}
              >
                Copy ID
              </Button>
            </div>
          </PanelSection>
        </div>
      ) : null}
    </SlidePanel>
  );
}


export function WaitlistTable({
  entries: initialEntries,
  setMessage,
  itemSeenVersion,
  onMarkItemSeen,
  search,
  onSearchChange,
  pagination,
  onPageChange,
  listPending
}: {
  entries: WaitlistEntry[];
  setMessage: (message: string) => void;
  itemSeenVersion: number;
  onMarkItemSeen: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  pagination: AdminDashboardData["pagination"]["waitlist"];
  onPageChange: (page: number) => void;
  listPending?: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<WaitlistEntry | null>(null);
  const [confirmInvite, setConfirmInvite] = useState<WaitlistEntry | null>(null);

  function openEntry(entry: WaitlistEntry) {
    markAdminItemSeen("waitlist", entry.id, entry.createdAtIso, entry.updatedAtIso);
    onMarkItemSeen();
    setSelected(entry);
  }

  useEffect(() => {
    setEntries(initialEntries);
    setSelected((current) => {
      if (!current) return null;
      const fresh = initialEntries.find((entry) => entry.id === current.id) ?? null;
      if (fresh) {
        markAdminItemSeen("waitlist", fresh.id, fresh.createdAtIso, fresh.updatedAtIso);
        onMarkItemSeen();
      }
      return fresh;
    });
  }, [initialEntries, onMarkItemSeen]);

  function canMarkContacted(entry: WaitlistEntry) {
    return entry.status === "NEW";
  }

  function waitlistStatusClass(status: string) {
    switch (status) {
      case "CONTACTED":
        return "bg-brand-amber/15 text-brand-amber-dark";
      case "CONVERTED":
        return "bg-brand-green-pale/70 text-brand-green-dark";
      case "CLOSED":
        return "bg-stone-100 text-neutral-600";
      default:
        return "bg-sage-100 text-sage-700";
    }
  }

  function startProviderInvite(entry: WaitlistEntry, notify: (message: string) => void = setMessage) {
    if (!canInviteProvider(entry)) {
      notify(providerInviteLockMessage(entry));
      return;
    }

    setSelected(null);
    setConfirmInvite(entry);
  }

  async function markContacted(id: string, name: string, notify: (message: string) => void = setMessage) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONTACTED" })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not update waitlist entry.");
      }

      const result = (await response.json()) as { status: WaitlistEntry["status"]; updatedAtIso?: string };
      const entry = entries.find((item) => item.id === id);
      const updatedAtIso = result.updatedAtIso ?? entry?.updatedAtIso ?? new Date().toISOString();

      setEntries((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: result.status,
                updatedAtIso,
                updatedAt: new Date(updatedAtIso).toLocaleDateString("en-GB")
              }
            : item
        )
      );
      setSelected((current) =>
        current?.id === id
          ? {
              ...current,
              status: result.status,
              updatedAtIso,
              updatedAt: new Date(updatedAtIso).toLocaleDateString("en-GB")
            }
          : current
      );

      if (entry) {
        markAdminItemSeen("waitlist", id, entry.createdAtIso, updatedAtIso);
        onMarkItemSeen();
      }

      try {
        await recordAction({
          type: "waitlist_contacted",
          targetType: "waitlist",
          targetId: id,
          label: `Marked ${name} as contacted.`,
          payload: { id, name }
        });
      } catch {
        // Action log is optional; the waitlist update already succeeded.
      }

      notify(`You marked ${name} as contacted on the waitlist.`);
    } catch {
      notify(`Could not mark ${name} as contacted. Please try again.`);
    } finally {
      setPendingId(null);
    }
  }

  async function toggleRegistrationVerified(
    id: string,
    verified: boolean,
    notify: (message: string) => void = setMessage
  ) {
    const entry = entries.find((item) => item.id === id) ?? (selected?.id === id ? selected : null);
    if (!entry) {
      notify("Could not update registration verification.");
      return;
    }
    if (!verified && isRegistrationVerificationLocked(entry)) {
      notify("Registration verification cannot be undone after the facility is contacted or invited.");
      return;
    }

    const previousVerified = Boolean(entry.registrationVerified);

    const optimisticPatch = (item: WaitlistEntry): WaitlistEntry =>
      item.id === id ? { ...item, registrationVerified: verified } : item;

    setEntries((current) => current.map(optimisticPatch));
    setSelected((current) => (current ? optimisticPatch(current) : current));

    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationVerified: verified })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not update registration verification.");
      }

      const result = (await response.json()) as Partial<WaitlistEntry> & { updatedAtIso?: string };
      const updatedAtIso = result.updatedAtIso ?? new Date().toISOString();

      const confirmPatch = (item: WaitlistEntry): WaitlistEntry =>
        item.id === id
          ? {
              ...item,
              registrationVerified: Boolean(result.registrationVerified ?? verified),
              canSendProviderInvite: Boolean(result.canSendProviderInvite ?? item.canSendProviderInvite),
              providerInviteAttemptsUsed:
                result.providerInviteAttemptsUsed ?? item.providerInviteAttemptsUsed,
              providerInviteAttemptsRemaining:
                result.providerInviteAttemptsRemaining ?? item.providerInviteAttemptsRemaining,
              hasActivePendingProviderInvite:
                result.hasActivePendingProviderInvite ?? item.hasActivePendingProviderInvite,
              providerInviteLockReason:
                result.providerInviteLockReason !== undefined
                  ? result.providerInviteLockReason
                  : item.providerInviteLockReason,
              updatedAt: new Date(updatedAtIso).toLocaleDateString("en-GB"),
              updatedAtIso
            }
          : item;

      setEntries((current) => current.map(confirmPatch));
      setSelected((current) => (current ? confirmPatch(current) : current));
    } catch (error) {
      const revertPatch = (item: WaitlistEntry): WaitlistEntry =>
        item.id === id ? { ...item, registrationVerified: previousVerified } : item;
      setEntries((current) => current.map(revertPatch));
      setSelected((current) => (current ? revertPatch(current) : current));
      notify(error instanceof Error ? error.message : "Could not update registration verification.");
    }
  }

  async function inviteProvider(entry: WaitlistEntry) {
    setPendingInviteId(entry.id);
    try {
      const response = await fetch("/api/admin/provider-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitlistEntryId: entry.id })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not send provider invite.");
      }

      const payload = (await response.json()) as {
        id: string;
        emailMode?: string;
        attemptsUsed?: number;
        attemptsRemaining?: number;
      };
      const nextStatus = entry.status === "NEW" ? ("CONTACTED" as const) : entry.status;
      const attemptsUsed = payload.attemptsUsed ?? entry.providerInviteAttemptsUsed + 1;
      const attemptsRemaining = payload.attemptsRemaining ?? Math.max(0, entry.providerInviteAttemptsRemaining - 1);

      setEntries((current) =>
        current.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                status: nextStatus,
                canSendProviderInvite: false,
                hasActivePendingProviderInvite: true,
                providerInviteAttemptsUsed: attemptsUsed,
                providerInviteAttemptsRemaining: attemptsRemaining,
                providerInviteLockReason:
                  "A provider invite is still pending. Wait for it to be accepted or expire."
              }
            : item
        )
      );
      setSelected((current) =>
        current?.id === entry.id
          ? {
              ...current,
              status: nextStatus,
              canSendProviderInvite: false,
              hasActivePendingProviderInvite: true,
              providerInviteAttemptsUsed: attemptsUsed,
              providerInviteAttemptsRemaining: attemptsRemaining,
              providerInviteLockReason:
                "A provider invite is still pending. Wait for it to be accepted or expire."
            }
          : current
      );

      markAdminItemSeen("waitlist", entry.id, entry.createdAtIso, entry.updatedAtIso);
      onMarkItemSeen();

      try {
        await recordAction({
          type: "provider_invite_sent",
          targetType: "waitlist",
          targetId: entry.id,
          label: `Sent provider invite to ${entry.email}.`,
          payload: { waitlistEntryId: entry.id, inviteId: payload.id, email: entry.email, emailMode: payload.emailMode }
        });
      } catch {
        // Invite send succeeded; action log is non-blocking.
      }

      setMessage(
        `Provider invite sent to ${entry.email}. It expires in 7 days (${attemptsRemaining} re-send${attemptsRemaining === 1 ? "" : "s"} left).`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not send provider invite to ${entry.email}. Please try again.`);
    } finally {
      setPendingInviteId(null);
      setConfirmInvite(null);
    }
  }

  return (
    <>
      <div className="border-b border-stone-100 px-3 py-3 sm:px-4">
        <ListSearch
          value={search}
          onChange={onSearchChange}
          placeholder="Search waitlist by name, email, location, or reference..."
        />
      </div>
      {!entries.length ? (
        <p className="px-5 py-8 text-center text-sm text-ink/50">
          {search ? "No waitlist entries match this search." : "No waitlist registrations yet."}
        </p>
      ) : (
      <table className="w-full min-w-[320px] border-collapse text-left sm:min-w-[520px]">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="hidden px-4 py-3 sm:table-cell">Type</th>
            <th className="px-3 py-3 sm:px-4">Name</th>
            <th className="hidden px-4 py-3 md:table-cell">Email</th>
            <th className="hidden px-4 py-3 lg:table-cell">Location</th>
            <th className="hidden px-4 py-3 xl:table-cell">Registered</th>
            <th className="hidden px-4 py-3 sm:table-cell">Status</th>
            <th className="whitespace-nowrap px-3 py-3 sm:px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {entries.map((entry) => {
            const isPending = pendingId === entry.id;
            const isInviteLocked = !canInviteProvider(entry);
            const inviteLabel = providerInviteButtonLabel(entry);
            const isUnread =
              selected?.id !== entry.id &&
              !isResolvedWaitlistStatus(entry.status) &&
              itemSeenVersion >= 0 &&
              isAdminItemUnread("waitlist", entry.id, entry.createdAtIso, entry.updatedAtIso);
            const typeLabel = entry.type === "FACILITY" ? "Facility" : "Family";

            return (
              <tr
                key={entry.id}
                className="cursor-pointer hover:bg-cream"
                onClick={() => openEntry(entry)}
              >
                <td className="hidden px-4 py-3 text-sm text-neutral-600 sm:table-cell">{typeLabel}</td>
                <td className="min-w-0 max-w-[16rem] px-3 py-3 text-sm sm:px-4">
                  <div className="flex min-w-0 items-start gap-2">
                    {isUnread ? <UnreadDot className="mt-1.5 shrink-0" /> : null}
                    <div className="min-w-0 space-y-1">
                      <strong className="block truncate text-ink">{entry.name}</strong>
                      <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
                        <Badge variant="softMuted">{typeLabel}</Badge>
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none", waitlistStatusClass(entry.status))}>
                          {waitlistStatusLabel(entry.status)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-neutral-500 md:hidden">{entry.email}</p>
                      <p className="font-mono text-[11px] text-neutral-400">Ref {formatReference(entry.id)}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden max-w-[14rem] truncate px-4 py-3 text-sm text-neutral-600 md:table-cell">
                  {entry.email}
                </td>
                <td className="hidden px-4 py-3 text-sm text-neutral-600 lg:table-cell">{entry.location}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-neutral-600 xl:table-cell">
                  {entry.createdAt}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none", waitlistStatusClass(entry.status))}>
                    {waitlistStatusLabel(entry.status)}
                  </span>
                </td>
                <td className="px-3 py-3 sm:px-4" onClick={(event) => event.stopPropagation()}>
                  <div className="flex flex-wrap items-center gap-1">
                    <IconActionButton label="Open details" icon={ArrowUpRight} onClick={() => openEntry(entry)} />
                    {entry.type === "FACILITY" ? (
                      <IconActionButton
                        label={isInviteLocked ? inviteLabel : providerInviteButtonLabel(entry)}
                        icon={Building2}
                        loading={pendingInviteId === entry.id}
                        disabled={pendingInviteId === entry.id || isInviteLocked}
                        onClick={() => startProviderInvite(entry)}
                      />
                    ) : null}
                    <IconActionButton
                      label={canMarkContacted(entry) ? "Mark contacted" : `${waitlistStatusLabel(entry.status)}`}
                      icon={Mail}
                      loading={isPending}
                      disabled={!canMarkContacted(entry) || isPending}
                      onClick={() => void markContacted(entry.id, entry.name)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      )}

      <ListPager
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        pending={listPending}
        onPageChange={onPageChange}
      />

      <WaitlistDetailPanel
        entry={selected}
        onClose={() => setSelected(null)}
        onMarkContacted={markContacted}
        onToggleRegistrationVerified={toggleRegistrationVerified}
        onInviteProvider={(entry, notify) => startProviderInvite(entry, notify)}
        pendingId={pendingId}
        pendingInviteId={pendingInviteId}
      />
      <ConfirmDialog
        open={Boolean(confirmInvite)}
        title="Send provider invite?"
        description={
          confirmInvite
            ? `Send a provider onboarding invite to ${confirmInvite.email}? The link expires in 7 days. Attempt ${confirmInvite.providerInviteAttemptsUsed + 1} of 3.`
            : ""
        }
        confirmLabel="Send invite"
        pending={Boolean(confirmInvite && pendingInviteId === confirmInvite.id)}
        onCancel={() => {
          if (pendingInviteId) return;
          setConfirmInvite(null);
        }}
        onConfirm={() => {
          if (!confirmInvite) return;
          void inviteProvider(confirmInvite);
        }}
      />
    </>
  );
}

function WaitlistDetailPanel({
  entry,
  onClose,
  onMarkContacted,
  onToggleRegistrationVerified,
  onInviteProvider,
  pendingId,
  pendingInviteId
}: {
  entry: WaitlistEntry | null;
  onClose: () => void;
  onMarkContacted: (id: string, name: string, notify?: (message: string) => void) => Promise<void>;
  onToggleRegistrationVerified: (
    id: string,
    verified: boolean,
    notify?: (message: string) => void
  ) => Promise<void>;
  onInviteProvider: (entry: WaitlistEntry, notify?: (message: string) => void) => void;
  pendingId: string | null;
  pendingInviteId: string | null;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
  const canContact = entry?.status === "NEW";
  const canInvite = entry ? canInviteProvider(entry) : false;
  const inviteLabel = entry ? providerInviteButtonLabel(entry) : "Invite provider";
  const isPending = entry ? pendingId === entry.id : false;
  const isInvitePending = entry ? pendingInviteId === entry.id : false;
  const isFamily = entry?.type === "FAMILY";
  const verificationLocked = entry ? isRegistrationVerificationLocked(entry) : false;

  useEffect(() => {
    if (!entry) clearPanelMessage();
  }, [entry, clearPanelMessage]);

  return (
    <SlidePanel
      open={Boolean(entry)}
      onClose={onClose}
      size="xl"
      title={entry?.name || "Waitlist entry"}
      subtitle={entry ? `${entry.type} registration | ${entry.location}` : undefined}
      notice={panelMessage}
      noticeTone={panelNoticeTone(panelMessage)}
    >
      {entry ? (
        <div className="space-y-5">
          <StatusPill className="bg-transparent px-0 py-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-xs font-medium text-neutral-500">Type</span>
                <p className="mt-1 font-semibold text-ink">{entry.type}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Status</span>
                <p className="mt-1 font-semibold text-ink">{entry ? waitlistStatusLabel(entry.status) : "-"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Registered</span>
                <p className="mt-1 font-semibold text-ink">{entry.createdAt}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Location</span>
                <p className="mt-1 font-semibold text-ink">{entry.location}</p>
              </div>
            </div>
          </StatusPill>

          <div className="divide-y divide-stone-100 border-t border-stone-100">
            <PanelTopic title="Contact" defaultOpen>
              <DetailList
                columns={1}
                items={[
                  { label: "Contact name", value: entry.contactName },
                  { label: "Email", value: entry.email },
                  { label: "Phone", value: entry.phone }
                ]}
              />
            </PanelTopic>
            <PanelTopic title="Location">
              <DetailList
                columns={1}
                items={[
                  { label: "City", value: entry.city },
                  { label: "Province", value: entry.province },
                  { label: "Full location", value: entry.location }
                ]}
              />
            </PanelTopic>
            {isFamily ? (
              <PanelTopic title="Family context" defaultOpen>
                <DetailList
                  columns={1}
                  items={[
                    { label: "Relationship", value: entry.relationship },
                    { label: "Age range", value: entry.ageRange }
                  ]}
                />
                <div className="mt-2">
                  <p className="text-xs font-medium text-neutral-500">Care types</p>
                  <div className="mt-1.5">
                    <TagList items={entry.careTypes ?? []} />
                  </div>
                </div>
              </PanelTopic>
            ) : (
              <PanelTopic title="Facility details" defaultOpen>
                <DetailList
                  columns={1}
                  items={[
                    { label: "Facility name", value: entry.facilityName },
                    { label: "Facility type", value: entry.facilityType },
                    { label: "KVK / registration", value: entry.registrationNumber },
                    {
                      label: "Registration verified",
                      value: entry.registrationVerified ? "Yes - ready to invite" : "Not verified yet"
                    },
                    { label: "Total beds", value: entry.bedsTotal != null ? String(entry.bedsTotal) : null }
                  ]}
                />
                <div className="mt-2">
                  <p className="text-xs font-medium text-neutral-500">Services</p>
                  <div className="mt-1.5">
                    <TagList items={entry.services ?? []} />
                  </div>
                </div>
                <label className="mt-3 flex items-start gap-3 py-1 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(entry.registrationVerified)}
                    disabled={Boolean(entry.registrationVerified) && verificationLocked}
                    onChange={(event) => {
                      void onToggleRegistrationVerified(entry.id, event.target.checked, setPanelMessage);
                    }}
                  />
                  <span>
                    <span className="font-medium text-ink">Registration verified externally</span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      {entry.registrationVerified && verificationLocked
                        ? "Confirmed. This cannot be undone after contacting or inviting the facility."
                        : entry.registrationVerified
                          ? "Saved. You can untick until you mark contacted or send an invite."
                          : "Confirm the KVK or government ID outside this app before inviting the facility."}
                    </span>
                  </span>
                </label>
              </PanelTopic>
            )}
            <PanelTopic title="Message">
              <p className="text-sm leading-7 text-neutral-700">{entry.message?.trim() || "-"}</p>
            </PanelTopic>
            <PanelTopic title="Record">
              <DetailList
                columns={1}
                items={[
                  { label: "Entry ID", value: entry.id },
                  { label: "Registered", value: entry.createdAt },
                  { label: "Last updated", value: entry.updatedAt },
                  ...(!isFamily
                    ? [
                        {
                          label: "Provider invites",
                          value: `${entry.providerInviteAttemptsUsed} sent | ${entry.providerInviteAttemptsRemaining} remaining`
                        },
                        {
                          label: "Invite status",
                          value: entry.hasActivePendingProviderInvite
                            ? "Pending - waiting for provider to accept"
                            : entry.canSendProviderInvite
                              ? "Ready to send"
                              : entry.providerInviteLockReason || "Not eligible"
                        }
                      ]
                    : [])
                ]}
              />
            </PanelTopic>
          </div>

          <PanelSection title="Quick actions">
            <div className="flex flex-wrap gap-2">
              {entry.email ? (
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${entry.email}`}>Email contact</a>
                </Button>
              ) : null}
              {!isFamily ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isInvitePending || !canInvite}
                  onClick={() => onInviteProvider(entry, setPanelMessage)}
                >
                  {isInvitePending ? "Sending..." : inviteLabel}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(entry.id);
                  setPanelMessage("Entry ID copied.");
                }}
              >
                Copy ID
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={onClose}>
                Close
              </Button>
              <Button
                className="w-full"
                disabled={!canContact || isPending}
                onClick={() => void onMarkContacted(entry.id, entry.name, setPanelMessage)}
              >
                {isPending ? "Saving..." : canContact ? "Mark contacted" : waitlistStatusLabel(entry.status)}
              </Button>
            </div>
          </PanelSection>
        </div>
      ) : null}
    </SlidePanel>
  );
}

const adminFieldClass = "rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-brand-amber";

function AdminPanelActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

