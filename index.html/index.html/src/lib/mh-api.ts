import { createServerFn } from "@tanstack/react-start";
import { normalizeSymptoms } from "@/lib/booking";
import type { Job, Role, User } from "@/lib/store";

export const mhBoard = createServerFn({ method: "GET" }).handler(async () => {
  const db = await import("./mh-db.server");
  return db.loadBoard();
});

export const mhLogin = createServerFn({ method: "POST" })
  .validator((d: { id: string; password: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.login(data.id, data.password);
  });

export const mhRegister = createServerFn({ method: "POST" })
  .validator(
    (d: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: Role;
      shopJoin?: string;
      shopName?: string;
      shopCode?: string;
      findCode?: string;
      businessName?: string;
      serviceMode?: User["serviceMode"];
    }) => d,
  )
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.register(data);
  });

export const mhRotateCode = createServerFn({ method: "POST" })
  .validator((d: { userId: string; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return "";
    const db = await import("./mh-db.server");
    return db.rotateCustomerCode(uid);
  });

export const mhClaimCode = createServerFn({ method: "POST" })
  .validator((d: { desired: string; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.claimCustomerCode(uid, data.desired);
  });

export const mhUpdateShop = createServerFn({ method: "POST" })
  .validator(
    (d: {
      userId: string;
      name?: string;
      bio?: string;
      photo?: string;
      profilePhoto?: string;
      supportEmail?: string;
      supportPhone?: string;
      hoursDays?: string;
      hoursOpen?: string;
      hoursClose?: string;
      blockAfterHours?: number;
      specialties?: string[];
      credentials?: string[];
      serviceArea?: string;
      yearsWrenching?: string;
      address?: string;
      authToken?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.updateShopProfile(uid, data);
  });

export const mhUpdateIndy = createServerFn({ method: "POST" })
  .validator(
    (d: {
      userId: string;
      businessName?: string;
      bio?: string;
      serviceMode?: User["serviceMode"];
      photo?: string;
      profilePhoto?: string;
      supportEmail?: string;
      supportPhone?: string;
      hoursDays?: string;
      hoursOpen?: string;
      hoursClose?: string;
      blockAfterHours?: number;
      specialties?: string[];
      credentials?: string[];
      serviceArea?: string;
      yearsWrenching?: string;
      address?: string;
      authToken?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.updateIndependentProfile(uid, data);
  });

export const mhUpdateUserPhoto = createServerFn({ method: "POST" })
  .validator((d: { userId: string; profilePhoto: string; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.updateUserPhoto(uid, data.profilePhoto);
  });

export const mhAddTech = createServerFn({ method: "POST" })
  .validator((d: { shopId: string; name: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.addTechName(data.shopId, data.name);
  });

export const mhAddJob = createServerFn({ method: "POST" })
  .validator((d: { job: Job }) => ({
    job: { ...d.job, symptoms: normalizeSymptoms(d.job?.symptoms) },
  }))
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.addJob(data.job);
  });

export const mhUpdateJob = createServerFn({ method: "POST" })
  .validator((d: { id: string; patch: Partial<Job> & { jobPhoto?: string; vehiclePhoto?: string } }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.updateJob(data.id, data.patch);
  });

export const mhSavePush = createServerFn({ method: "POST" })
  .validator((d: { userId: string; token: string; alertsOn: boolean; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.savePushToken(uid, data.token, data.alertsOn);
  });

export const mhRequestPasswordReset = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.requestPasswordReset(data.id);
  });

export const mhResetPassword = createServerFn({ method: "POST" })
  .validator((d: { id: string; code: string; password: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.resetPassword(data.id, data.code, data.password);
  });

export const mhRecoverUsername = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.recoverUsername(data.id);
  });

export const mhDeleteAccount = createServerFn({ method: "POST" })
  .validator((d: { userId: string; password: string; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.deleteAccount(uid, data.password);
  });

export const mhAddNote = createServerFn({ method: "POST" })
  .validator((d: { id: string; text: string; by?: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.addNote(data.id, data.text, data.by || "shop");
  });

export const mhDeclineJob = createServerFn({ method: "POST" })
  .validator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.declineJob(data.id, data.reason || "");
  });

export const mhCancelJob = createServerFn({ method: "POST" })
  .validator((d: { id: string; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.cancelJob(data.id, uid);
  });

export const mhRescheduleJob = createServerFn({ method: "POST" })
  .validator((d: { id: string; slot: string; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.rescheduleJob(data.id, data.slot, uid);
  });

export const mhSaveJobOps = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id: string;
      patch: {
        symptomPhoto?: string;
        estimate?: Job["estimate"];
        parts?: Job["parts"];
        statusBefore?: string;
        flaggedForOwner?: boolean;
      };
      authToken?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.saveJobOps(data.id, data.patch, uid);
  });

export const mhSetJobStatus = createServerFn({ method: "POST" })
  .validator((d: { id: string; status: Job["status"]; skipEstimate?: boolean; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.setJobStatus(data.id, data.status, uid, { skipEstimate: data.skipEstimate });
  });

export const mhUndoJobStatus = createServerFn({ method: "POST" })
  .validator((d: { id: string; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.undoJobStatus(data.id, uid);
  });

export const mhSaveEstimate = createServerFn({ method: "POST" })
  .validator((d: { id: string; amount: string; note: string; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.saveEstimate(data.id, data.amount, data.note, uid);
  });

export const mhDecideEstimate = createServerFn({ method: "POST" })
  .validator((d: { id: string; approved: boolean; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.decideEstimate(data.id, data.approved, uid);
  });

export const mhSkipEstimate = createServerFn({ method: "POST" })
  .validator((d: { id: string; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.skipEstimate(data.id, uid);
  });

export const mhSaveParts = createServerFn({ method: "POST" })
  .validator((d: { id: string; eta: string; note: string; ordered?: boolean; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.saveParts(data.id, data.eta, data.note, data.ordered !== false, uid);
  });

export const mhFlagJob = createServerFn({ method: "POST" })
  .validator((d: { id: string; flagged?: boolean; authToken?: string }) => d)
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session-token");
    const uid = verifySession(data.authToken);
    if (!uid) return { ok: false as const, error: "Please sign in again." };
    const db = await import("./mh-db.server");
    return db.flagJob(data.id, data.flagged !== false, uid);
  });

export const mhDiagnose = createServerFn({ method: "POST" })
  .validator((d: { text: string; locale: "en" | "es" }) => d)
  .handler(async ({ data }) => {
    const llm = await import("./diagnose-llm.server");
    return llm.diagnoseWithLlm(data.text, data.locale);
  });
