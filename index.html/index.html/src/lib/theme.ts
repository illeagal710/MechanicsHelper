export type Theme = "dark" | "light";

export const THEMES: Theme[] = ["dark", "light"];
export const DEFAULT_THEME: Theme = "dark";
export const THEME_KEY = "mh.theme";

const DARK_THEME_COLOR = "#071834";
const LIGHT_THEME_COLOR = "#f7f9fc";

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

export function readTheme(): Theme {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_THEME;
    const raw = localStorage.getItem(THEME_KEY);
    return isTheme(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function writeTheme(theme: Theme) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
}

export function applyDocumentTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? LIGHT_THEME_COLOR : DARK_THEME_COLOR);
}

export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}})();`;
