import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarPlus,
  ChevronDown,
  ClipboardList,
  House,
  MapPin,
  MessageCircle,
  QrCode,
  UserRound,
} from "lucide-react";
import { QrShare } from "@/components/qr-share";
import { Face, PhotoPicker } from "@/components/photo-input";
import { BAY_PHOTO_SLOT, PROFILE_PHOTO_SLOT, jobPhotoOf } from "@/lib/photos";
import { diagnoseLocal, greet, isBookChip, bookingSymptomsFromChat } from "@/lib/diagnose";
import { mhDiagnose } from "@/lib/mh-api";
import { LanguageToggle, useI18n } from "@/lib/i18n-context";
import {
  formatClock,
  formatHoursLabel,
  kindText,
  localeTag,
  privacySections,
  statusText,
  translateDetail,
  translateNote,
  translateStoreError,
  type MessageKey,
  type TranslateFn,
} from "@/lib/i18n";
import {
  Store,
  BIO_MAX,
  DAY_BITS,
  type Job,
  type Provider,
  type Role,
  type User,
  fmtShort,
  fmtWhen,
  statusMeta,
  vehicleLabel,
} from "@/lib/store";
import { missingRequiredBookingFields, normalizeSymptoms } from "@/lib/booking";
import { trimOptions } from "@/lib/trims";
import { OTHER_VALUE, VEHICLE_DATA, YEARS, carImage, resolveListedOrOther, vehicleKind } from "@/lib/vehicles";

type View =
  | "welcome"
  | "login"
  | "register"
  | "recover"
  | "forgotPassword"
  | "forgotUsername"
  | "home"
  | "book"
  | "confirm"
  | "track"
  | "job"
  | "diagnose"
  | "shopHome"
  | "shopJob"
  | "share"
  | "account"
  | "privacy"
  | "support";

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
  const { t } = useI18n();
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
    flash(t("toast.hi", { name: u.name.split(" ")[0] }));
  }

  useEffect(() => {
    let live = true;
    (async () => {
      await Store.hydrate();
      if (!live) return;
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
      bump();
    })();
    const poll = setInterval(() => {
      Store.hydrate().then(() => {
        if (live) bump();
      });
    }, 4000);
    return () => {
      live = false;
      clearInterval(poll);
    };
  }, []);

  function applyCode(raw: string, goBook = true) {
    const p = Store.findProviderByCode(raw);
    if (!p) {
      flash(t("toast.noCode"));
      return;
    }
    Store.setRefCode(p.code);
    setLockedProvider(p);
    flash(t("toast.found", { name: p.name }));
    if (goBook && user?.role === "customer") setView("book");
  }

  const isProvider = user?.role === "shop" || user?.role === "independent";
  const shareCode = Store.customerCodeFor(user);
  const liveLocked = lockedProvider
    ? Store.findProviderByCode(lockedProvider.code) || lockedProvider
    : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-bg shadow-[0_0_0_1px_var(--color-line)]">
      <header className="flex items-center justify-between gap-2 px-4 pt-3 text-xs font-semibold text-muted">
        <span className="min-w-0 truncate">{t("app.name")}</span>
        <div className="flex items-center gap-2">
          <LanguageToggle compact />
          <span className="font-mono text-dim">{isProvider ? shareCode || t("app.bay") : lockedProvider?.code || t("app.bay")}</span>
        </div>
      </header>
      <main className={`flex-1 overflow-y-auto px-4 pb-36 pt-3 ${view === "welcome" || view === "login" || view === "register" || view === "recover" || view === "forgotPassword" || view === "forgotUsername" ? "pb-16" : ""}`}>
        {view === "welcome" && (
          <Welcome
            locked={liveLocked}
            codeInput={codeInput}
            setCodeInput={setCodeInput}
            onApply={() => applyCode(codeInput, false)}
            onLogin={() => setView("login")}
            onRegister={() => setView("register")}
            onPrivacy={() => setView("privacy")}
            onSupport={() => setView("support")}
          />
        )}
        {view === "login" && (
          <Login
            onBack={() => setView("welcome")}
            onOk={enter}
            onErr={flash}
            onRegister={() => setView("register")}
            onForgot={() => setView("recover")}
          />
        )}
        {view === "recover" && (
          <RecoverHub
            onBack={() => setView("login")}
            onPassword={() => setView("forgotPassword")}
            onUsername={() => setView("forgotUsername")}
          />
        )}
        {view === "forgotPassword" && (
          <ForgotPassword
            onBack={() => setView("recover")}
            onLogin={() => setView("login")}
            onErr={flash}
          />
        )}
        {view === "forgotUsername" && (
          <ForgotUsername onBack={() => setView("recover")} onErr={flash} />
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
              flash(t("toast.unlocked"));
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
              flash(t("toast.pickAny"));
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
            <Top title={t("share.titleQr")} onBack={() => setView("shopHome")} />
            <QrShare
              key={shareCode}
              code={shareCode}
              title={user.role === "independent" ? user.businessName || user.name : user.shopName || t("share.yourShop")}
              canRotate={user.role === "independent" || user.shopRole === "owner"}
              rotateHint={
                user.role === "shop"
                  ? t("share.rotateShop")
                  : t("share.rotateIndy")
              }
              onRotate={async () => {
                const next = await Store.rotateCustomerCode(user);
                setUser(Store.getSession());
                flash(t("toast.newCode", { code: next }));
                bump();
              }}
            />
          </div>
        )}
        {view === "account" && user && (
          <Account
            user={user}
            locked={liveLocked}
            onBack={() => setView(homeFor(user.role))}
            onLogout={() => {
              Store.logout();
              setUser(null);
              setView("welcome");
            }}
            onDeleted={() => {
              setUser(null);
              setLockedProvider(null);
              setView("welcome");
              flash(t("toast.accountDeleted"));
            }}
            onPrivacy={() => setView("privacy")}
            onSupport={() => setView("support")}
            flash={flash}
            bump={bump}
            onSaved={(u) => {
              setUser(u);
              bump();
            }}
          />
        )}
        {view === "privacy" && (
          <LegalPage title={t("legal.privacy")} onBack={() => setView(user ? "account" : "welcome")} />
        )}
        {view === "support" && (
          <SupportPage
            locked={liveLocked}
            user={user}
            onBack={() => setView(user ? "account" : "welcome")}
            onPrivacy={() => setView("privacy")}
          />
        )}
      </main>
      {user && !["welcome", "login", "register", "recover", "forgotPassword", "forgotUsername", "privacy", "support"].includes(view) && (
        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-bg/95 px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          {isProvider ? (
            <div className="grid grid-cols-3">
              <Tab active={view === "shopHome" || view === "shopJob"} onClick={() => setView("shopHome")} icon={<ClipboardList className="size-5" />} label={t("nav.jobs")} />
              <Tab active={view === "share"} onClick={() => setView("share")} icon={<QrCode className="size-5" />} label={t("nav.qr")} />
              <Tab active={view === "account"} onClick={() => setView("account")} icon={<UserRound className="size-5" />} label={t("nav.account")} />
            </div>
          ) : (
            <div className="grid grid-cols-5">
              <Tab active={view === "home"} onClick={() => setView("home")} icon={<House className="size-5" />} label={t("nav.home")} />
              <Tab active={view === "diagnose"} onClick={() => setView("diagnose")} icon={<MessageCircle className="size-5" />} label={t("diag.helper")} />
              <Tab active={view === "book" || view === "confirm"} onClick={() => setView("book")} icon={<CalendarPlus className="size-5" />} label={t("nav.book")} />
              <Tab active={view === "track" || view === "job"} onClick={() => setView("track")} icon={<MapPin className="size-5" />} label={t("nav.myCar")} />
              <Tab active={view === "account"} onClick={() => setView("account")} icon={<UserRound className="size-5" />} label={t("nav.account")} />
            </div>
          )}
        </nav>
      )}
      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 max-w-[380px] -translate-x-1/2 rounded-xl border border-accent/40 bg-surface px-3.5 py-2.5 text-sm font-semibold text-fg shadow-lg">
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
      className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold tap ${active ? "bg-accent/15 text-accent" : "text-dim"}`}
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
  const { t } = useI18n();
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <button type="button" onClick={onBack} className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface" aria-label={t("nav.back")}>
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
  "w-full rounded-xl border border-line bg-bg2 px-3 py-3 text-base text-fg outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20";

const selectClass =
  inputClass +
  " appearance-none pr-11 font-semibold tracking-tight [color-scheme:dark]";

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-accent" />
    </div>
  );
}

function Welcome({
  locked,
  codeInput,
  setCodeInput,
  onApply,
  onLogin,
  onRegister,
  onPrivacy,
  onSupport,
}: {
  locked: Provider | null;
  codeInput: string;
  setCodeInput: (s: string) => void;
  onApply: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onPrivacy: () => void;
  onSupport: () => void;
}) {
  const { locale, t } = useI18n();
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <Logo />
        <div>
          <div className="font-bold">{t("app.name")}</div>
          <div className="text-xs text-muted">{t("app.tagline")}</div>
        </div>
      </div>
      {locked ? (
        <div className="mb-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t("welcome.referred")}</p>
          <div className="mt-2 flex items-start gap-3">
            <Face src={locked.photo} name={locked.name} size="lg" />
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">{locked.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {t("welcome.referredCode", { detail: translateDetail(locale, locked.detail), code: locked.code })}
              </p>
            </div>
          </div>
          {locked.bio ? <p className="mt-2 text-sm text-fg">{locked.bio}</p> : null}
          <p className="mt-2 text-sm text-muted">{formatHoursLabel(locale, locked)}</p>
          {(locked.supportPhone || locked.supportEmail) && (
            <p className="mt-2 text-sm text-muted">
              {locked.supportPhone ? locked.supportPhone : ""}
              {locked.supportPhone && locked.supportEmail ? " · " : ""}
              {locked.supportEmail ? locked.supportEmail : ""}
            </p>
          )}
          <p className="mt-2 text-sm text-muted">{t("welcome.referredLogin")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-linear-to-br from-surface2 to-bg2 p-5">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">
            {t("welcome.title1")}
            <br />
            {t("welcome.title2")}
          </h1>
          <p className="mt-2 text-sm text-muted">{t("welcome.body")}</p>
        </div>
      )}
      <div className="mt-4 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("welcome.haveCode")}</p>
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            placeholder={t("welcome.codePlaceholder")}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApply();
            }}
          />
          <button type="button" onClick={onApply} className="h-12 shrink-0 rounded-xl bg-accent px-4 font-semibold text-ink">
            {t("welcome.find")}
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        <button type="button" onClick={onLogin} className="h-12 rounded-xl bg-accent font-semibold text-ink">
          {t("welcome.login")}
        </button>
        <button type="button" onClick={onRegister} className="h-12 rounded-xl border border-line bg-surface font-semibold">
          {t("welcome.createAccount")}
        </button>
      </div>
      <div className="mt-6 flex justify-center gap-4 text-sm font-semibold text-muted">
        <button type="button" onClick={onPrivacy} className="underline-offset-2 hover:text-fg hover:underline">
          {t("welcome.privacy")}
        </button>
        <button type="button" onClick={onSupport} className="underline-offset-2 hover:text-fg hover:underline">
          {t("welcome.support")}
        </button>
      </div>
    </div>
  );
}

function Login({
  onBack,
  onOk,
  onErr,
  onRegister,
  onForgot,
}: {
  onBack: () => void;
  onOk: (u: User) => void;
  onErr: (s: string) => void;
  onRegister: () => void;
  onForgot: () => void;
}) {
  const { locale, t } = useI18n();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const res = await Store.login(String(fd.get("id")), String(fd.get("pw")));
        if (!res.ok) return onErr(translateStoreError(locale, res.error));
        onOk(res.user);
      }}
    >
      <Top title={t("login.title")} onBack={onBack} />
      <Field label={t("login.id")}>
        <input name="id" className={inputClass} autoComplete="username" required />
      </Field>
      <Field label={t("login.password")}>
        <input name="pw" type="password" className={inputClass} autoComplete="current-password" required />
      </Field>
      <button type="submit" className="h-12 rounded-xl bg-accent font-semibold text-ink">
        {t("login.submit")}
      </button>
      <button type="button" onClick={onForgot} className="text-sm font-semibold text-muted underline-offset-2 hover:text-fg hover:underline">
        {t("login.forgot")}
      </button>
      <button type="button" onClick={onRegister} className="h-12 rounded-xl border border-line bg-surface font-semibold">
        {t("login.needAccount")}
      </button>
    </form>
  );
}

function RecoverHub({
  onBack,
  onPassword,
  onUsername,
}: {
  onBack: () => void;
  onPassword: () => void;
  onUsername: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3">
      <Top title={t("recover.title")} onBack={onBack} />
      <p className="text-sm leading-relaxed text-muted">{t("recover.body")}</p>
      <button type="button" onClick={onPassword} className="h-12 rounded-xl bg-accent font-semibold text-ink">
        {t("recover.forgotPassword")}
      </button>
      <button type="button" onClick={onUsername} className="h-12 rounded-xl border border-line bg-surface font-semibold">
        {t("recover.forgotUsername")}
      </button>
      <button type="button" onClick={onBack} className="text-sm font-semibold text-muted underline-offset-2 hover:text-fg hover:underline">
        {t("recover.backToLogin")}
      </button>
    </div>
  );
}

function ForgotPassword({
  onBack,
  onLogin,
  onErr,
}: {
  onBack: () => void;
  onLogin: () => void;
  onErr: (s: string) => void;
}) {
  const { locale, t } = useI18n();
  const [id, setId] = useState("");
  const [channel, setChannel] = useState<"email" | "dev" | "stub" | "">("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function sendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await Store.requestPasswordReset(id);
      if (!res.ok) return onErr(translateStoreError(locale, res.error));
      setChannel(res.channel);
      setDevCode(res.devCode || "");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = String(fd.get("pw") || "");
    const confirm = String(fd.get("pw2") || "");
    if (next !== confirm) return onErr(t("recover.pw.mismatch"));
    setBusy(true);
    try {
      const res = await Store.resetPassword(id, String(fd.get("code") || ""), next);
      if (!res.ok) return onErr(translateStoreError(locale, res.error));
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <Top title={t("recover.pw.title")} onBack={onBack} />
        <div className="rounded-xl border border-line bg-surface px-4 py-4">
          <p className="text-sm font-semibold">{t("recover.pw.done")}</p>
        </div>
        <button type="button" onClick={onLogin} className="h-12 rounded-xl bg-accent font-semibold text-ink">
          {t("recover.backToLogin")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Top title={t("recover.pw.title")} onBack={onBack} />
      <form className="flex flex-col gap-3" onSubmit={sendCode}>
        <Field label={t("recover.pw.id")}>
          <input
            className={inputClass}
            autoComplete="username"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setChannel("");
              setDevCode("");
            }}
            required
          />
        </Field>
        <button type="submit" disabled={busy} className="h-12 rounded-xl border border-line bg-surface font-semibold disabled:opacity-60">
          {busy && !channel ? t("recover.pw.sending") : t("recover.pw.send")}
        </button>
      </form>
      {channel ? (
        <form className="flex flex-col gap-3" onSubmit={savePassword}>
          <p className="text-sm leading-relaxed text-muted">
            {channel === "email"
              ? t("recover.pw.sentEmail")
              : channel === "dev"
                ? t("recover.pw.sentDev")
                : t("recover.pw.sentStub")}
          </p>
          {devCode ? (
            <div className="rounded-xl border border-accent/40 bg-surface px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("recover.pw.devCode")}</p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.3em]">{devCode}</p>
            </div>
          ) : null}
          <Field label={t("recover.pw.code")}>
            <input name="code" className={inputClass} inputMode="numeric" autoComplete="one-time-code" required defaultValue={devCode} />
          </Field>
          <Field label={t("recover.pw.new")}>
            <input name="pw" type="password" className={inputClass} autoComplete="new-password" required minLength={6} />
          </Field>
          <Field label={t("recover.pw.confirm")}>
            <input name="pw2" type="password" className={inputClass} autoComplete="new-password" required minLength={6} />
          </Field>
          <button type="submit" disabled={busy} className="h-12 rounded-xl bg-accent font-semibold text-ink disabled:opacity-60">
            {busy ? t("recover.pw.saving") : t("recover.pw.submit")}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function ForgotUsername({
  onBack,
  onErr,
}: {
  onBack: () => void;
  onErr: (s: string) => void;
}) {
  const { locale, t } = useI18n();
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [looked, setLooked] = useState(false);
  const [result, setResult] = useState<{
    name: string;
    email: string;
    phone: string;
    login: string;
  } | null>(null);

  async function lookup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await Store.recoverUsername(id);
      if (!res.ok) return onErr(translateStoreError(locale, res.error));
      setLooked(true);
      setResult(res.found ? { name: res.name, email: res.email, phone: res.phone, login: res.login } : null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Top title={t("recover.user.title")} onBack={onBack} />
      <form className="flex flex-col gap-3" onSubmit={lookup}>
        <Field label={t("recover.user.id")}>
          <input
            className={inputClass}
            autoComplete="username"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setLooked(false);
              setResult(null);
            }}
            required
          />
        </Field>
        <button type="submit" disabled={busy} className="h-12 rounded-xl bg-accent font-semibold text-ink disabled:opacity-60">
          {busy ? t("recover.user.searching") : t("recover.user.submit")}
        </button>
      </form>
      {looked && !result ? (
        <div className="rounded-xl border border-line bg-surface px-4 py-5">
          <p className="font-semibold">{t("recover.user.emptyTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("recover.user.empty")}</p>
        </div>
      ) : null}
      {result ? (
        <div className="rounded-xl border border-line bg-surface px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("recover.user.found")}</p>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-muted">{t("recover.user.login")}</dt>
              <dd className="font-semibold">{result.login || t("recover.user.none")}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("recover.user.name")}</dt>
              <dd className="font-semibold">{result.name}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("recover.user.email")}</dt>
              <dd className="font-semibold">{result.email || t("recover.user.none")}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("recover.user.phone")}</dt>
              <dd className="font-semibold">{result.phone || t("recover.user.none")}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-muted">{t("recover.user.emailed")}</p>
        </div>
      ) : null}
    </div>
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
  const { locale, t } = useI18n();
  const [role, setRole] = useState<Role>("customer");
  const [join, setJoin] = useState<"create" | "join">("create");
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const res = await Store.register({
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
        if (!res.ok) return onErr(translateStoreError(locale, res.error));
        onOk(res.user);
      }}
    >
      <Top title={t("register.title")} onBack={onBack} />
      <Field label={t("register.name")}>
        <input name="name" className={inputClass} required />
      </Field>
      <Field label={t("register.email")}>
        <input name="email" type="email" className={inputClass} />
      </Field>
      <Field label={t("register.phone")}>
        <input name="phone" inputMode="tel" className={inputClass} />
      </Field>
      <Field label={t("register.password")}>
        <input name="pw" type="password" className={inputClass} required />
      </Field>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("register.iAm")}</p>
      <div className="flex rounded-xl bg-bg2 p-1">
        {(["customer", "shop", "independent"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold ${role === r ? "bg-surface2" : "text-muted"}`}
          >
            {r === "independent" ? t("register.roleIndependent") : r === "shop" ? t("register.roleShop") : t("register.roleCustomer")}
          </button>
        ))}
      </div>
      {role === "shop" && (
        <>
          <div className="flex rounded-xl bg-bg2 p-1">
            <button type="button" onClick={() => setJoin("create")} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${join === "create" ? "bg-surface2" : "text-muted"}`}>
              {t("register.createShop")}
            </button>
            <button type="button" onClick={() => setJoin("join")} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${join === "join" ? "bg-surface2" : "text-muted"}`}>
              {t("register.joinShop")}
            </button>
          </div>
          {join === "create" ? (
            <Field label={t("register.shopName")}>
              <input name="shopName" className={inputClass} placeholder={t("register.shopNamePh")} />
            </Field>
          ) : (
            <Field label={t("register.shopCode")}>
              <input name="shopCode" className={inputClass} placeholder={t("register.shopCodePh")} />
            </Field>
          )}
        </>
      )}
      {role === "independent" && (
        <>
          <Field label={t("register.bizName")}>
            <input name="biz" className={inputClass} placeholder={t("register.bizPh")} />
          </Field>
          <Field label={t("register.howYouWork")}>
            <select name="mode" className={inputClass}>
              <option value="mobile">{t("register.modeMobile")}</option>
              <option value="shop">{t("register.modeShop")}</option>
              <option value="both">{t("register.modeBoth")}</option>
            </select>
          </Field>
        </>
      )}
      <button type="submit" className="h-12 rounded-xl bg-accent font-semibold text-ink">
        {t("register.submit")}
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
  const { locale, t } = useI18n();
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <Logo />
        <div className="min-w-0 flex-1">
          <div className="font-bold">{t("app.name")}</div>
          <div className="truncate text-xs text-muted">{user.name}</div>
        </div>
        <button type="button" onClick={() => go("account")} className="h-9 rounded-xl border border-line px-3 text-sm font-semibold">
          {t("home.account")}
        </button>
      </div>
      {locked ? (
        <div className="mb-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t("home.bookingWith")}</p>
          <div className="mt-2 flex items-start gap-3">
            <Face src={locked.photo} name={locked.name} size="lg" />
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">{locked.name}</h2>
              <p className="text-sm text-muted">{translateDetail(locale, locked.detail)} · {locked.code}</p>
            </div>
          </div>
          {locked.bio ? <p className="mt-2 text-sm text-fg">{locked.bio}</p> : null}
          <p className="mt-2 text-sm text-muted">{formatHoursLabel(locale, locked)}</p>
          <button type="button" onClick={onClear} className="mt-2 text-sm font-semibold text-accent">
            {t("home.chooseDifferent")}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h1 className="text-[26px] font-bold leading-tight">{t("home.headline")}</h1>
          <p className="mt-2 text-sm text-muted">{t("home.sub")}</p>
        </div>
      )}
      <div className="mt-4 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("welcome.haveCode")}</p>
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            placeholder={t("welcome.codePlaceholder")}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApply();
            }}
          />
          <button type="button" onClick={onApply} className="h-12 shrink-0 rounded-xl bg-accent px-4 font-semibold text-ink">
            {t("welcome.find")}
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-2.5">
        <button type="button" onClick={() => go("book")} className="tap rounded-2xl bg-accent px-4 py-3.5 text-left">
          <p className="font-semibold text-ink">{t("home.bookAppt")}</p>
          <p className="mt-0.5 text-sm text-ink/70">{t("home.bookSub")}</p>
        </button>
        <button type="button" onClick={() => go("track")} className="tap rounded-2xl border border-line bg-surface px-4 py-3.5 text-left">
          <p className="font-semibold">{t("nav.myCar")}</p>
          <p className="mt-0.5 text-sm text-muted">{t("home.trackSub")}</p>
        </button>
        <button type="button" onClick={() => go("diagnose")} className="tap rounded-2xl border border-line bg-surface px-4 py-3.5 text-left">
          <p className="font-semibold">{t("home.askHelper")}</p>
          <p className="mt-0.5 text-sm text-muted">{t("home.helperSub")}</p>
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
  const { locale, t } = useI18n();
  const providers = Store.listProviders();
  const [make, setMake] = useState("");
  const [pick, setPick] = useState(locked ? `${locked.type}:${locked.id}` : "");
  const models = make ? VEHICLE_DATA[make] || [] : [];
  const pending = typeof window === "undefined" ? "" : sessionStorage.getItem("mh.symptoms") || "";
  const picked = locked || providers.find((p) => `${p.type}:${p.id}` === pick) || null;
  const dates = localeTag(locale);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = e.currentTarget;
        const fd = new FormData(f);
        const raw = locked ? `${locked.type}:${locked.id}` : String(fd.get("provider") || "");
        const [ptype, pid] = raw.split(":");
        const provider = providers.find((p) => p.id === pid && p.type === ptype);
        if (!provider) return onErr(t("err.chooseProvider"));
        const job: Job = {
          id: Store.jobCode(),
          userId: user.id,
          createdAt: Date.now(),
          name: String(fd.get("name")),
          phone: String(fd.get("phone")).replace(/\D/g, ""),
          email: String(fd.get("email")),
          year: String(fd.get("year")),
          make: resolveListedOrOther(String(fd.get("make")), String(fd.get("makeOther") || "")),
          model: resolveListedOrOther(String(fd.get("model")), String(fd.get("modelOther") || "")),
          trim: (() => {
            const listed = String(fd.get("trim") || "").trim();
            if (!listed) return "";
            return resolveListedOrOther(listed, String(fd.get("trimOther") || ""));
          })(),
          symptoms: normalizeSymptoms(fd.get("symptoms")),
          slot: new Date(String(fd.get("slot"))).toISOString(),
          status: "scheduled",
          providerId: provider.id,
          providerType: provider.type,
          providerName: provider.name,
          assignedTo: "",
          notes: [{ at: Date.now(), text: "Booked from customer app.", by: "system" }],
          notifySms: fd.get("notifySms") === "on",
        };
        if (
          missingRequiredBookingFields({
            year: job.year,
            make: job.make,
            model: job.model,
            slot: fd.get("slot"),
            symptoms: job.symptoms,
          }).length
        ) {
          return onErr(t("err.fillAll"));
        }
        if (Store.slotTaken(provider.id, job.slot)) {
          return onErr(t("err.slotTaken"));
        }
        const saved = await Store.addJob(job);
        if (saved && typeof saved === "object" && "ok" in saved && saved.ok === false) {
          return onErr(translateStoreError(locale, saved.error));
        }
        sessionStorage.removeItem("mh.symptoms");
        onBooked(job);
      }}
    >
      <Top title={t("book.title")} onBack={onBack} />
      {locked ? (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
          <div className="flex items-center gap-3">
            <Face src={locked.photo} name={locked.name} size="sm" />
            <div>
              {t("book.booking", { name: locked.name, code: locked.code })}
            </div>
          </div>
          {locked.bio ? <p className="mt-2 text-muted">{locked.bio}</p> : null}
          <p className="mt-1 text-sm text-muted">{formatHoursLabel(locale, locked)}</p>
          <button type="button" onClick={onClear} className="mt-1 block text-sm font-semibold text-accent">
            {t("book.chooseElse")}
          </button>
        </div>
      ) : (
        <Field label={t("book.who")}>
          <select
            name="provider"
            className={inputClass}
            required
            value={pick}
            onChange={(e) => setPick(e.target.value)}
          >
            <option value="">{t("book.chooseProvider")}</option>
            {providers.map((p) => (
              <option key={p.type + p.id} value={`${p.type}:${p.id}`}>
                {p.name} · {p.code}
              </option>
            ))}
          </select>
          {picked?.bio ? <p className="mt-2 text-sm text-muted">{picked.bio}</p> : null}
        </Field>
      )}
      <Field label={t("book.yourName")}>
        <input name="name" className={inputClass} defaultValue={user.name} required />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label={t("book.phone")}>
          <input name="phone" className={inputClass} defaultValue={user.phone} required />
        </Field>
        <Field label={t("book.email")}>
          <input name="email" type="email" className={inputClass} defaultValue={user.email} />
        </Field>
      </div>
      <VehiclePicker make={make} setMake={setMake} models={models} />
      <Field label={t("book.whatsGoingOn")}>
        <textarea
          name="symptoms"
          className={inputClass + " min-h-28"}
          defaultValue={pending}
          placeholder={t("book.symptomsPh")}
        />
        <p className="mt-2 text-sm text-muted">{t("book.symptomsHint")}</p>
      </Field>
      <Field label={t("book.preferredTime")}>
        <SelectWrap>
          <select name="slot" className={selectClass} required defaultValue="" disabled={!picked}>
            <option value="">{picked ? t("book.chooseOpenTime") : t("book.pickShopFirst")}</option>
            {Store.openSlots(picked?.id).map((d) => (
              <option key={d.toISOString()} value={d.toISOString()}>
                {fmtWhen(d.toISOString(), dates)}
              </option>
            ))}
          </select>
        </SelectWrap>
        {picked && Store.openSlots(picked.id).length === 0 ? (
          <p className="mt-2 text-sm text-accent2">{t("book.bayFull")}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">{t("book.takenHint")}</p>
        )}
      </Field>
      <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
        <input type="checkbox" name="notifySms" defaultChecked className="mt-1 size-4 accent-amber-400" />
        <span>
          {t("book.notifySms")}
        </span>
      </label>
      <button type="submit" className="h-12 rounded-xl bg-accent font-semibold text-ink">
        {t("book.request")}
      </button>
    </form>
  );
}

function Confirm({ job, onTrack, onHome }: { job: Job; onTrack: () => void; onHome: () => void }) {
  const { locale, t } = useI18n();
  return (
    <div>
      <Top title={t("confirm.title")} onBack={onHome} />
      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-center">
        <p className="text-sm text-muted">{t("confirm.saveCode")}</p>
        <p className="font-mono text-3xl tracking-[0.18em] text-accent">{job.id}</p>
        <p className="mt-1 text-sm text-muted">{t("confirm.goingTo", { name: job.providerName })}</p>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
        <img src={carImage(job)} alt="" className="h-36 w-full object-cover" />
        <div className="p-4">
          <h3 className="font-semibold">{vehicleLabel(job)}</h3>
          <p className="text-sm text-muted">{fmtWhen(job.slot, localeTag(locale))}</p>
        </div>
      </div>
      <button type="button" onClick={onTrack} className="mt-4 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
        {t("confirm.track")}
      </button>
    </div>
  );
}

function JobCard({ job, shop, onClick }: { job: Job; shop: boolean; onClick: () => void }) {
  const { locale } = useI18n();
  const st = statusMeta(job.status);
  return (
    <button type="button" onClick={onClick} className="tap w-full rounded-2xl border border-line bg-surface p-3.5 text-left">
      <div className="flex gap-3">
        <img src={jobPhotoOf(job) || carImage(job)} alt="" className="h-14 w-[4.25rem] shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold">{shop ? job.name : vehicleLabel(job)}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold badge-${st.badge}`}>
              {statusText(locale, job.status, shop ? "shop" : "customer")}
            </span>
          </div>
          <p className="truncate text-sm text-muted">
            {shop ? vehicleLabel(job) : job.name}
            {!shop && job.providerName ? ` · ${job.providerName}` : ""}
            {job.assignedTo ? ` · ${job.assignedTo}` : ""}
          </p>
          <p className="mt-1 text-sm font-medium text-fg/80">{fmtWhen(job.slot, localeTag(locale))}</p>
          <p className="font-mono text-xs text-dim">{job.id}</p>
        </div>
      </div>
    </button>
  );
}

function Track({ user, onOpen, onBack }: { user: User; onOpen: (id: string) => void; onBack: () => void }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const jobs = useMemo(() => (q ? Store.findJobs(q, user) : Store.providerJobs(user)), [q, user]);
  return (
    <div>
      <Top title={t("track.title")} onBack={onBack} />
      <input className={inputClass} placeholder={t("track.placeholder")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3 flex flex-col gap-2.5">
        {jobs.length ? jobs.map((j) => <JobCard key={j.id} job={j} shop={false} onClick={() => onOpen(j.id)} />) : <p className="p-6 text-center text-sm text-muted">{q ? t("track.emptySearch") : t("track.emptyBoard")}</p>}
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
  const { t } = useI18n();
  const [filter, setFilter] = useState<"active" | "ready" | "all">("active");
  const jobs = Store.providerJobs(user).slice().sort((a, b) => +new Date(a.slot) - +new Date(b.slot));
  const active = jobs.filter((j) => j.status !== "done");
  const ready = jobs.filter((j) => j.status === "ready").length;
  const busy = jobs.filter((j) => ["enroute", "checkedin", "diagnosing", "parts", "repair"].includes(j.status)).length;
  const list = filter === "ready" ? jobs.filter((j) => j.status === "ready") : filter === "all" ? jobs : active;
  const title = user.role === "independent" ? user.businessName || t("shop.independent") : user.shopName || t("shop.shop");
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
        <Face
          src={user.role === "independent" ? user.photo : Store.shopRecord(user.shopId || "")?.photo}
          name={title}
          size="md"
        />
        <div className="min-w-0">
          <div className="font-bold">{title}</div>
          <div className="text-xs text-muted">{user.role === "independent" ? t("shop.yourJobs") : user.name}</div>
        </div>
      </div>
      {publicBio ? <p className="mb-3 text-sm text-muted">{publicBio}</p> : null}
      <button
        type="button"
        onClick={onShare}
        className="mb-3 w-full rounded-xl border border-line bg-surface p-4 text-left"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("shop.findCodeShort")}</p>
        <p className="font-mono text-2xl tracking-[0.2em] text-accent">{shareCode || "—"}</p>
        <p className="mt-1 text-sm text-muted">{t("shop.qrTabHint")}</p>
      </button>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-line bg-surface py-3 text-center">
          <div className="text-xl font-bold">{active.length}</div>
          <div className="text-[11px] text-muted">{t("shop.open")}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface py-3 text-center">
          <div className="text-xl font-bold">{busy}</div>
          <div className="text-[11px] text-muted">{user.role === "independent" ? t("shop.active") : t("shop.inBay")}</div>
        </div>
        <div className={`rounded-xl border py-3 text-center ${ready ? "border-accent/40 bg-accent/10" : "border-line bg-surface"}`}>
          <div className={`text-xl font-bold ${ready ? "text-accent" : ""}`}>{ready}</div>
          <div className="text-[11px] text-muted">{t("shop.ready")}</div>
        </div>
      </div>
      <div className="mb-3 flex rounded-xl bg-bg2 p-1">
        {(["active", "ready", "all"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${filter === f ? "bg-surface2" : "text-muted"}`}>
            {f === "active" ? t("shop.open") : f === "ready" ? t("shop.ready") : t("shop.all")}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {list.map((j) => (
          <JobCard key={j.id} job={j} shop onClick={() => onOpen(j.id)} />
        ))}
        {!list.length && <p className="p-6 text-center text-sm text-muted">{t("shop.empty")}</p>}
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
  const { locale, t } = useI18n();
  void tick;
  const job = Store.load().jobs.find((j) => j.id === id);
  if (!job) return <p className="text-muted">{t("job.notFound")}</p>;
  const st = statusMeta(job.status);
  const idx = (["scheduled", "enroute", "checkedin", "diagnosing", "parts", "repair", "ready", "done"] as const).indexOf(job.status);
  const shopRec = user?.shopId ? Store.shopRecord(user.shopId) : null;
  const dates = localeTag(locale);
  return (
    <div>
      <Top title={job.id} onBack={onBack} />
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <img src={jobPhotoOf(job) || carImage(job)} alt="" className="h-36 w-full object-cover" />
        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-dim">{kindText(locale, vehicleKind(job))}</p>
          <h2 className="text-lg font-semibold">{vehicleLabel(job)}</h2>
          <p className="text-sm text-muted">
            {job.name} · {job.providerName}
          </p>
          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold badge-${st.badge}`}>
            {statusText(locale, job.status, shop ? "shop" : "customer")}
          </span>
          <p className="mt-2 rounded-xl bg-bg2 p-2.5 text-sm text-muted">
            {job.symptoms || t("book.noSymptoms")}
          </p>
        </div>
      </div>
      <h2 className="mb-2 mt-4 font-semibold">{t("job.progress")}</h2>
      <div>
        {(["scheduled", "enroute", "checkedin", "diagnosing", "parts", "repair", "ready", "done"] as const).map((s, i) => {
          const meta = statusMeta(s);
          const on = i <= idx;
          const row = (
            <div className="grid grid-cols-[18px_1fr] gap-3 pb-3 text-left">
              <div className={`mt-0.5 size-[18px] rounded-full border-2 ${on ? "border-accent bg-accent" : "border-dim"}`} />
              <div>
                <div className={`text-sm font-semibold ${job.status === s ? "text-accent" : ""}`}>
                  {statusText(locale, s, shop ? "shop" : "customer")}
                </div>
                {i === idx && (
                  <div className="text-xs text-dim">{t("job.current", { when: fmtShort(job.notes.slice(-1)[0]?.at || job.createdAt, dates) })}</div>
                )}
                {shop && i !== idx ? <div className="text-xs text-dim">{t("job.tapToSet")}</div> : null}
              </div>
            </div>
          );
          if (!shop) return <div key={s}>{row}</div>;
          return (
            <button
              key={s}
              type="button"
              className="tap w-full"
              onClick={async () => {
                await Store.updateJob(job.id, { status: s });
                await Store.addNote(job.id, "Status set to " + meta.label, "shop");
                flash?.(t("toast.statusUpdated"));
                bump();
              }}
            >
              {row}
            </button>
          );
        })}
      </div>
      {shop && user?.role === "shop" && shopRec && (
        <Field label={t("job.assign")}>
          <select
            className={inputClass}
            defaultValue={job.assignedTo || ""}
            onChange={async (e) => {
              await Store.updateJob(job.id, { assignedTo: e.target.value });
              flash?.(t("toast.assigned"));
              bump();
            }}
          >
            <option value="">{t("job.unassigned")}</option>
            {shopRec.techs.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
      )}
      {shop && (
        <div className="mt-3 rounded-xl border border-line bg-surface p-4">
          <PhotoPicker
            slot={BAY_PHOTO_SLOT}
            value={jobPhotoOf(job)}
            name={vehicleLabel(job)}
            label={t("job.photoLabel")}
            hint={t("job.photoHint")}
            onErr={(msg) => flash?.(translateStoreError(locale, msg))}
            onPick={async (dataUrl) => {
              await Store.saveJobPhoto(job.id, dataUrl);
              flash?.(t("toast.bayPhotoSaved"));
              bump();
            }}
          />
        </div>
      )}
      {shop && (
        <div className="mt-3">
          <form
            className="mt-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const note = new FormData(e.currentTarget).get("note");
              const text = String(note || "").trim();
              if (!text) return;
              await Store.addNote(job.id, text, "shop");
              (e.currentTarget as HTMLFormElement).reset();
              flash?.(t("toast.updateSent"));
              bump();
            }}
          >
            <Field label={t("job.customerUpdate")}>
              <textarea name="note" className={inputClass + " min-h-24"} placeholder={t("job.notePh")} />
            </Field>
            <button type="submit" className="mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
              {t("job.postUpdate")}
            </button>
          </form>
        </div>
      )}
      <h2 className="mb-2 mt-4 font-semibold">{t("job.updates")}</h2>
      {[...job.notes].reverse().map((n, i) => (
        <div key={i} className="mb-2 rounded-xl bg-bg2 p-2.5 text-sm text-muted">
          <strong className="text-fg">{n.by === "shop" ? t("job.shopUpdate") : t("job.system")}</strong> · {fmtShort(n.at, dates)}
          <br />
          {translateNote(locale, n.text)}
        </div>
      ))}
    </div>
  );
}

function listedLabel(value: string, t: TranslateFn) {
  return value === OTHER_VALUE ? t("vehicle.other") : value;
}

function VehiclePicker({
  make,
  setMake,
  models,
}: {
  make: string;
  setMake: (v: string) => void;
  models: string[];
}) {
  const [year, setYear] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [makeOther, setMakeOther] = useState("");
  const [modelOther, setModelOther] = useState("");
  const [trimOther, setTrimOther] = useState("");
  const { t } = useI18n();
  const trims = model ? trimOptions(make, model) : [];
  const preview = [
    year,
    resolveListedOrOther(make, makeOther),
    resolveListedOrOther(model, modelOther),
    trim ? resolveListedOrOther(trim, trimOther) : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{t("vehicle.title")}</p>
          <p className="text-sm text-muted">{t("vehicle.sub")}</p>
        </div>
        {make ? (
          <img
            src={carImage({ make, model })}
            alt=""
            className="h-11 w-[4.5rem] rounded-lg object-cover"
          />
        ) : null}
      </div>
      <div className="grid gap-3 p-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-muted">{t("book.year")}</span>
          <SelectWrap>
            <select
              name="year"
              className={selectClass}
              required
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">{t("vehicle.chooseYear")}</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </SelectWrap>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-muted">{t("book.make")}</span>
          <SelectWrap>
            <select
              name="make"
              className={selectClass}
              required
              value={make}
              onChange={(e) => {
                const next = e.target.value;
                setMake(next);
                setMakeOther("");
                setModel(next === OTHER_VALUE ? OTHER_VALUE : "");
                setModelOther("");
                setTrim("");
                setTrimOther("");
              }}
            >
              <option value="">{t("vehicle.chooseMake")}</option>
              {Object.keys(VEHICLE_DATA).map((m) => (
                <option key={m} value={m}>
                  {listedLabel(m, t)}
                </option>
              ))}
            </select>
          </SelectWrap>
        </label>
        {make === OTHER_VALUE ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-muted">{t("vehicle.whichMake")}</span>
            <input
              name="makeOther"
              className={inputClass}
              value={makeOther}
              onChange={(e) => setMakeOther(e.target.value)}
              placeholder={t("vehicle.typeHere")}
              autoComplete="off"
            />
          </label>
        ) : null}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-muted">{t("book.model")}</span>
          <SelectWrap>
            <select
              name="model"
              className={selectClass}
              required
              value={model}
              disabled={!make}
              onChange={(e) => {
                setModel(e.target.value);
                setModelOther("");
                setTrim("");
                setTrimOther("");
              }}
            >
              <option value="">{make ? t("vehicle.chooseModel") : t("vehicle.pickMakeFirst")}</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {listedLabel(m, t)}
                </option>
              ))}
            </select>
          </SelectWrap>
        </label>
        {model === OTHER_VALUE ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-muted">{t("vehicle.whichModel")}</span>
            <input
              name="modelOther"
              className={inputClass}
              value={modelOther}
              onChange={(e) => setModelOther(e.target.value)}
              placeholder={t("vehicle.typeHere")}
              autoComplete="off"
            />
          </label>
        ) : null}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-muted">{t("vehicle.trimOptional")}</span>
          <SelectWrap>
            <select
              name="trim"
              className={selectClass}
              value={trim}
              disabled={!model}
              onChange={(e) => setTrim(e.target.value)}
            >
              <option value="">{model ? t("vehicle.skipTrim") : t("vehicle.pickModelFirst")}</option>
              {trims.map((trimName) => (
                <option key={trimName} value={trimName}>
                  {listedLabel(trimName, t)}
                </option>
              ))}
            </select>
          </SelectWrap>
        </label>
        {trim === OTHER_VALUE ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-muted">{t("vehicle.whichTrim")}</span>
            <input
              name="trimOther"
              className={inputClass}
              value={trimOther}
              onChange={(e) => setTrimOther(e.target.value)}
              placeholder={t("vehicle.typeHere")}
              autoComplete="off"
            />
          </label>
        ) : null}
      </div>
      <div className="border-t border-line bg-bg2 px-4 py-3">
        <p className="text-sm text-muted">{t("vehicle.onAppointment")}</p>
        <p className="text-lg font-semibold leading-tight">{preview || t("vehicle.notChosen")}</p>
      </div>
    </div>
  );
}

function Diagnose({ onBack, onBook }: { onBack: () => void; onBook: (text: string) => void }) {
  const { locale, t } = useI18n();
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string; chips?: string[] }[]>(() => {
    const g = greet(locale);
    return [{ role: "bot", text: g.text, chips: g.chips }];
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length || prev[0].role !== "bot") return prev;
      const g = greet(locale);
      return [{ role: "bot", text: g.text, chips: g.chips }, ...prev.slice(1)];
    });
  }, [locale]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    let res;
    try {
      res = await mhDiagnose({ data: { text: trimmed, locale } });
    } catch {
      res = diagnoseLocal(trimmed, locale);
    }
    setMessages((prev) => [...prev, { role: "bot", text: res.text, chips: res.chips }]);
    setBusy(false);
  }

  return (
    <div>
      <Top title={t("diag.title")} onBack={onBack} />
      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3.5 text-[17px] leading-relaxed ${m.role === "user" ? "self-end bg-accent font-medium text-ink" : "self-start border border-line bg-surface text-fg"}`}
          >
            {m.role === "bot" && <div className="mb-1.5 text-sm font-semibold text-accent">{t("diag.helper")}</div>}
            {m.text}
            {m.chips && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={busy}
                    className="rounded-full border border-line bg-bg2 px-3.5 py-2 text-[15px] font-semibold text-fg disabled:opacity-50"
                    onClick={() =>
                      isBookChip(c)
                        ? onBook(bookingSymptomsFromChat(messages, i) || c)
                        : send(c)
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy ? (
          <div className="max-w-[92%] self-start whitespace-pre-wrap rounded-2xl border border-line bg-surface px-4 py-3.5 text-[17px] leading-relaxed text-muted">
            <div className="mb-1.5 text-sm font-semibold text-accent">{t("diag.helper")}</div>
            {t("diag.loading")}
          </div>
        ) : null}
      </div>
      <form
        className="mt-4 grid grid-cols-[1fr_auto] gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("chat") as HTMLInputElement;
          const val = input.value.trim();
          if (!val || busy) return;
          send(val);
          input.value = "";
        }}
      >
        <input
          name="chat"
          className={inputClass + " text-[17px]"}
          placeholder={t("diag.placeholder")}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy}
          className="h-12 rounded-xl bg-accent px-4 text-base font-semibold text-ink disabled:opacity-50"
        >
          {t("diag.send")}
        </button>
      </form>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {t("diag.disclaimer")}
      </p>
    </div>
  );
}

function Account({
  user,
  locked,
  onBack,
  onLogout,
  onDeleted,
  onPrivacy,
  onSupport,
  flash,
  bump,
  onSaved,
}: {
  user: User;
  locked: Provider | null;
  onBack: () => void;
  onLogout: () => void;
  onDeleted: () => void;
  onPrivacy: () => void;
  onSupport: () => void;
  flash: (s: string) => void;
  bump: () => void;
  onSaved: (u: User) => void;
}) {
  const { locale, t } = useI18n();
  const shop = user.shopId ? Store.shopRecord(user.shopId) : null;
  const canEditShop = user.role === "shop" && user.shopRole === "owner" && !!shop;
  const [shopName, setShopName] = useState(shop?.name || "");
  const [shopBio, setShopBio] = useState(shop?.bio || "");
  const [bizName, setBizName] = useState(user.businessName || user.name);
  const [indyBio, setIndyBio] = useState(user.bio || "");
  const [mode, setMode] = useState<User["serviceMode"]>(user.serviceMode || "both");
  const [techName, setTechName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(
    user.role === "shop" && user.shopRole === "owner" ? shop?.photo || "" : user.photo || "",
  );
  const [shopSupportEmail, setShopSupportEmail] = useState(shop?.supportEmail || "");
  const [shopSupportPhone, setShopSupportPhone] = useState(shop?.supportPhone || "");
  const [indySupportEmail, setIndySupportEmail] = useState(user.supportEmail || user.email || "");
  const [indySupportPhone, setIndySupportPhone] = useState(user.supportPhone || user.phone || "");
  const [shopDays, setShopDays] = useState(shop?.hoursDays || "123456");
  const [shopOpen, setShopOpen] = useState(shop?.hoursOpen || "08:00");
  const [shopClose, setShopClose] = useState(shop?.hoursClose || "16:00");
  const [indyDays, setIndyDays] = useState(user.hoursDays || "123456");
  const [indyOpen, setIndyOpen] = useState(user.hoursOpen || "08:00");
  const [indyClose, setIndyClose] = useState(user.hoursClose || "16:00");
  const [deletePw, setDeletePw] = useState("");
  const [deleting, setDeleting] = useState(false);
  void locked;
  const label =
    user.role === "shop"
      ? user.shopRole === "owner"
        ? t("account.shopOwner")
        : t("account.shopTech")
      : user.role === "independent"
        ? t("account.indyMech")
        : t("account.customer");

  return (
    <div>
      <Top title={t("account.title")} onBack={onBack} />
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <Face src={profilePhoto} name={user.name} size="lg" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-muted">
              {user.email || t("account.noEmail")}
              <br />
              {user.phone || t("account.noPhone")}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-surface2 px-2 py-0.5 text-[11px] font-semibold">{label}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-line bg-surface p-4">
        <PhotoPicker
          slot={PROFILE_PHOTO_SLOT}
          value={profilePhoto}
          name={user.role === "independent" ? bizName || user.name : shop?.name || user.name}
          label={
            user.role === "shop" && user.shopRole === "owner"
              ? t("photo.shopLabel")
              : t("photo.profileLabel")
          }
          hint={
            user.role === "independent"
              ? t("photo.indyHint")
              : user.role === "shop" && user.shopRole === "owner"
                ? t("photo.shopHint")
                : t("photo.profileHint")
          }
          onErr={(msg) => flash(translateStoreError(locale, msg))}
          onPick={async (dataUrl) => {
            const res = await Store.saveProfilePhoto(user, dataUrl);
            if (!res.ok) {
              flash(translateStoreError(locale, res.error));
              return;
            }
            setProfilePhoto(dataUrl);
            onSaved(res.user);
            flash(t("toast.profilePhotoSaved"));
          }}
        />
      </div>
      <div className="mt-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.language")}</p>
        <p className="mt-1 mb-3 text-sm text-muted">{t("account.languageHint")}</p>
        <LanguageToggle />
      </div>
      <div className="mt-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.alerts")}</p>
        <p className="mt-2 text-sm text-muted">
          {user.role === "customer" ? t("account.alertsCustomer") : t("account.alertsProvider")}
        </p>
        <button
          type="button"
          className="mt-3 h-11 w-full rounded-xl border border-line bg-surface2 font-semibold"
          onClick={async () => {
            if (typeof Notification === "undefined") {
              flash(t("toast.alertsUnsupported"));
              return;
            }
            const perm = await Notification.requestPermission();
            if (perm !== "granted") {
              await Store.saveAlerts(user, user.pushToken || "", false);
              return flash(t("toast.alertsOff"));
            }
            const token = "web-" + user.id;
            const res = await Store.saveAlerts(user, token, true);
            if (!res.ok) return flash(translateStoreError(locale, res.error));
            onSaved(res.user);
            try {
              new Notification(t("app.name"), { body: t("account.alertsNotifBody") });
            } catch {
              /* ignore */
            }
            flash(t("toast.alertsOn"));
          }}
        >
          {user.alertsOn ? t("account.alertsOnBtn") : t("account.alertsTurnOn")}
        </button>
      </div>
      {shop && (
        <form
          className="mt-3 rounded-xl border border-line bg-surface p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canEditShop) return;
            const res = await Store.updateShopProfile(user, {
              name: shopName,
              bio: shopBio,
              profilePhoto,
              supportEmail: shopSupportEmail,
              supportPhone: shopSupportPhone,
              hoursDays: shopDays,
              hoursOpen: shopOpen,
              hoursClose: shopClose,
            });
            if (!res.ok) return flash(translateStoreError(locale, res.error));
            onSaved(res.user);
            flash(t("toast.shopSaved"));
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.publicShop")}</p>
          <div className="mt-3 flex flex-col gap-3">
          {canEditShop ? (
            <Field label={t("account.shopName")}>
              <input className={inputClass} value={shopName} onChange={(e) => setShopName(e.target.value)} required />
            </Field>
          ) : (
            <h2 className="font-semibold">{shop.name}</h2>
          )}
          <Field label={t("account.bioCustomers")}>
            {canEditShop ? (
              <>
                <textarea
                  className={inputClass + " min-h-28"}
                  value={shopBio}
                  maxLength={BIO_MAX}
                  onChange={(e) => setShopBio(e.target.value.slice(0, BIO_MAX))}
                  placeholder={t("account.shopBioPh")}
                />
                <p className="mt-1 text-right text-xs text-dim tabular-nums">
                  {shopBio.length}/{BIO_MAX}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">{shop.bio || t("account.noBio")}</p>
            )}
          </Field>
          <Field label={t("account.supportEmail")}>
            {canEditShop ? (
              <input
                type="email"
                className={inputClass}
                value={shopSupportEmail}
                onChange={(e) => setShopSupportEmail(e.target.value)}
                placeholder="shop@yourdomain.com"
              />
            ) : (
              <p className="text-sm text-muted">{shop.supportEmail || t("account.notSet")}</p>
            )}
          </Field>
          <Field label={t("account.supportPhone")}>
            {canEditShop ? (
              <input
                className={inputClass}
                value={shopSupportPhone}
                onChange={(e) => setShopSupportPhone(e.target.value)}
                placeholder="(555) 555-0100"
              />
            ) : (
              <p className="text-sm text-muted">{shop.supportPhone || t("account.notSet")}</p>
            )}
          </Field>
          <HoursEditor
            days={shopDays}
            open={shopOpen}
            close={shopClose}
            onDays={setShopDays}
            onOpen={setShopOpen}
            onClose={setShopClose}
            canEdit={!!canEditShop}
          />
          </div>
          {canEditShop ? (
            <button type="submit" className="mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
              {t("account.saveShop")}
            </button>
          ) : null}
          <p className="mt-3 text-sm text-muted">{t("account.teamCode")}</p>
          <div className="my-2 font-mono text-2xl tracking-[0.2em]">{shop.code}</div>
          <p className="text-sm text-muted">{t("account.team", { names: shop.techs.join(", ") })}</p>
          {canEditShop && (
            <div className="mt-3 flex gap-2">
              <input
                className={inputClass}
                placeholder={t("account.addTechPh")}
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
              />
              <button
                type="button"
                className="h-12 shrink-0 rounded-xl border border-line px-3 font-semibold"
                onClick={async () => {
                  await Store.addTechName(shop.id, techName);
                  setTechName("");
                  flash(t("toast.techAdded"));
                  bump();
                }}
              >
                {t("account.add")}
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-dim">{t("account.customersUseCode")}</p>
        </form>
      )}
      {user.role === "independent" && (
        <form
          className="mt-3 rounded-xl border border-line bg-surface p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await Store.updateIndependentProfile(user, {
              businessName: bizName,
              bio: indyBio,
              serviceMode: mode,
              profilePhoto,
              supportEmail: indySupportEmail,
              supportPhone: indySupportPhone,
              hoursDays: indyDays,
              hoursOpen: indyOpen,
              hoursClose: indyClose,
            });
            if (!res.ok) return flash(translateStoreError(locale, res.error));
            onSaved(res.user);
            flash(t("toast.profileSaved"));
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.publicMech")}</p>
          <div className="mt-3 flex flex-col gap-3">
          <Field label={t("account.bizName")}>
            <input className={inputClass} value={bizName} onChange={(e) => setBizName(e.target.value)} required />
          </Field>
          <Field label={t("account.howYouWork")}>
            <select
              className={inputClass}
              value={mode}
              onChange={(e) => setMode(e.target.value as User["serviceMode"])}
            >
              <option value="mobile">{t("register.modeMobile")}</option>
              <option value="shop">{t("register.modeShop")}</option>
              <option value="both">{t("register.modeBoth")}</option>
            </select>
          </Field>
          <Field label={t("account.bioCustomers")}>
            <textarea
              className={inputClass + " min-h-28"}
              value={indyBio}
              maxLength={BIO_MAX}
              onChange={(e) => setIndyBio(e.target.value.slice(0, BIO_MAX))}
              placeholder={t("account.indyBioPh")}
            />
            <p className="mt-1 text-right text-xs text-dim tabular-nums">
              {indyBio.length}/{BIO_MAX}
            </p>
          </Field>
          <Field label={t("account.supportEmail")}>
            <input
              type="email"
              className={inputClass}
              value={indySupportEmail}
              onChange={(e) => setIndySupportEmail(e.target.value)}
              placeholder="you@yourdomain.com"
            />
          </Field>
          <Field label={t("account.supportPhone")}>
            <input
              className={inputClass}
              value={indySupportPhone}
              onChange={(e) => setIndySupportPhone(e.target.value)}
              placeholder="(555) 555-0100"
            />
          </Field>
          <HoursEditor
            days={indyDays}
            open={indyOpen}
            close={indyClose}
            onDays={setIndyDays}
            onOpen={setIndyOpen}
            onClose={setIndyClose}
            canEdit
          />
          </div>
          <button type="submit" className="mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
            {t("account.saveProfile")}
          </button>
          <p className="mt-2 text-xs text-dim">{t("account.qrOnShare")}</p>
        </form>
      )}
      <div className="mt-4 flex justify-center gap-4 text-sm font-semibold text-muted">
        <button type="button" onClick={onPrivacy} className="hover:text-fg">
          {t("welcome.privacy")}
        </button>
        <button type="button" onClick={onSupport} className="hover:text-fg">
          {t("welcome.support")}
        </button>
      </div>
      <button type="button" onClick={onLogout} className="mt-4 h-12 w-full rounded-xl border border-line bg-surface font-semibold">
        {t("account.logout")}
      </button>
      <form
        className="mt-3 rounded-xl border border-line bg-surface p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!deletePw) return flash(t("account.deleteNeedPw"));
          if (!window.confirm(t("account.deleteConfirm"))) return;
          setDeleting(true);
          const res = await Store.deleteAccount(user, deletePw);
          setDeleting(false);
          if (!res.ok) return flash(translateStoreError(locale, res.error));
          onDeleted();
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.deleteTitle")}</p>
        <p className="mt-2 text-sm text-muted">
          {t("account.deleteBody")}
        </p>
        <input
          type="password"
          className={inputClass + " mt-3"}
          placeholder={t("account.deletePw")}
          value={deletePw}
          onChange={(e) => setDeletePw(e.target.value)}
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={deleting}
          className="mt-3 h-12 w-full rounded-xl border border-red-500/40 bg-red-500/10 font-semibold text-red-200"
        >
          {deleting ? t("account.deleting") : t("account.deleteBtn")}
        </button>
      </form>
    </div>
  );
}

function LegalPage({ title, onBack }: { title: string; onBack: () => void }) {
  const { locale, t } = useI18n();
  return (
    <div>
      <Top title={title} onBack={onBack} />
      <p className="mb-3 text-sm text-muted">{t("legal.updated")}</p>
      <div className="flex flex-col gap-3">
        {privacySections(locale).map((s) => (
          <section key={s.title} className="rounded-xl border border-line bg-surface p-4">
            <h3 className="font-semibold">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function SupportPage({
  locked,
  user,
  onBack,
  onPrivacy,
}: {
  locked: Provider | null;
  user: User | null;
  onBack: () => void;
  onPrivacy: () => void;
}) {
  const shop = user?.shopId ? Store.shopRecord(user.shopId) : null;
  const fromAccount =
    user?.role === "independent"
      ? { name: user.businessName || user.name, email: user.supportEmail || user.email, phone: user.supportPhone || user.phone }
      : shop
        ? { name: shop.name, email: shop.supportEmail, phone: shop.supportPhone }
        : null;
  const { t } = useI18n();
  const contact = locked
    ? { name: locked.name, email: locked.supportEmail, phone: locked.supportPhone }
    : fromAccount;
  return (
    <div>
      <Top title={t("support.title")} onBack={onBack} />
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-sm text-muted">{t("support.intro")}</p>
        {contact ? (
          <div className="mt-3">
            <p className="font-semibold">{contact.name}</p>
            {contact.phone ? (
              <a className="mt-1 block text-[17px] font-semibold text-accent" href={`tel:${contact.phone}`}>
                {contact.phone}
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted">{t("support.noPhone")}</p>
            )}
            {contact.email ? (
              <a className="mt-1 block text-[17px] font-semibold text-accent" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted">{t("support.noEmail")}</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {t("support.scanFirst")}
          </p>
        )}
      </div>
      <div className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-muted">
        <p className="font-semibold text-fg">{t("support.thisApp")}</p>
        <p className="mt-2">
          {t("support.body")}
        </p>
        <button type="button" onClick={onPrivacy} className="mt-3 font-semibold text-accent">
          {t("support.readPrivacy")}
        </button>
      </div>
    </div>
  );
}

function HoursEditor({
  days,
  open,
  close,
  onDays,
  onOpen,
  onClose,
  canEdit,
}: {
  days: string;
  open: string;
  close: string;
  onDays: (v: string) => void;
  onOpen: (v: string) => void;
  onClose: (v: string) => void;
  canEdit: boolean;
}) {
  const { locale, t } = useI18n();
  const times = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const hours = { hoursDays: days, hoursOpen: open, hoursClose: close };
  return (
    <Field label={t("account.hours")}>
      {canEdit ? (
        <div>
          <div className="flex flex-wrap gap-1.5">
            {DAY_BITS.map((d) => {
              const on = days.includes(d.bit);
              return (
                <button
                  key={d.bit}
                  type="button"
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${on ? "bg-accent text-ink" : "border border-line bg-surface2 text-muted"}`}
                  onClick={() => {
                    const next = on ? days.replace(d.bit, "") : days + d.bit;
                    onDays([...next].sort().join(""));
                  }}
                >
                  {t(`hours.d${d.bit}` as MessageKey)}
                </button>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <SelectWrap>
              <select className={selectClass} value={open} onChange={(e) => onOpen(e.target.value)}>
                {times.map((time) => (
                  <option key={time} value={time}>
                    {t("hours.opens", { time: formatClock(locale, time) })}
                  </option>
                ))}
              </select>
            </SelectWrap>
            <SelectWrap>
              <select className={selectClass} value={close} onChange={(e) => onClose(e.target.value)}>
                {times.map((time) => (
                  <option key={time} value={time}>
                    {t("hours.closes", { time: formatClock(locale, time) })}
                  </option>
                ))}
              </select>
            </SelectWrap>
          </div>
          <p className="mt-2 text-sm text-muted">{formatHoursLabel(locale, hours)}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">{formatHoursLabel(locale, hours)}</p>
      )}
    </Field>
  );
}
