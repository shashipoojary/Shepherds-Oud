"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ComposeAnnouncementBar } from "@/components/admin/compose-announcement";
import { CrisisCasesPanel } from "@/components/admin/crisis-cases-panel";
import { HospitalInvitePanel } from "@/components/admin/hospital-invite-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatGrid } from "@/components/ui/stat-grid";
import type { AdminDashboardData, AdminListKey } from "@/lib/data/admin";
import { ADMIN_PAGE_SIZE } from "@/lib/data/admin-lists";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { brand } from "@/lib/config/brand";
import { cn } from "@/lib/core/utils";
import {
  countUnseenCrisisCases,
  countUnseenCrisisReferrals,
  countUnseenProviders,
  countUnseenWaitlist,
  getTabSeenAt,
  initTabSeenFromData,
  markTabSeen,
  type AdminTab
} from "@/lib/client/admin-seen";
import { initAdminItemsSeenFromData } from "@/lib/client/admin-item-seen";

const CrisisReferralsPanel = dynamic(
  () => import("@/components/admin/crisis-referrals-panel").then((m) => m.CrisisReferralsPanel),
  { loading: () => <p className="px-5 py-8 text-sm text-neutral-500">Loading referrals…</p> }
);
const ProvidersTable = dynamic(
  () => import("@/components/admin/admin-ops-panels").then((m) => m.ProvidersTable),
  { loading: () => <p className="px-5 py-8 text-sm text-neutral-500">Loading providers…</p> }
);
const WaitlistTable = dynamic(
  () => import("@/components/admin/admin-ops-panels").then((m) => m.WaitlistTable),
  { loading: () => <p className="px-5 py-8 text-sm text-neutral-500">Loading waitlist…</p> }
);

const TAB_LABELS: Record<AdminTab, string> = {
  cases: "Cases",
  referrals: "Referrals",
  providers: "Providers",
  waitlist: "Waitlist"
};

type ListQueryState = Record<AdminListKey, string>;
type ListPageState = Record<AdminListKey, number>;

const emptyQueries = (): ListQueryState => ({
  cases: "",
  referrals: "",
  providers: "",
  waitlist: ""
});

function pagesFromData(data: AdminDashboardData): ListPageState {
  return {
    cases: data.pagination.cases.page,
    referrals: data.pagination.referrals.page,
    providers: data.pagination.providers.page,
    waitlist: data.pagination.waitlist.page
  };
}

export function AdminDashboardClient({
  data: initialData
}: {
  data: AdminDashboardData;
}) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<AdminTab>("cases");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [listPending, setListPending] = useState(false);
  const [queries, setQueries] = useState<ListQueryState>(emptyQueries);
  const [pages, setPages] = useState<ListPageState>(() => pagesFromData(initialData));
  const [hydratedTabs, setHydratedTabs] = useState<Record<AdminListKey, boolean>>({
    cases: true,
    referrals: false,
    providers: false,
    waitlist: false
  });
  // Don't read localStorage during SSR/first paint — badges would hydrate-mismatch.
  const [tabSeenAt, setTabSeenAt] = useState(() => ({
    cases: new Date(0).toISOString(),
    referrals: new Date(0).toISOString(),
    providers: new Date(0).toISOString(),
    waitlist: new Date(0).toISOString()
  }));
  const [seenReady, setSeenReady] = useState(false);
  const [itemSeenVersion, setItemSeenVersion] = useState(-1);
  const focusRefetchTimerRef = useRef<number | null>(null);
  const lastFocusSyncAtRef = useRef(0);
  const searchTimersRef = useRef<Partial<Record<AdminListKey, number>>>({});
  const tabRef = useRef<AdminTab>(tab);
  tabRef.current = tab;

  const onMarkItemSeen = useCallback(() => {
    setItemSeenVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    initTabSeenFromData(initialData);
    initAdminItemsSeenFromData([
      ...initialData.providerList.map((provider) => ({
        scope: "provider" as const,
        id: provider.id,
        createdAtIso: provider.createdAtIso,
        updatedAtIso: provider.updatedAtIso
      })),
      ...initialData.waitlist.map((entry) => ({
        scope: "waitlist" as const,
        id: entry.id,
        createdAtIso: entry.createdAtIso,
        updatedAtIso: entry.updatedAtIso
      }))
    ]);
    setTabSeenAt(getTabSeenAt());
    setSeenReady(true);
    setItemSeenVersion(0);
  }, [initialData]);

  useEffect(() => {
    setData(initialData);
    setPages(pagesFromData(initialData));
  }, [initialData]);

  useEffect(() => {
    if (!seenReady) return;
    setTabSeenAt(markTabSeen(tab, data));
  }, [tab, data, seenReady]);

  const tabBadges = useMemo(
    () => {
      if (!seenReady) {
        return { cases: 0, referrals: 0, providers: 0, waitlist: 0 };
      }
      return {
        cases: tab === "cases" ? 0 : countUnseenCrisisCases(data.crisisCases, tabSeenAt.cases),
        referrals: tab === "referrals" ? 0 : countUnseenCrisisReferrals(data.crisisReferrals, tabSeenAt.referrals),
        providers: tab === "providers" ? 0 : countUnseenProviders(data.providerList, tabSeenAt.providers),
        waitlist: tab === "waitlist" ? 0 : countUnseenWaitlist(data.waitlist, tabSeenAt.waitlist)
      };
    },
    [data, tab, tabSeenAt, seenReady]
  );

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(searchTimersRef.current)) {
        if (timer) window.clearTimeout(timer);
      }
    };
  }, []);

  function buildParams(overrides?: {
    only?: AdminListKey;
    pages?: Partial<ListPageState>;
    queries?: Partial<ListQueryState>;
  }) {
    const nextPages = { ...pages, ...overrides?.pages };
    const nextQueries = { ...queries, ...overrides?.queries };
    const params = new URLSearchParams({ pageSize: String(ADMIN_PAGE_SIZE) });
    if (overrides?.only) params.set("only", overrides.only);
    params.set("casesPage", String(nextPages.cases));
    params.set("referralsPage", String(nextPages.referrals));
    params.set("providersPage", String(nextPages.providers));
    params.set("waitlistPage", String(nextPages.waitlist));
    if (nextQueries.cases) params.set("casesQ", nextQueries.cases);
    if (nextQueries.referrals) params.set("referralsQ", nextQueries.referrals);
    if (nextQueries.providers) params.set("providersQ", nextQueries.providers);
    if (nextQueries.waitlist) params.set("waitlistQ", nextQueries.waitlist);
    return params;
  }

  async function fetchDashboard(params: URLSearchParams) {
    const response = await fetch(`/api/admin/dashboard?${params.toString()}`);
    if (!response.ok) return null;
    return (await response.json()) as AdminDashboardData;
  }

  function mergeListPayload(current: AdminDashboardData, next: AdminDashboardData, only?: AdminListKey) {
    if (!only) return next;
    return {
      ...current,
      stats: next.stats.length ? next.stats : current.stats,
      directoryList: next.directoryList.length ? next.directoryList : current.directoryList,
      providerLinkOptions: next.providerLinkOptions.length
        ? next.providerLinkOptions
        : current.providerLinkOptions,
      crisisCases: only === "cases" ? next.crisisCases : current.crisisCases,
      crisisReferrals: only === "referrals" ? next.crisisReferrals : current.crisisReferrals,
      providerList: only === "providers" ? next.providerList : current.providerList,
      waitlist: only === "waitlist" ? next.waitlist : current.waitlist,
      pagination: {
        ...current.pagination,
        [only]: next.pagination[only]
      }
    };
  }

  async function syncDashboard(only?: AdminListKey) {
    const key = only ?? tabRef.current;
    const payload = await fetchDashboard(buildParams({ only: key }));
    if (!payload) return false;
    setPages((current) => ({ ...current, [key]: payload.pagination[key].page }));
    setData((current) => mergeListPayload(current, payload, key));
    setHydratedTabs((current) => ({ ...current, [key]: true }));
    return true;
  }

  async function loadList(
    only: AdminListKey,
    nextPage: number,
    nextQuery: string
  ) {
    setListPending(true);
    try {
      const payload = await fetchDashboard(
        buildParams({
          only,
          pages: { [only]: nextPage },
          queries: { [only]: nextQuery }
        })
      );
      if (!payload) {
        setMessage("Could not load list page.");
        return;
      }
      setPages((current) => ({ ...current, [only]: payload.pagination[only].page }));
      setData((current) => mergeListPayload(current, payload, only));
      setHydratedTabs((current) => ({ ...current, [only]: true }));
    } catch {
      setMessage("Could not load list page.");
    } finally {
      setListPending(false);
    }
  }

  function selectTab(next: AdminTab) {
    setTab(next);
    if (!hydratedTabs[next]) {
      void loadList(next, pages[next], queries[next]);
    }
  }

  function onSearchChange(only: AdminListKey, value: string) {
    setQueries((current) => ({ ...current, [only]: value }));
    const existing = searchTimersRef.current[only];
    if (existing) window.clearTimeout(existing);
    searchTimersRef.current[only] = window.setTimeout(() => {
      void loadList(only, 1, value);
    }, 300);
  }

  function onPageChange(only: AdminListKey, page: number) {
    void loadList(only, page, queries[only]);
  }

  useEffect(() => {
    const FOCUS_SYNC_COOLDOWN_MS = 5 * 60 * 1000;

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFocusSyncAtRef.current < FOCUS_SYNC_COOLDOWN_MS) return;

      if (focusRefetchTimerRef.current) window.clearTimeout(focusRefetchTimerRef.current);
      focusRefetchTimerRef.current = window.setTimeout(() => {
        lastFocusSyncAtRef.current = Date.now();
        void syncDashboard();
      }, 400);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (focusRefetchTimerRef.current) window.clearTimeout(focusRefetchTimerRef.current);
    };
  }, []);

  async function refreshDashboard() {
    setRefreshing(true);
    try {
      const ok = await syncDashboard();
      setMessage(ok ? "Dashboard updated." : "Could not refresh dashboard.");
    } catch {
      setMessage("Could not refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.3rem] font-semibold text-ink">Admin dashboard</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {brand.name} — triage cases, placement referrals, and providers
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <HospitalInvitePanel onNotify={setMessage} />
          <ComposeAnnouncementBar onNotify={setMessage} />
          <RefreshButton onClick={() => void refreshDashboard()} loading={refreshing} />
        </div>
      </header>

      <StatGrid stats={data.stats} />

      <div className="mt-5 flex w-full gap-1 overflow-x-auto rounded-[10px] bg-white p-1 shadow-soft [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-6 sm:inline-flex sm:w-auto [&::-webkit-scrollbar]:hidden">
        {(["cases", "referrals", "providers", "waitlist"] as const).map((item) => {
          const isActive = tab === item;
          const badge = tabBadges[item];
          return (
            <button
              key={item}
              type="button"
              onClick={() => selectTab(item)}
              className={cn(
                "relative min-w-fit flex-1 rounded-lg px-3 py-2 text-sm transition sm:flex-none sm:px-4",
                isActive ? "bg-brand-amber text-white" : "text-ink/70 hover:bg-brand-cream hover:text-brand-amber"
              )}
            >
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                {TAB_LABELS[item]}
                {badge > 0 && !isActive ? (
                  <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-amber px-1.5 text-[10px] font-bold leading-none text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {message ? <div className="mt-4 rounded-lg bg-brand-green-pale/30 px-5 py-4 text-sm text-brand-green-dark">{message}</div> : null}

      <div className="mt-4 rounded-xl bg-white shadow-soft">
        <div className="overflow-x-auto">
          {tab === "cases" ? (
            <CrisisCasesPanel
              cases={data.crisisCases}
              pagination={data.pagination.cases}
              search={queries.cases}
              pending={listPending}
              onSearchChange={(value) => onSearchChange("cases", value)}
              onPageChange={(page) => onPageChange("cases", page)}
            />
          ) : null}

          {tab === "referrals" ? (
            !hydratedTabs.referrals ? (
              <p className="px-5 py-8 text-sm text-neutral-500">Loading referrals…</p>
            ) : (
              <CrisisReferralsPanel
                referrals={data.crisisReferrals}
                directoryList={data.directoryList}
                providers={data.providerLinkOptions}
                pagination={data.pagination.referrals}
                search={queries.referrals}
                pending={listPending}
                setMessage={setMessage}
                onSearchChange={(value) => onSearchChange("referrals", value)}
                onPageChange={(page) => onPageChange("referrals", page)}
                onSync={async () => {
                  await syncDashboard("referrals");
                }}
              />
            )
          ) : null}

          {tab === "providers" ? (
            !hydratedTabs.providers ? (
              <p className="px-5 py-8 text-sm text-neutral-500">Loading providers…</p>
            ) : data.pagination.providers.total || queries.providers ? (
              <ProvidersTable
                providers={data.providerList}
                itemSeenVersion={itemSeenVersion}
                onMarkItemSeen={onMarkItemSeen}
                onSync={() => syncDashboard("providers")}
                search={queries.providers}
                onSearchChange={(value) => onSearchChange("providers", value)}
                pagination={data.pagination.providers}
                onPageChange={(page) => onPageChange("providers", page)}
                listPending={listPending}
              />
            ) : (
              <EmptyState
                title="No providers yet"
                description="Provider accounts appear here after invitation acceptance or profile creation."
              />
            )
          ) : null}

          {tab === "waitlist" ? (
            !hydratedTabs.waitlist ? (
              <p className="px-5 py-8 text-sm text-neutral-500">Loading waitlist…</p>
            ) : data.pagination.waitlist.total || queries.waitlist ? (
              <WaitlistTable
                entries={data.waitlist}
                setMessage={setMessage}
                itemSeenVersion={itemSeenVersion}
                onMarkItemSeen={onMarkItemSeen}
                search={queries.waitlist}
                onSearchChange={(value) => onSearchChange("waitlist", value)}
                pagination={data.pagination.waitlist}
                onPageChange={(page) => onPageChange("waitlist", page)}
                listPending={listPending}
              />
            ) : (
              <EmptyState
                title="No waitlist registrations yet"
                description="Family and facility pre-launch sign-ups appear here."
              />
            )
          ) : null}
        </div>
      </div>
    </main>
  );
}
