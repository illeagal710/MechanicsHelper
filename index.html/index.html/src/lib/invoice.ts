/** Handwritten-total replacement on a ticket. No catalog, no cards, no partial pay. */

export const INVOICE_LINE_MAX = 12;
export const INVOICE_DESC_MAX = 80;
export const INVOICE_NOTE_MAX = 160;
export const INVOICE_TAX_MAX = 20;

export const INVOICE_NEED_LINE = "Add a line with a description.";
export const INVOICE_SHARE_FAIL = "Could not share the invoice.";

export type InvoiceLine = {
  description: string;
  qty: number;
  price: number;
};

export type JobInvoice = {
  number: string;
  lines: InvoiceLine[];
  taxPct: number;
  note: string;
  paid: boolean;
  createdAt: number;
  updatedAt: number;
};

export type InvoiceTotals = {
  subtotal: number;
  tax: number;
  total: number;
};

const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatInvoiceMoney(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "$0.00";
  return MONEY.format(Math.round(n * 100) / 100);
}

export function invoicePrefix(code: string): string {
  const raw = String(code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return raw || "INV";
}

/** LEON-104 style. First invoice for a code is CODE-1. */
export function nextInvoiceNumber(code: string, existing: Array<string | undefined | null>): string {
  const prefix = invoicePrefix(code);
  const re = new RegExp(`^${prefix}-(\\d+)$`, "i");
  let max = 0;
  for (const raw of existing) {
    const m = String(raw || "").trim().match(re);
    if (m) max = Math.max(max, Number(m[1]) || 0);
  }
  return `${prefix}-${max + 1}`;
}

export function parseQty(raw: unknown): number {
  const n = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(999, Math.round(n * 100) / 100);
}

export function parseUnitPrice(raw: unknown): number {
  const n = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(99_999.99, Math.round(n * 100) / 100);
}

export function parseTaxPct(raw: unknown): number {
  const n = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(INVOICE_TAX_MAX, Math.round(n * 100) / 100);
}

export function blankInvoiceLine(): InvoiceLine {
  return { description: "", qty: 1, price: 0 };
}

export function sanitizeInvoiceLine(raw: unknown): InvoiceLine | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const description = String(row.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, INVOICE_DESC_MAX);
  return {
    description,
    qty: parseQty(row.qty),
    price: parseUnitPrice(row.price),
  };
}

export function sanitizeInvoiceLines(raw: unknown): InvoiceLine[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: InvoiceLine[] = [];
  for (const item of list) {
    const line = sanitizeInvoiceLine(item);
    if (!line?.description.trim()) continue;
    out.push(line);
    if (out.length >= INVOICE_LINE_MAX) break;
  }
  return out.length ? out : [blankInvoiceLine()];
}

export function filledInvoiceLines(lines: InvoiceLine[]): InvoiceLine[] {
  return lines.filter((line) => line.description.trim());
}

export function invoiceTotals(lines: InvoiceLine[], taxPct: number): InvoiceTotals {
  const subtotal = filledInvoiceLines(lines).reduce((sum, line) => sum + line.qty * line.price, 0);
  const rate = parseTaxPct(taxPct);
  const tax = Math.round(subtotal * (rate / 100) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    total,
  };
}

export function parseInvoice(raw: unknown): JobInvoice | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const obj = raw as Record<string, unknown>;
  const number = String(obj.number || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 16);
  if (!number) return undefined;
  const createdAt = Number(obj.createdAt) || 0;
  const updatedAt = Number(obj.updatedAt) || createdAt;
  return {
    number,
    lines: sanitizeInvoiceLines(obj.lines),
    taxPct: parseTaxPct(obj.taxPct),
    note: String(obj.note || "").replace(/\s+/g, " ").trim().slice(0, INVOICE_NOTE_MAX),
    paid: obj.paid === true || obj.paid === "t" || obj.paid === 1,
    createdAt,
    updatedAt,
  };
}

export function draftInvoice(
  number: string,
  patch: {
    lines?: unknown;
    taxPct?: unknown;
    note?: unknown;
    paid?: unknown;
    createdAt?: number;
    updatedAt?: number;
  },
  at = Date.now(),
): JobInvoice {
  const createdAt = patch.createdAt || at;
  return {
    number,
    lines: sanitizeInvoiceLines(patch.lines),
    taxPct: parseTaxPct(patch.taxPct),
    note: String(patch.note || "").replace(/\s+/g, " ").trim().slice(0, INVOICE_NOTE_MAX),
    paid: patch.paid === true || patch.paid === "t" || patch.paid === 1,
    createdAt,
    updatedAt: patch.updatedAt || at,
  };
}

export type InvoiceShareInput = {
  shopName: string;
  shopLogo?: string;
  number: string;
  paid: boolean;
  customerName: string;
  customerPhone?: string;
  vehicle: string;
  lines: InvoiceLine[];
  taxPct: number;
  note: string;
};

export function invoicePlainText(input: InvoiceShareInput): string {
  const totals = invoiceTotals(input.lines, input.taxPct);
  const rows = filledInvoiceLines(input.lines).map((line) => {
    const amt = formatInvoiceMoney(line.qty * line.price);
    return `${line.description}  ${line.qty} × ${formatInvoiceMoney(line.price)}  ${amt}`;
  });
  return [
    input.shopName,
    `Invoice ${input.number} · ${input.paid ? "Paid" : "Unpaid"}`,
    input.customerName,
    input.vehicle,
    ...rows,
    input.taxPct ? `Tax ${input.taxPct}%  ${formatInvoiceMoney(totals.tax)}` : "",
    `Total ${formatInvoiceMoney(totals.total)}`,
    input.note,
  ]
    .filter(Boolean)
    .join("\n");
}

export function canShareInvoice(lines: InvoiceLine[]): { ok: true } | { ok: false; error: string } {
  if (!filledInvoiceLines(lines).length) return { ok: false, error: INVOICE_NEED_LINE };
  return { ok: true };
}

export function invoiceNoteText(inv: Pick<JobInvoice, "number" | "lines" | "taxPct" | "paid">): string {
  const totals = invoiceTotals(inv.lines, inv.taxPct);
  return `Invoice ${inv.number} · ${formatInvoiceMoney(totals.total)} · ${inv.paid ? "Paid" : "Unpaid"}`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let row = words[0];
  for (const word of words.slice(1)) {
    const trial = `${row} ${word}`;
    if (ctx.measureText(trial).width <= maxWidth) row = trial;
    else {
      lines.push(row);
      row = word;
    }
  }
  lines.push(row);
  return lines;
}

function loadShareImage(src: string): Promise<HTMLImageElement | null> {
  if (typeof Image === "undefined" || !src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Light paper slip — the photo they used to take of a handwritten total. */
export async function renderInvoicePng(input: InvoiceShareInput): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error(INVOICE_SHARE_FAIL);
  }
  const width = 720;
  const pad = 40;
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error(INVOICE_SHARE_FAIL);
  measure.font = "28px ui-sans-serif, system-ui, sans-serif";
  const lines = filledInvoiceLines(input.lines);
  const totals = invoiceTotals(input.lines, input.taxPct);
  const logo = await loadShareImage(String(input.shopLogo || ""));
  let height = pad + (logo ? 88 : 12) + 36 + 28 + 24 + 22 + 28 + lines.length * 36 + 28 + 48 + 28;
  if (input.note) height += 24 + wrapText(measure, input.note, width - pad * 2).length * 24;
  height += pad + 20;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.max(640, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(INVOICE_SHARE_FAIL);

  ctx.fillStyle = "#f7f4ee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1c1914";
  let y = pad;

  if (logo) {
    const size = 64;
    ctx.save();
    rounded(ctx, pad, y, size, size, 12);
    ctx.clip();
    ctx.drawImage(logo, pad, y, size, size);
    ctx.restore();
    ctx.font = "700 28px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(input.shopName, pad + size + 16, y + 42);
    y += 88;
  } else {
    ctx.font = "700 28px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(input.shopName, pad, y + 28);
    y += 48;
  }

  ctx.font = "600 18px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#6b6258";
  ctx.fillText(`Invoice ${input.number}`, pad, y);
  ctx.fillStyle = input.paid ? "#1f7a3a" : "#9a3412";
  ctx.fillText(input.paid ? "PAID" : "UNPAID", width - pad - ctx.measureText(input.paid ? "PAID" : "UNPAID").width, y);
  y += 32;

  ctx.fillStyle = "#1c1914";
  ctx.font = "600 20px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(input.customerName, pad, y);
  y += 26;
  ctx.font = "16px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#6b6258";
  if (input.customerPhone) {
    ctx.fillText(input.customerPhone, pad, y);
    y += 22;
  }
  ctx.fillText(input.vehicle, pad, y);
  y += 28;

  ctx.strokeStyle = "#d7cfc3";
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(width - pad, y);
  ctx.stroke();
  y += 28;

  for (const line of lines) {
    ctx.fillStyle = "#1c1914";
    ctx.font = "16px ui-sans-serif, system-ui, sans-serif";
    const left = line.description;
    const mid = `${line.qty} × ${formatInvoiceMoney(line.price)}`;
    const right = formatInvoiceMoney(line.qty * line.price);
    ctx.fillText(left.slice(0, 42), pad, y);
    ctx.fillStyle = "#6b6258";
    ctx.fillText(mid, pad + 340, y);
    ctx.fillStyle = "#1c1914";
    ctx.fillText(right, width - pad - ctx.measureText(right).width, y);
    y += 36;
  }

  y += 8;
  ctx.strokeStyle = "#d7cfc3";
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(width - pad, y);
  ctx.stroke();
  y += 32;

  ctx.font = "16px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#6b6258";
  const sub = `Subtotal ${formatInvoiceMoney(totals.subtotal)}`;
  ctx.fillText(sub, width - pad - ctx.measureText(sub).width, y);
  y += 24;
  if (input.taxPct) {
    const tax = `Tax ${input.taxPct}%  ${formatInvoiceMoney(totals.tax)}`;
    ctx.fillText(tax, width - pad - ctx.measureText(tax).width, y);
    y += 24;
  }
  ctx.fillStyle = "#1c1914";
  ctx.font = "700 24px ui-sans-serif, system-ui, sans-serif";
  const tot = `Total ${formatInvoiceMoney(totals.total)}`;
  ctx.fillText(tot, width - pad - ctx.measureText(tot).width, y);
  y += 40;

  if (input.note) {
    ctx.fillStyle = "#6b6258";
    ctx.font = "16px ui-sans-serif, system-ui, sans-serif";
    for (const row of wrapText(ctx, input.note, width - pad * 2)) {
      ctx.fillText(row, pad, y);
      y += 24;
    }
  }

  ctx.fillStyle = "#a3988c";
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Mechanics Helper", pad, canvas.height - 24);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(INVOICE_SHARE_FAIL));
    }, "image/png");
  });
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function shareInvoiceImage(input: InvoiceShareInput): Promise<"shared" | "downloaded"> {
  const blob = await renderInvoicePng(input);
  const filename = `${input.number.replace(/[^A-Z0-9-]/gi, "") || "invoice"}.png`;
  const file = typeof File !== "undefined" ? new File([blob], filename, { type: "image/png" }) : null;
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (file && nav?.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: `Invoice ${input.number}`, text: invoicePlainText(input) });
      return "shared";
    } catch (err) {
      const name = err && typeof err === "object" && "name" in err ? String((err as { name: string }).name) : "";
      if (name === "AbortError") return "shared";
    }
  }
  if (typeof document === "undefined") throw new Error(INVOICE_SHARE_FAIL);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
