"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { DbColdStartToast } from "@/components/shared/db-cold-start-toast";
import { isDbHeavyRoute } from "@/lib/client/db-cold-start/config";
import {
  beginDbHeavyNavigation,
  initDbColdStart,
  onRouteSettled,
  wakeDatabaseEarly
} from "@/lib/client/db-cold-start/controller";

function DbColdStartNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    initDbColdStart();
    onRouteSettled(pathname);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.getAttribute("target") === "_blank" || anchor.hasAttribute("download")) return;

      let next: URL;
      try {
        next = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (next.origin !== window.location.origin) return;
      if (next.pathname === window.location.pathname && next.search === window.location.search) return;
      if (!isDbHeavyRoute(next.pathname)) return;

      wakeDatabaseEarly();
      beginDbHeavyNavigation(next.pathname);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return <DbColdStartToast />;
}

/** Predictive Neon cold-start toast for idle + slow DB-backed requests. */
export function DbColdStartHost() {
  return (
    <Suspense fallback={null}>
      <DbColdStartNavigation />
    </Suspense>
  );
}
