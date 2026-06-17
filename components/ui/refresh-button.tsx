"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshButton({
  onClick,
  loading,
  label = "Refresh"
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onClick}>
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
      {loading ? "Refreshing..." : label}
    </Button>
  );
}
