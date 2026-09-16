export type Role = "customer" | "shop" | "independent";

export type StatusId =
  | "scheduled"
  | "enroute"
  | "checkedin"
  | "diagnosing"
  | "parts"
  | "repair"
  | "ready"
  | "done";

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
};

export type Shop = {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  techs: string[];
  bio?: string;
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
  phone: string;
  email: string;
  year: string;
  make: string;
  model: string;
  symptoms: string;
  slot: string;
  status: StatusId;
  notes: Note[];
};

export type Provider = {
  id: string;
  type: "shop" | "independent";
  name: string;
  detail: string;
  code: string;
  bio: string;
};

export const BIO_MAX = 320;

const RIVERSIDE_BIO =
  "Family-run shop since 1998. Brakes, engines, and same-day diagnostics. We text you before we turn a wrench.";
const LEON_BIO =
  "I come to your driveway. Scan tools, common parts, and straight talk. Nights and weekends if the car is down.";

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
];

type DB = { shops: Shop[]; users: User[]; jobs: Job[] };

const KEY = "mechanicshelper.v4";
const SESSION = "mh.session";
const REF = "mh.ref";

function passHash(s: string) {
  let h = 2166136261;
  const str = "mh|" + String(s || "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function slotDays(days: number, hhmm: string) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function shopCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function defaultShops(): Shop[] {
  return [
    {
      id: "s-main",
      name: "Riverside Auto",
      code: "RIV4",
      ownerId: "u-shop",
      techs: ["Shop Desk", "Alex Ruiz"],
      bio: RIVERSIDE_BIO,
    },
  ];
}

function defaultUsers(): User[] {
  return [
    {
      id: "u-maya",
      name: "Maya Chen",
      email: "maya@example.com",
      phone: "5550148821",
      role: "customer",
      pass: passHash("demo123"),
    },
    {
      id: "u-shop",
      name: "Shop Desk",
      email: "shop@example.com",
      phone: "5550100000",
      role: "shop",
      shopId: "s-main",
      shopName: "Riverside Auto",
      shopRole: "owner",
      pass: passHash("demo123"),
    },
    {
      id: "u-alex",
      name: "Alex Ruiz",
      email: "alex@example.com",
      phone: "5550100001",
      role: "shop",
      shopId: "s-main",
      shopName: "Riverside Auto",
      shopRole: "tech",
      pass: passHash("demo123"),
    },
    {
      id: "u-indy",
      name: "Leon Miles",
      email: "indy@example.com",
      phone: "5550166000",
      role: "independent",
      businessName: "Leon Mobile Repair",
      serviceMode: "mobile",
      code: "LEON",
      bio: LEON_BIO,
      pass: passHash("demo123"),
    },
  ];
}

function seed(): DB {
  const now = Date.now();
  const data: DB = {
    shops: defaultShops(),
    users: defaultUsers(),
    jobs: [
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
        symptoms: "Check engine light. Rough idle after warmup.",
        slot: slotDays(0, "11:30"),
        status: "diagnosing",
        notes: [
          { at: now - 3600000 * 5, text: "Booked online.", by: "system" },
          {
            at: now - 3600000,
            text: "Pulled codes P0302. Checking coil pack and injector.",
            by: "shop",
          },
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
        symptoms: "Oil change and 30k service.",
        slot: slotDays(0, "08:00"),
        status: "ready",
        notes: [
          { at: now - 86400000, text: "Booked online.", by: "system" },
          { at: now - 3600000 * 2, text: "Service complete. Cabin filter replaced.", by: "shop" },
        ],
      },
    ],
  };
  save(data);
  return data;
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const data = JSON.parse(raw) as DB;
    if (!data.jobs) return seed();
    if (!data.users?.length) data.users = defaultUsers();
    if (!data.shops?.length) data.shops = defaultShops();
    for (const u of data.users) {
      if (u.role === "independent" && !u.code) u.code = uniqueCode(data);
    }
    for (const s of data.shops) {
      if (typeof s.bio !== "string") s.bio = s.id === "s-main" ? RIVERSIDE_BIO : "";
    }
    for (const u of data.users) {
      if (u.role === "independent" && typeof u.bio !== "string") {
        u.bio = u.id === "u-indy" ? LEON_BIO : "";
      }
    }
    save(data);
    return data;
  } catch {
    return seed();
  }
}

function save(data: DB) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function uniqueCode(data: DB) {
  const used = new Set<string>();
  for (const s of data.shops) used.add(s.code);
  for (const u of data.users) if (u.code) used.add(u.code);
  let c = shopCode();
  while (used.has(c)) c = shopCode();
  return c;
}

export function publicUser(u: User): User {
  const { pass: _p, ...rest } = u;
  return { ...rest, pass: "" };
}

export const Store = {
  load,
  passHash: (s: string) => passHash(s),

  getSession(): User | null {
    try {
      const raw = localStorage.getItem(SESSION);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      const fresh = load().users.find((u) => u.id === parsed.id);
      return fresh ? publicUser(fresh) : parsed;
    } catch {
      return null;
    }
  },

  setSession(user: User | null) {
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

  findUser(emailOrPhone: string) {
    const q = String(emailOrPhone || "").trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return (
      load().users.find((u) => {
        if ((u.email || "").toLowerCase() === q) return true;
        const ph = (u.phone || "").replace(/\D/g, "");
        return digits.length >= 4 && ph === digits;
      }) || null
    );
  },

  login(emailOrPhone: string, password: string) {
    const user = this.findUser(emailOrPhone);
    if (!user || user.pass !== passHash(password)) {
      return { ok: false as const, error: "Email/phone or password is wrong." };
    }
    this.setSession(user);
    return { ok: true as const, user: publicUser(user) };
  },

  logout() {
    this.setSession(null);
  },

  register(fields: {
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
  }) {
    const data = load();
    const emailL = (fields.email || "").trim().toLowerCase();
    const phoneD = String(fields.phone || "").replace(/\D/g, "");
    if (!fields.name || !fields.password || (!emailL && !phoneD)) {
      return { ok: false as const, error: "Name, password, and email or phone are required." };
    }
    if (fields.password.length < 6) {
      return { ok: false as const, error: "Password must be at least 6 characters." };
    }
    if (this.findUser(emailL || phoneD)) {
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
      pass: passHash(fields.password),
    };
    if (role === "shop") {
      if (fields.shopJoin === "join") {
        const code = String(fields.shopCode || "").trim().toUpperCase();
        const shop = data.shops.find((s) => s.code === code);
        if (!shop) return { ok: false as const, error: "No shop with that code." };
        user.shopId = shop.id;
        user.shopName = shop.name;
        user.shopRole = "tech";
        if (!shop.techs.includes(user.name)) shop.techs.push(user.name);
      } else {
        const shopName = String(fields.shopName || "").trim() || user.name + "'s Shop";
        const shop: Shop = {
          id: "s-" + Math.random().toString(36).slice(2, 7),
          name: shopName,
          code: uniqueCode(data),
          ownerId: user.id,
          techs: [user.name],
          bio: "",
        };
        data.shops.push(shop);
        user.shopId = shop.id;
        user.shopName = shop.name;
        user.shopRole = "owner";
      }
    }
    if (role === "independent") {
      user.businessName = String(fields.businessName || "").trim() || user.name;
      user.serviceMode = fields.serviceMode || "both";
      user.code = uniqueCode(data);
      user.bio = "";
    }
    data.users.push(user);
    save(data);
    this.setSession(user);
    return { ok: true as const, user: publicUser(user) };
  },

  listProviders(): Provider[] {
    const data = load();
    const shops = data.shops.map((s) => ({
      id: s.id,
      type: "shop" as const,
      name: s.name,
      detail: "Repair shop",
      code: s.code,
      bio: s.bio || "",
    }));
    const indy = data.users
      .filter((u) => u.role === "independent")
      .map((u) => ({
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
      }));
    return [...shops, ...indy];
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
    if (user.role === "independent") return user.code || "";
    return "";
  },

  rotateCustomerCode(user: User) {
    const data = load();
    const next = uniqueCode(data);
    if (user.role === "shop" && user.shopId) {
      const shop = data.shops.find((s) => s.id === user.shopId);
      if (!shop) return "";
      shop.code = next;
      save(data);
      return next;
    }
    if (user.role === "independent") {
      const u = data.users.find((x) => x.id === user.id);
      if (!u) return "";
      u.code = next;
      save(data);
      this.setSession(u);
      return next;
    }
    return "";
  },

  providerJobs(user: User | null) {
    const data = load();
    if (!user) return data.jobs;
    if (user.role === "shop") return data.jobs.filter((j) => j.providerId === user.shopId);
    if (user.role === "independent") return data.jobs.filter((j) => j.providerId === user.id);
    return data.jobs.filter(
      (j) => j.email === user.email || j.phone === user.phone || j.userId === user.id,
    );
  },

  shopRecord(shopId: string) {
    return load().shops.find((s) => s.id === shopId) || null;
  },

  updateShopProfile(user: User, patch: { name?: string; bio?: string }) {
    if (user.role !== "shop" || user.shopRole !== "owner" || !user.shopId) {
      return { ok: false as const, error: "Only the shop owner can edit this." };
    }
    const data = load();
    const shop = data.shops.find((s) => s.id === user.shopId);
    if (!shop) return { ok: false as const, error: "Shop not found." };
    if (patch.name !== undefined) {
      const name = String(patch.name).trim();
      if (!name) return { ok: false as const, error: "Shop name is required." };
      shop.name = name;
      for (const u of data.users) {
        if (u.shopId === shop.id) u.shopName = name;
      }
    }
    if (patch.bio !== undefined) shop.bio = String(patch.bio).trim().slice(0, BIO_MAX);
    save(data);
    const fresh = data.users.find((u) => u.id === user.id);
    if (fresh) this.setSession(fresh);
    return { ok: true as const, user: fresh ? publicUser(fresh) : publicUser(user) };
  },

  updateIndependentProfile(
    user: User,
    patch: { businessName?: string; bio?: string; serviceMode?: User["serviceMode"] },
  ) {
    if (user.role !== "independent") {
      return { ok: false as const, error: "Only independents can edit this." };
    }
    const data = load();
    const u = data.users.find((x) => x.id === user.id);
    if (!u) return { ok: false as const, error: "Account not found." };
    if (patch.businessName !== undefined) {
      const name = String(patch.businessName).trim();
      if (!name) return { ok: false as const, error: "Business name is required." };
      u.businessName = name;
    }
    if (patch.bio !== undefined) u.bio = String(patch.bio).trim().slice(0, BIO_MAX);
    if (patch.serviceMode) u.serviceMode = patch.serviceMode;
    save(data);
    this.setSession(u);
    return { ok: true as const, user: publicUser(u) };
  },

  addTechName(shopId: string, name: string) {
    const data = load();
    const shop = data.shops.find((s) => s.id === shopId);
    if (!shop) return null;
    name = String(name || "").trim();
    if (name && !shop.techs.includes(name)) shop.techs.push(name);
    save(data);
    return shop;
  },

  jobCode() {
    return "MH-" + Math.floor(1000 + Math.random() * 9000);
  },

  addJob(job: Job) {
    const data = load();
    data.jobs.unshift(job);
    save(data);
    return job;
  },

  updateJob(id: string, patch: Partial<Job>) {
    const data = load();
    const j = data.jobs.find((x) => x.id === id);
    if (!j) return null;
    Object.assign(j, patch);
    save(data);
    return j;
  },

  addNote(id: string, text: string, by = "shop") {
    const data = load();
    const j = data.jobs.find((x) => x.id === id);
    if (!j) return null;
    j.notes = j.notes || [];
    j.notes.push({ at: Date.now(), text, by });
    save(data);
    return j;
  },

  findJobs(q: string, user: User | null) {
    const raw = String(q || "").trim().toUpperCase();
    const digits = raw.replace(/\D/g, "");
    let jobs = load().jobs;
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
};

export function statusMeta(id: string) {
  return STATUSES.find((s) => s.id === id) || STATUSES[0];
}

export function fmtWhen(iso: string, locale?: string) {
  return new Date(iso).toLocaleString(locale || undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtShort(isoOrMs: string | number, locale?: string) {
  return new Date(isoOrMs).toLocaleString(locale || undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function vehicleLabel(j: { year: string; make: string; model: string }) {
  return `${j.year} ${j.make} ${j.model}`;
}
