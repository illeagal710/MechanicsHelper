import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(ROOT, "..", "..");

function pngInfo(abs) {
  const buf = readFileSync(abs);
  assert.equal(buf.subarray(0, 8).toString("binary"), "\x89PNG\r\n\x1a\n");
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

test("Capacitor loads the live HTTPS site with a stable Play application id", () => {
  const config = readFileSync(join(ROOT, "capacitor.config.ts"), "utf8");
  assert.match(config, /appId:\s*PLAY_APP_ID/);
  assert.match(config, /export const PLAY_APP_ID = "app\.mechanicshelper"/);
  assert.match(config, /export const PLAY_APP_NAME = "Mechanics Helper"/);
  assert.match(config, /url:\s*LIVE_ORIGIN/);
  assert.match(config, /https:\/\/mechanicshelper\.app/);
  assert.match(config, /"mechanicshelper\.app"/);
  assert.match(config, /"www\.mechanicshelper\.app"/);
  assert.match(config, /androidScheme:\s*"https"/);
  assert.doesNotMatch(config, /cleartext:\s*true/);
  assert.match(config, /backgroundColor:\s*NAVY/);
  assert.match(config, /#071834/);
});

test("Android package, version, and signing are wired without committed secrets", () => {
  const gradle = readFileSync(join(ROOT, "android/app/build.gradle"), "utf8");
  assert.match(gradle, /applicationId "app\.mechanicshelper"/);
  assert.match(gradle, /versionCode 2/);
  assert.match(gradle, /versionName "1\.0\.1"/);
  assert.match(gradle, /keystore\.properties/);
  assert.match(gradle, /signingConfigs/);
  assert.equal(existsSync(join(ROOT, "android/keystore.properties")), false);
  assert.equal(existsSync(join(ROOT, "android/keystore.properties.example")), true);
  const example = readFileSync(join(ROOT, "android/keystore.properties.example"), "utf8");
  assert.match(example, /storeFile=/);
  assert.match(example, /keyAlias=mechanicshelper/);
  assert.doesNotMatch(example, /[A-Za-z0-9]{20,}/);
});

test("Android permissions stay minimal and camera/photos are declared", () => {
  const manifest = readFileSync(join(ROOT, "android/app/src/main/AndroidManifest.xml"), "utf8");
  assert.match(manifest, /android\.permission\.INTERNET/);
  assert.match(manifest, /android\.permission\.CAMERA/);
  assert.match(manifest, /android\.permission\.READ_MEDIA_IMAGES/);
  assert.match(manifest, /usesCleartextTraffic="false"/);
  assert.doesNotMatch(manifest, /WRITE_EXTERNAL_STORAGE/);
  assert.doesNotMatch(manifest, /ACCESS_FINE_LOCATION/);
  assert.doesNotMatch(manifest, /RECORD_AUDIO/);
});

test("Play launcher icons are the brand mark at density sizes", () => {
  const xxx = pngInfo(join(ROOT, "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"));
  assert.equal(xxx.width, 192);
  assert.equal(xxx.height, 192);
  const fg = pngInfo(join(ROOT, "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png"));
  assert.equal(fg.width, 432);
  assert.equal(fg.height, 432);
  const mdpi = pngInfo(join(ROOT, "android/app/src/main/res/mipmap-mdpi/ic_launcher.png"));
  assert.equal(mdpi.width, 48);
  assert.equal(mdpi.height, 48);
});

test("Play Store doc lives at the repo root and names the nested app root", () => {
  const doc = readFileSync(join(REPO, "docs/PLAY_STORE.md"), "utf8");
  assert.match(doc, /app\.mechanicshelper/);
  assert.match(doc, /index\.html\/index\.html/);
  assert.match(doc, /versionCode/);
  assert.match(doc, /versionName.*1\.0\.1/);
  assert.match(doc, /bundleRelease/);
  assert.match(doc, /mechanicshelper\.app\/privacy/);
  assert.match(doc, /12 testers/);
  assert.match(doc, /Leon will paste dedicated reviewer accounts|Leon: paste dedicated reviewer accounts/i);
  assert.match(doc, /SEED_DEMO/);
  assert.match(doc, /maya@example\.com/);
  assert.match(doc, /do not work/i);
  assert.doesNotMatch(doc, /maya@example\.com \/ demo123 works/i);
  assert.match(doc, /Not a marketplace/);
  assert.match(doc, /keystore\.properties/);
  assert.match(doc, /android\/app\/build\/outputs\/apk\/debug\/app-debug\.apk/);
  assert.match(doc, /android\/app\/build\/outputs\/bundle\/release\/app-release\.aab/);
});

test("Play phone screenshots are 9:16 PNG and listing copy stays private-shop", () => {
  const dir = join(REPO, "store/play-screenshots");
  const shots = readdirSync(dir).filter((n) => /^\d{2}-.+\.png$/.test(n));
  assert.ok(shots.length >= 4, `need at least 4 phone screenshots, got ${shots.join()}`);
  for (const name of shots) {
    const info = pngInfo(join(dir, name));
    assert.equal(info.width * 16, info.height * 9, `${name} must be 9:16 (got ${info.width}x${info.height})`);
    assert.ok(Math.min(info.width, info.height) >= 320, `${name} short side`);
    assert.ok(Math.max(info.width, info.height) <= 3840, `${name} long side`);
  }
  const feature = pngInfo(join(dir, "feature-graphic-1024x500.png"));
  assert.equal(feature.width, 1024);
  assert.equal(feature.height, 500);
  const readme = readFileSync(join(dir, "README.md"), "utf8");
  assert.match(readme, /9:16/);
  assert.match(readme, /mechanicshelper\.app/);
});
