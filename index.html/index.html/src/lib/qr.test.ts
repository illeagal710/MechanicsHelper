import assert from "node:assert/strict";
import { test } from "node:test";
import { canNativeShare, referralSharePayload, referralUrl } from "./qr.ts";

const loc = { origin: "https://mechanicshelper.app", pathname: "/" };

test("referralUrl is origin plus path plus encoded ref", () => {
  assert.equal(referralUrl("LEON", loc), "https://mechanicshelper.app/?ref=LEON");
  assert.equal(referralUrl("RIV4", loc), "https://mechanicshelper.app/?ref=RIV4");
  assert.equal(
    referralUrl("A+B", { origin: "https://mechanicshelper.app", pathname: "/app" }),
    "https://mechanicshelper.app/app?ref=A%2BB",
  );
  assert.equal(referralUrl("LEON"), "/?ref=LEON");
});

test("referral share payload uses the same URL customers and shops send", () => {
  const payload = referralSharePayload("Riverside Auto", "RIV4", "Book with Riverside Auto. Find code RIV4", loc);
  assert.deepEqual(payload, {
    title: "Riverside Auto",
    text: "Book with Riverside Auto. Find code RIV4",
    url: "https://mechanicshelper.app/?ref=RIV4",
  });
  assert.equal(canNativeShare(), false);
});
