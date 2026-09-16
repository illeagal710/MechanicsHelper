import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_THEME,
  THEME_BOOT_SCRIPT,
  THEME_KEY,
  isTheme,
  readTheme,
  writeTheme,
} from "./theme.ts";

test("theme defaults to dark and only accepts dark or light", () => {
  assert.equal(DEFAULT_THEME, "dark");
  assert.equal(THEME_KEY, "mh.theme");
  assert.equal(isTheme("dark"), true);
  assert.equal(isTheme("light"), true);
  assert.equal(isTheme("system"), false);
  assert.equal(isTheme(""), false);
});

test("readTheme falls back to dark without storage", () => {
  assert.equal(readTheme(), DEFAULT_THEME);
});

test("writeTheme and readTheme persist through a localStorage stub", () => {
  const store = new Map<string, string>();
  const previous = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });
  try {
    assert.equal(readTheme(), "dark");
    writeTheme("light");
    assert.equal(store.get(THEME_KEY), "light");
    assert.equal(readTheme(), "light");
    writeTheme("dark");
    assert.equal(readTheme(), "dark");
  } finally {
    if (previous === undefined) {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: previous,
      });
    }
  }
});

test("boot script reads the same storage key as writeTheme", () => {
  assert.match(THEME_BOOT_SCRIPT, new RegExp(THEME_KEY));
  assert.match(THEME_BOOT_SCRIPT, /data-theme/);
});
