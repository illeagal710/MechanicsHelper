import assert from "node:assert/strict";
import { test } from "node:test";
import { customerSmsKey, firstReachablePhone, formatPublicPhone, phoneDigits, smsHref, telHref } from "./phone.ts";

test("phoneDigits keeps a leading plus and strips junk", () => {
  assert.equal(phoneDigits("(555) 010-0000"), "5550100000");
  assert.equal(phoneDigits("+1 555 010 0000"), "+15550100000");
  assert.equal(phoneDigits(""), "");
});

test("formatPublicPhone uses (661) 202-4288 for US numbers", () => {
  assert.equal(formatPublicPhone("6612024288"), "(661) 202-4288");
  assert.equal(formatPublicPhone("661-202-4288"), "(661) 202-4288");
  assert.equal(formatPublicPhone("1 661 202 4288"), "(661) 202-4288");
  assert.equal(formatPublicPhone("+1 (661) 202-4288"), "(661) 202-4288");
  assert.equal(formatPublicPhone(""), "");
  assert.equal(formatPublicPhone("ext 12"), "ext 12");
});

test("telHref and smsHref stay empty for short junk", () => {
  assert.equal(telHref("123"), "");
  assert.equal(smsHref("hi"), "");
  assert.equal(telHref("5550100000"), "tel:5550100000");
  assert.equal(smsHref("5550100000"), "sms:5550100000");
  assert.equal(
    smsHref("5550100000", "Your car is ready."),
    "sms:5550100000?body=Your%20car%20is%20ready.",
  );
});

test("firstReachablePhone skips blanks and short junk", () => {
  assert.equal(firstReachablePhone("", "123", "(555) 010-0000"), "5550100000");
  assert.equal(firstReachablePhone("hi", ""), "");
});

test("customer SMS template key follows on-the-way / parts / ready", () => {
  assert.equal(customerSmsKey("enroute"), "job.smsBodyEnroute");
  assert.equal(customerSmsKey("parts"), "job.smsBodyParts");
  assert.equal(customerSmsKey("ready"), "job.smsBodyReady");
  assert.equal(customerSmsKey("repair"), "job.smsBodyUpdate");
});
