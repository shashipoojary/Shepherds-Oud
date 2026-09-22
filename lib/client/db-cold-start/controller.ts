import {
  DB_EXTENDED_MESSAGE_MS,
  DB_SLOW_REQUEST_MS,
  DB_WAKE_HEALTH_PATH,
  isDbHeavyRoute,
  isSameOriginApiUrl
} from "@/lib/client/db-cold-start/config";
import { isBackendIdleBeyondThreshold, setLastBackendOkAt } from "@/lib/client/db-cold-start/storage";

export type DbColdStartPhase = "primary" | "extended";

export type DbColdStartState = {
  visible: boolean;
  phase: DbColdStartPhase;
};

type Listener = (state: DbColdStartState) => void;

/** Abandon a navigation watch if the route never settles (e.g. cancelled click). */
const NAVIGATION_ABANDON_MS = 60_000;

let initialized = false;
let apiInFlight = 0;
let navigationPendingPath: string | null = null;
let navigationSlowTimer: ReturnType<typeof setTimeout> | null = null;
let navigationAbandonTimer: ReturnType<typeof setTimeout> | null = null;
let extendedMessageTimer: ReturnType<typeof setTimeout> | null = null;
let visible = false;
let phase: DbColdStartPhase = "primary";
const listeners = new Set<Listener>();

function emit() {
  const state: DbColdStartState = { visible, phase };
  listeners.forEach((listener) => listener(state));
}

function clearExtendedMessageTimer() {
  if (extendedMessageTimer) {
    clearTimeout(extendedMessageTimer);
    extendedMessageTimer = null;
  }
}

function clearNavigationSlowTimer() {
  if (navigationSlowTimer) {
    clearTimeout(navigationSlowTimer);
    navigationSlowTimer = null;
  }
}

function clearNavigationAbandonTimer() {
  if (navigationAbandonTimer) {
    clearTimeout(navigationAbandonTimer);
    navigationAbandonTimer = null;
  }
}

function clearNavigationWatch() {
  clearNavigationSlowTimer();
  clearNavigationAbandonTimer();
  navigationPendingPath = null;
}

/** Hide the toast whenever nothing DB-backed is still in flight or pending. */
function reconcileToastVisibility() {
  if (visible && apiInFlight === 0 && !navigationPendingPath) {
    hideToast();
  }
}

function showToast() {
  if (visible) return;

  visible = true;
  phase = "primary";
  clearExtendedMessageTimer();
  extendedMessageTimer = setTimeout(() => {
    if (!visible) return;
    phase = "extended";
    emit();
  }, DB_EXTENDED_MESSAGE_MS);
  emit();
}

function hideToast() {
  if (!visible) return;

  visible = false;
  phase = "primary";
  clearExtendedMessageTimer();
  emit();
}

function resolveRequestUrl(input: RequestInfo | URL): URL | null {
  try {
    if (input instanceof Request) {
      return new URL(input.url);
    }

    if (input instanceof URL) {
      return input;
    }

    return new URL(input, window.location.href);
  } catch {
    return null;
  }
}

function patchFetch() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveRequestUrl(input);

    if (!url || !isSameOriginApiUrl(url)) {
      return originalFetch(input, init);
    }

    const predictive = isBackendIdleBeyondThreshold();
    let slowTimer: ReturnType<typeof setTimeout> | null = null;

    if (predictive) {
      apiInFlight += 1;
      slowTimer = setTimeout(() => {
        if (apiInFlight > 0) {
          showToast();
        }
      }, DB_SLOW_REQUEST_MS);
    }

    return originalFetch(input, init)
      .then((response) => {
        if (response.ok) {
          setLastBackendOkAt();
        }
        return response;
      })
      .finally(() => {
        if (slowTimer) {
          clearTimeout(slowTimer);
        }

        if (predictive) {
          apiInFlight = Math.max(0, apiInFlight - 1);
          reconcileToastVisibility();
        }
      });
  };
}

export function subscribeDbColdStart(listener: Listener) {
  listeners.add(listener);
  listener({ visible, phase });
  return () => {
    listeners.delete(listener);
  };
}

export function getDbColdStartState(): DbColdStartState {
  return { visible, phase };
}

export function wakeDatabaseEarly() {
  void fetch(DB_WAKE_HEALTH_PATH, { cache: "no-store", credentials: "same-origin" });
}

export function beginDbHeavyNavigation(targetPath: string) {
  if (!isBackendIdleBeyondThreshold()) return;

  clearNavigationWatch();
  navigationPendingPath = targetPath;
  navigationSlowTimer = setTimeout(() => {
    if (navigationPendingPath) {
      showToast();
    }
  }, DB_SLOW_REQUEST_MS);

  navigationAbandonTimer = setTimeout(() => {
    clearNavigationWatch();
    reconcileToastVisibility();
  }, NAVIGATION_ABANDON_MS);
}

/**
 * Called when the client route settles. Always clears a pending navigation watch
 * and hides the toast — even on redirects (e.g. /admin → /login).
 */
export function onRouteSettled(pathname: string) {
  const hadPendingNavigation = navigationPendingPath !== null;
  clearNavigationWatch();

  if (isDbHeavyRoute(pathname)) {
    setLastBackendOkAt();
    hideToast();
    return;
  }

  if (hadPendingNavigation) {
    hideToast();
    return;
  }

  reconcileToastVisibility();
}

/** @deprecated Use onRouteSettled */
export function completeDbHeavyNavigation(pathname: string) {
  onRouteSettled(pathname);
}

export function initDbColdStart() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  patchFetch();
}
