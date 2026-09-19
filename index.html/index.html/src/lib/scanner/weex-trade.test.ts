import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clientOrderId,
  formatQty,
  resolveTradeAction,
  sizeBuy,
  type TradeGate,
} from "./weex-trade.ts";

const sized = {
  lastPrice: 100,
  pct: 5,
  maxQuote: 50,
  minQuote: 10,
  minTradeAmount: 0.001,
  stepSize: 0.001,
};

test("paper is the default action when Live is not armed", () => {
  const rest: TradeGate = { execution: "paper", liveArmed: false, killed: false };
  assert.equal(resolveTradeAction(rest), "paper");
  assert.equal(resolveTradeAction({ execution: "live", liveArmed: false, killed: false }), "paper");
  assert.equal(resolveTradeAction({ execution: "live", liveArmed: true, killed: false }), "live");
});

test("alerts-only and kill switch never place", () => {
  assert.equal(resolveTradeAction({ execution: "alerts", liveArmed: true, killed: false }), "skip");
  assert.equal(resolveTradeAction({ execution: "live", liveArmed: true, killed: true }), "skip");
  assert.equal(resolveTradeAction({ execution: "paper", liveArmed: false, killed: true }), "skip");
});

test("sizeBuy uses percent of free USDT capped by maxQuote", () => {
  const hit = sizeBuy({ ...sized, freeUsdt: 1000 });
  assert.equal(hit.ok, true);
  if (!hit.ok) return;
  assert.equal(hit.quote, 50);
  assert.equal(hit.quantity, 0.5);
  assert.equal(hit.quantityStr, "0.500");
});

test("sizeBuy refuses when USDT is below the minimum quote", () => {
  const miss = sizeBuy({ ...sized, freeUsdt: 8 });
  assert.equal(miss.ok, false);
});

test("formatQty follows stepSize", () => {
  assert.equal(formatQty(0.123456, 0.001), "0.123");
});

test("client order ids stay short and alphanumeric", () => {
  const id = clientOrderId("BTCUSDT", 1_700_000_000_000);
  assert.ok(id.length <= 32);
  assert.match(id, /^[A-Za-z0-9]+$/);
});

test("live sizeBuy is still percent of free USDT, not 1% risk math", () => {
  const hit = sizeBuy({ ...sized, freeUsdt: 10_000, pct: 5, maxQuote: 50 });
  assert.equal(hit.ok, true);
  if (!hit.ok) return;
  assert.equal(hit.quote, 50);
});
