"use client";

import { createContext, useContext, useMemo } from "react";
import { getPublicRoutes, type PublicRoutes } from "@/lib/config/prelaunch";

const PrelaunchContext = createContext<boolean>(true);

export function PrelaunchProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <PrelaunchContext.Provider value={value}>{children}</PrelaunchContext.Provider>;
}

export function usePrelaunch() {
  return useContext(PrelaunchContext);
}

export function usePublicRoutes(): PublicRoutes {
  const prelaunch = usePrelaunch();
  return useMemo(() => getPublicRoutes(prelaunch), [prelaunch]);
}
