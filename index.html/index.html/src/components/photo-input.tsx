import { useEffect, useId, useRef, useState } from "react";
import { Camera, ImageIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { BAY_PHOTO_SLOT, PROFILE_PHOTO_SLOT, isMobilePhotoDevice, type PhotoSlot } from "@/lib/photos";
import { resizePhoto } from "@/lib/store";

export function ProfileSilhouette({
  size = "md",
  label,
}: {
  size?: "sm" | "md" | "lg";
  label: string;
}) {
  const box = size === "lg" ? "size-16" : size === "sm" ? "size-10" : "size-14";
  return (
    <div
      className={`${box} grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-surface2 text-muted`}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 64 64" className="size-[78%]" aria-hidden>
        <circle cx="32" cy="20" r="12" fill="currentColor" />
        <path
          d="M8 58c1.5-16 10.5-24 24-24s22.5 8 24 24"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export function Face({
  src,
  name,
  size = "md",
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useI18n();
  const box = size === "lg" ? "size-16" : size === "sm" ? "size-10" : "size-14";
  if (src) {
    return <img src={src} alt="" className={`${box} shrink-0 rounded-2xl border border-line object-cover`} />;
  }
  return <ProfileSilhouette size={size} label={t("photo.silhouetteAlt", { name: name || "?" })} />;
}

function BayPreview({ src }: { src?: string }) {
  const { t } = useI18n();
  if (src) {
    return <img src={src} alt="" className="h-28 w-full rounded-xl border border-line object-cover" />;
  }
  return (
    <div className="grid h-28 place-items-center rounded-xl border border-dashed border-line bg-bg2 px-3 text-center text-sm text-muted">
      {t("photo.noBay")}
    </div>
  );
}

export function PhotoPicker({
  slot,
  value,
  name,
  onPick,
  onErr,
  disabled,
  label,
  hint,
}: {
  slot: PhotoSlot;
  value?: string;
  name: string;
  onPick: (dataUrl: string) => void | Promise<void>;
  onErr: (message: string) => void;
  disabled?: boolean;
  label: string;
  hint: string;
}) {
  const { t } = useI18n();
  const chooseId = useId();
  const takeId = useId();
  const chooseRef = useRef<HTMLInputElement>(null);
  const takeRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || disabled) return;
    setBusy(true);
    try {
      const dataUrl = await resizePhoto(file);
      await onPick(dataUrl);
    } catch (err) {
      onErr(err instanceof Error ? err.message : t("err.photoFail"));
    } finally {
      setBusy(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  async function openDesktopCamera() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      takeRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      takeRef.current?.click();
    }
  }

  function snapDesktop() {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onErr(t("err.readImage"));
      return;
    }
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      async (blob) => {
        stopCamera();
        if (!blob) {
          onErr(t("err.readImage"));
          return;
        }
        await handleFile(new File([blob], "camera.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.82,
    );
  }

  const isProfile = slot === PROFILE_PHOTO_SLOT;

  return (
    <div data-photo-slot={slot} className="flex flex-col gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </div>
      {isProfile ? (
        <div className="flex items-center gap-3">
          <Face src={value} name={name} size="lg" />
          <p className="text-sm text-muted">{value ? t("photo.profileSet") : t("photo.profileEmpty")}</p>
        </div>
      ) : (
        <BayPreview src={value} />
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || busy}
          className="tap flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-semibold disabled:opacity-50"
          onClick={() => chooseRef.current?.click()}
        >
          <ImageIcon className="size-4 shrink-0" />
          {t("photo.choose")}
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          className="tap flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-semibold disabled:opacity-50"
          onClick={() => {
            if (isMobilePhotoDevice()) takeRef.current?.click();
            else void openDesktopCamera();
          }}
        >
          <Camera className="size-4 shrink-0" />
          {t("photo.take")}
        </button>
      </div>
      {/* Gallery / files — no capture, so iOS/Android open the library. */}
      <input
        id={chooseId}
        ref={chooseRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        data-photo-input="choose"
        data-photo-slot={slot}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          await handleFile(file);
        }}
      />
      {/* Camera path — capture=environment on mobile Safari/Chrome. */}
      <input
        id={takeId}
        ref={takeRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        data-photo-input="take"
        data-photo-slot={slot}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          await handleFile(file);
        }}
      />
      {cameraOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-4 sm:place-items-center">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-bg">
            <p className="px-4 pt-3 text-sm font-semibold">{t("photo.cameraTitle")}</p>
            <video ref={videoRef} playsInline muted autoPlay className="mt-2 h-56 w-full bg-black object-cover" />
            <div className="grid grid-cols-2 gap-2 p-3">
              <button type="button" className="h-11 rounded-xl border border-line font-semibold" onClick={stopCamera}>
                {t("photo.cameraCancel")}
              </button>
              <button type="button" className="h-11 rounded-xl bg-accent font-semibold text-ink" onClick={snapDesktop}>
                {t("photo.cameraSnap")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { BAY_PHOTO_SLOT, PROFILE_PHOTO_SLOT };
