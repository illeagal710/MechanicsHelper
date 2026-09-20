import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signSession } from "@/lib/session-token";
import { mailerConfigured, revealRecoveryCode, sendEmail } from "@/lib/mailer.server";
import { normalizeSymptoms } from "@/lib/booking";
import { appendJobNote } from "@/lib/job-notes";
import { blockHoursFromRecord, normalizeBlockAfterHours } from "@/lib/booking-block";
import {
  CANCEL_TOO_LATE,
  RESCHEDULE_CLOSED,
  RESCHEDULE_NOTE,
  applyCancel,
  applyDecline,
  canCustomerCancel,
  canManageAppointment,
  isJobStatus,
  slotTakenAmong,
} from "@/lib/job-status";
import { customerOwnsJob } from "@/lib/booking-provider";
import {
  DEMO_SHOP_FIND_CODE,
  FIND_CODE_TAKEN,
  USED_FIND_AS_JOIN,
  allocateShopCodes,
  claimFindCode,
  generateUnusedCode,
} from "@/lib/find-code";
import { sanitizeJobPatch, withJobPhoto } from "@/lib/photos";
import { publicProfileFromRecord, sanitizePublicProfile } from "@/lib/shop-profile";
import { canRotateFindCode, isShopTechnician } from "@/lib/shop-role";
import {
  ESTIMATE_APPROVED_NOTE,
  ESTIMATE_DECLINED_NOTE,
  ESTIMATE_INVALID,
  ESTIMATE_NOT_PENDING,
  ESTIMATE_SKIPPED_NOTE,
  FLAG_NOTE,
  REPAIR_NEEDS_ESTIMATE,
  UNFLAG_NOTE,
  applyEstimateDecision,
  applyEstimateSend,
  applyOpsToJob,
  applyParts,
  applySkipEstimate,
  applyStatusChange,
  applyStatusUndo,
  canCustomerDecideEstimate,
  canEnterRepair,
  estimateNoteText,
  jobOpsOf,
  mergeJobOps,
  parseEstimateAmount,
  parseJobOps,
  partsNoteText,
  serializeJobOps,
} from "@/lib/job-ops";
import { canShareInvoice, draftInvoice, invoiceNoteText, nextInvoiceNumber } from "@/lib/invoice";
import type { Job, Note, Role, Shop, User } from "@/lib/store";

const RIVERSIDE_BIO =
  "Family-run shop since 1998. Brakes, engines, and same-day diagnostics. We text you before we turn a wrench.";
const LEON_BIO =
  "I come to your driveway. Scan tools, common parts, and straight talk. Nights and weekends if the car is down.";
/** Demo independent find code. LEON is left free for a real shop to claim. */
const DEMO_INDY_FIND_CODE = "INDY1";

export const BIO_MAX = 320;

function slotDays(days: number, hhmm: string) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function parseJson<T>(raw: unknown, fallback: T): T {
  try {
    if (typeof raw !== "string" || !raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function rowUser(r: Record<string, unknown>): User {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email || ""),
    phone: String(r.phone || ""),
    role: r.role as Role,
    pass: String(r.pass || ""),
    shopId: r.shop_id ? String(r.shop_id) : undefined,
    shopName: r.shop_name ? String(r.shop_name) : undefined,
    shopRole: r.shop_role === "owner" || r.shop_role === "tech" ? r.shop_role : undefined,
    businessName: r.business_name ? String(r.business_name) : undefined,
    serviceMode:
      r.service_mode === "mobile" || r.service_mode === "shop" || r.service_mode === "both"
        ? r.service_mode
        : undefined,
    code: r.code ? String(r.code) : undefined,
    bio: String(r.bio || ""),
    photo: String(r.photo || ""),
    supportEmail: String(r.support_email || ""),
    supportPhone: String(r.support_phone || ""),
    pushToken: String(r.push_token || ""),
    alertsOn: r.alerts_on !== false && r.alerts_on !== "f" && r.alerts_on !== 0,
    hoursDays: String(r.hours_days || "123456"),
    hoursOpen: String(r.hours_open || "08:00"),
    hoursClose: String(r.hours_close || "16:00"),
    blockAfterHours: normalizeBlockAfterHours(r.block_after_hours),
    ...publicProfileFromRecord(r),
  };
}

function rowShop(r: Record<string, unknown>): Shop {
  return {
    id: String(r.id),
    name: String(r.name),
    code: String(r.code),
    joinCode: r.join_code ? String(r.join_code) : "",
    ownerId: String(r.owner_id),
    techs: parseJson<string[]>(r.techs_json, []),
    bio: String(r.bio || ""),
    photo: String(r.photo || ""),
    supportEmail: String(r.support_email || ""),
    supportPhone: String(r.support_phone || ""),
    hoursDays: String(r.hours_days || "123456"),
    hoursOpen: String(r.hours_open || "08:00"),
    hoursClose: String(r.hours_close || "16:00"),
    blockAfterHours: normalizeBlockAfterHours(r.block_after_hours),
    ...publicProfileFromRecord(r),
  };
}

function rowJob(r: Record<string, unknown>): Job {
  const ops = parseJobOps(r.ops_json);
  return {
    id: String(r.id),
    userId: r.user_id ? String(r.user_id) : undefined,
    createdAt: Number(r.created_at),
    providerId: String(r.provider_id),
    providerType: r.provider_type === "independent" ? "independent" : "shop",
    providerName: String(r.provider_name),
    assignedTo: String(r.assigned_to || ""),
    name: String(r.name),
    phone: String(r.phone || ""),
    email: String(r.email || ""),
    year: String(r.year || ""),
    make: String(r.make || ""),
    model: String(r.model || ""),
    trim: String(r.trim || ""),
    symptoms: String(r.symptoms || ""),
    slot: String(r.slot),
    status: (r.status as Job["status"]) || "scheduled",
    notes: parseJson<Note[]>(r.notes_json, []),
    notifySms: r.notify_sms !== false && r.notify_sms !== "f" && r.notify_sms !== 0,
    photo: String(r.photo || ""),
    jobPhoto: String(r.photo || ""),
    vehiclePhoto: String(r.vehicle_photo || ""),
    color: String(r.color || ""),
    ...applyOpsToJob({}, ops),
  };
}

async function usedCodes() {
  const sql = await getSql();
  const shops = await sql.query<{ code: string; join_code: string | null }>(
    "select code, join_code from mh_shops",
  );
  const users = await sql.query<{ code: string | null }>("select code from mh_users where code is not null");
  const used = new Set<string>();
  for (const s of shops) {
    if (s.code) used.add(s.code);
    if (s.join_code) used.add(s.join_code);
  }
  for (const u of users) if (u.code) used.add(u.code);
  return used;
}

export async function uniqueCode() {
  const used = await usedCodes();
  return generateUnusedCode(used);
}

async function allocatePreferredCode(preferred: string | undefined, used: Set<string>, current?: string, blocked?: string) {
  const raw = String(preferred || "").trim();
  if (!raw) {
    return { ok: true as const, code: generateUnusedCode(used, current || "", blocked || "") };
  }
  return claimFindCode(raw, used, current, blocked);
}

/**
 * Seed independent used to own LEON. Reassign that demo row so a real shop
 * can claim LEON. Never touches a non-seed account that already has LEON.
 */
async function freeSeedLeonFindCode() {
  const sql = await getSql();
  const holders = await sql.query<{ id: string; kind: string }>(
    `select id, 'user' as kind from mh_users
       where code = 'LEON' and (id = 'u-indy' or email = 'indy@example.com')
     union all
     select id, 'shop' as kind from mh_shops
       where code = 'LEON' and owner_id = 'u-indy'`,
  );
  if (!holders.length) return;
  const used = await usedCodes();
  used.delete("LEON");
  let next = DEMO_INDY_FIND_CODE;
  if (used.has(next)) next = generateUnusedCode(used);
  for (const row of holders) {
    if (row.kind === "user") {
      await sql.query("update mh_users set code = $2 where id = $1", [row.id, next]);
    } else {
      await sql.query("update mh_shops set code = $2 where id = $1", [row.id, next]);
    }
  }
}

/** Existing shops that still share one code get a distinct team-join value. */
async function ensureShopJoinCodes() {
  const sql = await getSql();
  const shops = await sql.query<{ id: string; code: string; join_code: string | null }>(
    "select id, code, join_code from mh_shops",
  );
  const used = await usedCodes();
  for (const shop of shops) {
    const join = String(shop.join_code || "");
    if (join && join !== shop.code) continue;
    if (join) used.delete(join);
    const next = generateUnusedCode(used, shop.code);
    used.add(next);
    await sql.query("update mh_shops set join_code = $2 where id = $1", [shop.id, next]);
  }
}

/** Paint colors on demo tickets so generic silver art can show a tint. */
async function ensureDemoVehicleHero() {
  const sql = await getSql();
  const patches: Array<[string, string]> = [
    ["MH-4820", "red"],
    ["MH-4821", "white"],
    ["MH-4822", "blue"],
    ["MH-4823", "green"],
  ];
  for (const [id, color] of patches) {
    try {
      await sql.query("update mh_jobs set color = $2 where id = $1 and (color is null or color = '')", [id, color]);
    } catch {
      /* 0013 */
    }
  }
}

export async function ensureSeeded() {
  const sql = await getSql();
  await freeSeedLeonFindCode();
  const live = Boolean(process.env.DATABASE_URL?.trim()) && process.env.SEED_DEMO !== "1";
  if (live) {
    await sql.query("delete from mh_jobs where id in ('MH-4821','MH-4822','MH-4823','MH-4824','MH-1094') or provider_id in ('s-main','u-indy') or user_id in ('u-maya','u-shop','u-alex','u-indy')");
    await sql.query("delete from mh_users where id in ('u-maya','u-shop','u-alex','u-indy') or email in ('maya@example.com','shop@example.com','alex@example.com','indy@example.com')");
    await sql.query("delete from mh_shops where id = 's-main' or code = $1", [DEMO_SHOP_FIND_CODE]);
    await ensureShopJoinCodes();
    return;
  }
  const rows = await sql.query<{ n: number }>("select count(*)::int as n from mh_users");
  if ((rows[0]?.n || 0) > 0) {
    await ensureShopJoinCodes();
    await ensureDemoVehicleHero();
    return;
  }

  const now = Date.now();
  await sql.query(
    `insert into mh_shops (id, name, code, join_code, owner_id, techs_json, bio) values ($1,$2,$3,$4,$5,$6,$7)`,
    ["s-main", "Riverside Auto", DEMO_SHOP_FIND_CODE, "RIVTEAM", "u-shop", JSON.stringify(["Shop Desk", "Alex Ruiz"]), RIVERSIDE_BIO],
  );
  await sql.query(
    `update mh_shops set specialties_json = $2, credentials_json = $3, service_area = $4, years_wrenching = $5 where id = $1`,
    [
      "s-main",
      JSON.stringify(["brakes", "diagnostics", "oil", "tires"]),
      JSON.stringify(["ase", "insured"]),
      "Riverside, CA",
      "25",
    ],
  );
  await sql.query("update mh_shops set address = $2 where id = $1", [
    "s-main",
    "1450 Market St, Riverside, CA 92501",
  ]);

  const users: unknown[][] = [
    ["u-maya", "Maya Chen", "maya@example.com", "5550148821", "customer", hashPassword("demo123"), null, null, null, null, null, null, ""],
    ["u-shop", "Shop Desk", "shop@example.com", "5550100000", "shop", hashPassword("demo123"), "s-main", "Riverside Auto", "owner", null, null, null, ""],
    ["u-alex", "Alex Ruiz", "alex@example.com", "5550100001", "shop", hashPassword("demo123"), "s-main", "Riverside Auto", "tech", null, null, null, ""],
    ["u-indy", "Leon Miles", "indy@example.com", "5550166000", "independent", hashPassword("demo123"), null, null, null, "Leon Mobile Repair", "mobile", DEMO_INDY_FIND_CODE, LEON_BIO],
  ];
  for (const u of users) {
    await sql.query(
      `insert into mh_users (id, name, email, phone, role, pass, shop_id, shop_name, shop_role, business_name, service_mode, code, bio)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      u,
    );
  }
  await sql.query(
    `update mh_users set specialties_json = $2, credentials_json = $3, service_area = $4, years_wrenching = $5 where id = $1`,
    [
      "u-indy",
      JSON.stringify(["mobile", "diagnostics", "brakes", "engine"]),
      JSON.stringify(["mobile_license", "insured"]),
      "Inland Empire · I come to you",
      "14",
    ],
  );

  const jobs: Job[] = [
    {
      id: "MH-4821",
      createdAt: now - 86400000 * 2,
      providerId: "s-main",
      providerType: "shop",
      providerName: "Riverside Auto",
      assignedTo: "Alex Ruiz",
      name: "Maya Chen",
      phone: "5550148821",
      email: "maya@example.com",
      year: "2019",
      make: "Honda",
      model: "CR-V",
      color: "white",
      symptoms: "Grinding noise when braking, especially downhill.",
      slot: slotDays(1, "09:00"),
      status: "repair",
      notes: [
        { at: now - 86400000 * 2, text: "Booked online.", by: "system" },
        {
          at: now - 3600000 * 8,
          text: "Front pads at 2mm. Rotors scored. Customer approved pads + rotors.",
          by: "shop",
        },
      ],
    },
    {
      id: "MH-4822",
      createdAt: now - 3600000 * 5,
      providerId: "u-indy",
      providerType: "independent",
      providerName: "Leon Mobile Repair",
      assignedTo: "Leon Miles",
      name: "James Ortiz",
      phone: "5550193304",
      email: "james@example.com",
      year: "2016",
      make: "Ford",
      model: "F-150",
      color: "blue",
      symptoms: "Check engine light. Rough idle after warmup.",
      slot: slotDays(0, "11:30"),
      status: "diagnosing",
      notes: [
        { at: now - 3600000 * 5, text: "Booked online.", by: "system" },
        { at: now - 3600000, text: "Pulled codes P0302. Checking coil pack and injector.", by: "shop" },
      ],
    },
    {
      id: "MH-4820",
      createdAt: now - 86400000,
      providerId: "s-main",
      providerType: "shop",
      providerName: "Riverside Auto",
      assignedTo: "Shop Desk",
      name: "Priya Shah",
      phone: "5550167742",
      email: "priya@example.com",
      year: "2022",
      make: "Toyota",
      model: "Camry",
      color: "red",
      symptoms: "Oil change and 30k service.",
      slot: slotDays(0, "08:00"),
      status: "ready",
      notes: [
        { at: now - 86400000, text: "Booked online.", by: "system" },
        { at: now - 3600000 * 2, text: "Service complete. Cabin filter replaced.", by: "shop" },
      ],
    },
    {
      id: "MH-4810",
      createdAt: now - 86400000 * 12,
      providerId: "s-main",
      providerType: "shop",
      providerName: "Riverside Auto",
      assignedTo: "Alex Ruiz",
      name: "Maya Chen",
      phone: "5550148821",
      email: "maya@example.com",
      year: "2018",
      make: "Honda",
      model: "Civic",
      symptoms: "Battery died overnight. Jump start plus test.",
      slot: slotDays(-8, "10:00"),
      status: "done",
      notes: [
        { at: now - 86400000 * 12, text: "Booked online.", by: "system" },
        { at: now - 86400000 * 8, text: "Status set to Completed", by: "shop" },
      ],
    },
    {
      id: "MH-4823",
      createdAt: now - 3600000,
      providerId: "s-main",
      providerType: "shop",
      providerName: "Riverside Auto",
      assignedTo: "",
      name: "Maya Chen",
      phone: "5550148821",
      email: "maya@example.com",
      year: "2021",
      make: "Subaru",
      model: "Outback",
      color: "green",
      symptoms: "A/C blows warm on the highway.",
      slot: slotDays(2, "13:00"),
      status: "scheduled",
      notes: [{ at: now - 3600000, text: "Booked from customer app.", by: "system" }],
    },
    {
      id: "MH-4824",
      createdAt: now - 1800000,
      providerId: "s-main",
      providerType: "shop",
      providerName: "Riverside Auto",
      assignedTo: "",
      name: "Maya Chen",
      phone: "5550148821",
      email: "maya@example.com",
      year: "2014",
      make: "Toyota",
      model: "Corolla",
      symptoms: "Squeak when turning into the driveway.",
      slot: new Date(now + 25 * 60 * 1000).toISOString(),
      status: "scheduled",
      notes: [{ at: now - 1800000, text: "Booked from customer app.", by: "system" }],
    },
  ];
  for (const j of jobs) {
    await insertJob(j);
  }
  await ensureShopJoinCodes();
  await ensureDemoVehicleHero();
}

export async function loadBoard() {
  await ensureSeeded();
  const sql = await getSql();
  const shops = (await sql.query<Record<string, unknown>>("select * from mh_shops order by name")).map(rowShop);
  const users = (await sql.query<Record<string, unknown>>("select * from mh_users order by name")).map(rowUser);
  const jobs = (await sql.query<Record<string, unknown>>("select * from mh_jobs order by created_at desc")).map(rowJob);
  return { shops, users, jobs };
}

export async function findUser(emailOrPhone: string) {
  await ensureSeeded();
  const q = String(emailOrPhone || "").trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const sql = await getSql();
  const rows = await sql.query<Record<string, unknown>>("select * from mh_users");
  const users = rows.map(rowUser);
  return (
    users.find((u) => {
      if ((u.email || "").toLowerCase() === q) return true;
      const ph = (u.phone || "").replace(/\D/g, "");
      return digits.length >= 4 && ph === digits;
    }) || null
  );
}

export async function login(emailOrPhone: string, password: string) {
  const user = await findUser(emailOrPhone);
  const verdict = user ? verifyPassword(password, user.pass) : { ok: false, needsRehash: false };
  if (!user || !verdict.ok) {
    return { ok: false as const, error: "Email/phone or password is wrong." };
  }
  if (verdict.needsRehash) {
    // Transparently upgrade a legacy (unsalted) hash to salted scrypt on login.
    try {
      const sql = await getSql();
      await sql.query("update mh_users set pass = $2 where id = $1", [user.id, hashPassword(password)]);
    } catch {
      /* best-effort upgrade; login still succeeds */
    }
  }
  const { pass: _p, ...rest } = user;
  return { ok: true as const, user: { ...rest, pass: "" }, token: signSession(user.id) };
}

const RECOVERY_TTL_MS = 15 * 60 * 1000;

export type RecoveryChannel = "email" | "dev" | "stub";

function hashRecoveryCode(code: string) {
  return createHash("sha256").update("mh-reset|" + String(code || "")).digest("hex");
}

function recoveryCodesMatch(stored: string, given: string) {
  const a = Buffer.from(stored);
  const b = Buffer.from(hashRecoveryCode(given));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function freshRecoveryCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function loginIdFor(user: User) {
  const email = (user.email || "").trim();
  const phone = (user.phone || "").trim();
  return email || phone;
}

function recoveryChannel(sentEmail: boolean): RecoveryChannel {
  if (sentEmail) return "email";
  if (revealRecoveryCode()) return "dev";
  return "stub";
}

async function issueRecoveryCode(user: User, purpose: "password" | "username") {
  const sql = await getSql();
  await sql.query("delete from mh_recovery where user_id = $1 and purpose = $2 and used_at is null", [
    user.id,
    purpose,
  ]);
  const code = freshRecoveryCode();
  await sql.query(
    `insert into mh_recovery (id, user_id, purpose, code_hash, expires_at) values ($1,$2,$3,$4,$5)`,
    ["r-" + Math.random().toString(36).slice(2, 10), user.id, purpose, hashRecoveryCode(code), Date.now() + RECOVERY_TTL_MS],
  );
  return code;
}

async function emailRecovery(user: User, purpose: "password" | "username", code?: string) {
  const to = (user.email || "").trim();
  if (!to) return false;
  const login = loginIdFor(user);
  const subject =
    purpose === "password"
      ? "Mechanics Helper password reset"
      : "Mechanics Helper username reminder";
  const text =
    purpose === "password"
      ? `Your Mechanics Helper reset code is ${code}. It expires in 15 minutes.\n\nTu código para restablecer la contraseña es ${code}. Caduca en 15 minutos.`
      : `Your Mechanics Helper login is ${login}.\n\nTu usuario de Mechanics Helper es ${login}.`;
  const mail = await sendEmail({ to, subject, text });
  return mail.ok;
}

export async function requestPasswordReset(emailOrPhone: string) {
  const id = String(emailOrPhone || "").trim();
  if (!id) return { ok: false as const, error: "Email or phone is required." };
  const user = await findUser(id);
  if (!user) {
    return {
      ok: true as const,
      channel: recoveryChannel(mailerConfigured()),
    };
  }
  const code = await issueRecoveryCode(user, "password");
  const sent = await emailRecovery(user, "password", code);
  const channel = recoveryChannel(sent);
  return {
    ok: true as const,
    channel,
    ...(channel === "dev" ? { devCode: code } : {}),
  };
}

export async function resetPassword(emailOrPhone: string, code: string, password: string) {
  const id = String(emailOrPhone || "").trim();
  const rawCode = String(code || "").replace(/\s/g, "");
  if (!id || !rawCode) return { ok: false as const, error: "Email/phone and reset code are required." };
  if (String(password || "").length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters." };
  }
  const user = await findUser(id);
  if (!user) return { ok: false as const, error: "That reset code is wrong or expired." };
  const sql = await getSql();
  const rows = await sql.query<Record<string, unknown>>(
    `select * from mh_recovery
     where user_id = $1 and purpose = 'password' and used_at is null
     order by expires_at desc`,
    [user.id],
  );
  const now = Date.now();
  const match = rows.find((r) => {
    if (Number(r.expires_at) < now) return false;
    return recoveryCodesMatch(String(r.code_hash || ""), rawCode);
  });
  if (!match) return { ok: false as const, error: "That reset code is wrong or expired." };
  await sql.query("update mh_users set pass = $2 where id = $1", [user.id, hashPassword(password)]);
  await sql.query("update mh_recovery set used_at = $2 where id = $1", [String(match.id), now]);
  return { ok: true as const };
}

export async function recoverUsername(emailOrPhone: string) {
  const id = String(emailOrPhone || "").trim();
  if (!id) return { ok: false as const, error: "Email or phone is required." };
  const user = await findUser(id);
  if (!user) return { ok: true as const, found: false as const };
  const login = loginIdFor(user);
  const sent = await emailRecovery(user, "username");
  return {
    ok: true as const,
    found: true as const,
    name: user.name,
    email: user.email || "",
    phone: user.phone || "",
    login,
    channel: recoveryChannel(sent),
  };
}

export async function register(fields: {
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
}) {
  await ensureSeeded();
  const sql = await getSql();
  const emailL = (fields.email || "").trim().toLowerCase();
  const phoneD = String(fields.phone || "").replace(/\D/g, "");
  if (!fields.name || !fields.password || (!emailL && !phoneD)) {
    return { ok: false as const, error: "Name, password, and email or phone are required." };
  }
  if (fields.password.length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters." };
  }
  if (await findUser(emailL || phoneD)) {
    return { ok: false as const, error: "That email or phone already has an account." };
  }
  const role: Role =
    fields.role === "shop" || fields.role === "independent" ? fields.role : "customer";
  const user: User = {
    id: "u-" + Math.random().toString(36).slice(2, 8),
    name: String(fields.name).trim(),
    email: emailL,
    phone: phoneD,
    role,
    pass: hashPassword(fields.password),
    bio: "",
  };
  if (role === "shop") {
    if (fields.shopJoin === "join") {
      const code = String(fields.shopCode || "").trim().toUpperCase();
      const byJoin = await sql.query<Record<string, unknown>>("select * from mh_shops where join_code = $1", [code]);
      const shop = byJoin[0] ? rowShop(byJoin[0]) : null;
      if (!shop) {
        const byFind = await sql.query<Record<string, unknown>>("select * from mh_shops where code = $1", [code]);
        if (byFind[0]) return { ok: false as const, error: USED_FIND_AS_JOIN };
        return { ok: false as const, error: "No shop with that code." };
      }
      user.shopId = shop.id;
      user.shopName = shop.name;
      user.shopRole = "tech";
      if (!shop.techs.includes(user.name)) shop.techs.push(user.name);
      await sql.query("update mh_shops set techs_json = $2 where id = $1", [shop.id, JSON.stringify(shop.techs)]);
    } else {
      const shopName = String(fields.shopName || "").trim() || user.name + "'s Shop";
      const used = await usedCodes();
      const allocated = allocateShopCodes(fields.findCode, used);
      if (!allocated.ok) return allocated;
      const shop: Shop = {
        id: "s-" + Math.random().toString(36).slice(2, 7),
        name: shopName,
        code: allocated.findCode,
        joinCode: allocated.joinCode,
        ownerId: user.id,
        techs: [user.name],
        bio: "",
      };
      await sql.query(
        `insert into mh_shops (id, name, code, join_code, owner_id, techs_json, bio) values ($1,$2,$3,$4,$5,$6,$7)`,
        [shop.id, shop.name, shop.code, shop.joinCode, shop.ownerId, JSON.stringify(shop.techs), shop.bio],
      );
      user.shopId = shop.id;
      user.shopName = shop.name;
      user.shopRole = "owner";
    }
  }
  if (role === "independent") {
    user.businessName = String(fields.businessName || "").trim() || user.name;
    user.serviceMode = fields.serviceMode || "both";
    const used = await usedCodes();
    const allocated = await allocatePreferredCode(fields.findCode, used);
    if (!allocated.ok) return allocated;
    user.code = allocated.code;
    user.bio = "";
  }
  await sql.query(
    `insert into mh_users (id, name, email, phone, role, pass, shop_id, shop_name, shop_role, business_name, service_mode, code, bio)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      user.id,
      user.name,
      user.email,
      user.phone,
      user.role,
      user.pass,
      user.shopId || null,
      user.shopName || null,
      user.shopRole || null,
      user.businessName || null,
      user.serviceMode || null,
      user.code || null,
      user.bio || "",
    ],
  );
  const { pass: _p, ...rest } = user;
  return { ok: true as const, user: { ...rest, pass: "" }, token: signSession(user.id) };
}

export async function rotateCustomerCode(userId: string) {
  const board = await loadBoard();
  const user = board.users.find((u) => u.id === userId);
  if (!user || !canRotateFindCode(user)) return "";
  const used = await usedCodes();
  const sql = await getSql();
  if (user.role === "shop" && user.shopRole === "owner" && user.shopId) {
    const shop = board.shops.find((s) => s.id === user.shopId);
    const current = shop?.code || "";
    if (current) used.delete(current);
    const next = generateUnusedCode(used, shop?.joinCode || "");
    await sql.query("update mh_shops set code = $2 where id = $1", [user.shopId, next]);
    return next;
  }
  if (user.role === "independent") {
    const current = user.code || "";
    if (current) used.delete(current);
    const next = generateUnusedCode(used);
    await sql.query("update mh_users set code = $2 where id = $1", [user.id, next]);
    return next;
  }
  return "";
}

export async function claimCustomerCode(userId: string, desired: string) {
  const board = await loadBoard();
  const user = board.users.find((u) => u.id === userId);
  if (!user || !canRotateFindCode(user)) {
    return { ok: false as const, error: "Only the shop owner can edit this." };
  }
  const used = await usedCodes();
  let current = "";
  let blocked = "";
  if (user.role === "shop" && user.shopRole === "owner" && user.shopId) {
    const shop = board.shops.find((s) => s.id === user.shopId);
    current = shop?.code || "";
    blocked = shop?.joinCode || "";
  } else if (user.role === "independent") {
    current = user.code || "";
  }
  if (current) used.delete(current);
  const allocated = await allocatePreferredCode(desired, used, current, blocked);
  if (!allocated.ok) return allocated;
  if (allocated.code === current) return { ok: true as const, code: current };
  const sql = await getSql();
  if (user.role === "shop" && user.shopRole === "owner" && user.shopId) {
    await sql.query("update mh_shops set code = $2 where id = $1", [user.shopId, allocated.code]);
    return { ok: true as const, code: allocated.code };
  }
  if (user.role === "independent") {
    await sql.query("update mh_users set code = $2 where id = $1", [user.id, allocated.code]);
    return { ok: true as const, code: allocated.code };
  }
  return { ok: false as const, error: FIND_CODE_TAKEN };
}

function profilePhotoFrom(patch: { photo?: string; profilePhoto?: string }) {
  if (patch.profilePhoto !== undefined) return String(patch.profilePhoto || "");
  if (patch.photo !== undefined) return String(patch.photo || "");
  return undefined;
}

export async function updateShopProfile(
  userId: string,
  patch: {
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
  },
) {
  const board = await loadBoard();
  const user = board.users.find((u) => u.id === userId);
  if (!user || user.role !== "shop" || user.shopRole !== "owner" || !user.shopId) {
    return { ok: false as const, error: "Only the shop owner can edit this." };
  }
  const shop = board.shops.find((s) => s.id === user.shopId);
  if (!shop) return { ok: false as const, error: "Shop not found." };
  const sql = await getSql();
  if (patch.name !== undefined) {
    const name = String(patch.name).trim();
    if (!name) return { ok: false as const, error: "Shop name is required." };
    shop.name = name;
    await sql.query("update mh_shops set name = $2 where id = $1", [shop.id, name]);
    await sql.query("update mh_users set shop_name = $2 where shop_id = $1", [shop.id, name]);
  }
  if (patch.bio !== undefined) {
    const bio = String(patch.bio).trim().slice(0, BIO_MAX);
    await sql.query("update mh_shops set bio = $2 where id = $1", [shop.id, bio]);
  }
  const profilePhoto = profilePhotoFrom(patch);
  if (profilePhoto !== undefined) {
    await sql.query("update mh_shops set photo = $2 where id = $1", [shop.id, profilePhoto]);
  }
  if (patch.supportEmail !== undefined) {
    await sql.query("update mh_shops set support_email = $2 where id = $1", [
      shop.id,
      String(patch.supportEmail || "").trim().toLowerCase(),
    ]);
  }
  if (patch.supportPhone !== undefined) {
    await sql.query("update mh_shops set support_phone = $2 where id = $1", [
      shop.id,
      String(patch.supportPhone || "").trim(),
    ]);
  }
  if (patch.hoursDays !== undefined || patch.hoursOpen !== undefined || patch.hoursClose !== undefined) {
    await sql.query("update mh_shops set hours_days = $2, hours_open = $3, hours_close = $4 where id = $1", [
      shop.id,
      patch.hoursDays ?? shop.hoursDays ?? "123456",
      patch.hoursOpen ?? shop.hoursOpen ?? "08:00",
      patch.hoursClose ?? shop.hoursClose ?? "16:00",
    ]);
  }
  if (patch.blockAfterHours !== undefined) {
    try {
      await sql.query("update mh_shops set block_after_hours = $2 where id = $1", [
        shop.id,
        normalizeBlockAfterHours(patch.blockAfterHours),
      ]);
    } catch {
      /* column arrives after 0012 */
    }
  }
  if (
    patch.specialties !== undefined ||
    patch.credentials !== undefined ||
    patch.serviceArea !== undefined ||
    patch.yearsWrenching !== undefined ||
    patch.address !== undefined
  ) {
    const next = sanitizePublicProfile({
      specialties: patch.specialties ?? shop.specialties,
      credentials: patch.credentials ?? shop.credentials,
      serviceArea: patch.serviceArea ?? shop.serviceArea,
      yearsWrenching: patch.yearsWrenching ?? shop.yearsWrenching,
      address: patch.address ?? shop.address,
    });
    await sql.query(
      "update mh_shops set specialties_json = $2, credentials_json = $3, service_area = $4, years_wrenching = $5, address = $6 where id = $1",
      [shop.id, JSON.stringify(next.specialties), JSON.stringify(next.credentials), next.serviceArea, next.yearsWrenching, next.address],
    );
  }
  const fresh = (await loadBoard()).users.find((u) => u.id === userId);
  if (!fresh) return { ok: false as const, error: "Account not found." };
  const { pass: _p, ...rest } = fresh;
  return { ok: true as const, user: { ...rest, pass: "" } };
}

export async function updateIndependentProfile(
  userId: string,
  patch: {
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
  },
) {
  const board = await loadBoard();
  const user = board.users.find((u) => u.id === userId);
  if (!user || user.role !== "independent") {
    return { ok: false as const, error: "Only independents can edit this." };
  }
  const sql = await getSql();
  const name =
    patch.businessName !== undefined ? String(patch.businessName).trim() : user.businessName || user.name;
  if (patch.businessName !== undefined && !name) {
    return { ok: false as const, error: "Business name is required." };
  }
  const bio = patch.bio !== undefined ? String(patch.bio).trim().slice(0, BIO_MAX) : user.bio || "";
  const mode = patch.serviceMode || user.serviceMode || "both";
  const incomingPhoto = profilePhotoFrom(patch);
  const photo = incomingPhoto !== undefined ? incomingPhoto : user.photo || "";
  const supportEmail =
    patch.supportEmail !== undefined ? String(patch.supportEmail || "").trim().toLowerCase() : user.supportEmail || "";
  const supportPhone =
    patch.supportPhone !== undefined ? String(patch.supportPhone || "").trim() : user.supportPhone || "";
  const hoursDays = patch.hoursDays ?? user.hoursDays ?? "123456";
  const hoursOpen = patch.hoursOpen ?? user.hoursOpen ?? "08:00";
  const hoursClose = patch.hoursClose ?? user.hoursClose ?? "16:00";
  const blockAfterHours = normalizeBlockAfterHours(
    patch.blockAfterHours !== undefined ? patch.blockAfterHours : user.blockAfterHours,
  );
  const next = sanitizePublicProfile({
    specialties: patch.specialties ?? user.specialties,
    credentials: patch.credentials ?? user.credentials,
    serviceArea: patch.serviceArea ?? user.serviceArea,
    yearsWrenching: patch.yearsWrenching ?? user.yearsWrenching,
    address: patch.address ?? user.address,
  });
  await sql.query(
    "update mh_users set business_name = $2, bio = $3, service_mode = $4, photo = $5, support_email = $6, support_phone = $7, hours_days = $8, hours_open = $9, hours_close = $10, specialties_json = $11, credentials_json = $12, service_area = $13, years_wrenching = $14, address = $15 where id = $1",
    [
      user.id,
      name,
      bio,
      mode,
      photo,
      supportEmail,
      supportPhone,
      hoursDays,
      hoursOpen,
      hoursClose,
      JSON.stringify(next.specialties),
      JSON.stringify(next.credentials),
      next.serviceArea,
      next.yearsWrenching,
      next.address,
    ],
  );
  try {
    await sql.query("update mh_users set block_after_hours = $2 where id = $1", [user.id, blockAfterHours]);
  } catch {
    /* column arrives after 0012 */
  }
  const fresh = (await loadBoard()).users.find((u) => u.id === userId);
  if (!fresh) return { ok: false as const, error: "Account not found." };
  const { pass: _p, ...rest } = fresh;
  return { ok: true as const, user: { ...rest, pass: "" } };
}

/** Customer / shop-tech account photo. Never writes mh_jobs or mh_shops. */
export async function updateUserPhoto(userId: string, profilePhoto: string) {
  const board = await loadBoard();
  const user = board.users.find((u) => u.id === userId);
  if (!user) return { ok: false as const, error: "Account not found." };
  if (user.role === "independent") {
    return updateIndependentProfile(userId, { profilePhoto });
  }
  if (user.role === "shop" && user.shopRole === "owner") {
    return updateShopProfile(userId, { profilePhoto });
  }
  const sql = await getSql();
  await sql.query("update mh_users set photo = $2 where id = $1", [user.id, String(profilePhoto || "")]);
  const fresh = (await loadBoard()).users.find((u) => u.id === userId);
  if (!fresh) return { ok: false as const, error: "Account not found." };
  const { pass: _p, ...rest } = fresh;
  return { ok: true as const, user: { ...rest, pass: "" } };
}

export async function addTechName(shopId: string, name: string) {
  const board = await loadBoard();
  const shop = board.shops.find((s) => s.id === shopId);
  if (!shop) return null;
  name = String(name || "").trim();
  if (name && !shop.techs.includes(name)) shop.techs.push(name);
  const sql = await getSql();
  await sql.query("update mh_shops set techs_json = $2 where id = $1", [shop.id, JSON.stringify(shop.techs)]);
  return shop;
}

async function insertJob(job: Job) {
  const sql = await getSql();
  await sql.query(
    `insert into mh_jobs (
      id, user_id, created_at, provider_id, provider_type, provider_name, assigned_to,
      name, phone, email, year, make, model, symptoms, slot, status, notes_json
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      job.id,
      job.userId || null,
      job.createdAt,
      job.providerId,
      job.providerType,
      job.providerName,
      job.assignedTo || "",
      job.name,
      job.phone,
      job.email,
      job.year,
      job.make,
      job.model,
      normalizeSymptoms(job.symptoms),
      job.slot,
      job.status,
      JSON.stringify(job.notes || []),
    ],
  );
  try {
    await sql.query("update mh_jobs set notify_sms = $2 where id = $1", [job.id, job.notifySms !== false]);
  } catch {
    /* column arrives after 0005 */
  }
  try {
    await sql.query("update mh_jobs set trim = $2 where id = $1", [job.id, job.trim || ""]);
  } catch {
    /* column arrives after 0006 */
  }
  try {
    await sql.query("update mh_jobs set ops_json = $2 where id = $1", [
      job.id,
      serializeJobOps(jobOpsOf(job)),
    ]);
  } catch {
    /* column arrives after 0014 */
  }
  try {
    await sql.query("update mh_jobs set vehicle_photo = $2, color = $3 where id = $1", [
      job.id,
      job.vehiclePhoto || "",
      job.color || "",
    ]);
  } catch {
    /* columns arrive after 0013 */
  }
  return applyOpsToJob(job, jobOpsOf(job));
}

export async function addJob(job: Job) {
  await ensureSeeded();
  job = { ...job, symptoms: normalizeSymptoms(job.symptoms) };
  const board = await loadBoard();
  const provider =
    board.shops.find((s) => s.id === job.providerId) || board.users.find((u) => u.id === job.providerId);
  const taken = slotTakenAmong(board.jobs, job.providerId, job.slot, blockHoursFromRecord(provider));
  if (taken) {
    return { ok: false as const, error: "That time is already booked. Pick another slot." };
  }
  const saved = await insertJob(job);
  return { ok: true as const, job: saved };
}

export async function updateJob(id: string, patch: Partial<Job> & { jobPhoto?: string }) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return null;
  const previous = job.status;
  const safe = sanitizeJobPatch(patch as Record<string, unknown>);
  if (safe.status) job.status = safe.status;
  if (safe.assignedTo !== undefined) job.assignedTo = safe.assignedTo;
  if (safe.jobPhoto !== undefined) Object.assign(job, withJobPhoto(job, safe.jobPhoto));
  if (safe.vehiclePhoto !== undefined) job.vehiclePhoto = safe.vehiclePhoto;
  if (safe.color !== undefined) job.color = safe.color;
  // Do not rewrite notes_json here — addNote is the only writer for ticket notes.
  const sql = await getSql();
  await sql.query(
    `update mh_jobs set
      assigned_to = $2, status = $3, provider_name = $4
     where id = $1`,
    [job.id, job.assignedTo || "", job.status, job.providerName],
  );
  if (safe.jobPhoto !== undefined) {
    try {
      await sql.query("update mh_jobs set photo = $2 where id = $1", [job.id, safe.jobPhoto]);
    } catch {
      /* 0007 */
    }
  }
  if (safe.vehiclePhoto !== undefined || safe.color !== undefined) {
    try {
      await sql.query("update mh_jobs set vehicle_photo = $2, color = $3 where id = $1", [
        job.id,
        job.vehiclePhoto || "",
        job.color || "",
      ]);
    } catch {
      /* 0013 */
    }
  }
  if (safe.status && safe.status !== previous) {
    const owner = job.userId ? board.users.find((u) => u.id === job.userId) : undefined;
    const token = owner?.alertsOn === false ? "" : owner?.pushToken || "";
    try {
      const { pingJob } = await import("./notify.server");
      await pingJob(job, previous, token);
    } catch {
      /* preview without Twilio/FCM is fine */
    }
  }
  return job;
}

export async function savePushToken(userId: string, token: string, alertsOn: boolean) {
  const sql = await getSql();
  await sql.query("update mh_users set push_token = $2, alerts_on = $3 where id = $1", [
    userId,
    String(token || ""),
    alertsOn,
  ]);
  const board = await loadBoard();
  const user = board.users.find((u) => u.id === userId);
  if (!user) return { ok: false as const, error: "Account not found." };
  const { pass: _p, ...rest } = user;
  return { ok: true as const, user: { ...rest, pass: "", pushToken: token, alertsOn } };
}

export async function addNote(id: string, text: string, by = "shop") {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return null;
  const noteText = String(text || "").trim();
  if (!noteText) return job;
  // Write notes_json directly. Do not go through updateJob / sanitizeJobPatch —
  // that photo-slot sanitizer drops `notes`, so status auto-notes and Post update
  // never persisted after profile/bay photo separation.
  job.notes = appendJobNote(job.notes, noteText, by);
  const sql = await getSql();
  await sql.query("update mh_jobs set notes_json = $2 where id = $1", [
    job.id,
    JSON.stringify(job.notes),
  ]);
  return job;
}

export async function declineJob(id: string, reason = "") {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const result = applyDecline(job, reason);
  if (!result.ok) return result;
  const sql = await getSql();
  await sql.query("update mh_jobs set status = $2, notes_json = $3 where id = $1", [
    job.id,
    result.job.status,
    JSON.stringify(result.job.notes),
  ]);
  job.status = result.job.status;
  job.notes = result.job.notes;
  let mail: "sent" | "skip" | "fail" = "skip";
  if (result.mail.send) {
    try {
      const sent = await sendEmail({
        to: result.mail.to,
        subject: result.mail.subject,
        text: result.mail.text,
      });
      mail = sent.ok ? "sent" : sent.skipped ? "skip" : "fail";
    } catch {
      mail = "skip";
    }
  }
  return { ok: true as const, job, mail };
}

export async function cancelJob(id: string, actorUserId: string) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!actor || !customerOwnsJob(actor, job)) {
    return { ok: false as const, error: "You can only cancel your own appointment." };
  }
  const result = applyCancel(job);
  if (!result.ok) return result;
  const sql = await getSql();
  await sql.query("update mh_jobs set status = $2, notes_json = $3 where id = $1", [
    job.id,
    result.job.status,
    JSON.stringify(result.job.notes),
  ]);
  return { ok: true as const, job: result.job };
}

export async function rescheduleJob(id: string, slotIso: string, actorUserId: string) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!actor || !customerOwnsJob(actor, job)) {
    return { ok: false as const, error: "You can only reschedule your own appointment." };
  }
  if (!canCustomerCancel(job.status)) {
    return { ok: false as const, error: RESCHEDULE_CLOSED };
  }
  if (!canManageAppointment(job)) {
    return { ok: false as const, error: CANCEL_TOO_LATE };
  }
  const when = new Date(slotIso);
  if (!Number.isFinite(when.getTime()) || when.getTime() < Date.now()) {
    return { ok: false as const, error: "Pick a valid upcoming time." };
  }
  const slot = when.toISOString();
  const others = board.jobs.filter((j) => j.id !== job.id);
  if (slotTakenAmong(others, job.providerId, slot)) {
    return { ok: false as const, error: "That time is already booked. Pick another slot." };
  }
  const notes = appendJobNote(job.notes, RESCHEDULE_NOTE, "customer");
  const sql = await getSql();
  await sql.query("update mh_jobs set slot = $2, status = $3, notes_json = $4 where id = $1", [
    job.id,
    slot,
    "scheduled",
    JSON.stringify(notes),
  ]);
  return { ok: true as const, job: { ...job, slot, status: "scheduled" as const, notes } };
}

function providerOwnsJob(user: User | undefined, job: Job): boolean {
  if (!user) return false;
  if (user.role === "independent") return job.providerId === user.id;
  if (user.role === "shop") return !!user.shopId && job.providerId === user.shopId;
  return false;
}

async function persistOps(job: Job) {
  const sql = await getSql();
  try {
    await sql.query("update mh_jobs set ops_json = $2 where id = $1", [
      job.id,
      serializeJobOps(jobOpsOf(job)),
    ]);
  } catch {
    /* column arrives after 0014 */
  }
}

async function persistNotes(job: Job) {
  const sql = await getSql();
  await sql.query("update mh_jobs set notes_json = $2 where id = $1", [
    job.id,
    JSON.stringify(job.notes || []),
  ]);
}

function withNote(job: Job, text: string, by: string, at = Date.now()): Job {
  return { ...job, notes: appendJobNote(job.notes, text, by, at) };
}

export async function saveJobOps(
  id: string,
  patch: Partial<Pick<Job, "symptomPhoto" | "estimate" | "parts" | "statusBefore" | "flaggedForOwner" | "invoice">>,
  actorUserId: string,
) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!providerOwnsJob(actor, job)) {
    return { ok: false as const, error: "Please sign in again." };
  }
  const nextOps = mergeJobOps(jobOpsOf(job), patch);
  const next = applyOpsToJob(job, nextOps);
  Object.assign(job, next);
  await persistOps(job);
  return { ok: true as const, job };
}

export async function saveInvoice(
  id: string,
  draft: { lines: NonNullable<Job["invoice"]>["lines"]; taxPct: number; note: string; paid: boolean },
  actorUserId: string,
) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!providerOwnsJob(actor, job)) {
    return { ok: false as const, error: "Please sign in again." };
  }
  const check = canShareInvoice(draft.lines);
  if (!check.ok) return { ok: false as const, error: check.error };
  const shop = board.shops.find((s) => s.id === job.providerId);
  const indy = board.users.find((u) => u.id === job.providerId);
  const code = shop?.code || indy?.code || "";
  const used = board.jobs.filter((j) => j.providerId === job.providerId).map((j) => j.invoice?.number);
  const number = job.invoice?.number || nextInvoiceNumber(code, used);
  const invoice = draftInvoice(number, {
    lines: draft.lines,
    taxPct: draft.taxPct,
    note: draft.note,
    paid: draft.paid,
    createdAt: job.invoice?.createdAt,
  });
  const nextOps = mergeJobOps(jobOpsOf(job), { invoice });
  const next = applyOpsToJob(job, nextOps);
  Object.assign(job, next);
  Object.assign(job, withNote(job, invoiceNoteText(invoice), "shop"));
  await persistOps(job);
  await persistNotes(job);
  return { ok: true as const, job };
}

export async function setJobStatus(
  id: string,
  status: Job["status"],
  actorUserId: string,
  opts?: { skipEstimate?: boolean },
) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!providerOwnsJob(actor, job)) {
    return { ok: false as const, error: "Please sign in again." };
  }
  if (!isJobStatus(status)) {
    return { ok: false as const, error: "Job not found." };
  }
  if (status === job.status) return { ok: true as const, job };

  if (status === "repair" && !canEnterRepair(job.estimate)) {
    if (!opts?.skipEstimate) {
      return { ok: false as const, error: REPAIR_NEEDS_ESTIMATE };
    }
    job.estimate = applySkipEstimate();
    Object.assign(job, applyOpsToJob(job, mergeJobOps(jobOpsOf(job), { estimate: job.estimate })));
    Object.assign(job, withNote(job, ESTIMATE_SKIPPED_NOTE, "system"));
    await persistNotes(job);
  }

  const previous = job.status;
  const changed = applyStatusChange(job, status);
  job.status = changed.status;
  job.statusBefore = changed.statusBefore;
  Object.assign(job, applyOpsToJob(job, mergeJobOps(jobOpsOf(job), { statusBefore: job.statusBefore })));
  const sql = await getSql();
  await sql.query("update mh_jobs set status = $2 where id = $1", [job.id, job.status]);
  await persistOps(job);

  const token = job.userId
    ? board.users.find((u) => u.id === job.userId)?.alertsOn === false
      ? ""
      : board.users.find((u) => u.id === job.userId)?.pushToken || ""
    : "";
  try {
    const { pingJob } = await import("./notify.server");
    await pingJob(job, previous, token);
  } catch {
    /* preview without Twilio/FCM is fine */
  }
  return { ok: true as const, job };
}

export async function undoJobStatus(id: string, actorUserId: string) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!providerOwnsJob(actor, job)) {
    return { ok: false as const, error: "Please sign in again." };
  }
  const result = applyStatusUndo(job);
  if (!result.ok) return result;
  job.status = result.job.status as Job["status"];
  job.statusBefore = undefined;
  Object.assign(job, applyOpsToJob(job, mergeJobOps(jobOpsOf(job), { statusBefore: undefined })));
  const sql = await getSql();
  await sql.query("update mh_jobs set status = $2 where id = $1", [job.id, job.status]);
  await persistOps(job);
  return { ok: true as const, job };
}

export async function saveEstimate(id: string, amountRaw: string, note: string, actorUserId: string) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!providerOwnsJob(actor, job)) {
    return { ok: false as const, error: "Please sign in again." };
  }
  const amount = parseEstimateAmount(amountRaw);
  if (amount == null) return { ok: false as const, error: ESTIMATE_INVALID };
  job.estimate = applyEstimateSend(amount, note);
  Object.assign(job, applyOpsToJob(job, mergeJobOps(jobOpsOf(job), { estimate: job.estimate })));
  Object.assign(job, withNote(job, estimateNoteText(job.estimate), "shop"));
  await persistOps(job);
  await persistNotes(job);
  return { ok: true as const, job };
}

export async function decideEstimate(id: string, approved: boolean, actorUserId: string) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!actor || !customerOwnsJob(actor, job)) {
    return { ok: false as const, error: "Please sign in again." };
  }
  if (!canCustomerDecideEstimate(job.estimate)) {
    return { ok: false as const, error: ESTIMATE_NOT_PENDING };
  }
  job.estimate = applyEstimateDecision(job.estimate!, approved);
  Object.assign(job, applyOpsToJob(job, mergeJobOps(jobOpsOf(job), { estimate: job.estimate })));
  Object.assign(job, withNote(job, approved ? ESTIMATE_APPROVED_NOTE : ESTIMATE_DECLINED_NOTE, "customer"));
  await persistOps(job);
  await persistNotes(job);
  return { ok: true as const, job };
}

export async function skipEstimate(id: string, actorUserId: string) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!providerOwnsJob(actor, job)) {
    return { ok: false as const, error: "Please sign in again." };
  }
  job.estimate = applySkipEstimate();
  Object.assign(job, applyOpsToJob(job, mergeJobOps(jobOpsOf(job), { estimate: job.estimate })));
  Object.assign(job, withNote(job, ESTIMATE_SKIPPED_NOTE, "system"));
  await persistOps(job);
  await persistNotes(job);
  return { ok: true as const, job };
}

export async function saveParts(id: string, eta: string, note: string, ordered: boolean, actorUserId: string) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!providerOwnsJob(actor, job)) {
    return { ok: false as const, error: "Please sign in again." };
  }
  job.parts = applyParts(eta, note, ordered);
  Object.assign(job, applyOpsToJob(job, mergeJobOps(jobOpsOf(job), { parts: job.parts })));
  Object.assign(job, withNote(job, partsNoteText(job.parts), "shop"));
  await persistOps(job);
  await persistNotes(job);
  return { ok: true as const, job };
}

export async function flagJob(id: string, flagged: boolean, actorUserId: string) {
  const board = await loadBoard();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return { ok: false as const, error: "Job not found." };
  const actor = board.users.find((u) => u.id === actorUserId);
  if (!providerOwnsJob(actor, job) || !isShopTechnician(actor)) {
    return { ok: false as const, error: "Please sign in again." };
  }
  job.flaggedForOwner = flagged;
  Object.assign(job, applyOpsToJob(job, mergeJobOps(jobOpsOf(job), { flaggedForOwner: flagged })));
  Object.assign(job, withNote(job, flagged ? FLAG_NOTE : UNFLAG_NOTE, "internal"));
  await persistOps(job);
  await persistNotes(job);
  return { ok: true as const, job };
}

export function jobCode() {
  return "MH-" + Math.floor(1000 + Math.random() * 9000);
}

export async function deleteAccount(userId: string, password: string) {
  const board = await loadBoard();
  const user = board.users.find((u) => u.id === userId);
  if (!user) return { ok: false as const, error: "Account not found." };
  if (!verifyPassword(password, user.pass).ok) {
    return { ok: false as const, error: "Password is wrong." };
  }
  const sql = await getSql();
  if (user.role === "shop" && user.shopRole === "owner" && user.shopId) {
    await sql.query("delete from mh_shops where id = $1", [user.shopId]);
    await sql.query("update mh_users set shop_id = null, shop_name = null, shop_role = null where shop_id = $1", [
      user.shopId,
    ]);
  }
  await sql.query("delete from mh_users where id = $1", [user.id]);
  return { ok: true as const };
}
