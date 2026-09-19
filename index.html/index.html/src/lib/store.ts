import {
  mhAddJob,
  mhAddNote,
  mhDeclineJob,
  mhAddTech,
  mhBoard,
  mhLogin,
  mhRecoverUsername,
  mhRegister,
  mhRequestPasswordReset,
  mhResetPassword,
  mhRotateCode,
  mhClaimCode,
  mhUpdateIndy,
  mhUpdateJob,
  mhUpdateUserPhoto,
  mhDeleteAccount,
  mhSavePush,
  mhUpdateShop,
} from "@/lib/mh-api";
import { jobPhotoOf, profilePhotoOf, resizePhoto, sanitizeJobPatch, withJobPhoto } from "@/lib/photos";
import { publicProfileFromRecord, type PublicProfileFields } from "@/lib/shop-profile";
import {
  addSavedVehicle,
  mergeCustomerVehicles,
  readSavedVehicles,
  type VehicleFields,
} from "@/lib/customer-vehicles";
import { TIME_12H } from "@/lib/i18n";
import { blockHoursFromRecord, normalizeBlockAfterHours, type BlockAfterHours } from "./booking-block.ts";
import { slotTakenAmong, type JobStatusId } from "./job-status.ts";

export { resizePhoto };

export type Role = "customer" | "shop" | "independent";

export type StatusId = JobStatusId;

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  pass: string;
  shopId?: string;
  shopName?: string;
  shopRole?: "owner" | "tech";
  businessName?: string;
  serviceMode?: "mobile" | "shop" | "both";
  code?: string;
  bio?: string;
  photo?: string;
  supportEmail?: string;
  supportPhone?: string;
  pushToken?: string;
  alertsOn?: boolean;
  hoursDays?: string;
  hoursOpen?: string;
  hoursClose?: string;
  /** Owner job length. Shop techs inherit the shop value. Default 3. */
  blockAfterHours?: BlockAfterHours;
  specialties?: string[];
  credentials?: string[];
  serviceArea?: string;
  yearsWrenching?: string;
  address?: string;
};

export type Shop = {
  id: string;
  name: string;
  code: string;
  /** Employee invite — never the same value as `code` (customer find). */
  joinCode?: string;
  ownerId: string;
  techs: string[];
  bio?: string;
  photo?: string;
  supportEmail?: string;
  supportPhone?: string;
  hoursDays?: string;
  hoursOpen?: string;
  hoursClose?: string;
  blockAfterHours?: BlockAfterHours;
  specialties?: string[];
  credentials?: string[];
  serviceArea?: string;
  yearsWrenching?: string;
  address?: string;
};

export type Note = { at: number; text: string; by: string };

export type Job = {
  id: string;
  userId?: string;
  createdAt: number;
  providerId: string;
  providerType: "shop" | "independent";
  providerName: string;
  assignedTo?: string;
  name: string;
  email: string;
  phone: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
  symptoms: string;
  slot: string;
  status: StatusId;
  notes: Note[];
  notifySms?: boolean;
  /** @deprecated Use jobPhoto. Kept in sync for older tickets. */
  photo?: string;
  /** Bay / job-ticket media. Never the account profile photo. */
  jobPhoto?: string;
};

export type Provider = {
  id: string;
  type: "shop" | "independent";
  name: string;
  detail: string;
  code: string;
  bio: string;
  photo?: string;
  supportEmail?: string;
  supportPhone?: string;
  hoursDays?: string;
  hoursOpen?: string;
  hoursClose?: string;
  hoursLabel?: string;
  blockAfterHours?: BlockAfterHours;
  specialties?: string[];
  credentials?: string[];
  serviceArea?: string;
  yearsWrenching?: string;
  address?: string;
};

function withPublicProfile<T extends object>(row: T, extra?: Partial<PublicProfileFields>): T & PublicProfileFields {
  return { ...row, ...publicProfileFromRecord({ ...row, ...extra }) };
}

export const BIO_MAX = 320;

export const DAY_BITS = [
  { bit: "0", label: "Sun" },
  { bit: "1", label: "Mon" },
  { bit: "2", label: "Tue" },
  { bit: "3", label: "Wed" },
  { bit: "4", label: "Thu" },
  { bit: "5", label: "Fri" },
  { bit: "6", label: "Sat" },
];

export function hoursLabel(h?: { hoursDays?: string; hoursOpen?: string; hoursClose?: string }) {
  const days = h?.hoursDays || "123456";
  const open = h?.hoursOpen || "08:00";
  const close = h?.hoursClose || "16:00";
  const names = DAY_BITS.filter((d) => days.includes(d.bit)).map((d) => d.label);
  const dayPart =
    names.length === 7
      ? "Every day"
      : names.length === 5 && days === "12345"
        ? "Mon–Fri"
        : names.length === 6 && days === "123456"
          ? "Mon–Sat"
          : names.length
            ? names.join(" · ")
            : "Closed";
  const fmt = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    const am = hh < 12;
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${String(mm || 0).padStart(2, "0")} ${am ? "AM" : "PM"}`;
  };
  return `${dayPart} · ${fmt(open)} – ${fmt(close)}`;
}

function mins(t: string) {
  const [h, m] = String(t || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function slotInHours(d: Date, h?: { hoursDays?: string; hoursOpen?: string; hoursClose?: string }) {
  const days = h?.hoursDays || "123456";
  if (!days.includes(String(d.getDay()))) return false;
  const t = d.getHours() * 60 + d.getMinutes();
  return t >= mins(h?.hoursOpen || "08:00") && t <= mins(h?.hoursClose || "16:00");
}

export const STATUSES: {
  id: StatusId;
  label: string;
  customer: string;
  badge: string;
}[] = [
  { id: "scheduled", label: "Scheduled", customer: "Appointment booked", badge: "scheduled" },
  { id: "enroute", label: "On the way", customer: "Mechanic is heading to you", badge: "enroute" },
  { id: "checkedin", label: "Checked in", customer: "Vehicle is with the mechanic", badge: "checkedin" },
  { id: "diagnosing", label: "Diagnosing", customer: "Technician is inspecting the vehicle", badge: "diagnosing" },
  { id: "parts", label: "Waiting on parts", customer: "Parts ordered — we'll update when they arrive", badge: "parts" },
  { id: "repair", label: "In repair", customer: "Work is underway", badge: "repair" },
  { id: "ready", label: "Ready for pickup", customer: "Your vehicle is ready", badge: "ready" },
  { id: "done", label: "Completed", customer: "Picked up — thank you", badge: "done" },
  { id: "declined", label: "Declined", customer: "The shop declined this booking", badge: "declined" },
];

type DB = { shops: Shop[]; users: User[]; jobs: Job[] };

const SESSION = "mh.session";
const REF = "mh.ref";
const LINKED = "mh.linked.";
const UNLINKED = "-";

let cache: DB = { shops: [], users: [], jobs: [] };
let hydrated = false;
let hydratePromise: Promise<DB> | null = null;

export function publicUser(u: User): User {
  const { pass: _p, ...rest } = u;
  return { ...rest, pass: "" };
}

function providersFrom(data: DB): Provider[] {
  const shops = data.shops.map((s) =>
    withPublicProfile({
      id: s.id,
      type: "shop" as const,
      name: s.name,
      detail: "Repair shop",
      code: s.code,
      bio: s.bio || "",
      photo: s.photo || "",
      supportEmail: s.supportEmail || "",
      supportPhone: s.supportPhone || "",
      hoursDays: s.hoursDays || "123456",
      hoursOpen: s.hoursOpen || "08:00",
      hoursClose: s.hoursClose || "16:00",
      hoursLabel: hoursLabel(s),
      blockAfterHours: normalizeBlockAfterHours(s.blockAfterHours),
    }, s),
  );
  const indy = data.users
    .filter((u) => u.role === "independent")
    .map((u) =>
      withPublicProfile({
        id: u.id,
        type: "independent" as const,
        name: u.businessName || u.name,
        detail:
          u.serviceMode === "mobile"
            ? "Mobile mechanic"
            : u.serviceMode === "shop"
              ? "Independent shop"
              : "Mobile or drop-off",
        code: u.code || "",
        bio: u.bio || "",
        photo: u.photo || "",
        supportEmail: u.supportEmail || "",
        supportPhone: u.supportPhone || "",
        hoursDays: u.hoursDays || "123456",
        hoursOpen: u.hoursOpen || "08:00",
        hoursClose: u.hoursClose || "16:00",
        hoursLabel: hoursLabel(u),
        blockAfterHours: normalizeBlockAfterHours(u.blockAfterHours),
      }, u),
    );
  return [...shops, ...indy];
}

export const Store = {
  ready: () => hydrated,

  async hydrate() {
    if (hydratePromise) return hydratePromise;
    hydratePromise = mhBoard()
      .then((data) => {
        cache = {
          shops: data.shops,
          users: data.users.map((u) => publicUser(u)),
          jobs: data.jobs,
        };
        hydrated = true;
        return cache;
      })
      .finally(() => {
        hydratePromise = null;
      });
    return hydratePromise;
  },

  load(): DB {
    return cache;
  },

  getSession(): User | null {
    try {
      const raw = localStorage.getItem(SESSION);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      const fresh = cache.users.find((u) => u.id === parsed.id);
      return fresh ? publicUser(fresh) : parsed;
    } catch {
      return null;
    }
  },

  setSession(user: User | null) {
    if (typeof localStorage === "undefined") return;
    if (!user) localStorage.removeItem(SESSION);
    else localStorage.setItem(SESSION, JSON.stringify(publicUser(user)));
  },

  getRefCode() {
    try {
      return localStorage.getItem(REF) || "";
    } catch {
      return "";
    }
  },

  setRefCode(code: string) {
    const c = String(code || "").trim().toUpperCase();
    if (!c) localStorage.removeItem(REF);
    else localStorage.setItem(REF, c);
  },

  getLinkedCode(user: User | null) {
    try {
      if (user?.id) {
        const saved = localStorage.getItem(LINKED + user.id) || "";
        if (saved === UNLINKED) return "";
        if (saved) return saved;
      }
      return this.getRefCode();
    } catch {
      return this.getRefCode();
    }
  },

  wasUnlinked(user: User | null) {
    try {
      return !!user?.id && localStorage.getItem(LINKED + user.id) === UNLINKED;
    } catch {
      return false;
    }
  },

  setLinkedCode(user: User | null, code: string) {
    const c = String(code || "").trim().toUpperCase();
    this.setRefCode(c);
    try {
      if (!user?.id) return;
      if (!c) localStorage.setItem(LINKED + user.id, UNLINKED);
      else localStorage.setItem(LINKED + user.id, c);
    } catch {
      /* ignore quota / private mode */
    }
  },

  listProviders(): Provider[] {
    return providersFrom(cache);
  },

  findProviderByCode(code: string): Provider | null {
    const c = String(code || "").trim().toUpperCase();
    if (!c) return null;
    return this.listProviders().find((p) => p.code === c) || null;
  },

  customerCodeFor(user: User | null): string {
    if (!user) return "";
    if (user.role === "shop" && user.shopId) {
      return this.shopRecord(user.shopId)?.code || "";
    }
    if (user.role === "independent") {
      const fresh = cache.users.find((u) => u.id === user.id);
      return fresh?.code || user.code || "";
    }
    return "";
  },

  teamJoinCodeFor(user: User | null): string {
    if (!user || user.role !== "shop" || !user.shopId) return "";
    return this.shopRecord(user.shopId)?.joinCode || "";
  },

  shopRecord(shopId: string) {
    return cache.shops.find((s) => s.id === shopId) || null;
  },

  customerVehicles(user: User | null): VehicleFields[] {
    if (!user || user.role !== "customer") return [];
    return mergeCustomerVehicles(this.providerJobs(user), readSavedVehicles(user.id));
  },

  addCustomerVehicle(user: User, vehicle: VehicleFields) {
    addSavedVehicle(user.id, vehicle);
    return this.customerVehicles(user);
  },

  providerJobs(user: User | null) {
    const jobs = cache.jobs;
    if (!user) return jobs;
    if (user.role === "shop") return jobs.filter((j) => j.providerId === user.shopId);
    if (user.role === "independent") return jobs.filter((j) => j.providerId === user.id);
    return jobs.filter(
      (j) => j.email === user.email || j.phone === user.phone || j.userId === user.id,
    );
  },

  slotTaken(providerId: string | undefined, slotIso: string) {
    return slotTakenAmong(cache.jobs, providerId, slotIso, this.blockHoursFor(providerId));
  },

  hoursFor(providerId: string | undefined) {
    if (!providerId) return undefined;
    const shop = cache.shops.find((s) => s.id === providerId);
    if (shop) return shop;
    const indy = cache.users.find((u) => u.id === providerId);
    return indy;
  },

  blockHoursFor(providerId: string | undefined) {
    return blockHoursFromRecord(this.hoursFor(providerId));
  },

  openSlots(providerId: string | undefined) {
    const hours = this.hoursFor(providerId);
    return slotsFromNow().filter(
      (d) => slotInHours(d, hours) && !this.slotTaken(providerId, d.toISOString()),
    );
  },

  weekSlotStates(providerId: string | undefined) {
    const hours = this.hoursFor(providerId);
    return slotsFromNow()
      .filter((d) => slotInHours(d, hours))
      .map((d) => {
        const iso = d.toISOString();
        return { date: d, iso, taken: this.slotTaken(providerId, iso) };
      });
  },

  findJobs(q: string, user: User | null) {
    const raw = String(q || "").trim().toUpperCase();
    const digits = raw.replace(/\D/g, "");
    let jobs = cache.jobs;
    if (user?.role === "customer") {
      jobs = jobs.filter(
        (j) => j.email === user.email || j.phone === user.phone || j.userId === user.id,
      );
    }
    return jobs.filter((j) => {
      if (j.id.toUpperCase() === raw) return true;
      const ph = (j.phone || "").replace(/\D/g, "");
      return digits.length >= 4 && (ph.endsWith(digits) || ph.includes(digits));
    });
  },

  jobCode() {
    return "MH-" + Math.floor(1000 + Math.random() * 9000);
  },

  async login(emailOrPhone: string, password: string) {
    const res = await mhLogin({ data: { id: emailOrPhone, password } });
    if (res.ok) {
      this.setSession(res.user);
      await this.hydrate();
    }
    return res;
  },

  requestPasswordReset(emailOrPhone: string) {
    return mhRequestPasswordReset({ data: { id: emailOrPhone } });
  },

  resetPassword(emailOrPhone: string, code: string, password: string) {
    return mhResetPassword({ data: { id: emailOrPhone, code, password } });
  },

  recoverUsername(emailOrPhone: string) {
    return mhRecoverUsername({ data: { id: emailOrPhone } });
  },

  logout() {
    this.setSession(null);
  },

  async saveAlerts(user: User, token: string, alertsOn: boolean) {
    const res = await mhSavePush({ data: { userId: user.id, token, alertsOn } });
    if (res.ok) this.setSession(res.user);
    return res;
  },

  async deleteAccount(user: User, password: string) {
    const res = await mhDeleteAccount({ data: { userId: user.id, password } });
    if (res.ok) this.setSession(null);
    return res;
  },

  async register(fields: {
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
    const res = await mhRegister({ data: fields });
    if (res.ok) {
      this.setSession(res.user);
      await this.hydrate();
    }
    return res;
  },

  async rotateCustomerCode(user: User) {
    const next = await mhRotateCode({ data: { userId: user.id } });
    await this.hydrate();
    const fresh = this.getSession();
    if (fresh) this.setSession(fresh);
    return next;
  },

  async claimCustomerCode(user: User, desired: string) {
    const res = await mhClaimCode({ data: { userId: user.id, desired } });
    await this.hydrate();
    const fresh = this.getSession();
    if (fresh) this.setSession(fresh);
    return res;
  },

  async updateShopProfile(
    user: User,
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
      blockAfterHours?: BlockAfterHours;
      specialties?: string[];
      credentials?: string[];
      serviceArea?: string;
      yearsWrenching?: string;
      address?: string;
    },
  ) {
    const profilePhoto = patch.profilePhoto !== undefined ? patch.profilePhoto : patch.photo;
    const res = await mhUpdateShop({
      data: {
        userId: user.id,
        ...patch,
        ...(profilePhoto !== undefined ? { profilePhoto, photo: profilePhoto } : { photo: undefined, profilePhoto: undefined }),
      },
    });
    if (res.ok) {
      this.setSession(res.user);
      await this.hydrate();
    }
    return res;
  },

  async updateIndependentProfile(
    user: User,
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
      blockAfterHours?: BlockAfterHours;
      specialties?: string[];
      credentials?: string[];
      serviceArea?: string;
      yearsWrenching?: string;
      address?: string;
    },
  ) {
    const profilePhoto = patch.profilePhoto !== undefined ? patch.profilePhoto : patch.photo;
    const res = await mhUpdateIndy({
      data: {
        userId: user.id,
        ...patch,
        ...(profilePhoto !== undefined ? { profilePhoto, photo: profilePhoto } : { photo: undefined, profilePhoto: undefined }),
      },
    });
    if (res.ok) {
      this.setSession(res.user);
      await this.hydrate();
    }
    return res;
  },

  /** Writes only mh_users.photo or mh_shops.photo — never a job/bay row. */
  async saveProfilePhoto(user: User, profilePhoto: string) {
    if (user.role === "shop" && user.shopRole === "owner") {
      return this.updateShopProfile(user, { profilePhoto });
    }
    if (user.role === "independent") {
      return this.updateIndependentProfile(user, { profilePhoto });
    }
    const res = await mhUpdateUserPhoto({ data: { userId: user.id, profilePhoto } });
    if (res.ok) {
      this.setSession(res.user);
      await this.hydrate();
    }
    return res;
  },

  profilePhoto(user: User | null) {
    if (!user) return "";
    const shop = user.shopId ? this.shopRecord(user.shopId) : null;
    return profilePhotoOf(user, shop);
  },

  jobPhoto(job: Job | null | undefined) {
    return jobPhotoOf(job);
  },

  async addTechName(shopId: string, name: string) {
    const shop = await mhAddTech({ data: { shopId, name } });
    await this.hydrate();
    return shop;
  },

  async addJob(job: Job) {
    const saved = await mhAddJob({ data: { job } });
    await this.hydrate();
    return saved;
  },

  async updateJob(id: string, patch: Partial<Job> & { jobPhoto?: string }) {
    const saved = await mhUpdateJob({
      data: { id, patch: sanitizeJobPatch(patch as Record<string, unknown>) },
    });
    await this.hydrate();
    return saved;
  },

  async saveJobPhoto(id: string, jobPhoto: string) {
    return this.updateJob(id, withJobPhoto({ jobPhoto: "", photo: "" }, jobPhoto));
  },

  async addNote(id: string, text: string, by = "shop") {
    const saved = await mhAddNote({ data: { id, text, by } });
    await this.hydrate();
    return saved;
  },

  async declineJob(id: string, reason = "") {
    const res = await mhDeclineJob({ data: { id, reason } });
    await this.hydrate();
    return res;
  },
};

export function slotsFromNow() {
  const out: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let d = 1; d <= 7; d++) {
    for (const t of ["08:00", "09:30", "11:00", "13:00", "14:30", "16:00"]) {
      const [h, m] = t.split(":").map(Number);
      const dt = new Date(start);
      dt.setDate(dt.getDate() + d);
      dt.setHours(h, m, 0, 0);
      if (dt.getDay() === 0) continue;
      out.push(dt);
    }
  }
  return out;
}

export function statusMeta(id: string) {
  return STATUSES.find((s) => s.id === id) || STATUSES[0];
}

export function fmtWhen(iso: string, locale?: string) {
  return new Date(iso).toLocaleString(locale || undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...TIME_12H,
  });
}

export function fmtShort(isoOrMs: string | number, locale?: string) {
  return new Date(isoOrMs).toLocaleString(locale || undefined, {
    month: "short",
    day: "numeric",
    ...TIME_12H,
  });
}

export function vehicleLabel(j: { year: string; make: string; model: string; trim?: string }) {
  const base = `${j.year} ${j.make} ${j.model}`.trim();
  const trim = String(j.trim || "").trim();
  return trim ? `${base} ${trim}` : base;
}
