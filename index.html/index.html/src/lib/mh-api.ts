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
      businessName?: string;
      serviceMode?: User["serviceMode"];
    }) => d,
  )
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.register(data);
  });

export const mhRotateCode = createServerFn({ method: "POST" })
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.rotateCustomerCode(data.userId);
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
    }) => d,
  )
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.updateShopProfile(data.userId, data);
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
    }) => d,
  )
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.updateIndependentProfile(data.userId, data);
  });

export const mhUpdateUserPhoto = createServerFn({ method: "POST" })
  .validator((d: { userId: string; profilePhoto: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.updateUserPhoto(data.userId, data.profilePhoto);
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
  .validator((d: { id: string; patch: Partial<Job> & { jobPhoto?: string } }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.updateJob(data.id, data.patch);
  });

export const mhSavePush = createServerFn({ method: "POST" })
  .validator((d: { userId: string; token: string; alertsOn: boolean }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.savePushToken(data.userId, data.token, data.alertsOn);
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
  .validator((d: { userId: string; password: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.deleteAccount(data.userId, data.password);
  });

export const mhAddNote = createServerFn({ method: "POST" })
  .validator((d: { id: string; text: string; by?: string }) => d)
  .handler(async ({ data }) => {
    const db = await import("./mh-db.server");
    return db.addNote(data.id, data.text, data.by || "shop");
  });

export const mhDiagnose = createServerFn({ method: "POST" })
  .validator((d: { text: string; locale: "en" | "es" }) => d)
  .handler(async ({ data }) => {
    const llm = await import("./diagnose-llm.server");
    return llm.diagnoseWithLlm(data.text, data.locale);
  });
