"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, FileText, Link2, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { ListPager } from "@/components/ui/list-pager";
import { ListSearch } from "@/components/ui/list-search";
import { panelNoticeTone, SlidePanel } from "@/components/ui/slide-panel";
import type { AdminDashboardData } from "@/lib/data/admin";
import { canTransitionFeeStatus } from "@/lib/crisis-v2/referral-fee-transitions";
import { formatReference } from "@/lib/domain/reference";
import type { PlacementFeeStatus } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

type CrisisReferral = AdminDashboardData["crisisReferrals"][number];
type DirectoryListing = AdminDashboardData["directoryList"][number];
type ProviderOption = AdminDashboardData["providerLinkOptions"][number];
type PageMeta = AdminDashboardData["pagination"]["referrals"];

const FEE_ACTIONS: Array<{
  status: PlacementFeeStatus;
  label: string;
  confirmTitle: string;
  confirmDescription: (item: CrisisReferral) => string;
  confirmLabel: string;
  tone: "default" | "danger";
  successMessage: (item: CrisisReferral) => string;
  icon: LucideIcon;
}> = [
  {
    status: "INVOICED",
    label: "Mark invoiced",
    confirmTitle: "Mark fee as invoiced?",
    confirmDescription: (item) =>
      `Confirm invoice raised for this introduction only (${item.familyName} → ${item.providerName}). This cannot be undone.`,
    confirmLabel: "Mark invoiced",
    tone: "default",
    successMessage: (item) => `Fee for ${item.familyName} → ${item.providerName} marked Invoiced.`,
    icon: FileText
  },
  {
    status: "PAID",
    label: "Mark paid",
    confirmTitle: "Mark fee as paid?",
    confirmDescription: (item) =>
      `Confirm payment received for this introduction only (${item.familyName} → ${item.providerName}). This cannot be undone.`,
    confirmLabel: "Mark paid",
    tone: "default",
    successMessage: (item) => `Fee for ${item.familyName} → ${item.providerName} marked Paid.`,
    icon: CheckCircle2
  },
  {
    status: "DECLINED",
    label: "Mark declined",
    confirmTitle: "Decline this introduction?",
    confirmDescription: (item) =>
      `Close this introduction only (${item.familyName} → ${item.providerName}). Other referrals are unchanged. This cannot be undone.`,
    confirmLabel: "Mark declined",
    tone: "danger",
    successMessage: (item) => `Fee for ${item.familyName} → ${item.providerName} marked Declined.`,
    icon: Ban
  }
];

const selectClass =
  "w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-brand-amber";

function feeBadgeVariant(status: PlacementFeeStatus) {
  if (status === "PENDING") return "softPending" as const;
  if (status === "PAID") return "softSuccess" as const;
  if (status === "DECLINED") return "softDanger" as const;
  return "softNeutral" as const;
}

function providerTypeLabel(type: string) {
  if (type === "HOME_CARE") return "Home care";
  if (type === "RESIDENTIAL") return "Residential";
  return type.replaceAll("_", " ");
}

function pathLabel(path: string | null) {
  if (!path) return "—";
  if (path === "HOME_CARE") return "Home care";
  if (path === "FACILITY") return "Facility";
  if (path === "BOTH") return "Both";
  if (path === "UNDECIDED") return "Undecided";
  return path.replaceAll("_", " ");
}

export function CrisisReferralsPanel({
  referrals,
  directoryList,
  providers,
  pagination,
  search,
  pending,
  setMessage,
  onSearchChange,
  onPageChange,
  onSync
}: {
  referrals: CrisisReferral[];
  directoryList: DirectoryListing[];
  providers: ProviderOption[];
  pagination: PageMeta;
  search: string;
  pending?: boolean;
  setMessage: (message: string) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onSync: () => Promise<void> | void;
}) {
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [panelMessage, setPanelMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [rows, setRows] = useState(referrals);
  const [listings, setListings] = useState(directoryList);
  const [confirm, setConfirm] = useState<{
    item: CrisisReferral;
    action: (typeof FEE_ACTIONS)[number];
  } | null>(null);

  useEffect(() => {
    setRows(referrals);
  }, [referrals]);

  useEffect(() => {
    setListings(directoryList);
  }, [directoryList]);

  const providerOptions = useMemo(
    () => [...providers].sort((a, b) => a.name.localeCompare(b.name)),
    [providers]
  );

  const unlinkedCount = useMemo(
    () => listings.filter((item) => !item.linkedProviderId).length,
    [listings]
  );

  function applyLinkLocal(
    directoryProviderId: string,
    linkedProviderId: string | null,
    linkedProviderName: string | null,
    linkedProviderEmail: string | null
  ) {
    setListings((current) =>
      current.map((item) =>
        item.id === directoryProviderId
          ? { ...item, linkedProviderId, linkedProviderName, linkedProviderEmail }
          : item
      )
    );
    setRows((current) =>
      current.map((row) =>
        row.providerId === directoryProviderId
          ? { ...row, linkedProviderId, linkedProviderName, linkedProviderEmail }
          : row
      )
    );
  }

  async function linkListing(directoryProviderId: string, linkedProviderId: string | null) {
    setLinkingId(directoryProviderId);
    setPanelMessage("");
    try {
      const response = await fetch("/api/v2/admin/directory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryProviderId, linkedProviderId })
      });
      const data = (await response.json()) as {
        error?: string;
        linkedProviderId?: string | null;
        linkedProviderName?: string | null;
        linkedProviderEmail?: string | null;
      };
      if (!response.ok) {
        setPanelMessage(data.error || "Could not update directory link.");
        return;
      }
      applyLinkLocal(
        directoryProviderId,
        data.linkedProviderId ?? null,
        data.linkedProviderName ?? null,
        data.linkedProviderEmail ?? null
      );
      const listing = listings.find((item) => item.id === directoryProviderId);
      const okMessage = linkedProviderId
        ? `Linked “${listing?.name || "listing"}” to provider account.`
        : `Unlinked “${listing?.name || "listing"}” from provider account.`;
      setPanelMessage(okMessage);
      setMessage(okMessage);
      await onSync();
    } catch {
      setPanelMessage("Could not update directory link.");
    } finally {
      setLinkingId(null);
    }
  }

  async function updateFee(item: CrisisReferral, action: (typeof FEE_ACTIONS)[number]) {
    setSavingId(item.id);
    try {
      const response = await fetch("/api/v2/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralId: item.id, feeStatus: action.status })
      });
      const data = (await response.json()) as { error?: string; feeStatus?: PlacementFeeStatus };
      if (!response.ok) {
        setMessage(data.error || "Could not update fee status.");
        return;
      }
      const nextStatus = data.feeStatus || action.status;
      setRows((current) =>
        current.map((row) => (row.id === item.id ? { ...row, feeStatus: nextStatus } : row))
      );
      setMessage(action.successMessage(item));
      setConfirm(null);
      await onSync();
    } catch {
      setMessage("Could not update fee status.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-stone-100 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
        <div className="min-w-0 flex-1">
          {pagination.total || search ? (
            <ListSearch
              value={search}
              onChange={onSearchChange}
              placeholder="Search referrals by family, provider, or fee status…"
            />
          ) : (
            <p className="text-sm text-ink/55">Placement referrals from directory introductions.</p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setLinkPanelOpen(true)}>
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          Link accounts
          {unlinkedCount > 0 ? (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-amber px-1.5 text-[10px] font-bold text-white">
              {unlinkedCount > 9 ? "9+" : unlinkedCount}
            </span>
          ) : null}
        </Button>
      </div>

      {!pagination.total && !search ? (
        <EmptyState
          title="No placement referrals yet"
          description="Referrals appear when a family contacts a directory provider from their triage case."
        />
      ) : (
        <>
          {!rows.length ? (
            <p className="px-5 py-8 text-center text-sm text-ink/50">No referrals match this search.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-cream/50 text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3 font-medium sm:px-5">Family</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Path</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Referred</th>
                  <th className="px-4 py-3 font-medium">Fee</th>
                  <th className="px-4 py-3 font-medium">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3 sm:px-5">
                      <p className="font-medium text-ink">{item.familyName}</p>
                      <p className="text-xs text-ink/50">
                        {item.patientName || item.familyEmail || formatReference(item.caseId)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{item.providerName}</p>
                      <p className="text-xs text-ink/50">
                        {providerTypeLabel(item.providerType)} · {item.municipality}
                      </p>
                      <p className="mt-1 text-xs text-ink/45">
                        {item.linkedProviderId
                          ? `Account: ${item.linkedProviderName || "linked"}`
                          : "No provider account linked"}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-ink/80 md:table-cell">{pathLabel(item.path)}</td>
                    <td className="hidden px-4 py-3 text-ink/70 lg:table-cell">
                      {new Date(item.referredAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={feeBadgeVariant(item.feeStatus)}>{item.feeStatus}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {item.feeStatus === "PAID" || item.feeStatus === "DECLINED" ? (
                        <span className="text-xs text-ink/45">
                          {item.feeStatus === "PAID" ? "Paid — final" : "Closed — final"}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {FEE_ACTIONS.filter((action) =>
                            canTransitionFeeStatus(item.feeStatus, action.status)
                          ).map((action) => (
                            <IconActionButton
                              key={action.status}
                              label={action.label}
                              icon={action.icon}
                              disabled={savingId === item.id}
                              loading={savingId === item.id && confirm?.item.id === item.id}
                              onClick={() => setConfirm({ item, action })}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <ListPager
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            pending={pending}
            onPageChange={onPageChange}
          />
        </>
      )}

      <SlidePanel
        open={linkPanelOpen}
        onClose={() => {
          setLinkPanelOpen(false);
          setPanelMessage("");
        }}
        title="Directory ↔ provider accounts"
        subtitle="Link each public listing to a facility login so introductions appear in their provider portal."
        size="wide"
        notice={panelMessage}
        noticeTone={panelNoticeTone(panelMessage)}
      >
        {!listings.length ? (
          <p className="text-sm text-ink/60">No directory listings yet. Seed or add Haaglanden providers first.</p>
        ) : !providerOptions.length ? (
          <p className="text-sm text-ink/60">
            No provider accounts yet. Invite or approve a facility under Providers first, then link here.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-100">
            {listings.map((listing) => (
              <li key={listing.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_minmax(12rem,16rem)] sm:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{listing.name}</p>
                  <p className="text-xs text-ink/50">
                    {providerTypeLabel(listing.type)} · {listing.municipality}
                  </p>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                  {listing.linkedProviderId ? (
                    <>
                      <Badge variant="softSuccess">
                        Linked · {listing.linkedProviderName || "account"}
                      </Badge>
                      <IconActionButton
                        label="Unlink provider account"
                        icon={Unlink}
                        disabled={linkingId === listing.id}
                        loading={linkingId === listing.id}
                        onClick={() => void linkListing(listing.id, null)}
                      />
                    </>
                  ) : (
                    <select
                      className={selectClass}
                      disabled={linkingId === listing.id}
                      defaultValue=""
                      onChange={(event) => {
                        const value = event.target.value;
                        if (!value) return;
                        void linkListing(listing.id, value);
                        event.target.value = "";
                      }}
                    >
                      <option value="">Link provider account…</option>
                      {providerOptions.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                          {provider.email ? ` (${provider.email})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SlidePanel>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.action.confirmTitle || ""}
        description={confirm ? confirm.action.confirmDescription(confirm.item) : ""}
        confirmLabel={confirm?.action.confirmLabel}
        tone={confirm?.action.tone}
        pending={Boolean(confirm && savingId === confirm.item.id)}
        onCancel={() => {
          if (savingId) return;
          setConfirm(null);
        }}
        onConfirm={() => {
          if (!confirm) return;
          void updateFee(confirm.item, confirm.action);
        }}
      />
    </div>
  );
}
