import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import {
  applyDocumentTheme,
  DEFAULT_THEME,
  readTheme,
  writeTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const stored = readTheme();
    setThemeState(stored);
    applyDocumentTheme(stored);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const setTheme = (next: Theme) => {
      setThemeState(next);
      writeTheme(next);
      applyDocumentTheme(next);
    };
    return { theme, setTheme };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: DEFAULT_THEME, setTheme: () => {} };
  }
  return ctx;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("theme.groupAria")}
      data-theme-toggle=""
      className={compact ? "flex rounded-lg bg-bg2 p-0.5" : "flex rounded-xl bg-bg2 p-1"}
    >
      {([
        ["dark", "theme.dark", Moon],
        ["light", "theme.light", Sun],
      ] as const).map(([mode, labelKey, Icon]) => {
        const active = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            aria-label={t(labelKey)}
            onClick={() => setTheme(mode)}
            className={`${
              compact ? "grid size-7 place-items-center" : "h-9 flex-1 px-3 text-xs"
            } rounded-md font-semibold tracking-wide ${
              active ? "bg-surface2 text-fg" : "text-muted"
            }`}
          >
            {compact ? <Icon className="size-3.5" /> : t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
