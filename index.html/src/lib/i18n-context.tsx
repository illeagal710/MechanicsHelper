import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyDocumentLocale,
  DEFAULT_LOCALE,
  readLocale,
  translate,
  writeLocale,
  type Locale,
  type MessageKey,
  type TranslateFn,
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readLocale();
    setLocaleState(stored);
    applyDocumentLocale(stored);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (next: Locale) => {
      setLocaleState(next);
      writeLocale(next);
      applyDocumentLocale(next);
    };
    return {
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
    };
  }
  return ctx;
}

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("lang.groupAria")}
      data-language-toggle=""
      className={compact ? "flex rounded-lg bg-bg2 p-0.5" : "flex rounded-xl bg-bg2 p-1"}
    >
      {([
        ["en", "lang.enShort", "lang.en"],
        ["es", "lang.esShort", "lang.es"],
      ] as const).map(([code, shortKey, nameKey]) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            aria-label={t(nameKey)}
            onClick={() => setLocale(code)}
            className={`${
              compact ? "h-7 min-w-8 px-2 text-[10px]" : "h-9 flex-1 px-3 text-xs"
            } rounded-md font-semibold tracking-wide ${
              active ? "bg-surface2 text-fg" : "text-muted"
            }`}
          >
            {t(shortKey as MessageKey)}
          </button>
        );
      })}
    </div>
  );
}
