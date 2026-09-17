#!/usr/bin/env node
/**
 * Capture Play Console phone (9:16) screenshots from the live site.
 *
 *   cd index.html/index.html
 *   node scripts/capture-play-screenshots.mjs
 *
 * Optional reviewer logins (do not commit passwords into this file):
 *   MH_SHOP_EMAIL MH_SHOP_PASSWORD
 *   MH_CUSTOMER_EMAIL MH_CUSTOMER_PASSWORD
 *   MH_FIND_CODE   (public shop find code, e.g. Leon's live shop)
 *
 * Seed demos (maya@example.com / demo123 / RIV4) do not work on production.
 */
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "..", "..", "store", "play-screenshots");
const LIVE = process.env.MH_LIVE_ORIGIN || "https://mechanicshelper.app";
const FIND = (process.env.MH_FIND_CODE || "").trim().toUpperCase();
const SHOP_EMAIL = process.env.MH_SHOP_EMAIL || "";
const SHOP_PASSWORD = process.env.MH_SHOP_PASSWORD || "";
const CUSTOMER_EMAIL = process.env.MH_CUSTOMER_EMAIL || "";
const CUSTOMER_PASSWORD = process.env.MH_CUSTOMER_PASSWORD || "";

const W = 432;
const H = 768; // 432×768 is exact 9:16
const DSF = 3; // 1296×2304 PNG
const OUT_W = W * DSF;
const OUT_H = H * DSF;

mkdirSync(OUT, { recursive: true });

function isPlayShot(name) {
  return /^\d{2}-.+\.png$/.test(name);
}

async function shot(page, name) {
  const dest = join(OUT, name);
  await page.waitForTimeout(400);
  await page.screenshot({ path: dest, type: "png", animations: "disabled" });
  console.log("wrote", dest);
}

async function gotoLive(page, path = "/") {
  const url = path.startsWith("http") ? path : `${LIVE}${path}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: /log in|iniciar sesión/i }).first().waitFor({ timeout: 30000 }).catch(() => {});
}

async function waitToastGone(page) {
  await page.waitForTimeout(2600);
  const toast = page.locator("div.fixed.bottom-24");
  if (await toast.count()) {
    await toast.first().waitFor({ state: "hidden", timeout: 4000 }).catch(() => {});
  }
}

async function login(page, email, password) {
  await gotoLive(page, "/");
  await page.getByRole("button", { name: /^log in$|^iniciar sesión$/i }).first().click();
  await page.locator('input[name="id"]').waitFor({ timeout: 15000 });
  await page.locator('input[name="id"]').fill(email);
  await page.locator('input[name="pw"]').fill(password);
  await page.locator("form").getByRole("button", { name: /^log in$|^iniciar sesión$/i }).click();
  await page.locator("nav").waitFor({ timeout: 20000 });
  await waitToastGone(page);
}

async function main() {
  for (const name of readdirSync(OUT)) {
    if (isPlayShot(name) || /^(customer-|indy-|shop-|live-).+\.png$/.test(name)) {
      unlinkSync(join(OUT, name));
    }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: DSF,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
    locale: "en-US",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  const captured = [];

  await gotoLive(page, "/");
  await shot(page, "01-welcome.png");
  captured.push("01-welcome.png — landing, find-code field, Log in / Create account (no demo logins)");

  await page.getByRole("button", { name: /^log in$|^iniciar sesión$/i }).first().click();
  await page.locator('input[name="id"]').waitFor();
  await shot(page, "02-login.png");
  captured.push("02-login.png — email/phone login + forgot username/password");

  await page.getByRole("button", { name: /need an account|necesitas/i }).click().catch(async () => {
    await gotoLive(page, "/");
    await page.getByRole("button", { name: /create an account|crear una cuenta/i }).click();
  });
  await page.getByText(/i am|soy/i).first().waitFor({ timeout: 15000 });
  await shot(page, "03-create-account-customer.png");
  captured.push("03-create-account-customer.png — create account, Customer / Shop / Independent");

  await page.getByRole("button", { name: /^shop$|^taller$/i }).click();
  await page.getByRole("button", { name: /create shop|crear taller/i }).waitFor();
  await shot(page, "04-create-account-shop.png");
  captured.push("04-create-account-shop.png — shop owner create vs join (technician)");

  await gotoLive(page, "/privacy");
  await page.getByRole("heading", { name: /privacy/i }).waitFor({ timeout: 20000 });
  await shot(page, "05-privacy.png");
  captured.push("05-privacy.png — /privacy");

  await gotoLive(page, "/support");
  await page.getByRole("heading", { name: /support|soporte/i }).waitFor({ timeout: 20000 });
  await shot(page, "06-support.png");
  captured.push("06-support.png — /support");

  if (FIND) {
    await gotoLive(page, `/?ref=${encodeURIComponent(FIND)}`);
    await page.waitForTimeout(1200);
    const referred = await page.getByText(/you were referred|te refirieron/i).count();
    if (referred) {
      await shot(page, "07-public-shop-profile.png");
      captured.push(`07-public-shop-profile.png — live find code ${FIND} public shop card`);
    } else {
      await gotoLive(page, "/");
      await page.locator("[data-find-code-entry] input").fill(FIND);
      await page.getByRole("button", { name: /^find$|^buscar$/i }).click();
      await page.waitForTimeout(1200);
      await shot(page, "07-public-shop-profile.png");
      captured.push(`07-public-shop-profile.png — find code ${FIND} lookup`);
    }
  }

  if (SHOP_EMAIL && SHOP_PASSWORD) {
    try {
      await login(page, SHOP_EMAIL, SHOP_PASSWORD);
      await page.locator("[data-shop-home]").waitFor({ timeout: 15000 });
      await shot(page, "08-shop-jobs.png");
      captured.push("08-shop-jobs.png — shop owner Jobs board (Open / Ready / History)");

      const history = page.locator('[data-shop-filter="history"]');
      if (await history.count()) {
        await history.click();
        await page.waitForTimeout(400);
        await shot(page, "09-shop-history.png");
        captured.push("09-shop-history.png — job history (completed / declined)");
      }

      const share = page.getByRole("button", { name: /^qr$|^share$|^código$/i });
      if (await share.count()) {
        await share.click();
        await page.getByRole("button", { name: /copy code|copiar código/i }).waitFor({ timeout: 10000 });
        await shot(page, "10-share-find-code.png");
        captured.push("10-share-find-code.png — Share tab, copy find code / copy link");
      }

      const card = page.locator("[data-job-id]").first();
      if (await page.locator("[data-shop-filter='active']").count()) {
        await page.locator("[data-shop-filter='active']").click();
        await page.waitForTimeout(300);
      }
      if (await card.count()) {
        await card.click();
        await page.locator("[data-ticket-block='vehicle']").waitFor({ timeout: 10000 });
        await shot(page, "11-shop-job-bay-photo.png");
        captured.push("11-shop-job-bay-photo.png — ticket vehicle hero + bay photo / Post update");
      }

      await page.getByRole("button", { name: /^account$|^cuenta$/i }).click();
      await page.locator("[data-account-public-profile]").waitFor({ timeout: 10000 }).catch(() => {});
      await shot(page, "12-shop-account-profile.png");
      captured.push("12-shop-account-profile.png — shop Account / public profile fields");
    } catch (err) {
      console.warn("shop login capture skipped:", err?.message || err);
    }
  }

  if (CUSTOMER_EMAIL && CUSTOMER_PASSWORD) {
    try {
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear()).catch(() => {});
      await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await page.getByRole("button", { name: /^home$|^inicio$/i }).waitFor({ timeout: 15000 });
      await waitToastGone(page);
      await shot(page, "13-customer-home.png");
      captured.push("13-customer-home.png — customer Home");

      if (FIND) {
        await page.locator("[data-find-code-entry] input").fill(FIND);
        await page.getByRole("button", { name: /^find$|^buscar$/i }).click();
        await waitToastGone(page);
      }
      await page.getByRole("button", { name: /^book$|^citas$|^reservar$/i }).click();
      await page.waitForTimeout(800);
      await waitToastGone(page);
      await shot(page, "14-customer-book.png");
      captured.push("14-customer-book.png — New appointment (linked shop, no marketplace directory)");
    } catch (err) {
      console.warn("customer login capture skipped:", err?.message || err);
    }
  }

  await browser.close();

  const manifest = {
    origin: LIVE,
    viewport: `${W}x${H}`,
    deviceScaleFactor: DSF,
    pixelSize: `${W * DSF}x${H * DSF}`,
    ratio: "9:16",
    captured,
    note: "Production has no seed demos. Authenticated shots only appear when MH_* credentials sign in on live.",
  };
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
