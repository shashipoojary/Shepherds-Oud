"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { isProviderSaved, toggleSavedProvider } from "@/lib/client/favourites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core/utils";

export function ProviderFavouriteButton({
  providerId,
  className,
  size = "sm",
  variant = "outline"
}: {
  providerId: string;
  className?: string;
  size?: "sm" | "default";
  variant?: "outline" | "ghost";
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isProviderSaved(providerId));
  }, [providerId]);

  function handleClick() {
    toggleSavedProvider(providerId);
    setSaved(isProviderSaved(providerId));
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("gap-1.5", className)}
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from favourites" : "Save to favourites"}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-brand-amber text-brand-amber")} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
