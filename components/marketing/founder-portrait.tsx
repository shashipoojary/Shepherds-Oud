"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { brand, brandFounderRole } from "@/lib/config/brand";

export function FounderPortrait() {
  const { locale } = useLocale();
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-2xl bg-brand-green-dark md:mx-0 md:w-full">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- optional local asset until founder.jpg ships
        <img
          src={brand.founderPhotoPath}
          alt={`${brand.founderName}, ${brandFounderRole(locale)}`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-green-dark to-brand-green-mid text-white">
          <span className="font-brand text-5xl font-semibold tracking-wide">{brand.founderName.slice(0, 1)}</span>
        </div>
      )}
    </div>
  );
}
