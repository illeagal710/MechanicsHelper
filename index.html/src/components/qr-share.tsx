import { useEffect, useState } from "react";
import { Check, Copy, Download, RefreshCw, Share2 } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { qrDataUrl, referralUrl } from "@/lib/qr";

export function QrShare({
  code,
  title,
  onRotate,
  canRotate,
  rotateHint,
}: {
  code: string;
  title: string;
  onRotate?: () => void;
  canRotate?: boolean;
  rotateHint?: string;
}) {
  const { t } = useI18n();
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

  function download() {
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `find-code-${code}.png`;
    a.click();
  }

  async function shareNative() {
    try {
      await navigator.share({
        title: title,
        text: t("qr.shareText", { title, code }),
        url: link,
      });
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
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
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold ${canNativeShare ? "" : "col-span-2"}`}
          onClick={download}
        >
          <Download className="size-4" />
          {t("qr.saveQr")}
        </button>
        {canNativeShare ? (
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
          onClick={onRotate}
        >
          <RefreshCw className="size-4" />
          {t("qr.newCode")}
        </button>
      ) : null}
      {rotateHint ? <p className="mt-1 text-xs text-dim">{rotateHint}</p> : null}
    </div>
  );
}
