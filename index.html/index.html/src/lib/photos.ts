import type { Job, Shop, StatusId, User } from "@/lib/store";
import { isJobStatus } from "./job-status.ts";
import { pickVehicleImage } from "./vehicles.ts";

/** Account / shop / mechanic identity photo. Never a bay/job image. */
export const PROFILE_PHOTO_SLOT = "profile" as const;
/** Job ticket / status photo from the bay. Never the account avatar. */
export const BAY_PHOTO_SLOT = "bay" as const;
/** Ticket header / hero: the vehicle (car) picture. Never bay/work media. */
export const VEHICLE_PHOTO_SLOT = "vehicle" as const;

export type PhotoSlot = typeof PROFILE_PHOTO_SLOT | typeof BAY_PHOTO_SLOT | typeof VEHICLE_PHOTO_SLOT;

export type TicketPhotoSlots = {
  /** Image above year/make/model. Never the mechanic's bay/work photo. */
  vehicle: string;
  /** Work / parts photo from the bay. Independent of the vehicle hero. */
  bay: string;
};

export type JobMediaPatch = {
  status?: StatusId;
  assignedTo?: string;
  jobPhoto?: string;
  /** Customer / ticket vehicle hero. Never aliases bay `photo`. */
  vehiclePhoto?: string;
  color?: string;
};

/**
 * Profile photo for the signed-in account.
 * Shop owners use the shop logo column; everyone else uses mh_users.photo.
 * Job/bay media is never returned here.
 */
export function profilePhotoOf(user: User | null | undefined, shop?: Shop | null): string {
  if (!user) return "";
  if (user.role === "shop" && user.shopRole === "owner") return String(shop?.photo || "");
  return String(user.photo || "");
}

/** Bay / job ticket photo only. Stock car art is not a profile photo. */
export function jobPhotoOf(job: Pick<Job, "jobPhoto" | "photo"> | null | undefined): string {
  if (!job) return "";
  return String(job.jobPhoto || job.photo || "");
}

/** True only when the bay slot actually has an image. Empty placeholders must not open a lightbox. */
export function hasBayPhoto(src: string | null | undefined): boolean {
  return String(src || "").trim().length > 0;
}

/**
 * Ticket header / hero above the vehicle name.
 * Prefers the customer/ticket vehicle photo. Generic body-type art is fallback.
 * Never uses jobPhoto / photo (the bay slot) or a profile avatar.
 */
export function ticketVehiclePhotoOf(
  job:
    | {
        make?: string;
        model?: string;
        vehiclePhoto?: string;
        color?: string;
        jobPhoto?: string;
        photo?: string;
      }
    | null
    | undefined,
): string {
  if (!job) return "";
  return pickVehicleImage({
    make: job.make,
    model: job.model,
    vehiclePhoto: job.vehiclePhoto,
    color: job.color,
  }).src;
}

/** Two independent ticket images: car hero vs bay/work photo. */
export function ticketPhotoSlots(
  job:
    | (Pick<Job, "jobPhoto" | "photo"> & {
        make?: string;
        model?: string;
        vehiclePhoto?: string;
        color?: string;
      })
    | null
    | undefined,
): TicketPhotoSlots {
  return {
    vehicle: ticketVehiclePhotoOf(job),
    bay: jobPhotoOf(job),
  };
}

export function withJobPhoto<T extends Pick<Job, "jobPhoto" | "photo">>(job: T, photo: string): T {
  const next = String(photo || "");
  return { ...job, jobPhoto: next, photo: next };
}

/**
 * Strip anything that is not a job-ticket field so a profile `photo` cannot
 * ride along on a bay update (and vice versa). Notes are intentionally omitted:
 * persist them with `addNote` → `notes_json`, never via this client patch.
 */
export function sanitizeJobPatch(patch: Record<string, unknown> | null | undefined): JobMediaPatch {
  const out: JobMediaPatch = {};
  if (!patch || typeof patch !== "object") return out;

  const status = patch.status;
  if (isJobStatus(status)) {
    out.status = status;
  }

  if (typeof patch.assignedTo === "string") out.assignedTo = patch.assignedTo;

  // Canonical bay key. Ignore a generic `photo` if this looks like a profile/user object.
  const looksLikeProfile =
    "businessName" in patch ||
    "shopId" in patch ||
    "role" in patch ||
    "bio" in patch ||
    "serviceMode" in patch ||
    "profilePhoto" in patch ||
    "specialties" in patch ||
    "credentials" in patch ||
    "serviceArea" in patch ||
    "yearsWrenching" in patch;

  if (typeof patch.jobPhoto === "string") {
    out.jobPhoto = patch.jobPhoto;
  } else if (!looksLikeProfile && typeof patch.photo === "string") {
    out.jobPhoto = patch.photo;
  }

  if (typeof patch.vehiclePhoto === "string") out.vehiclePhoto = patch.vehiclePhoto;
  if (typeof patch.color === "string") out.color = patch.color;

  return out;
}

export function isMobilePhotoDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  if (nav.userAgentData?.mobile) return true;
  return navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform || "");
}

/** Longest edge after encode. Old 480px JPEGs looked soft on profiles, tickets, and lightbox. */
export const PHOTO_MAX_EDGE = 1280;
export const PHOTO_JPEG_QUALITY = 0.92;

export const PHOTO_CAMERA_VIDEO = {
  facingMode: { ideal: "environment" as const },
  width: { ideal: 1920 },
  height: { ideal: 1440 },
};

export function fitPhotoSize(
  width: number,
  height: number,
  max = PHOTO_MAX_EDGE,
): { width: number; height: number } {
  const srcW = Math.max(1, Math.round(Number(width) || 1));
  const srcH = Math.max(1, Math.round(Number(height) || 1));
  const longest = Math.max(srcW, srcH);
  if (longest <= max) return { width: srcW, height: srcH };
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(srcW * scale)),
    height: Math.max(1, Math.round(srcH * scale)),
  };
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

async function sourceFromFile(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through to <img> */
    }
  }
  return loadImageElement(file);
}

/** Downscale phone photos with high-quality interpolation and a sharper JPEG. */
export async function resizePhoto(file: File): Promise<string> {
  if (!file?.type || !file.type.startsWith("image/")) {
    throw new Error("Choose a photo or logo image.");
  }
  const source = await sourceFromFile(file);
  const { width, height } = fitPhotoSize(source.width, source.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  if ("close" in source && typeof source.close === "function") {
    source.close();
  }
  return canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY);
}
