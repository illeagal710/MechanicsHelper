import { useEffect, useState } from "react";
import { Check, Copy, Download, Printer, RefreshCw, Share2 } from "lucide-react";
import { qrDataUrl, qrPrintDataUrl, referralUrl } from "@/lib/qr";

export function QrShare({
  code,
  title,
  onRotate,
  canRotate,
  rotateHint,
}: {
  code: string;
  title: string;
  onRotate?: () => void | Promise<void>;
  canRotate?: boolean;
  rotateHint?: string;
}) {
  const [src, setSrc] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | "">("");
  const link = typeof window === "undefined" ? "" : referralUrl(code);
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!code) return;
    const url = referralUrl(code);
    void qrDataUrl(url).then(setSrc);
  }, [code]);

  async function copy(kind: "code" | "link") {
    const text = kind === "code" ? code : link;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setCopied(kind);
    setTimeout(() => setCopied(""), 1600);
  }

  async function download() {
    try {
      const png = await qrPrintDataUrl(link || referralUrl(code));
      const a = document.createElement("a");
      a.href = png;
      a.download = `${title.replace(/[^\w]+/g, "-")}-${code}-QR.png`;
      a.click();
    } catch {
      if (!src) return;
      const a = document.createElement("a");
      a.href = src;
      a.download = `find-code-${code}.png`;
      a.click();
    }
  }

  async function printSheet() {
    const png = await qrPrintDataUrl(link || referralUrl(code));
    const win = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
    if (!win) {
      download();
      return;
    }
    const safeTitle = title.replace(/</g, "");
    const safeCode = code.replace(/</g, "");
    win.document.write(`<!doctype html><html><head><title>${safeCode} print</title>
<style>
  @page { size: letter; margin: 0.6in; }
  body { font-family: system-ui, sans-serif; text-align: center; color: #111; }
  h1 { font-size: 28px; margin: 0 0 6px; }
  p { margin: 6px 0; color: #333; }
  img { width: 3.4in; height: 3.4in; }
  .code { font-family: ui-monospace, monospace; font-size: 42px; letter-spacing: 0.18em; font-weight: 700; margin: 10px 0 4px; }
  .hint { font-size: 14px; }
</style></head><body>
  <p class="hint">Scan to book</p>
  <h1>${safeTitle}</h1>
  <img src="${png}" alt="QR" />
  <div class="code">${safeCode}</div>
  <p class="hint">Or type this find code in Mechanics Helper.</p>
  <script>window.onload = function () { window.print(); }<\/script>
</body></html>`);
    win.document.close();
  }

  async function shareNative() {
    try {
      await navigator.share({
        title: title,
        text: `Book with ${title}. Find code ${code}`,
        url: link,
      });
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer find code</p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">
        Print, text, or leave on the counter. Customers scan or type this and book you — not a random shop.
      </p>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-bg2 p-3">
        {src ? (
          <img src={src} alt={`QR code for ${code}`} className="size-36 shrink-0 rounded-lg bg-accent/10 p-1.5" />
        ) : (
          <div className="size-36 shrink-0 animate-pulse rounded-lg bg-surface2" />
        )}
        <div className="min-w-0 flex-1 text-center">
          <div className="font-mono text-3xl font-semibold tracking-[0.18em] text-accent">{code}</div>
          <p className="mt-1 text-xs text-dim">4-letter find code</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-ink"
          onClick={() => void copy("code")}
        >
          {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === "code" ? "Copied" : "Copy code"}
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold"
          onClick={() => void copy("link")}
        >
          {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === "link" ? "Copied" : "Copy link"}
        </button>
        <button
          type="button"
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold ${canNativeShare ? "" : "col-span-2"}`}
          onClick={download}
        >
          <Download className="size-4" />
          Save QR
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold"
          onClick={() => void printSheet()}
        >
          <Printer className="size-4" />
          Print sheet
        </button>
        {canNativeShare ? (
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold"
            onClick={() => void shareNative()}
          >
            <Share2 className="size-4" />
            Share
          </button>
        ) : null}
      </div>
      {canRotate && onRotate ? (
        <button
          type="button"
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted"
          onClick={() => {
            const ok = window.confirm(
              "Generate a new code?\n\nThrow away or cover the old QR. Any sticker, paper, or saved QR with the old code will not work anymore. Print a new sheet after this.",
            );
           if (ok) void onRotate();
          }}
        >
          <RefreshCw className="size-4" />
          New code + QR
        </button>
      ) : null}
      {rotateHint ? <p className="mt-1 text-xs text-dim">{rotateHint}</p> : null}
    </div>
  );
}
