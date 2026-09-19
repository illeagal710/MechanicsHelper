import { useEffect, useId, useRef, useState } from "react";
import { Camera, ImageIcon, X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import {
  BAY_PHOTO_SLOT,
  PHOTO_CAMERA_VIDEO,
  PHOTO_JPEG_QUALITY,
  PROFILE_PHOTO_SLOT,
  hasBayPhoto,
  isMobilePhotoDevice,
  resizePhoto,
  type PhotoSlot,
} from "@/lib/photos";
import { clampPan, clampZoom } from "@/lib/photo-zoom";

export function ProfileSilhouette({
  size = "md",
  label,
}: {
  size?: "sm" | "md" | "lg";
  label: string;
}) {
  const box = size === "lg" ? "size-20" : size === "sm" ? "size-12" : "size-16";
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
  const box = size === "lg" ? "size-20" : size === "sm" ? "size-12" : "size-16";
  if (src) {
    return (
      <img
        src={src}
        alt=""
        data-user-photo=""
        decoding="async"
        className={`${box} shrink-0 rounded-2xl border border-line object-cover [image-rendering:auto]`}
      />
    );
  }
  return <ProfileSilhouette size={size} label={t("photo.silhouetteAlt", { name: name || "?" })} />;
}

export function PhotoLightbox({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pinch = useRef<{ dist: number; scale: number; pan: { x: number; y: number } } | null>(null);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; id: number } | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  function viewSize() {
    const box = viewRef.current?.getBoundingClientRect();
    return { w: box?.width || 400, h: box?.height || 400 };
  }

  function setZoom(next: number) {
    const s = clampZoom(next);
    const { w, h } = viewSize();
    setScale(s);
    setPan((p) => clampPan(p.x, p.y, s, w, h));
  }

  useEffect(() => {
    if (!hasBayPhoto(src)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, src]);

  if (!hasBayPhoto(src)) return null;

  function pinchDist(e: React.TouchEvent) {
    return Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
  }

  function onPointerDown(e: React.PointerEvent) {
    if (scale <= 1 || e.button === 2) return;
    drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const { w, h } = viewSize();
    setPan(
      clampPan(
        drag.current.panX + (e.clientX - drag.current.x),
        drag.current.panY + (e.clientY - drag.current.y),
        scale,
        w,
        h,
      ),
    );
  }

  function onPointerUp(e: React.PointerEvent) {
    if (drag.current?.id === e.pointerId) drag.current = null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("job.tapToEnlarge")}
      data-photo-lightbox=""
      data-lightbox-scale={scale}
      data-lightbox-x={Math.round(pan.x)}
      data-lightbox-y={Math.round(pan.y)}
      className="fixed inset-0 z-[80] flex flex-col bg-black/94"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          data-lightbox-close=""
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white"
          onClick={onClose}
        >
          <X className="size-4" />
          {t("job.closePhoto")}
        </button>
        <div className="flex gap-2">
          {scale > 1 ? (
            <button
              type="button"
              data-lightbox-reset=""
              className="h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white"
              onClick={() => {
                setScale(1);
                setPan({ x: 0, y: 0 });
              }}
            >
              {t("job.resetView")}
            </button>
          ) : null}
          <button
            type="button"
            data-lightbox-zoom-out=""
            className="grid size-11 place-items-center rounded-xl border border-white/20 bg-white/10 text-lg font-semibold text-white"
            aria-label={t("job.zoomOut")}
            onClick={() => setZoom(scale - 0.5)}
          >
            −
          </button>
          <button
            type="button"
            data-lightbox-zoom-in=""
            className="grid size-11 place-items-center rounded-xl border border-white/20 bg-white/10 text-lg font-semibold text-white"
            aria-label={t("job.zoomIn")}
            onClick={() => setZoom(scale + 0.5)}
          >
            +
          </button>
        </div>
      </div>
      <div
        ref={viewRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3"
        data-lightbox-stage=""
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            drag.current = null;
            pinch.current = { dist: pinchDist(e), scale, pan };
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinch.current) {
            const dist = pinchDist(e);
            if (pinch.current.dist > 0) {
              setZoom(pinch.current.scale * (dist / pinch.current.dist));
            }
          }
        }}
        onTouchEnd={() => {
          pinch.current = null;
        }}
      >
        <img
          src={src}
          alt=""
          data-lightbox-image=""
          decoding="async"
          draggable={false}
          className={`max-h-full max-w-full origin-center object-contain select-none [image-rendering:auto] ${
            scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
          }`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={() => {
            if (scale > 1) {
              setScale(1);
              setPan({ x: 0, y: 0 });
            } else {
              setZoom(2.5);
            }
          }}
        />
        {scale > 1 ? (
          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">
            {t("job.panHint")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function BayPreview({ src }: { src?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const photo = hasBayPhoto(src) ? String(src).trim() : "";

  useEffect(() => {
    if (!photo) setOpen(false);
  }, [photo]);

  if (!photo) {
    return (
      <p className="text-sm text-muted" data-ticket-bay-preview="empty">
        {t("photo.noBay")}
      </p>
    );
  }
  return (
    <>
      <button
        type="button"
        data-ticket-bay-preview="filled"
        data-bay-preview-open=""
        className="block w-full cursor-zoom-in overflow-hidden rounded-xl border border-line bg-bg2"
        aria-label={t("job.tapToEnlarge")}
        onClick={() => setOpen(true)}
      >
        <img
          src={photo}
          alt=""
          data-user-photo=""
          decoding="async"
          className="mx-auto max-h-80 min-h-48 w-full object-contain [image-rendering:auto] md:max-h-[32rem]"
        />
      </button>
      {open ? <PhotoLightbox src={photo} onClose={() => setOpen(false)} /> : null}
    </>
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
        video: PHOTO_CAMERA_VIDEO,
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
      PHOTO_JPEG_QUALITY,
    );
  }

  const isProfile = slot === PROFILE_PHOTO_SLOT;
  const bayFilled = !isProfile && hasBayPhoto(value);

  return (
    <div data-photo-slot={slot} className="flex flex-col gap-3" data-bay-empty={isProfile ? undefined : bayFilled ? "false" : "true"}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </div>
      {isProfile ? (
        <div className="flex items-center gap-3">
          <Face src={value} name={name} size="lg" />
          <p className="text-sm text-muted">{value ? t("photo.profileSet") : t("photo.profileEmpty")}</p>
        </div>
      ) : bayFilled ? (
        <BayPreview src={value} />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || busy}
          className="tap flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-semibold disabled:opacity-50"
          onClick={() => chooseRef.current?.click()}
        >
          <ImageIcon className="size-4 shrink-0" />
          {isProfile || bayFilled ? t("photo.choose") : t("photo.addBay")}
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          className="tap flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-semibold disabled:opacity-50"
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
