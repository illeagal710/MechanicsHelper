import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarPlus,
  ClipboardList,
  House,
  MapPin,
  MessageCircle,
  QrCode,
  UserRound,
} from "lucide-react";
import { QrShare } from "@/components/qr-share";
import { greet, reply } from "@/lib/diagnose";
import {
  Store,
  BIO_MAX,
  type Job,
  type Provider,
  type Role,
  type User,
  fmtShort,
  fmtWhen,
  statusMeta,
  vehicleLabel,
} from "@/lib/store";
import { VEHICLE_DATA, YEARS, carImage, vehicleKind } from "@/lib/vehicles";

type View =
  | "welcome"
  | "login"
  | "register"
  | "home"
  | "book"
  | "confirm"
  | "track"
  | "job"
  | "diagnose"
  | "shopHome"
  | "shopJob"
  | "share"
  | "account";

function homeFor(role: Role): View {
  if (role === "shop" || role === "independent") return "shopHome";
  return "home";
}

function readRefFromUrl() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("ref") || "";
  return q.trim().toUpperCase();
}

function slots() {
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

export function MechanicsApp() {
  const [view, setView] = useState<View>("welcome");
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Job | null>(null);
  const [lockedProvider, setLockedProvider] = useState<Provider | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [tick, setTick] = useState(0);
  const bump = () => setTick((n) => n + 1);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function enter(u: User) {
    setUser(u);
    const next = homeFor(u.role);
    if (u.role === "customer" && lockedProvider) setView("book");
    else setView(next);
    flash("Hi " + u.name.split(" ")[0]);
  }

  useEffect(() => {
    const fromUrl = readRefFromUrl();
    if (fromUrl) Store.setRefCode(fromUrl);
    const code = fromUrl || Store.getRefCode();
    if (code) {
      const p = Store.findProviderByCode(code);
      if (p) setLockedProvider(p);
    }
    const s = Store.getSession();
    if (s) {
      setUser(s);
      setView(s.role === "customer" && Store.getRefCode() ? "book" : homeFor(s.role));
    }
  }, []);

  function applyCode(raw: string, goBook = true) {
    const p = Store.findProviderByCode(raw);
    if (!p) {
      flash("No shop or mechanic with that code.");
      return;
    }
    Store.setRefCode(p.code);
    setLockedProvider(p);
    flash("Found " + p.name);
    if (goBook && user?.role === "customer") setView("book");
  }

  const isProvider = user?.role === "shop" || user?.role === "independent";
  const shareCode = Store.customerCodeFor(user);
  const liveLocked = lockedProvider
    ? Store.findProviderByCode(lockedProvider.code) || lockedProvider
    : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-bg shadow-[0_0_0_1px_var(--color-line)]">
      <header className="flex items-center justify-between px-5 pt-3 text-xs font-semibold text-muted">
        <span>Mechanics Helper</span>
        <span className="font-mono text-dim">{isProvider ? shareCode || "Bay" : lockedProvider?.code || "Bay"}</span>
      </header>
      <main className={`flex-1 overflow-y-auto px-4 pb-36 pt-3 ${view === "welcome" || view === "login" || view === "register" ? "pb-16" : ""}`}>
        {view === "welcome" && (
          <Welcome
            locked={liveLocked}
            codeInput={codeInput}
            setCodeInput={setCodeInput}
            onApply={() => applyCode(codeInput, false)}
            onLogin={() => setView("login")}
            onRegister={() => setView("register")}
          />
        )}
        {view === "login" && (
          <Login
            onBack={() => setView("welcome")}
            onOk={enter}
            onErr={flash}
            onRegister={() => setView("register")}
          />
        )}
        {view === "register" && (
          <Register onBack={() => setView("welcome")} onOk={enter} onErr={flash} />
        )}
        {view === "home" && user && (
          <CustomerHome
            user={user}
            locked={liveLocked}
            codeInput={codeInput}
            setCodeInput={setCodeInput}
            onApply={() => applyCode(codeInput)}
            onClear={() => {
              Store.setRefCode("");
              setLockedProvider(null);
              setCodeInput("");
              flash("Shop unlocked — pick anyone");
            }}
            go={setView}
          />
        )}
        {view === "book" && user && (
          <Book
            user={user}
            locked={liveLocked}
            onClear={() => {
              Store.setRefCode("");
              setLockedProvider(null);
              flash("Pick any shop or mechanic");
            }}
            onBack={() => setView("home")}
            onBooked={(j) => {
              setDraft(j);
              setView("confirm");
            }}
            onErr={flash}
          />
        )}
        {view === "confirm" && draft && (
          <Confirm job={draft} onTrack={() => { setSelectedId(draft.id); setView("track"); }} onHome={() => setView("home")} />
        )}
        {view === "track" && user && (
          <Track
            user={user}
            onOpen={(id) => {
              setSelectedId(id);
              setView("job");
            }}
            onBack={() => setView("home")}
          />
        )}
        {view === "job" && selectedId && (
          <JobDetail id={selectedId} shop={false} onBack={() => setView("track")} bump={bump} tick={tick} />
        )}
        {view === "diagnose" && (
          <Diagnose
            onBack={() => setView("home")}
            onBook={(text) => {
              sessionStorage.setItem("mh.symptoms", text);
              setView("book");
            }}
          />
        )}
        {view === "shopHome" && user && (
          <ShopHome
            user={user}
            tick={tick}
            shareCode={shareCode}
            onShare={() => setView("share")}
            onOpen={(id) => {
              setSelectedId(id);
              setView("shopJob");
            }}
          />
        )}
        {view === "shopJob" && selectedId && user && (
          <JobDetail
            id={selectedId}
            shop
            user={user}
            onBack={() => setView("shopHome")}
            bump={bump}
            flash={flash}
            tick={tick}
          />
        )}
        {view === "share" && user && shareCode && (
          <div>
            <Top title="Share with customers" onBack={() => setView("shopHome")} />
            <QrShare
              key={shareCode}
              code={shareCode}
              title={user.role === "independent" ? user.businessName || user.name : user.shopName || "Your shop"}
              canRotate={user.role === "independent" || user.shopRole === "owner"}
              rotateHint={
                user.role === "shop"
                  ? "A new code also replaces the employee join code. Old printed QRs stop working."
                  : "Old printed QRs stop working after you generate a new code."
              }
              onRotate={() => {
                const next = Store.rotateCustomerCode(user);
                setUser(Store.getSession());
                flash("New code: " + next);
                bump();
              }}
            />
          </div>
        )}
        {view === "account" && user && (
          <Account
            user={user}
            onBack={() => setView(homeFor(user.role))}
            onLogout={() => {
              Store.logout();
              setUser(null);
              setView("welcome");
            }}
            flash={flash}
            bump={bump}
            onSaved={(u) => {
              setUser(u);
              bump();
            }}
          />
        )}
      </main>
      {user && !["welcome", "login", "register"].includes(view) && (
        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-bg/95 px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          {isProvider ? (
            <div className="grid grid-cols-3">
              <Tab active={view === "shopHome" || view === "shopJob"} onClick={() => setView("shopHome")} icon={<ClipboardList className="size-5" />} label="Jobs" />
              <Tab active={view === "share"} onClick={() => setView("share")} icon={<QrCode className="size-5" />} label="Share" />
              <Tab active={view === "account"} onClick={() => setView("account")} icon={<UserRound className="size-5" />} label="Account" />
            </div>
          ) : (
            <div className="grid grid-cols-4">
              <Tab active={view === "home"} onClick={() => setView("home")} icon={<House className="size-5" />} label="Home" />
              <Tab active={view === "diagnose"} onClick={() => setView("diagnose")} icon={<MessageCircle className="size-5" />} label="Diagnose" />
              <Tab active={view === "book" || view === "confirm"} onClick={() => setView("book")} icon={<CalendarPlus className="size-5" />} label="Book" />
              <Tab active={view === "track" || view === "job"} onClick={() => setView("track")} icon={<MapPin className="size-5" />} label="My car" />
            </div>
          )}
        </nav>
      )}
      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 max-w-[380px] -translate-x-1/2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-900">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-1 text-[11px] font-semibold ${active ? "text-accent" : "text-dim"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Logo() {
  return <img src="/img/logo.jpg" alt="" className="size-10 rounded-[11px] object-cover" />;
}

function Top({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <button type="button" onClick={onBack} className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface" aria-label="Back">
        <ArrowLeft className="size-4" />
      </button>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-bg2 px-3 py-3 text-base text-fg outline-none focus:border-accent/60";

function Welcome({
  locked,
  codeInput,
  setCodeInput,
  onApply,
  onLogin,
  onRegister,
}: {
  locked: Provider | null;
  codeInput: string;
  setCodeInput: (s: string) => void;
  onApply: () => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <Logo />
        <div>
          <div className="font-bold">Mechanics Helper</div>
          <div className="text-xs text-muted">Shop · Independent · Customer</div>
        </div>
      </div>
      {locked ? (
        <div className="mb-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">You were referred</p>
          <h2 className="mt-1 text-xl font-semibold">{locked.name}</h2>
          <p className="mt-1 text-sm text-muted">{locked.detail} · code {locked.code}</p>
          {locked.bio ? <p className="mt-2 text-sm text-fg">{locked.bio}</p> : null}
          <p className="mt-2 text-sm text-muted">Log in as a customer to book this mechanic.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-linear-to-br from-surface2 to-bg2 p-5">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">
            Sign in to book
            <br />
            or run the bay.
          </h1>
          <p className="mt-2 text-sm text-muted">Customers track repairs. Shops and independents share a find code so people land on the right bay.</p>
        </div>
      )}
      <div className="mt-4 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Have a shop or mechanic code?</p>
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            placeholder="RIV4 or LEON"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApply();
            }}
          />
          <button type="button" onClick={onApply} className="h-12 shrink-0 rounded-xl bg-accent px-4 font-semibold text-ink">
            Find
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        <button type="button" onClick={onLogin} className="h-12 rounded-xl bg-accent font-semibold text-ink">
          Log in
        </button>
        <button type="button" onClick={onRegister} className="h-12 rounded-xl border border-line bg-surface font-semibold">
          Create an account
        </button>
      </div>
      <div className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        <p className="font-semibold text-fg">Demo logins · password demo123</p>
        <p className="mt-2">Customer: maya@example.com</p>
        <p>Shop: shop@example.com</p>
        <p>Independent: indy@example.com</p>
        <p className="mt-2">Find codes: RIV4 · LEON</p>
      </div>
    </div>
  );
}

function Login({
  onBack,
  onOk,
  onErr,
  onRegister,
}: {
  onBack: () => void;
  onOk: (u: User) => void;
  onErr: (s: string) => void;
  onRegister: () => void;
}) {
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const res = Store.login(String(fd.get("id")), String(fd.get("pw")));
        if (!res.ok) return onErr(res.error);
        onOk(res.user);
      }}
    >
      <Top title="Log in" onBack={onBack} />
      <Field label="Email or phone">
        <input name="id" className={inputClass} autoComplete="username" required />
      </Field>
      <Field label="Password">
        <input name="pw" type="password" className={inputClass} autoComplete="current-password" required />
      </Field>
      <button type="submit" className="h-12 rounded-xl bg-accent font-semibold text-ink">
        Log in
      </button>
      <button type="button" onClick={onRegister} className="h-12 rounded-xl border border-line bg-surface font-semibold">
        Need an account?
      </button>
    </form>
  );
}

function Register({
  onBack,
  onOk,
  onErr,
}: {
  onBack: () => void;
  onOk: (u: User) => void;
  onErr: (s: string) => void;
}) {
  const [role, setRole] = useState<Role>("customer");
  const [join, setJoin] = useState<"create" | "join">("create");
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const res = Store.register({
          name: String(fd.get("name")),
          email: String(fd.get("email")),
          phone: String(fd.get("phone")),
          password: String(fd.get("pw")),
          role,
          shopJoin: join,
          shopName: String(fd.get("shopName") || ""),
          shopCode: String(fd.get("shopCode") || ""),
          businessName: String(fd.get("biz") || ""),
          serviceMode: (String(fd.get("mode") || "both") as User["serviceMode"]),
        });
        if (!res.ok) return onErr(res.error);
        onOk(res.user);
      }}
    >
      <Top title="Create account" onBack={onBack} />
      <Field label="Full name">
        <input name="name" className={inputClass} required />
      </Field>
      <Field label="Email">
        <input name="email" type="email" className={inputClass} />
      </Field>
      <Field label="Phone">
        <input name="phone" inputMode="tel" className={inputClass} />
      </Field>
      <Field label="Password">
        <input name="pw" type="password" className={inputClass} required />
      </Field>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">I am</p>
      <div className="flex rounded-xl bg-bg2 p-1">
        {(["customer", "shop", "independent"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize ${role === r ? "bg-surface2" : "text-muted"}`}
          >
            {r === "independent" ? "Independent" : r === "shop" ? "Shop" : "Customer"}
          </button>
        ))}
      </div>
      {role === "shop" && (
        <>
          <div className="flex rounded-xl bg-bg2 p-1">
            <button type="button" onClick={() => setJoin("create")} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${join === "create" ? "bg-surface2" : "text-muted"}`}>
              Create shop
            </button>
            <button type="button" onClick={() => setJoin("join")} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${join === "join" ? "bg-surface2" : "text-muted"}`}>
              Join shop
            </button>
          </div>
          {join === "create" ? (
            <Field label="Shop name">
              <input name="shopName" className={inputClass} placeholder="Riverside Auto" />
            </Field>
          ) : (
            <Field label="Shop team code">
              <input name="shopCode" className={inputClass} placeholder="RIV4" />
            </Field>
          )}
        </>
      )}
      {role === "independent" && (
        <>
          <Field label="Business name">
            <input name="biz" className={inputClass} placeholder="Leon Mobile Repair" />
          </Field>
          <Field label="How you work">
            <select name="mode" className={inputClass}>
              <option value="mobile">I go to the customer</option>
              <option value="shop">They come to me</option>
              <option value="both">Both</option>
            </select>
          </Field>
        </>
      )}
      <button type="submit" className="h-12 rounded-xl bg-accent font-semibold text-ink">
        Create account
      </button>
    </form>
  );
}

function CustomerHome({
  user,
  locked,
  codeInput,
  setCodeInput,
  onApply,
  onClear,
  go,
}: {
  user: User;
  locked: Provider | null;
  codeInput: string;
  setCodeInput: (s: string) => void;
  onApply: () => void;
  onClear: () => void;
  go: (v: View) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <Logo />
        <div className="min-w-0 flex-1">
          <div className="font-bold">Mechanics Helper</div>
          <div className="truncate text-xs text-muted">{user.name}</div>
        </div>
        <button type="button" onClick={() => go("account")} className="h-9 rounded-xl border border-line px-3 text-sm font-semibold">
          Account
        </button>
      </div>
      {locked ? (
        <div className="mb-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Booking with</p>
          <h2 className="text-xl font-semibold">{locked.name}</h2>
          <p className="text-sm text-muted">{locked.detail} · {locked.code}</p>
          {locked.bio ? <p className="mt-2 text-sm text-fg">{locked.bio}</p> : null}
          <button type="button" onClick={onClear} className="mt-2 text-sm font-semibold text-accent">
            Choose a different shop
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h1 className="text-[26px] font-bold leading-tight">Get the car in. Stay in the loop.</h1>
          <p className="mt-2 text-sm text-muted">Ask the helper, book a bay, and watch progress instead of calling the desk.</p>
        </div>
      )}
      <div className="mt-4 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Have a shop or mechanic code?</p>
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            placeholder="RIV4 or LEON"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApply();
            }}
          />
          <button type="button" onClick={onApply} className="h-12 shrink-0 rounded-xl bg-accent px-4 font-semibold text-ink">
            Find
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        <button type="button" onClick={() => go("diagnose")} className="h-12 rounded-xl bg-accent font-semibold text-ink">
          Ask the helper
        </button>
        <button type="button" onClick={() => go("book")} className="h-12 rounded-xl border border-line bg-surface font-semibold">
          Book an appointment
        </button>
        <button type="button" onClick={() => go("track")} className="h-12 rounded-xl border border-line bg-surface font-semibold">
          Track a repair
        </button>
      </div>
    </div>
  );
}

function Book({
  user,
  locked,
  onClear,
  onBack,
  onBooked,
  onErr,
}: {
  user: User;
  locked: Provider | null;
  onClear: () => void;
  onBack: () => void;
  onBooked: (j: Job) => void;
  onErr: (s: string) => void;
}) {
  const providers = Store.listProviders();
  const [make, setMake] = useState("");
  const [pick, setPick] = useState(locked ? `${locked.type}:${locked.id}` : "");
  const models = make ? VEHICLE_DATA[make] || [] : [];
  const pending = typeof window === "undefined" ? "" : sessionStorage.getItem("mh.symptoms") || "";
  const picked = locked || providers.find((p) => `${p.type}:${p.id}` === pick) || null;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = e.currentTarget;
        const fd = new FormData(f);
        const raw = locked ? `${locked.type}:${locked.id}` : String(fd.get("provider") || "");
        const [ptype, pid] = raw.split(":");
        const provider = providers.find((p) => p.id === pid && p.type === ptype);
        if (!provider) return onErr("Choose a shop or mechanic");
        const job: Job = {
          id: Store.jobCode(),
          userId: user.id,
          createdAt: Date.now(),
          name: String(fd.get("name")),
          phone: String(fd.get("phone")).replace(/\D/g, ""),
          email: String(fd.get("email")),
          year: String(fd.get("year")),
          make: String(fd.get("make")),
          model: String(fd.get("model")),
          symptoms: String(fd.get("symptoms")),
          slot: new Date(String(fd.get("slot"))).toISOString(),
          status: "scheduled",
          providerId: provider.id,
          providerType: provider.type,
          providerName: provider.name,
          assignedTo: "",
          notes: [{ at: Date.now(), text: "Booked from customer app.", by: "system" }],
        };
        if (!job.year || !job.make || !job.model || !job.symptoms || !fd.get("slot")) {
          return onErr("Fill in all fields");
        }
        Store.addJob(job);
        sessionStorage.removeItem("mh.symptoms");
        onBooked(job);
      }}
    >
      <Top title="New appointment" onBack={onBack} />
      {locked ? (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
          Booking <span className="font-semibold">{locked.name}</span> · {locked.code}
          {locked.bio ? <p className="mt-2 text-muted">{locked.bio}</p> : null}
          <button type="button" onClick={onClear} className="mt-1 block text-sm font-semibold text-accent">
            Choose someone else
          </button>
        </div>
      ) : (
        <Field label="Who should get this job?">
          <select
            name="provider"
            className={inputClass}
            required
            value={pick}
            onChange={(e) => setPick(e.target.value)}
          >
            <option value="">Choose a shop or mechanic</option>
            {providers.map((p) => (
              <option key={p.type + p.id} value={`${p.type}:${p.id}`}>
                {p.name} · {p.code}
              </option>
            ))}
          </select>
          {picked?.bio ? <p className="mt-2 text-sm text-muted">{picked.bio}</p> : null}
        </Field>
      )}
      <Field label="Your name">
        <input name="name" className={inputClass} defaultValue={user.name} required />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Phone">
          <input name="phone" className={inputClass} defaultValue={user.phone} required />
        </Field>
        <Field label="Email">
          <input name="email" type="email" className={inputClass} defaultValue={user.email} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Year">
          <select name="year" className={inputClass} required defaultValue="">
            <option value="">Year</option>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </Field>
        <Field label="Make">
          <select name="make" className={inputClass} required value={make} onChange={(e) => setMake(e.target.value)}>
            <option value="">Make</option>
            {Object.keys(VEHICLE_DATA).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Model">
        <select name="model" className={inputClass} required defaultValue="">
          <option value="">{make ? "Select model" : "Select make first"}</option>
          {models.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </Field>
      <Field label="What’s going on?">
        <textarea name="symptoms" className={inputClass + " min-h-28"} required defaultValue={pending} />
      </Field>
      <Field label="Preferred time">
        <select name="slot" className={inputClass} required defaultValue="">
          <option value="">Choose a slot</option>
          {slots().map((d) => (
            <option key={d.toISOString()} value={d.toISOString()}>
              {fmtWhen(d.toISOString())}
            </option>
          ))}
        </select>
      </Field>
      <button type="submit" className="h-12 rounded-xl bg-accent font-semibold text-ink">
        Request appointment
      </button>
    </form>
  );
}

function Confirm({ job, onTrack, onHome }: { job: Job; onTrack: () => void; onHome: () => void }) {
  return (
    <div>
      <Top title="You’re on the board" onBack={onHome} />
      <div className="rounded-2xl border border-line bg-surface p-4 text-center">
        <p className="text-sm text-muted">Job code</p>
        <p className="font-mono text-2xl tracking-[0.18em]">{job.id}</p>
        <p className="mt-1 text-sm text-muted">Going to {job.providerName}</p>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
        <img src={carImage(job)} alt="" className="h-36 w-full object-cover" />
        <div className="p-4">
          <h3 className="font-semibold">{vehicleLabel(job)}</h3>
          <p className="text-sm text-muted">{fmtWhen(job.slot)}</p>
        </div>
      </div>
      <button type="button" onClick={onTrack} className="mt-4 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
        Track this job
      </button>
    </div>
  );
}

function JobCard({ job, shop, onClick }: { job: Job; shop: boolean; onClick: () => void }) {
  const st = statusMeta(job.status);
  return (
    <button type="button" onClick={onClick} className="w-full rounded-xl border border-line bg-surface p-3.5 text-left">
      <div className="flex gap-3">
        <img src={carImage(job)} alt="" className="h-11 w-14 rounded-[10px] object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-dim">{vehicleKind(job)}</p>
          <h3 className="truncate font-semibold">{shop ? job.name : vehicleLabel(job)}</h3>
          <p className="truncate text-sm text-muted">
            {shop ? vehicleLabel(job) : job.name} · {job.id}
            {job.assignedTo ? ` · ${job.assignedTo}` : ""}
            {!shop && job.providerName ? ` · ${job.providerName}` : ""}
          </p>
          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold badge-${st.badge}`}>
            {shop ? st.label : st.customer}
          </span>
        </div>
      </div>
    </button>
  );
}

function Track({ user, onOpen, onBack }: { user: User; onOpen: (id: string) => void; onBack: () => void }) {
  const [q, setQ] = useState("");
  const jobs = useMemo(() => (q ? Store.findJobs(q, user) : Store.providerJobs(user)), [q, user]);
  return (
    <div>
      <Top title="Track a repair" onBack={onBack} />
      <input className={inputClass} placeholder="Job code or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3 flex flex-col gap-2.5">
        {jobs.length ? jobs.map((j) => <JobCard key={j.id} job={j} shop={false} onClick={() => onOpen(j.id)} />) : <p className="p-6 text-center text-sm text-muted">No jobs matched. Try MH-4821.</p>}
      </div>
    </div>
  );
}

function ShopHome({
  user,
  onOpen,
  onShare,
  shareCode,
  tick,
}: {
  user: User;
  onOpen: (id: string) => void;
  onShare: () => void;
  shareCode: string;
  tick: number;
}) {
  const [filter, setFilter] = useState<"active" | "ready" | "all">("active");
  const jobs = Store.providerJobs(user).slice().sort((a, b) => +new Date(a.slot) - +new Date(b.slot));
  const active = jobs.filter((j) => j.status !== "done");
  const ready = jobs.filter((j) => j.status === "ready").length;
  const busy = jobs.filter((j) => ["enroute", "checkedin", "diagnosing", "parts", "repair"].includes(j.status)).length;
  const list = filter === "ready" ? jobs.filter((j) => j.status === "ready") : filter === "all" ? jobs : active;
  const title = user.role === "independent" ? user.businessName || "Independent" : user.shopName || "Shop";
  const publicBio =
    user.role === "independent"
      ? user.bio || ""
      : user.shopId
        ? Store.shopRecord(user.shopId)?.bio || ""
        : "";
  void tick;
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <Logo />
        <div className="min-w-0">
          <div className="font-bold">{title}</div>
          <div className="text-xs text-muted">{user.role === "independent" ? "Your jobs" : user.name}</div>
        </div>
      </div>
      {publicBio ? <p className="mb-3 text-sm text-muted">{publicBio}</p> : null}
      <div className="mb-3 rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer find code</p>
            <p className="font-mono text-2xl tracking-[0.2em] text-accent">{shareCode || "—"}</p>
          </div>
          <button type="button" onClick={onShare} className="h-11 shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-ink">
            QR & share
          </button>
        </div>
        <p className="mt-1 text-xs text-dim">Give this to customers so they book you, not a random shop.</p>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-line bg-surface py-3 text-center">
          <div className="text-xl font-bold">{active.length}</div>
          <div className="text-[11px] text-muted">Open</div>
        </div>
        <div className="rounded-xl border border-line bg-surface py-3 text-center">
          <div className="text-xl font-bold">{busy}</div>
          <div className="text-[11px] text-muted">{user.role === "independent" ? "Active" : "In bay"}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface py-3 text-center">
          <div className="text-xl font-bold">{ready}</div>
          <div className="text-[11px] text-muted">Ready</div>
        </div>
      </div>
      <div className="mb-3 flex rounded-xl bg-bg2 p-1">
        {(["active", "ready", "all"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize ${filter === f ? "bg-surface2" : "text-muted"}`}>
            {f === "active" ? "Open" : f}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {list.map((j) => (
          <JobCard key={j.id} job={j} shop onClick={() => onOpen(j.id)} />
        ))}
        {!list.length && <p className="p-6 text-center text-sm text-muted">No jobs in this filter.</p>}
      </div>
    </div>
  );
}

function JobDetail({
  id,
  shop,
  user,
  onBack,
  bump,
  flash,
  tick,
}: {
  id: string;
  shop: boolean;
  user?: User;
  onBack: () => void;
  bump: () => void;
  flash?: (s: string) => void;
  tick?: number;
}) {
  void tick;
  const job = Store.load().jobs.find((j) => j.id === id);
  if (!job) return <p className="text-muted">Job not found.</p>;
  const st = statusMeta(job.status);
  const idx = (["scheduled", "enroute", "checkedin", "diagnosing", "parts", "repair", "ready", "done"] as const).indexOf(job.status);
  const shopRec = user?.shopId ? Store.shopRecord(user.shopId) : null;
  return (
    <div>
      <Top title={job.id} onBack={onBack} />
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <img src={carImage(job)} alt="" className="h-36 w-full object-cover" />
        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-dim">{vehicleKind(job)}</p>
          <h2 className="text-lg font-semibold">{vehicleLabel(job)}</h2>
          <p className="text-sm text-muted">
            {job.name} · {job.providerName}
          </p>
          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold badge-${st.badge}`}>
            {shop ? st.label : st.customer}
          </span>
          <p className="mt-2 rounded-xl bg-bg2 p-2.5 text-sm text-muted">{job.symptoms}</p>
        </div>
      </div>
      <h2 className="mb-2 mt-4 font-semibold">Progress</h2>
      <div>
        {statusMeta &&
          ["scheduled", "enroute", "checkedin", "diagnosing", "parts", "repair", "ready", "done"].map((s, i) => {
            const meta = statusMeta(s);
            const on = i <= idx;
            return (
              <div key={s} className="grid grid-cols-[18px_1fr] gap-3 pb-3">
                <div className={`mt-0.5 size-[18px] rounded-full border-2 ${on ? "border-accent bg-accent" : "border-dim"}`} />
                <div>
                  <div className="text-sm font-semibold">{shop ? meta.label : meta.customer}</div>
                  {i === idx && <div className="text-xs text-dim">Current · {fmtShort(job.notes.slice(-1)[0]?.at || job.createdAt)}</div>}
                </div>
              </div>
            );
          })}
      </div>
      {shop && user?.role === "shop" && shopRec && (
        <Field label="Assign technician">
          <select
            className={inputClass}
            defaultValue={job.assignedTo || ""}
            onChange={(e) => {
              Store.updateJob(job.id, { assignedTo: e.target.value });
              flash?.("Assigned");
              bump();
            }}
          >
            <option value="">Unassigned</option>
            {shopRec.techs.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
      )}
      {shop && (
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Move status</p>
          <div className="grid gap-2">
            {(["scheduled", "enroute", "checkedin", "diagnosing", "parts", "repair", "ready", "done"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`rounded-xl border px-3 py-3 text-left text-sm ${job.status === s ? "border-accent bg-accent/10" : "border-line bg-surface"}`}
                onClick={() => {
                  Store.updateJob(job.id, { status: s });
                  Store.addNote(job.id, "Status set to " + statusMeta(s).label, "shop");
                  flash?.("Status updated");
                  bump();
                }}
              >
                {statusMeta(s).label}
              </button>
            ))}
          </div>
          <form
            className="mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              const t = new FormData(e.currentTarget).get("note");
              const text = String(t || "").trim();
              if (!text) return;
              Store.addNote(job.id, text, "shop");
              (e.currentTarget as HTMLFormElement).reset();
              flash?.("Update sent to customer");
              bump();
            }}
          >
            <Field label="Customer-facing update">
              <textarea name="note" className={inputClass + " min-h-24"} placeholder="Pads and rotors installed." />
            </Field>
            <button type="submit" className="mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
              Post update
            </button>
          </form>
        </div>
      )}
      <h2 className="mb-2 mt-4 font-semibold">Updates</h2>
      {[...job.notes].reverse().map((n, i) => (
        <div key={i} className="mb-2 rounded-xl bg-bg2 p-2.5 text-sm text-muted">
          <strong className="text-fg">{n.by === "shop" ? "Shop update" : "System"}</strong> · {fmtShort(n.at)}
          <br />
          {n.text}
        </div>
      ))}
    </div>
  );
}

function Diagnose({ onBack, onBook }: { onBack: () => void; onBook: (text: string) => void }) {
  const g = greet();
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string; chips?: string[] }[]>([
    { role: "bot", text: g.text, chips: g.chips },
  ]);
  function send(text: string) {
    const userBits = [...messages.filter((m) => m.role === "user").map((m) => m.text), text];
    const res = reply(text);
    setMessages((m) => [...m, { role: "user", text }, { role: "bot", text: res.text, chips: res.chips }]);
    void userBits;
  }
  const userText = messages.filter((m) => m.role === "user").map((m) => m.text).join(" — ");
  return (
    <div>
      <Top title="Shop helper" onBack={onBack} />
      <div className="flex flex-col gap-2.5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm ${m.role === "user" ? "self-end bg-accent font-medium text-ink" : "self-start border border-line bg-surface"}`}
          >
            {m.role === "bot" && <div className="mb-1 text-[11px] font-semibold text-dim">Helper</div>}
            {m.text}
            {m.chips && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="rounded-full border border-line bg-bg2 px-2.5 py-1 text-xs font-semibold text-muted"
                    onClick={() => (/book/i.test(c) ? onBook(userText || c) : send(c))}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <form
        className="mt-3 grid grid-cols-[1fr_auto] gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("chat") as HTMLInputElement;
          const val = input.value.trim();
          if (!val) return;
          send(val);
          input.value = "";
        }}
      >
        <input name="chat" className={inputClass} placeholder="2018 Civic, grinds when braking…" />
        <button type="submit" className="h-12 rounded-xl bg-accent px-4 font-semibold text-ink">
          Send
        </button>
      </form>
    </div>
  );
}

function Account({
  user,
  onBack,
  onLogout,
  flash,
  bump,
  onSaved,
}: {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  flash: (s: string) => void;
  bump: () => void;
  onSaved: (u: User) => void;
}) {
  const shop = user.shopId ? Store.shopRecord(user.shopId) : null;
  const canEditShop = user.role === "shop" && user.shopRole === "owner" && !!shop;
  const [shopName, setShopName] = useState(shop?.name || "");
  const [shopBio, setShopBio] = useState(shop?.bio || "");
  const [bizName, setBizName] = useState(user.businessName || user.name);
  const [indyBio, setIndyBio] = useState(user.bio || "");
  const [mode, setMode] = useState<User["serviceMode"]>(user.serviceMode || "both");
  const [techName, setTechName] = useState("");
  const label =
    user.role === "shop" ? (user.shopRole === "owner" ? "Shop owner" : "Shop technician") : user.role === "independent" ? "Independent mechanic" : "Customer";

  return (
    <div>
      <Top title="Account" onBack={onBack} />
      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-lg font-semibold">{user.name}</h2>
        <p className="text-sm text-muted">
          {user.email || "No email"}
          <br />
          {user.phone || "No phone"}
        </p>
        <span className="mt-2 inline-flex rounded-full bg-surface2 px-2 py-0.5 text-[11px] font-semibold">{label}</span>
      </div>
      {shop && (
        <form
          className="mt-3 rounded-xl border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canEditShop) return;
            const res = Store.updateShopProfile(user, { name: shopName, bio: shopBio });
            if (!res.ok) return flash(res.error);
            onSaved(res.user);
            flash("Shop profile saved");
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Public shop profile</p>
          <div className="mt-3 flex flex-col gap-3">
          {canEditShop ? (
            <Field label="Shop name">
              <input className={inputClass} value={shopName} onChange={(e) => setShopName(e.target.value)} required />
            </Field>
          ) : (
            <h2 className="font-semibold">{shop.name}</h2>
          )}
          <Field label="Bio — what customers see">
            {canEditShop ? (
              <>
                <textarea
                  className={inputClass + " min-h-28"}
                  value={shopBio}
                  maxLength={BIO_MAX}
                  onChange={(e) => setShopBio(e.target.value.slice(0, BIO_MAX))}
                  placeholder="Brakes, diagnostics, how you work, what makes the bay yours."
                />
                <p className="mt-1 text-right text-xs text-dim tabular-nums">
                  {shopBio.length}/{BIO_MAX}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">{shop.bio || "The owner hasn’t written a bio yet."}</p>
            )}
          </Field>
          </div>
          {canEditShop ? (
            <button type="submit" className="mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
              Save shop profile
            </button>
          ) : null}
          <p className="mt-3 text-sm text-muted">Team join code — employees use this when they create an account</p>
          <div className="my-2 font-mono text-2xl tracking-[0.2em]">{shop.code}</div>
          <p className="text-sm text-muted">Team: {shop.techs.join(", ")}</p>
          {canEditShop && (
            <div className="mt-3 flex gap-2">
              <input
                className={inputClass}
                placeholder="Add technician name"
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
              />
              <button
                type="button"
                className="h-12 shrink-0 rounded-xl border border-line px-3 font-semibold"
                onClick={() => {
                  Store.addTechName(shop.id, techName);
                  setTechName("");
                  flash("Technician added");
                  bump();
                }}
              >
                Add
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-dim">Customers use the same code (or the QR on Share) to find this shop.</p>
        </form>
      )}
      {user.role === "independent" && (
        <form
          className="mt-3 rounded-xl border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const res = Store.updateIndependentProfile(user, {
              businessName: bizName,
              bio: indyBio,
              serviceMode: mode,
            });
            if (!res.ok) return flash(res.error);
            onSaved(res.user);
            flash("Profile saved");
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Public mechanic profile</p>
          <div className="mt-3 flex flex-col gap-3">
          <Field label="Business name">
            <input className={inputClass} value={bizName} onChange={(e) => setBizName(e.target.value)} required />
          </Field>
          <Field label="How you work">
            <select
              className={inputClass}
              value={mode}
              onChange={(e) => setMode(e.target.value as User["serviceMode"])}
            >
              <option value="mobile">I go to the customer</option>
              <option value="shop">They come to me</option>
              <option value="both">Both</option>
            </select>
          </Field>
          <Field label="Bio — what customers see">
            <textarea
              className={inputClass + " min-h-28"}
              value={indyBio}
              maxLength={BIO_MAX}
              onChange={(e) => setIndyBio(e.target.value.slice(0, BIO_MAX))}
              placeholder="Your specialties, how you work, and why they should pick you."
            />
            <p className="mt-1 text-right text-xs text-dim tabular-nums">
              {indyBio.length}/{BIO_MAX}
            </p>
          </Field>
          </div>
          <button type="submit" className="mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
            Save profile
          </button>
          <p className="mt-2 text-xs text-dim">Your customer QR is on the Share tab.</p>
        </form>
      )}
      <button type="button" onClick={onLogout} className="mt-4 h-12 w-full rounded-xl border border-line bg-surface font-semibold">
        Log out
      </button>
    </div>
  );
}
