import type { Job, Shop, StatusId, User } from "@/lib/store";

/** Account / shop / mechanic identity photo. Never a bay/job image. */
export const PROFILE_PHOTO_SLOT = "profile" as const;
/** Job ticket / status photo from the bay. Never the account avatar. */
export const BAY_PHOTO_SLOT = "bay" as const;

export type PhotoSlot = typeof PROFILE_PHOTO_SLOT | typeof BAY_PHOTO_SLOT;

export type JobMediaPatch = {
  status?: StatusId;
  assignedTo?: string;
  jobPhoto?: string;
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
  if (
    status === "scheduled" ||
    status === "enroute" ||
    status === "checkedin" ||
    status === "diagnosing" ||
    status === "parts" ||
    status === "repair" ||
    status === "ready" ||
    status === "done"
  ) {
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
    "profilePhoto" in patch;

  if (typeof patch.jobPhoto === "string") {
    out.jobPhoto = patch.jobPhoto;
  } else if (!looksLikeProfile && typeof patch.photo === "string") {
    out.jobPhoto = patch.photo;
  }

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
