"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";

/** Footer disclosure only — nav already covers directory / region. */
export function CrisisChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const { locale } = useLocale();
  const ui = crisisV2Ui(locale);
  const onDirectory = pathname === "/directory" || pathname.startsWith("/directory/");

  return (
    <>
      {children}
      <p className="mx-auto mt-8 max-w-3xl text-xs leading-5 text-ink/50">
        {onDirectory ? ui.facilityPayDisclosure : ui.aiDisclosure}
      </p>
    </>
  );
}
