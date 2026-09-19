import assert from "node:assert/strict";
import { test } from "node:test";
import { weexAccessSign } from "./weex-sign-node.ts";
import { weexPrehash } from "./weex-sign.ts";

test("WEEX prehash matches the official POST order example", () => {
  const body =
    '{"symbol":"BTCUSDT","side":"BUY","type":"LIMIT","timeInForce":"GTC","quantity":"1","price":"68900","newClientOrderId":"my-order-001"}';
  assert.equal(
    weexPrehash("1561022985382", "POST", "/api/v3/order", "", body),
    `1561022985382POST/api/v3/order${body}`,
  );
});

test("WEEX prehash includes ?query for GET", () => {
  assert.equal(
    weexPrehash("1591089508404", "GET", "/api/v3/market/depth", "symbol=BTCUSDT&limit=20", ""),
    "1591089508404GET/api/v3/market/depth?symbol=BTCUSDT&limit=20",
  );
});

test("HMAC-SHA256 signature is Base64", () => {
  const sig = weexAccessSign("test-secret", "1561022985382", "GET", "/api/v3/account");
  assert.match(sig, /^[A-Za-z0-9+/]+=*$/);
  assert.equal(sig, weexAccessSign("test-secret", "1561022985382", "GET", "/api/v3/account"));
  assert.notEqual(sig, weexAccessSign("other", "1561022985382", "GET", "/api/v3/account"));
});
