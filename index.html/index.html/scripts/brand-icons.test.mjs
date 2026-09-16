import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

function pngInfo(rel) {
  const buf = readFileSync(join(PUBLIC, rel));
  assert.equal(buf.subarray(0, 8).toString("binary"), "\x89PNG\r\n\x1a\n");
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    colorType: buf.readUInt8(25),
  };
}

test("wordmark and icon-only masters are present at the store/web sizes", () => {
  const wordmark = pngInfo("img/logo-wordmark.png");
  assert.ok(wordmark.width > wordmark.height * 0.9);
  assert.equal(wordmark.colorType, 2);

  const apple = pngInfo("brand/apple-icon-1024.png");
  assert.equal(apple.width, 1024);
  assert.equal(apple.height, 1024);
  assert.equal(apple.colorType, 2, "Apple 1024 must have no alpha");

  const play = pngInfo("brand/play-icon-512.png");
  assert.equal(play.width, 512);
  assert.equal(play.height, 512);
  assert.equal(play.colorType, 2);

  const touch = pngInfo("__grok/icon-180.png");
  assert.equal(touch.width, 180);
  assert.equal(touch.height, 180);
  assert.equal(touch.colorType, 2);
  assert.deepEqual(pngInfo("apple-touch-icon.png"), touch);

  const fav = pngInfo("favicon.png");
  assert.equal(fav.width, 32);
  assert.equal(fav.height, 32);

  const maskable = pngInfo("icon-512-maskable.png");
  assert.equal(maskable.width, 512);
  assert.equal(maskable.height, 512);

  const fg = pngInfo("brand/android/ic_launcher_foreground.png");
  assert.equal(fg.width, 1080);
  assert.equal(fg.height, 1080);
  assert.equal(fg.colorType, 6, "adaptive foreground keeps alpha");

  const bg = pngInfo("brand/android/ic_launcher_background.png");
  assert.equal(bg.width, 1080);
  assert.equal(bg.height, 1080);
  assert.equal(bg.colorType, 2);
});
