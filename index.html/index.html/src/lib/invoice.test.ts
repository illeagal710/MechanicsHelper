import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canShareInvoice,
  draftInvoice,
  filledInvoiceLines,
  formatInvoiceMoney,
  invoiceNoteText,
  invoicePlainText,
  invoicePrefix,
  invoiceTotals,
  nextInvoiceNumber,
  parseInvoice,
  parseTaxPct,
} from "./invoice.ts";

test("invoice numbers count up from the find code like LEON-104", () => {
  assert.equal(invoicePrefix("leon"), "LEON");
  assert.equal(invoicePrefix("riv-4"), "RIV4");
  assert.equal(nextInvoiceNumber("LEON", []), "LEON-1");
  assert.equal(nextInvoiceNumber("LEON", ["LEON-103", "RIV4-9", "LEON-104"]), "LEON-105");
  assert.equal(nextInvoiceNumber("RIV4", ["riv4-1", "RIV4-2"]), "RIV4-3");
});

test("line math is qty times price plus optional tax", () => {
  const lines = [
    { description: "Pads", qty: 1, price: 180 },
    { description: "Labor", qty: 1.5, price: 90 },
  ];
  const none = invoiceTotals(lines, 0);
  assert.equal(none.subtotal, 315);
  assert.equal(none.tax, 0);
  assert.equal(none.total, 315);
  const taxed = invoiceTotals(lines, 8.25);
  assert.equal(taxed.subtotal, 315);
  assert.equal(taxed.tax, 25.99);
  assert.equal(taxed.total, 340.99);
  assert.equal(parseTaxPct("25"), 20);
  assert.equal(formatInvoiceMoney(340.99), "$340.99");
});

test("blank lines drop out of the total and share check", () => {
  const lines = [
    { description: "", qty: 1, price: 40 },
    { description: "Oil change", qty: 1, price: 65 },
  ];
  assert.deepEqual(filledInvoiceLines(lines), [{ description: "Oil change", qty: 1, price: 65 }]);
  assert.equal(invoiceTotals(lines, 0).total, 65);
  assert.equal(canShareInvoice(lines).ok, true);
  assert.equal(canShareInvoice([{ description: "", qty: 1, price: 0 }]).ok, false);
});

test("parseInvoice keeps number, paid, and note; ignores junk", () => {
  const inv = parseInvoice({
    number: "leon-104",
    lines: [{ description: "  Pads  ", qty: "2", price: "$40.10" }, { description: "" }],
    taxPct: "7.25",
    note: "  Venmo, due on pickup  ",
    paid: true,
    createdAt: 10,
    updatedAt: 20,
  });
  assert.equal(inv?.number, "LEON-104");
  assert.equal(inv?.lines[0].description, "Pads");
  assert.equal(inv?.lines[0].qty, 2);
  assert.equal(inv?.lines[0].price, 40.1);
  assert.equal(inv?.taxPct, 7.25);
  assert.equal(inv?.note, "Venmo, due on pickup");
  assert.equal(inv?.paid, true);
  assert.equal(parseInvoice({ lines: [] }), undefined);
});

test("draftInvoice stamps a stable number", () => {
  const inv = draftInvoice("RIV4-1", { lines: [{ description: "Labor", qty: 1, price: 90 }], note: "cash" }, 50);
  assert.equal(inv.number, "RIV4-1");
  assert.equal(inv.createdAt, 50);
  assert.equal(inv.paid, false);
});

test("ticket note is number, total, and unpaid or paid", () => {
  const inv = draftInvoice("LEON-104", {
    lines: [{ description: "Pads", qty: 1, price: 180 }],
    paid: false,
  });
  assert.equal(invoiceNoteText(inv), "Invoice LEON-104 · $180.00 · Unpaid");
  assert.equal(invoiceNoteText({ ...inv, paid: true }), "Invoice LEON-104 · $180.00 · Paid");
});

test("plain text share is the handwritten total, not a catalog", () => {
  const text = invoicePlainText({
    shopName: "Riverside Auto",
    number: "RIV4-1",
    paid: false,
    customerName: "Maya Chen",
    vehicle: "2019 Honda CR-V",
    lines: [{ description: "Pads", qty: 1, price: 180 }],
    taxPct: 0,
    note: "cash, Venmo, due on pickup",
  });
  assert.match(text, /Riverside Auto/);
  assert.match(text, /RIV4-1/);
  assert.match(text, /Unpaid/);
  assert.match(text, /Maya Chen/);
  assert.match(text, /2019 Honda CR-V/);
  assert.match(text, /Pads/);
  assert.match(text, /\$180\.00/);
  assert.match(text, /cash, Venmo, due on pickup/);
  assert.doesNotMatch(text, /QuickBooks|inventory|card/i);
});
