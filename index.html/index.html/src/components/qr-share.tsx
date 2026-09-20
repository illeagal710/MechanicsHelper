import { useEffect, useState } from "react";
import { Check, Copy, Download, Printer, RefreshCw, Share2 } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { canNativeShare, qrDataUrl, qrPrintDataUrl, referralSharePayload, referralUrl } from "@/lib/qr";

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
  const { t } = useI18n();
  const [src, setSrc] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | "">("");
  const link = typeof window === "undefined" ? "" : referralUrl(code);
  const nativeShare = canNativeShare();

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
    const scan = t("qr.printScan").replace(/</g, "");
    const hint = t("qr.printHint").replace(/</g, "");
    const printTitle = t("qr.printTitle", { code: safeCode }).replace(/</g, "");
    win.document.write(`<!doctype html><html><head><title>${printTitle}</title>
<style>
  @page { size: letter; margin: 0.6in; }
  body { font-family: system-ui, sans-serif; text-align: center; color: #111; }
  h1 { font-size: 28px; margin: 0 0 6px; }
  p { margin: 6px 0; color: #333; }
  img { width: 3.4in; height: 3.4in; }
  .code { font-family: ui-monospace, monospace; font-size: 42px; letter-spacing: 0.18em; font-weight: 700; margin: 10px 0 4px; }
  .hint { font-size: 14px; }
</style></head><body>
  <p class="hint">${scan}</p>
  <h1>${safeTitle}</h1>
  <img src="${png}" alt="QR" />
  <div class="code">${safeCode}</div>
  <p class="hint">${hint}</p>
  <script>window.onload = function () { window.print(); }</${"script"}>
</body></html>`);
    win.document.close();
  }

  async function shareNative() {
    try {
      await navigator.share(
        referralSharePayload(title, code, t("qr.shareText", { title, code })),
      );
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4" data-share-find-code="">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("qr.findCode")}</p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{t("qr.hint")}</p>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-bg2 p-3">
        {src ? (
          <img src={src} alt={t("qr.alt", { code })} className="size-36 shrink-0 rounded-lg bg-accent/10 p-1.5" />
        ) : (
          <div className="size-36 shrink-0 animate-pulse rounded-lg bg-surface2" />
        )}
        <div className="min-w-0 flex-1 text-center">
          <div className="font-mono text-3xl font-semibold tracking-[0.18em] text-accent">{code}</div>
          <p className="mt-1 text-xs text-dim">{t("qr.fourLetter")}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-ink"
          onClick={() => void copy("code")}
        >
          {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === "code" ? t("qr.copied") : t("qr.copyCode")}
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold"
          onClick={() => void copy("link")}
        >
          {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === "link" ? t("qr.copied") : t("qr.copyLink")}
        </button>
        <button
          type="button"
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold ${nativeShare ? "" : "col-span-2"}`}
          onClick={download}
        >
          <Download className="size-4" />
          {t("qr.saveQr")}
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold"
          onClick={() => void printSheet()}
        >
          <Printer className="size-4" />
          {t("qr.printSheet")}
        </button>
        {nativeShare ? (
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold"
            onClick={() => void shareNative()}
          >
            <Share2 className="size-4" />
            {t("qr.share")}
          </button>
        ) : null}
      </div>
      {canRotate && onRotate ? (
        <button
          type="button"
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted"
          onClick={() => {
            const ok = window.confirm(t("qr.rotateConfirm"));
            if (ok) void onRotate();
          }}
        >
          <RefreshCw className="size-4" />
          {t("qr.newCodeQr")}
        </button>
      ) : null}
      {rotateHint ? <p className="mt-1 text-xs text-dim">{rotateHint}</p> : null}
    </div>
  );
}

/** Word-of-mouth share on the public shop card. Same referral URL as the shop QR. */
export function CustomerShopShare({
  code,
  title,
}: {
  code: string;
  title: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const link = typeof window === "undefined" ? "" : referralUrl(code);

  async function copyLink() {
    const url = link || referralUrl(code);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function share() {
    if (canNativeShare()) {
      try {
        await navigator.share(
          referralSharePayload(title, code, t("qr.shareText", { title, code })),
        );
        return;
      } catch {
        /* cancelled */
        return;
      }
    }
    await copyLink();
  }

  if (!code) return null;

  return (
    <div className="mt-3" data-customer-share-shop="">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("qr.sendShop")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-semibold"
          data-copy-shop-link=""
          onClick={() => void copyLink()}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? t("qr.copied") : t("qr.copyLink")}
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-ink"
          data-share-shop=""
          onClick={() => void share()}
        >
          <Share2 className="size-4" />
          {t("qr.share")}
        </button>
      </div>
    </div>
  );
}
