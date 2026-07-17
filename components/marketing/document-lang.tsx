"use client";

import { useEffect } from "react";

/** Sets <html lang> for this route so Chrome Translate treats the page as English. */
export function DocumentLang({ lang }: { lang: string }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previous || "nl";
    };
  }, [lang]);

  return null;
}
