"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  parseLocale,
  type Locale
} from "@/lib/i18n/config";
import { journeyCopy, productUi } from "@/lib/i18n/ui";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  ui: ReturnType<typeof productUi>;
  journey: ReturnType<typeof journeyCopy>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function LocaleProvider({
  initialLocale,
  children
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
    document.documentElement.lang = initialLocale;
  }, [initialLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      const parsed = parseLocale(next);
      setLocaleState(parsed);
      writeLocaleCookie(parsed);
      document.documentElement.lang = parsed;
      try {
        localStorage.setItem(LOCALE_COOKIE, parsed);
      } catch {
        /* ignore */
      }
      router.refresh();
    },
    [router]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      ui: productUi(locale),
      journey: journeyCopy(locale)
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => undefined,
      ui: productUi(DEFAULT_LOCALE),
      journey: journeyCopy(DEFAULT_LOCALE)
    };
  }
  return ctx;
}
