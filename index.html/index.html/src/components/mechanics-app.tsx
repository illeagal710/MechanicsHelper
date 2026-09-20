import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  House,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  QrCode,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { QrShare } from "@/components/qr-share";
import { BayPreview, Face, PhotoPicker, ProfilePhotoEditor } from "@/components/photo-input";
import { VehicleArt } from "@/components/vehicle-art";
import { BAY_PHOTO_SLOT, SYMPTOM_PHOTO_SLOT, VEHICLE_PHOTO_SLOT, hasBayPhoto, jobPhotoOf, symptomPhotoOf, ticketVehiclePhotoOf } from "@/lib/photos";
import {
  INVOICE_DESC_MAX,
  INVOICE_LINE_MAX,
  INVOICE_NOTE_MAX,
  blankInvoiceLine,
  canShareInvoice,
  formatInvoiceMoney,
  invoiceTotals,
  parseQty,
  parseTaxPct,
  parseUnitPrice,
  shareInvoiceImage,
  type InvoiceLine,
} from "@/lib/invoice";

import { diagnoseLocal, greet, isBookChip, bookingSymptomsFromChat } from "@/lib/diagnose";
import { mhDiagnose } from "@/lib/mh-api";
import { LanguageToggle, useI18n } from "@/lib/i18n-context";
import { ThemeToggle } from "@/lib/theme-context";
import { PolicyFooterLinks } from "@/components/legal-pages";
import {
  formatClock,
  formatHoursLabel,
  kindText,
  localeTag,
  statusText,
  translateDetail,
  translateNote,
  translateProfileTag,
  translateStoreError,
  type MessageKey,
  type TranslateFn,
} from "@/lib/i18n";
import {
  Store,
  BIO_MAX,
  DAY_BITS,
  soloMechanicDetail,
  type Job,
  type Provider,
  type Role,
  type StatusId,
  type User,
  fmtShort,
  fmtWhen,
  statusMeta,
  vehicleLabel,
} from "@/lib/store";
import { missingRequiredBookingFields, normalizeSymptoms } from "@/lib/booking";
import { addMonths, dayKey, monthGrid, monthKey } from "@/lib/booking-calendar";
import {
  BLOCK_AFTER_HOURS_CHOICES,
  normalizeBlockAfterHours,
  type BlockAfterHours,
} from "@/lib/booking-block";
import { resolveBookingProvider } from "@/lib/booking-provider";
import { isCompleteVehicle, vehicleFromTicket, vehicleKey, type VehicleFields } from "@/lib/customer-vehicles";
import {
  PIPELINE_STATUSES,
  canCustomerCancel,
  canManageAppointment,
  canDeclineStatus,
  declineReasonFromNotes,
  searchJobs,
  shopBoardJobs,
  type ShopBoardFilter,
} from "@/lib/job-status";
import { shouldSkipDuplicateNote } from "@/lib/job-notes";
import {
  activeJobsWithLatestUpdate,
  customerFacingNotes,
  isInternalNote,
  isNewProviderNote,
  latestProviderNote,
  markNotesSeen,
  notesNewestFirst,
  rankCustomerJobs,
  readSeenNoteAt,
} from "@/lib/job-updates";
import { trimOptions } from "@/lib/trims";
import {

  OTHER_VALUE,
  VEHICLE_COLOR_IDS,
  VEHICLE_DATA,
  YEARS,
  isCustomerVehiclePhoto,
  resolveListedOrOther,
  vehicleKind,
} from "@/lib/vehicles";
import {
  ADDRESS_MAX,
  CREDENTIAL_IDS,
  SERVICE_AREA_MAX,
  SPECIALTY_IDS,
  TAG_MAX,
  TAGS_MAX,
  isPresetTag,
  formatPublicPlace,
  sanitizeYearsWrenching,
  toggleTag,
} from "@/lib/shop-profile";
import { openDirections } from "@/lib/directions";
import {
  notificationsActive,
  notificationsSupported,
  permissionState,
  requestNotificationPermission,
  showLocalNotification,
} from "@/lib/notifications";
import {
  canRotateFindCode,
  canSeeTeamJoinCode,
  canShareCustomerQr,
  isAssignedToUser,
  isShopTechnician,
  rankShopJobsForViewer,
  shopPortalKind,
  usesWideProviderShell,
} from "@/lib/shop-role";
import {
  appointmentIcs,
  canCustomerDecideEstimate,
  downloadIcs,
  formatEstimateAmount,
  googleCalendarUrl,
  statusActionConfirm,
} from "@/lib/job-ops";
import { guestLandingView } from "@/lib/app-entry";
import { customerSmsKey, firstReachablePhone, formatPublicPhone, smsHref, telHref } from "@/lib/phone";

type View =
  | "welcome"
  | "login"
  | "register"
  | "recover"
  | "forgotPassword"
  | "forgotUsername"
  | "provider"
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

function providerNoteLabel(job: Pick<Job, "providerType" | "providerName">, t: TranslateFn) {
  if (job.providerType === "independent") {
    return t("job.updateFrom", { name: job.providerName });
  }
  return t("job.bayUpdate");
}

function calendarPayload(job: Job) {
  const hours = Store.hoursFor(job.providerId);
  return {
    id: job.id,
    slot: job.slot,
    providerName: job.providerName,
    year: job.year,
    make: job.make,
    model: job.model,
    address: hours?.address || "",
  };
}

function AddToCalendar({ job, flash }: { job: Job; flash?: (s: string) => void }) {
  const { t } = useI18n();
  const payload = calendarPayload(job);
  return (
    <div className="mt-3 grid grid-cols-2 gap-2" data-add-calendar="">
      <a
        href={googleCalendarUrl(payload)}
        target="_blank"
        rel="noreferrer"
        className="flex h-11 items-center justify-center rounded-xl border border-line bg-surface2 px-2 text-center text-xs font-semibold"
        data-google-calendar=""
      >
        {t("job.googleCalendar")}
      </a>
      <button
        type="button"
        data-ics-calendar=""
        className="h-11 rounded-xl border border-line bg-surface2 px-2 text-xs font-semibold"
        onClick={() => {
          downloadIcs(`${job.id}.ics`, appointmentIcs(payload));
          flash?.(t("toast.calendarSaved"));
        }}
      >
        {t("job.appleCalendar")}
      </button>
    </div>
  );
}

function ConfirmBar({
  message,
  onConfirm,
  onStay,
  confirmLabel,
}: {
  message: string;
  onConfirm: () => void;
  onStay: () => void;
  confirmLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="mb-3 rounded-xl border border-accent/40 bg-accent/10 p-3" data-inline-confirm="">
      <p className="text-sm leading-relaxed">{message}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          data-confirm-stay=""
          className="h-11 rounded-xl border border-line bg-surface font-semibold"
          onClick={onStay}
        >
          {t("job.confirmStay")}
        </button>
        <button
          type="button"
          data-confirm-continue=""
          className="h-11 rounded-xl bg-accent font-semibold text-ink"
          onClick={onConfirm}
        >
          {confirmLabel || t("job.confirmContinue")}
        </button>
      </div>
    </div>
  );
}

function TicketPhoneRow({
  callHref,
  textHref,
  callLabel,
  hint,
}: {
  callHref: string;
  textHref: string;
  callLabel: string;
  hint?: string;
}) {
  const { t } = useI18n();
  if (!callHref && !textHref) return null;
  return (
    <div className="mt-3" data-ticket-phone="">
      <div className="grid grid-cols-2 gap-2">
        {callHref ? (
          <a
            href={callHref}
            data-call-link=""
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface2 text-sm font-semibold"
          >
            <Phone className="size-4 shrink-0" aria-hidden />
            {callLabel}
          </a>
        ) : null}
        {textHref ? (
          <a
            href={textHref}
            data-text-link=""
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface2 text-sm font-semibold"
          >
            <MessageCircle className="size-4 shrink-0" aria-hidden />
            {t("job.textCustomer")}
          </a>
        ) : null}
      </div>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

function bayPhotoCopy(job: Pick<Job, "providerType">, shop: boolean, t: TranslateFn) {
  const indy = job.providerType === "independent";
  return {
    label: t(shop ? (indy ? "job.photoLabelIndy" : "job.photoLabel") : indy ? "job.progressPhoto" : "job.workPhoto"),
    hint: t(shop ? "job.photoHint" : "job.workPhotoHint"),
  };
}

function readRefFromUrl() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("ref") || "";
  return q.trim().toUpperCase();
}

export function MechanicsApp({
  initialView = "welcome",
}: {
  initialView?: "welcome" | "login" | "provider";
} = {}) {

  const { t } = useI18n();
  const [view, setView] = useState<View>(initialView);
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
    const fromLock = lockedProvider || Store.findProviderByCode(Store.getLinkedCode(u));
    const resolved = resolveBookingProvider({
      user: u,
      locked: fromLock,
      providers: Store.listProviders(),
      jobs: Store.providerJobs(u),
      linkedCode: Store.getLinkedCode(u),
      allowSavedBay: !Store.wasUnlinked(u),
    });
    if (resolved) {
      setLockedProvider(resolved);
      if (u.role === "customer" && (lockedProvider || Store.getLinkedCode(u) || Store.getRefCode())) {
        Store.setLinkedCode(u, resolved.code);
      }
    }
    const next = homeFor(u.role);
    if (u.role === "customer" && (lockedProvider || Store.getRefCode())) {
      if (draft) {
        setSelectedId(draft.id);
        setView("job");
      } else {
        setView("book");
      }
    } else setView(next);
    flash(t("toast.hi", { name: u.name.split(" ")[0] }));
  }

  useEffect(() => {
    let live = true;
    (async () => {
      await Store.hydrate();
      if (!live) return;
      const fromUrl = readRefFromUrl();
      if (fromUrl) Store.setRefCode(fromUrl);
      const s = Store.getSession();
      if (s) setUser(s);
      const urlProvider = Store.findProviderByCode(fromUrl || Store.getRefCode());
      const existingLink = fromUrl || Store.getRefCode() || (s ? Store.getLinkedCode(s) : "");
      const resolved = s
        ? resolveBookingProvider({
            user: s,
            locked: urlProvider,
            providers: Store.listProviders(),
            jobs: Store.providerJobs(s),
            linkedCode: Store.getLinkedCode(s),
            allowSavedBay: !Store.wasUnlinked(s),
          })
        : urlProvider;
      if (resolved) {
        setLockedProvider(resolved);
        if (s?.role === "customer" && existingLink) Store.setLinkedCode(s, resolved.code);
      }
      if (s) {
        setView(s.role === "customer" && (fromUrl || Store.getRefCode()) ? "book" : homeFor(s.role));
      } else {
        const landing = guestLandingView({
          wantsLogin: initialView === "login",
          signedIn: false,
          hasProvider: Boolean(resolved),
        });
        setView(landing);
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

  useEffect(() => {
    if (view === "share" && user && !canShareCustomerQr(user)) setView("shopHome");
  }, [view, user]);

  function applyCode(raw: string, goBook = true) {
    const p = Store.findProviderByCode(raw);
    if (!p) {
      flash(t("toast.noCode"));
      return;
    }
    Store.setLinkedCode(user, p.code);
    Store.setRefCode(p.code);
    setLockedProvider(p);
    flash(t("toast.found", { name: p.name }));
    if (!user) {
      setView(goBook ? "book" : "provider");
      return;
    }
    if (goBook && user.role === "customer") setView("book");
  }

  function startBooking() {
    if (!user || user.role === "customer") setView("book");
    else setView(homeFor(user.role));
  }

  function authBack() {
    setView(lockedProvider && !user ? "provider" : "welcome");
  }

  const isProvider = usesWideProviderShell(user);
  const showShare = canShareCustomerQr(user);
  const shareCode = showShare ? Store.customerCodeFor(user) : "";
  const portalKind = shopPortalKind(user);
  const liveLocked = lockedProvider
    ? Store.findProviderByCode(lockedProvider.code) || lockedProvider
    : null;
  const unsignedChrome =
    !user ||
    view === "welcome" ||
    view === "login" ||
    view === "register" ||
    view === "recover" ||
    view === "forgotPassword" ||
    view === "forgotUsername" ||
    view === "provider";
  const showWordmark = unsignedChrome;
  const bayLabel = isShopTechnician(user)
    ? t("shop.techBadge", { shop: user?.shopName || t("shop.shop") })
    : isProvider
      ? shareCode || t("app.bay")
      : lockedProvider?.code || t("app.bay");

  const shellMax = isProvider ? "max-w-[430px] md:max-w-[980px]" : "max-w-[430px]";

  return (
    <div
      data-app-shell={isProvider ? "provider" : "customer"}

      data-app-view={view}

      data-wide-shell={isProvider ? "true" : "false"}
      className={`mx-auto flex min-h-dvh w-full flex-col bg-bg shadow-[0_0_0_1px_var(--color-line)] ${shellMax}`}
    >
      <header className="flex items-center justify-between gap-2 px-4 pt-3" data-app-header="" data-shop-portal={portalKind || undefined}>
        {showWordmark ? (
          <BrandWordmark className="h-[72px] w-auto max-w-[min(220px,58%)] object-contain object-left" />
        ) : (
          <span
            className={`text-xs font-semibold text-dim ${isShopTechnician(user) ? "" : "font-mono"}`}
            data-tech-badge={isShopTechnician(user) ? "true" : undefined}
          >
            {bayLabel}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted">
          <ThemeToggle compact />
          <LanguageToggle compact />
          {showWordmark ? <span className="font-mono text-dim">{bayLabel}</span> : null}
        </div>
      </header>
      <main className={`flex-1 overflow-y-auto px-4 pt-3 ${isProvider ? "md:px-6" : ""} ${unsignedChrome ? "pb-16" : "pb-36"}`}>
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
        {view === "provider" && (
          <GuestProviderPage
            provider={liveLocked}
            onBook={startBooking}
            onLogin={() => setView("login")}
            onRegister={() => setView("register")}
          />
        )}
        {view === "login" && (
          <Login
            onBack={authBack}
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
          <Register
            onBack={authBack}
            onOk={enter}
            onErr={flash}
            customerOnly={Boolean(liveLocked)}
            shopName={liveLocked?.name}
          />
        )}
        {view === "home" && user && (
          <CustomerHome
            user={user}
            locked={liveLocked}
            codeInput={codeInput}
            setCodeInput={setCodeInput}
            onApply={() => applyCode(codeInput)}
            go={setView}
            onOpenJob={(id) => {
              setSelectedId(id);
              setView("job");
            }}
          />
        )}
        {view === "book" && (!user || user.role === "customer") && (
          <Book
            user={user}
            locked={liveLocked}
            onLink={(code) => applyCode(code)}
            onBack={() => setView(user ? "home" : liveLocked ? "provider" : "welcome")}
            onBooked={(j) => {
              setDraft(j);
              setView("confirm");
            }}
            onErr={flash}
            onRegister={() => setView("register")}
          />
        )}
        {view === "confirm" && draft && (
          <Confirm
            job={draft}
            guest={!user}
            onTrack={() => { setSelectedId(draft.id); setView(user ? "track" : "job"); }}
            onHome={() => setView(user ? "home" : liveLocked ? "provider" : "welcome")}
            onRegister={() => setView("register")}
          />
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
          <JobDetail
            id={selectedId}
            shop={false}
            user={user || undefined}
            onBack={() => setView(user ? "track" : draft ? "confirm" : liveLocked ? "provider" : "welcome")}
            bump={bump}
            flash={flash}
            tick={tick}
          />
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
        {view === "share" && user && shareCode && showShare && (
          <div>
            <Top title={t("share.titleQr")} onBack={() => setView("shopHome")} />
            <QrShare
              key={shareCode}
              code={shareCode}
              title={user.role === "independent" ? user.businessName || user.name : user.shopName || t("share.yourShop")}
              canRotate={canRotateFindCode(user)}
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
            {canRotateFindCode(user) ? (
              <ClaimFindCode
                user={user}
                onClaimed={(code) => {
                  setUser(Store.getSession());
                  flash(t("toast.newCode", { code }));
                  bump();
                }}
                onErr={flash}
              />
            ) : null}

            {canSeeTeamJoinCode(user) ? (
              <TeamJoinCard code={Store.teamJoinCodeFor(user)} />
            ) : null}

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
              setView(liveLocked ? "provider" : "welcome");
            }}
            onDeleted={() => {
              setUser(null);
              setLockedProvider(null);
              setView("welcome");
              flash(t("toast.accountDeleted"));
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
        {user && !["welcome", "login", "register", "recover", "forgotPassword", "forgotUsername", "provider"].includes(view) && (
        <nav className={`fixed bottom-0 left-1/2 z-20 w-full -translate-x-1/2 border-t border-line bg-bg/95 px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur ${shellMax}`}>
          {isProvider ? (
            <div className={`grid ${showShare ? "grid-cols-3" : "grid-cols-2"}`} data-provider-nav={portalKind || undefined}>
              <Tab active={view === "shopHome" || view === "shopJob"} onClick={() => setView("shopHome")} icon={<ClipboardList className="size-5" />} label={t("nav.jobs")} />
              {showShare ? (
                <Tab active={view === "share"} onClick={() => setView("share")} icon={<QrCode className="size-5" />} label={t("nav.qr")} />
              ) : null}
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
        <div className="fixed bottom-28 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[380px] -translate-x-1/2 rounded-xl border border-accent/40 bg-surface px-3.5 py-2.5 text-sm font-semibold text-fg shadow-lg">
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

function BrandWordmark({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <img
      src="/img/logo-wordmark.png"
      alt={t("app.name")}
      data-brand-wordmark=""
      className={className ?? "h-16 w-auto max-w-[220px] object-contain object-left [image-rendering:auto]"}
    />
  );
}

function Top({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <button type="button" onClick={onBack} className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface" aria-label={t("nav.back")}>
        <ArrowLeft className="size-4" />
      </button>
      <h2 className="min-w-0 flex-1 text-lg font-semibold">{title}</h2>
      {action ?? null}
    </div>
  );
}

function ClaimFindCode({
  user,
  onClaimed,
  onErr,
}: {
  user: User;
  onClaimed: (code: string) => void;
  onErr: (s: string) => void;
}) {
  const { locale, t } = useI18n();
  const [desired, setDesired] = useState("");
  const [busy, setBusy] = useState(false);

  const [formErr, setFormErr] = useState("");

  return (
    <form
      className="mt-3 rounded-xl border border-line bg-surface p-4"
      data-claim-code=""
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);

        setFormErr("");
        const res = await Store.claimCustomerCode(user, desired);
        setBusy(false);
        if (!res.ok) {
          const msg = translateStoreError(locale, res.error);
          setFormErr(msg);
          return onErr(msg);
        }

        setDesired("");
        onClaimed(res.code);
      }}
    >
      <Field label={t("share.pickCode")}>
        <input
          className={inputClass}
          value={desired}

          onChange={(e) => {
            setDesired(e.target.value.toUpperCase());
            setFormErr("");
          }}

          placeholder={t("share.pickCodePh")}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}

          data-claim-code-input=""

        />
      </Field>
      <button
        type="submit"
        disabled={busy || !desired.trim()}
        className="mt-3 h-11 w-full rounded-xl bg-accent font-semibold text-ink disabled:opacity-60"

        data-claim-code-submit=""
      >
        {t("share.useCode")}
      </button>
      {formErr ? (
        <p className="mt-2 text-sm font-semibold text-red-600" data-claim-code-error="">
          {formErr}
        </p>
      ) : (
        <p className="mt-2 text-xs text-dim">{t("share.pickCodeHint")}</p>
      )}

    </form>
  );
}


function TeamJoinCard({ code }: { code: string }) {
  const { t } = useI18n();
  return (
    <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-team-join-code="">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("share.teamJoin")}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.18em] text-ink">{code || "—"}</p>
      <p className="mt-2 text-sm text-muted">{t("share.teamJoinHint")}</p>
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

function Fieldset({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-bg2 px-3 py-3 text-base text-fg outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20";

const selectClass =
  inputClass +
  " appearance-none pr-11 font-semibold tracking-tight";

function profileTagLabel(locale: "en" | "es", kind: "spec" | "cred", tag: string) {
  return translateProfileTag(locale, kind, tag);
}

function TagPills({
  kind,
  tags,
}: {
  kind: "spec" | "cred";
  tags: string[];
}) {
  const { locale } = useI18n();
  if (!tags.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" data-profile-tags={kind}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-accent/30 bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-fg"
        >
          {profileTagLabel(locale, kind, tag)}
        </span>
      ))}
    </div>
  );
}

function PublicProviderCard({
  provider,
  eyebrow,
  children,
  compact,
}: {
  provider: Provider;
  eyebrow: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  const { locale, t } = useI18n();
  const specialties = provider.specialties || [];
  const credentials = provider.credentials || [];
  const years = provider.yearsWrenching || "";
  return (
    <div
      className={`${compact ? "" : "mb-3 "}rounded-xl border border-accent/40 bg-accent/10 p-4`}
      data-public-provider-card=""
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
      <div className="mt-2 flex items-start gap-3">
        <Face src={provider.photo} name={provider.name} size="lg" />
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{provider.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {t("welcome.referredCode", { detail: translateDetail(locale, provider.detail), code: provider.code })}
          </p>
          {provider.serviceArea ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted" data-public-place="">
              <MapPin className="size-3.5 shrink-0 text-accent" aria-hidden />
              {t("profile.basedIn", { area: formatPublicPlace(provider.serviceArea) })}
            </p>
          ) : null}
        </div>
      </div>
      {provider.address ? (
        <div className="mt-2 flex items-start justify-between gap-3 rounded-lg border border-line bg-surface p-3">
          <p className="flex items-start gap-1.5 text-sm text-fg">
            <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <span data-public-address="">{formatPublicPlace(provider.address)}</span>
          </p>
          <button
            type="button"
            onClick={() => openDirections(provider.address || "")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-ink"
            data-directions=""
          >
            <Navigation className="size-3.5" aria-hidden />
            {t("profile.directions")}
          </button>
        </div>
      ) : null}
      {provider.bio ? <p className="mt-2 text-sm text-fg">{provider.bio}</p> : null}
      <TagPills kind="spec" tags={specialties} />
      <TagPills
        kind="cred"
        tags={[
          ...credentials,
          ...(years ? [t("profile.years", { n: years })] : []),
        ]}
      />
      <p className="mt-2 text-sm text-muted">{formatHoursLabel(locale, provider)}</p>
      {(provider.supportPhone || provider.supportEmail) && (
        <p className="mt-2 text-sm text-muted" data-public-contact="">
          {provider.supportPhone ? (
            <span data-public-phone="">{formatPublicPhone(provider.supportPhone)}</span>
          ) : null}
          {provider.supportPhone && provider.supportEmail ? " · " : ""}
          {provider.supportEmail ? provider.supportEmail : ""}
        </p>
      )}
      {children}
    </div>
  );
}

function ChipEditor({
  kind,
  value,
  onChange,
  canEdit,
  empty,
}: {
  kind: "spec" | "cred";
  value: string[];
  onChange: (next: string[]) => void;
  canEdit: boolean;
  empty: string;
}) {
  const { locale, t } = useI18n();
  const [other, setOther] = useState("");
  const presets = kind === "spec" ? SPECIALTY_IDS : CREDENTIAL_IDS;
  if (!canEdit) {
    return value.length ? <TagPills kind={kind} tags={value} /> : <p className="text-sm text-muted">{empty}</p>;
  }
  return (
    <div data-chip-editor={kind}>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((id) => {
          const on = value.includes(id);
          return (
            <button
              key={id}
              type="button"
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                on ? "bg-accent text-ink" : "border border-line bg-surface2 text-muted"
              }`}
              onClick={() => onChange(toggleTag(value, id, presets))}
            >
              {profileTagLabel(locale, kind, id)}
            </button>
          );
        })}
        {value
          .filter((tag) => !isPresetTag(tag, presets))
          .map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-ink"
              onClick={() => onChange(toggleTag(value, tag, presets))}
            >
              {tag} ×
            </button>
          ))}
      </div>
      {value.length < TAGS_MAX ? (
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            maxLength={TAG_MAX}
            placeholder={t("account.otherTag")}
            value={other}
            onChange={(e) => setOther(e.target.value.slice(0, TAG_MAX))}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const next = toggleTag(value, other, presets);
              if (next.length !== value.length || next.some((tag) => !value.includes(tag))) {
                onChange(next);
                setOther("");
              }
            }}
          />
          <button
            type="button"
            className="h-12 shrink-0 rounded-xl border border-line px-3 font-semibold"
            onClick={() => {
              const next = toggleTag(value, other, presets);
              if (next.length !== value.length || next.some((tag) => !value.includes(tag))) {
                onChange(next);
                setOther("");
              }
            }}
          >
            {t("account.addOther")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

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
}: {
  locked: Provider | null;
  codeInput: string;
  setCodeInput: (s: string) => void;
  onApply: () => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const { t } = useI18n();
  return (
    <div>
      <p className="mb-4 text-xs text-muted">{t("app.tagline")}</p>
      {locked ? (
        <PublicProviderCard provider={locked} eyebrow={t("welcome.referred")}>
          <p className="mt-2 text-sm text-muted">{t("welcome.referredLogin")}</p>
        </PublicProviderCard>
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
      {locked ? null : (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4" data-find-code-entry="">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("welcome.haveCode")}</p>
          <div className="mt-2 flex gap-2">
            <input
              className={inputClass}
              placeholder={t("welcome.codePlaceholder")}
              aria-label={t("welcome.haveCode")}
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
      )}
      {locked ? (
        <div className="mt-3 flex items-center justify-center gap-3 text-sm" data-guest-auth="">
          <button type="button" onClick={onLogin} className="font-semibold text-muted underline-offset-2 hover:text-fg hover:underline">
            {t("welcome.login")}
          </button>
          <span className="text-dim" aria-hidden>
            ·
          </span>
          <button type="button" onClick={onRegister} className="font-semibold text-muted underline-offset-2 hover:text-fg hover:underline">
            {t("welcome.createAccount")}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          <button type="button" onClick={onLogin} className="h-12 rounded-xl bg-accent font-semibold text-ink">
            {t("welcome.login")}
          </button>
          <button type="button" onClick={onRegister} className="h-12 rounded-xl border border-line bg-surface font-semibold">
            {t("welcome.createAccount")}
          </button>
        </div>
      )}
      <PolicyFooterLinks />
    </div>
  );
}

function GuestProviderPage({
  provider,
  onBook,
  onLogin,
  onRegister,
}: {
  provider: Provider | null;
  onBook: () => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const { t } = useI18n();
  if (!provider) {
    return <p className="text-sm text-muted">{t("welcome.lookingUp")}</p>;
  }
  return (
    <div data-guest-provider={provider.code}>
      <PublicProviderCard provider={provider} eyebrow={t("welcome.referred")}>
        <p className="mt-2 text-sm text-muted">{t("welcome.referredLogin")}</p>
      </PublicProviderCard>
      <button
        type="button"
        data-guest-book=""
        onClick={onBook}
        className="mt-4 h-12 w-full rounded-xl bg-accent font-semibold text-ink"
      >
        {t("welcome.bookAppointment")}
      </button>
      <div className="mt-3 flex items-center justify-center gap-3 text-sm" data-guest-auth="">
        <button type="button" onClick={onLogin} className="font-semibold text-muted underline-offset-2 hover:text-fg hover:underline">
          {t("welcome.login")}
        </button>
        <span className="text-dim" aria-hidden>
          ·
        </span>
        <button
          type="button"
          data-guest-register=""
          onClick={onRegister}
          className="font-semibold text-muted underline-offset-2 hover:text-fg hover:underline"
        >
          {t("welcome.createAccount")}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-muted">{t("welcome.accountWhenBooking")}</p>
      <PolicyFooterLinks />
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
  customerOnly,
  shopName,
}: {
  onBack: () => void;
  onOk: (u: User) => void;
  onErr: (s: string) => void;
  customerOnly?: boolean;
  shopName?: string;
}) {
  const { locale, t } = useI18n();
  const [role, setRole] = useState<Role>("customer");
  const [join, setJoin] = useState<"create" | "join">("create");
  const effectiveRole = customerOnly ? "customer" : role;
  return (
    <form
      className="flex flex-col gap-3"
      data-register-customer-only={customerOnly ? "true" : undefined}
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const res = await Store.register({
          name: String(fd.get("name")),
          email: String(fd.get("email")),
          phone: String(fd.get("phone")),
          password: String(fd.get("pw")),
          role: effectiveRole,
          shopJoin: join,
          shopName: String(fd.get("shopName") || ""),
          shopCode: String(fd.get("shopCode") || ""),
          findCode: String(fd.get("findCode") || ""),
          businessName: String(fd.get("biz") || ""),
          serviceMode: (String(fd.get("mode") || "both") as User["serviceMode"]),
        });
        if (!res.ok) return onErr(translateStoreError(locale, res.error));
        onOk(res.user);
      }}
    >
      <Top title={t("register.title")} onBack={onBack} />
      {customerOnly ? (
        <p className="text-sm text-muted">{t("register.customerToBook", { name: shopName || t("shop.shop") })}</p>
      ) : null}
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
      {customerOnly ? null : (
        <>
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
      {role === "independent" ? <p className="text-sm text-muted">{t("register.roleHint")}</p> : null}
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
            <>

              <Field label={t("register.shopName")}>
                <input name="shopName" className={inputClass} placeholder={t("register.shopNamePh")} />
              </Field>
              <Field label={t("register.findCode")}>
                <input name="findCode" className={inputClass} placeholder={t("register.findCodePh")} autoCapitalize="characters" />
              </Field>
              <p className="-mt-1 text-xs text-dim">{t("register.findCodeHint")}</p>

            </>
          ) : (
            <>
              <Field label={t("register.shopCode")}>
                <input name="shopCode" className={inputClass} placeholder={t("register.shopCodePh")} autoCapitalize="characters" />
              </Field>
              <p className="-mt-1 text-xs text-dim">{t("register.shopCodeHint")}</p>
            </>
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
          <Field label={t("register.findCode")}>
            <input name="findCode" className={inputClass} placeholder={t("register.findCodePh")} autoCapitalize="characters" />
          </Field>
          <p className="-mt-1 text-xs text-dim">{t("register.findCodeHint")}</p>
        </>
      )}
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
  go,
  onOpenJob,
}: {
  user: User;
  locked: Provider | null;
  codeInput: string;
  setCodeInput: (s: string) => void;
  onApply: () => void;
  go: (v: View) => void;
  onOpenJob: (id: string) => void;
}) {
  const { locale, t } = useI18n();
  const dates = localeTag(locale);
  const latest = activeJobsWithLatestUpdate(Store.providerJobs(user));
  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{user.name}</div>
        </div>
        <button type="button" onClick={() => go("account")} className="h-9 rounded-xl border border-line px-3 text-sm font-semibold">
          {t("home.account")}
        </button>
      </div>
      {locked ? (
        <PublicProviderCard provider={locked} eyebrow={t("home.bookingWith")} />
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h1 className="text-[26px] font-bold leading-tight">{t("home.headline")}</h1>
          <p className="mt-2 text-sm text-muted">{t("home.sub")}</p>
        </div>
      )}
      {latest.length ? (
        <div className="mt-4 flex flex-col gap-2.5" data-home-latest-updates="">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("home.latestFromBay")}</p>
          {latest.slice(0, 3).map(({ job, note }) => {
            const seen = readSeenNoteAt(user.id, job.id);
            const isNew = isNewProviderNote(note, seen);
            return (
              <button
                key={job.id}
                type="button"
                data-latest-update={job.id}
                onClick={() => onOpenJob(job.id)}
                className={`tap w-full rounded-2xl border p-4 text-left ${
                  isNew ? "border-accent/50 bg-accent/10" : "border-line bg-surface"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isNew ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-ink" data-note-new="">
                      {t("job.newUpdate")}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("job.latestUpdate")}</span>
                  )}
                </div>
                <p className="mt-1.5 font-semibold">{vehicleLabel(job)}</p>
                <p className="text-sm text-muted">
                  {providerNoteLabel(job, t)} · {fmtShort(note.at, dates)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-fg">{translateNote(locale, note.text)}</p>
              </button>
            );
          })}
        </div>
      ) : null}
      {locked ? null : (
      <div className="mt-4 rounded-xl border border-line bg-surface p-4" data-find-code-entry="">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("welcome.haveCode")}</p>
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            placeholder={t("welcome.codePlaceholder")}
            aria-label={t("welcome.haveCode")}
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
      )}
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
  onLink,
  onBack,
  onBooked,
  onErr,
  onRegister,
}: {
  user: User | null;
  locked: Provider | null;
  onLink: (code: string) => void;
  onBack: () => void;
  onBooked: (j: Job) => void;
  onErr: (s: string) => void;
  onRegister?: () => void;
}) {
  const { locale, t } = useI18n();
  const providers = Store.listProviders();
  const savedVehicles = user ? Store.customerVehicles(user) : [];
  const [pickedVehicleKey, setPickedVehicleKey] = useState(savedVehicles[0] ? vehicleKey(savedVehicles[0]) : "");
  const pickedVehicle = savedVehicles.find((v) => vehicleKey(v) === pickedVehicleKey) || null;
  const [linkCode, setLinkCode] = useState("");

  const [symptomPhoto, setSymptomPhoto] = useState("");

  const [slotIso, setSlotIso] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  const pending = typeof window === "undefined" ? "" : sessionStorage.getItem("mh.symptoms") || "";
  const provider = resolveBookingProvider({
    user,
    locked,
    providers,
    jobs: user ? Store.providerJobs(user) : [],
    linkedCode: user ? Store.getLinkedCode(user) : Store.getRefCode(),
    allowSavedBay: user ? !Store.wasUnlinked(user) : Boolean(locked),
  });

  if (!provider) {
    return (
      <div>
        <Top title={t("book.title")} onBack={onBack} />
        <div className="rounded-xl border border-line bg-surface p-4" data-book-link-shop="" data-find-code-entry="">
          <p className="text-sm font-semibold">{t("book.linkTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("book.linkHint")}</p>
          <div className="mt-3 flex gap-2">
            <input
              className={inputClass}
              placeholder={t("welcome.codePlaceholder")}
              aria-label={t("welcome.haveCode")}
              value={linkCode}
              autoCapitalize="characters"
              onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") onLink(linkCode);
              }}
            />
            <button
              type="button"
              onClick={() => onLink(linkCode)}
              className="h-12 shrink-0 rounded-xl bg-accent px-4 font-semibold text-ink"
            >
              {t("book.linkCta")}
            </button>
          </div>
          <button type="button" onClick={onBack} className="mt-3 text-sm font-semibold text-accent">
            {t("book.backHome")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      data-guest-book-form={user ? undefined : "true"}
      onSubmit={async (e) => {
        e.preventDefault();
        const f = e.currentTarget;
        const fd = new FormData(f);
        const picked = vehicleFromPickerForm(fd);
        const savedMatch = savedVehicles.find((v) => vehicleKey(v) === vehicleKey(picked)) || pickedVehicle;
        const job: Job = {
          id: Store.jobCode(),
          userId: user?.id,
          createdAt: Date.now(),
          name: String(fd.get("name")),
          phone: String(fd.get("phone")).replace(/\D/g, ""),
          email: String(fd.get("email")),
          year: picked.year,
          make: picked.make,
          model: picked.model,
          trim: picked.trim,
          vehiclePhoto: picked.photo || savedMatch?.photo || "",
          color: picked.color || savedMatch?.color || "",
          symptoms: normalizeSymptoms(fd.get("symptoms")),
          slot: new Date(String(fd.get("slot"))).toISOString(),
          status: "scheduled",
          providerId: provider.id,
          providerType: provider.type,
          providerName: provider.name,
          assignedTo: "",
          notes: [{ at: Date.now(), text: user ? "Booked from customer app." : "Booked as guest.", by: "system" }],
          notifySms: fd.get("notifySms") === "on",
          symptomPhoto: symptomPhoto || undefined,
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
        Store.setLinkedCode(user, provider.code);
        if (user) {
          Store.addCustomerVehicle(user, {
            year: job.year,
            make: job.make,
            model: job.model,
            trim: job.trim,
            photo: job.vehiclePhoto,
            color: job.color,
          });
        }
        sessionStorage.removeItem("mh.symptoms");
        onBooked(job);
      }}
    >
      <Top title={t("book.title")} onBack={onBack} />
      {!user ? (
        <p className="text-sm text-muted" data-guest-book-hint="">
          {t("book.guestHint")}
        </p>
      ) : null}
      <div data-booking-bay="">
        <PublicProviderCard provider={provider} eyebrow={t("book.withShop", { name: provider.name })} compact />
      </div>
      <Field label={t("book.yourName")}>
        <input name="name" className={inputClass} defaultValue={user?.name || ""} required />
      </Field>
      <Field label={t("book.phone")}>
        <input name="phone" className={inputClass} defaultValue={user?.phone || ""} required />
      </Field>
      <div data-book-slot="">
      <Fieldset label={t("book.preferredTime")}>
        <input type="hidden" name="slot" value={slotIso} />
        <SlotCalendar
          providerId={provider.id}
          selected={slotIso}
          onSelect={setSlotIso}
          locale={locale}
        />

        {Store.openSlots(provider.id).length === 0 ? (
          <p className="mt-2 text-sm text-accent2">{t("book.bayFull")}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">{t("book.takenHint")}</p>
        )}
      </Fieldset>
      </div>
      {savedVehicles.length ? (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("book.yourVehicles")}</p>
          <div className="mt-2 flex flex-col gap-2">
            {savedVehicles.map((v) => {
              const key = vehicleKey(v);
              const active = key === pickedVehicleKey;
              return (
                <button
                  key={key}
                  type="button"
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left ${
                    active ? "border-accent bg-accent/10" : "border-line bg-bg2"
                  }`}
                  onClick={() => setPickedVehicleKey(key)}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{vehicleLabel(v)}</span>
                    <span className="text-sm text-muted">{t("book.useVehicle")}</span>
                  </span>
                  <VehicleArt
                    make={v.make}
                    model={v.model}
                    vehiclePhoto={v.photo}
                    color={v.color}
                    className="h-10 w-[3.6rem] shrink-0 rounded-lg"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <VehiclePicker key={pickedVehicleKey || "new"} defaults={pickedVehicle || undefined} optionalOpen={moreOpen} />
      <button
        type="button"
        data-book-more=""
        data-book-more-open={moreOpen ? "true" : "false"}
        onClick={() => setMoreOpen((open) => !open)}
        className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-semibold text-muted"
      >
        <ChevronDown className={`size-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} aria-hidden />
        {moreOpen ? t("book.hideDetails") : t("book.moreDetails")}
      </button>
      {moreOpen ? (
        <div data-book-optional="" className="flex flex-col gap-3">
          <Field label={t("book.email")}>
            <input name="email" type="email" className={inputClass} defaultValue={user?.email || ""} />
          </Field>
          <Field label={t("book.whatsGoingOn")}>
            <textarea
              name="symptoms"
              className={inputClass + " min-h-28"}
              defaultValue={pending}
              placeholder={t("book.symptomsPh")}
            />
            <p className="mt-2 text-sm text-muted">{t("book.symptomsHint")}</p>
          </Field>
          <div className="rounded-xl border border-line bg-surface p-4" data-symptom-photo-picker="">
            <PhotoPicker
              slot={SYMPTOM_PHOTO_SLOT}
              value={symptomPhoto}
              name={t("book.symptomPhoto")}
              label={t("book.symptomPhoto")}
              hint={t("book.symptomPhotoHint")}
              onErr={(msg) => onErr(translateStoreError(locale, msg))}
              onPick={async (dataUrl) => {
                setSymptomPhoto(dataUrl);
              }}
            />
          </div>
          {user ? (
            <label data-book-notify="" className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
              <input type="checkbox" name="notifySms" defaultChecked className="mt-1 size-4 accent-amber-400" />
              <span>{t("book.notifySms")}</span>
            </label>
          ) : null}
        </div>
      ) : (
        <>
          <input type="hidden" name="email" defaultValue={user?.email || ""} />
          <input type="hidden" name="symptoms" defaultValue={pending} />
          {user ? <input type="hidden" name="notifySms" value="on" /> : null}
        </>
      )}
      <button type="submit" className="h-12 rounded-xl bg-accent font-semibold text-ink">
        {t("book.request")}
      </button>
      {!user && onRegister ? (
        <button
          type="button"
          onClick={onRegister}
          className="text-center text-sm font-semibold text-muted underline-offset-2 hover:text-fg hover:underline"
        >
          {t("book.guestTrackHint")}
        </button>
      ) : null}
    </form>
  );
}

function Confirm({
  job,
  guest,
  onTrack,
  onHome,
  onRegister,
}: {
  job: Job;
  guest?: boolean;
  onTrack: () => void;
  onHome: () => void;
  onRegister?: () => void;
}) {
  const { locale, t } = useI18n();
  return (
    <div data-guest-confirm={guest ? "true" : undefined}>
      <Top title={t("confirm.title")} onBack={onHome} />
      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-center">
        <p className="text-sm text-muted">{t("confirm.saveCode")}</p>
        <p className="font-mono text-3xl tracking-[0.18em] text-accent">{job.id}</p>
        <p className="mt-1 text-sm text-muted">{t("confirm.goingTo", { name: job.providerName })}</p>
        {guest ? <p className="mt-2 text-sm text-muted">{t("confirm.guestHint")}</p> : null}
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
        <VehicleArt
          make={job.make}
          model={job.model}
          vehiclePhoto={job.vehiclePhoto}
          color={job.color}
          className="block h-40 w-full"
        />
        <div className="p-4">
          <h3 className="font-semibold">{vehicleLabel(job)}</h3>
          <p className="text-sm text-muted">{fmtWhen(job.slot, localeTag(locale))}</p>
          <AddToCalendar job={job} />
        </div>
      </div>
      <button type="button" onClick={onTrack} className="mt-4 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
        {t("confirm.track")}
      </button>
      {guest && onRegister ? (
        <button
          type="button"
          data-guest-confirm-register=""
          onClick={onRegister}
          className="mt-3 w-full text-center text-sm font-semibold text-muted underline-offset-2 hover:text-fg hover:underline"
        >
          {t("confirm.createAccount")}
        </button>
      ) : null}
    </div>
  );
}

function JobCard({
  job,
  shop,
  onClick,
  userId,
  mine,
}: {
  job: Job;
  shop: boolean;
  onClick: () => void;
  userId?: string;
  mine?: boolean;
}) {
  const { locale, t } = useI18n();
  const st = statusMeta(job.status);
  const note = !shop ? latestProviderNote(job) : null;
  const isNew = !!(note && userId && isNewProviderNote(note, readSeenNoteAt(userId, job.id)));
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap w-full rounded-2xl border p-3.5 text-left ${mine ? "border-accent/40 bg-accent/10" : "border-line bg-surface"}`}
      data-job-id={job.id}
      data-job-status={job.status}
      data-assigned-to-you={mine ? "true" : undefined}
    >
      {mine ? (
        <span className="mb-2 inline-flex rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-ink">
          {t("shop.assignedToYou")}
        </span>
      ) : null}
      {shop && job.flaggedForOwner ? (
        <span className="mb-2 mr-2 inline-flex rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-bold text-danger" data-owner-flag="">
          {t("job.flagged")}
        </span>
      ) : null}
      {note ? (
        <div
          className={`mb-2.5 rounded-xl px-2.5 py-2 text-left ${isNew ? "bg-accent/15" : "bg-bg2"}`}
          data-job-card-update=""
        >
          <div className="flex items-center gap-2">
            {isNew ? (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-ink" data-note-new="">
                {t("job.newUpdate")}
              </span>
            ) : null}
            <span className="text-xs font-semibold text-fg">{providerNoteLabel(job, t)}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-fg">{translateNote(locale, note.text)}</p>
        </div>
      ) : null}
      <div className="flex gap-3">
        <VehicleArt
          make={job.make}
          model={job.model}
          vehiclePhoto={job.vehiclePhoto}
          color={job.color}
          photoSlot={VEHICLE_PHOTO_SLOT}
          className={`shrink-0 rounded-xl ${shop ? "h-[4.5rem] w-[5.25rem] md:h-20 md:w-28" : "h-16 w-[4.75rem]"}`}
        />
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
  const jobs = useMemo(() => {
    const list = q ? Store.findJobs(q, user) : Store.providerJobs(user);
    return rankCustomerJobs(list);
  }, [q, user]);
  return (
    <div>
      <Top title={t("track.title")} onBack={onBack} />
      <input className={inputClass} placeholder={t("track.placeholder")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3 flex flex-col gap-2.5">
        {jobs.length ? jobs.map((j) => <JobCard key={j.id} job={j} shop={false} userId={user.id} onClick={() => onOpen(j.id)} />) : <p className="p-6 text-center text-sm text-muted">{q ? t("track.emptySearch") : t("track.emptyBoard")}</p>}
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
  const [filter, setFilter] = useState<ShopBoardFilter>("active");
  const [query, setQuery] = useState("");
  const jobs = Store.providerJobs(user);
  const active = shopBoardJobs(jobs, "active");
  const ready = jobs.filter((j) => j.status === "ready").length;
  const busy = jobs.filter((j) => ["enroute", "checkedin", "diagnosing", "parts", "repair"].includes(j.status)).length;
  const list = rankShopJobsForViewer(searchJobs(shopBoardJobs(jobs, filter), query), user);
  const title = user.role === "independent" ? user.businessName || t("shop.independent") : user.shopName || t("shop.shop");
  const tech = isShopTechnician(user);
  const showShare = canShareCustomerQr(user);
  const publicBio =
    user.role === "independent"
      ? user.bio || ""
      : !tech && user.shopId
        ? Store.shopRecord(user.shopId)?.bio || ""
        : "";
  void tick;
  return (
    <div data-shop-home={shopPortalKind(user) || undefined}>
      <div className="mb-4 flex items-center gap-2.5">
        <Face
          src={user.role === "independent" ? user.photo : Store.shopRecord(user.shopId || "")?.photo}
          name={title}
          size="md"
        />
        <div className="min-w-0">
          <div className="font-bold">{title}</div>
          {tech ? (
            <span
              className="mt-1 inline-flex rounded-full bg-surface2 px-2 py-0.5 text-[11px] font-semibold"
              data-tech-badge=""
            >
              {t("shop.techBadge", { shop: title })}
            </span>
          ) : (
            <div className="text-xs text-muted">{user.role === "independent" ? t("shop.yourJobs") : user.name}</div>
          )}
        </div>
      </div>
      {tech ? <p className="mb-3 text-sm text-muted">{t("shop.techWorkHint")}</p> : publicBio ? <p className="mb-3 text-sm text-muted">{publicBio}</p> : null}
      {showShare ? (
      <button
        type="button"
        onClick={onShare}
        data-shop-find-code=""
        className="mb-3 w-full rounded-xl border border-line bg-surface p-4 text-left"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("shop.findCodeShort")}</p>
        <p className="font-mono text-2xl tracking-[0.2em] text-accent">{shareCode || "—"}</p>
        <p className="mt-1 text-sm text-muted">{t("shop.qrTabHint")}</p>
      </button>
      ) : null}
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
        {(["active", "ready", "history"] as const).map((f) => (
          <button key={f} type="button" data-shop-filter={f} onClick={() => setFilter(f)} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${filter === f ? "bg-surface2" : "text-muted"}`}>
            {f === "active" ? t("shop.open") : f === "ready" ? t("shop.ready") : t("shop.history")}
          </button>
        ))}
      </div>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" aria-hidden />
        <input
          className={inputClass + " pl-9" + (query ? " pr-9" : "")}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("shop.searchPlaceholder")}
          aria-label={t("shop.searchPlaceholder")}
          data-shop-search=""
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={t("shop.searchClear")}
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-dim"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2.5 md:grid md:grid-cols-2" data-shop-board="">
        {list.map((j) => (
          <JobCard key={j.id} job={j} shop mine={isAssignedToUser(j, user) && tech} onClick={() => onOpen(j.id)} />
        ))}
        {!list.length && (
          <p className="p-6 text-center text-sm text-muted">
            {query
              ? t("shop.searchEmpty")
              : filter === "history"
                ? t("shop.historyEmpty")
                : t("shop.empty")}
          </p>
        )}
      </div>
    </div>
  );
}

function invoiceBrandOf(job: Job): { name: string; photo: string } {
  const brand = Store.listProviders().find((p) => p.id === job.providerId);
  return { name: brand?.name || job.providerName, photo: brand?.photo || "" };
}

function TicketInvoice({
  job,
  shop,
  flash,
  bump,
}: {
  job: Job;
  shop: boolean;
  flash?: (s: string) => void;
  bump: () => void;
}) {
  const { locale, t } = useI18n();
  const saved = job.invoice;
  const [lines, setLines] = useState<InvoiceLine[]>(() =>
    saved?.lines?.length ? saved.lines : [blankInvoiceLine()],
  );
  const [qtyText, setQtyText] = useState<string[]>(() =>
    (saved?.lines?.length ? saved.lines : [blankInvoiceLine()]).map((l) => String(l.qty)),
  );
  const [priceText, setPriceText] = useState<string[]>(() =>
    (saved?.lines?.length ? saved.lines : [blankInvoiceLine()]).map((l) => (l.price ? String(l.price) : "")),
  );
  const [taxPct, setTaxPct] = useState(saved?.taxPct ? String(saved.taxPct) : "");
  const [note, setNote] = useState(saved?.note || "");
  const [paid, setPaid] = useState(saved?.paid === true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const current = Store.load().jobs.find((j) => j.id === job.id)?.invoice;
    const next = current?.lines?.length ? current.lines : [blankInvoiceLine()];
    setLines(next);
    setQtyText(next.map((l) => String(l.qty)));
    setPriceText(next.map((l) => (l.price ? String(l.price) : "")));
    setTaxPct(current?.taxPct ? String(current.taxPct) : "");
    setNote(current?.note || "");
    setPaid(current?.paid === true);
  }, [job.id]);

  if (!shop && !saved) return null;

  const liveLines = lines.map((line, i) => ({
    ...line,
    qty: parseQty(qtyText[i]),
    price: parseUnitPrice(priceText[i]),
  }));
  const totals = invoiceTotals(liveLines, parseTaxPct(taxPct));
  const brand = invoiceBrandOf(job);
  const vehicle = vehicleLabel(job);
  const number = saved?.number || "";

  function parsedLines(): InvoiceLine[] {
    return liveLines;
  }

  async function persist() {
    const nextLines = parsedLines();
    const check = canShareInvoice(nextLines);
    if (!check.ok) {
      flash?.(translateStoreError(locale, check.error));
      return null;
    }
    const res = await Store.saveInvoice(job.id, {
      lines: nextLines,
      taxPct: parseTaxPct(taxPct),
      note,
      paid,
    });
    if (!res.ok) {
      flash?.(translateStoreError(locale, res.error));
      return null;
    }
    bump();
    const inv = res.job?.invoice || Store.load().jobs.find((j) => j.id === job.id)?.invoice || null;
    if (inv) {
      const next = inv.lines.length ? inv.lines : [blankInvoiceLine()];
      setLines(next);
      setQtyText(next.map((l) => String(l.qty)));
      setPriceText(next.map((l) => (l.price ? String(l.price) : "")));
      setTaxPct(inv.taxPct ? String(inv.taxPct) : "");
      setNote(inv.note || "");
      setPaid(inv.paid === true);
    }
    return inv;
  }

  async function onCreate() {
    if (busy) return;
    setBusy(true);
    try {
      const inv = await persist();
      if (inv) flash?.(t("toast.invoiceSaved"));
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    if (busy) return;
    setBusy(true);
    try {
      const inv = await persist();
      if (!inv) return;
      const result = await shareInvoiceImage({
        shopName: brand.name,
        shopLogo: brand.photo,
        number: inv.number,
        paid: inv.paid,
        customerName: job.name,
        customerPhone: formatPublicPhone(job.phone) || job.phone,
        vehicle,
        lines: inv.lines,
        taxPct: inv.taxPct,
        note: inv.note,
      });
      flash?.(t(result === "downloaded" ? "toast.invoiceDownloaded" : "toast.invoiceShared"));
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "Could not share the invoice.";
      flash?.(translateStoreError(locale, msg));
    } finally {
      setBusy(false);
    }
  }

  if (!shop) {
    const view = saved!;
    const shown = invoiceTotals(view.lines, view.taxPct);
    return (
      <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-invoice-card="customer">
        <div className="flex items-start gap-3">
          <Face src={brand.photo} name={brand.name} size="sm" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("job.invoice")}</p>
            <p className="font-semibold" data-invoice-number="">
              {t("job.invoiceNumber", { number: view.number })}
            </p>
            <p className="text-sm text-muted">
              {job.name} · {vehicle}
            </p>
          </div>
          <span
            className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              view.paid ? "bg-accent/20 text-accent" : "bg-danger/15 text-danger"
            }`}
            data-invoice-status={view.paid ? "paid" : "unpaid"}
          >
            {view.paid ? t("job.invoicePaid") : t("job.invoiceUnpaid")}
          </span>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          {view.lines.filter((line) => line.description.trim()).map((line, i) => (
            <li key={`${line.description}-${i}`} className="flex justify-between gap-3">
              <span className="min-w-0">
                {line.description}
                <span className="text-muted">
                  {" "}
                  · {line.qty} × {formatInvoiceMoney(line.price)}
                </span>
              </span>
              <span className="shrink-0 font-medium">{formatInvoiceMoney(line.qty * line.price)}</span>
            </li>
          ))}
        </ul>
        {view.taxPct ? (
          <p className="mt-2 text-right text-sm text-muted">
            {t("job.invoiceTax")} {view.taxPct} · {formatInvoiceMoney(shown.tax)}
          </p>
        ) : null}
        <p className="mt-1 text-right text-base font-semibold" data-invoice-total="">
          {t("job.invoiceTotal")} {formatInvoiceMoney(shown.total)}
        </p>
        {view.note ? <p className="mt-2 text-sm text-muted">{view.note}</p> : null}
        <p className="mt-2 text-xs text-muted">{t("job.invoiceCustomerHint")}</p>
      </div>
    );
  }

  const lineClass = "rounded-lg border border-line bg-bg2 px-2 py-2 text-sm text-fg outline-none focus:border-accent";

  return (
    <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-invoice-card="shop">
      <div className="flex items-start gap-3">
        <Face src={brand.photo} name={brand.name} size="sm" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("job.invoice")}</p>
          <p className="font-semibold" data-invoice-number="">
            {number ? t("job.invoiceNumber", { number }) : t("job.invoicePendingNumber")}
          </p>
          <p className="text-sm text-muted">
            {job.name} · {vehicle}
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">{t("job.invoiceHint")}</p>
      <div className="mt-3 flex gap-2" data-invoice-paid-toggle="">
        <button
          type="button"
          data-invoice-unpaid=""
          className={`h-9 flex-1 rounded-full text-xs font-bold ${
            paid ? "border border-line bg-surface2 text-muted" : "bg-danger/15 text-danger"
          }`}
          onClick={() => setPaid(false)}
        >
          {t("job.invoiceUnpaid")}
        </button>
        <button
          type="button"
          data-invoice-paid=""
          className={`h-9 flex-1 rounded-full text-xs font-bold ${
            paid ? "bg-accent/20 text-accent" : "border border-line bg-surface2 text-muted"
          }`}
          onClick={() => setPaid(true)}
        >
          {t("job.invoicePaid")}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_3.25rem_4.75rem] gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
        <span>{t("job.invoiceDesc")}</span>
        <span>{t("job.invoiceQty")}</span>
        <span>{t("job.invoicePrice")}</span>
      </div>
      {lines.map((line, i) => (
        <div key={i} className="mt-1.5 grid grid-cols-[minmax(0,1fr)_3.25rem_4.75rem] gap-1.5" data-invoice-line="">
          <input
            className={lineClass}
            value={line.description}
            maxLength={INVOICE_DESC_MAX}
            placeholder={t("job.invoiceDescPh")}
            data-invoice-desc=""
            onChange={(e) =>
              setLines((prev) => prev.map((row, idx) => (idx === i ? { ...row, description: e.target.value } : row)))
            }
          />
          <input
            className={lineClass + " text-center"}
            inputMode="decimal"
            value={qtyText[i] ?? ""}
            data-invoice-qty=""
            onChange={(e) => setQtyText((prev) => prev.map((row, idx) => (idx === i ? e.target.value : row)))}
          />
          <input
            className={lineClass + " text-right"}
            inputMode="decimal"
            value={priceText[i] ?? ""}
            placeholder="0"
            data-invoice-price=""
            onChange={(e) => setPriceText((prev) => prev.map((row, idx) => (idx === i ? e.target.value : row)))}
          />
        </div>
      ))}
      {lines.length < INVOICE_LINE_MAX ? (
        <button
          type="button"
          data-invoice-add-line=""
          className="mt-2 text-sm font-semibold text-accent"
          onClick={() => {
            setLines((prev) => [...prev, blankInvoiceLine()]);
            setQtyText((prev) => [...prev, "1"]);
            setPriceText((prev) => [...prev, ""]);
          }}
        >
          {t("job.invoiceAddLine")}
        </button>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Field label={t("job.invoiceTax")}>
          <input
            className={inputClass}
            inputMode="decimal"
            value={taxPct}
            placeholder={t("job.invoiceTaxPh")}
            data-invoice-tax=""
            onChange={(e) => setTaxPct(e.target.value)}
          />
        </Field>
        <div className="flex flex-col justify-end pb-1 text-right">
          <p className="text-sm text-muted">
            {t("job.invoiceSubtotal")} {formatInvoiceMoney(totals.subtotal)}
          </p>
          {parseTaxPct(taxPct) ? (
            <p className="text-sm text-muted">{formatInvoiceMoney(totals.tax)}</p>
          ) : null}
          <p className="text-base font-semibold" data-invoice-total="">
            {t("job.invoiceTotal")} {formatInvoiceMoney(totals.total)}
          </p>
        </div>
      </div>
      <Field label={t("job.invoiceNote")}>
        <input
          className={inputClass}
          value={note}
          maxLength={INVOICE_NOTE_MAX}
          placeholder={t("job.invoiceNotePh")}
          data-invoice-note=""
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <button
        type="button"
        data-create-invoice=""
        disabled={busy}
        className="mt-3 h-11 w-full rounded-xl bg-accent font-semibold text-ink disabled:opacity-60"
        onClick={() => void onCreate()}
      >
        {t("job.invoiceCreate")}
      </button>
      <button
        type="button"
        data-share-invoice=""
        disabled={busy}
        className="mt-2 h-11 w-full rounded-xl border border-line bg-surface2 text-sm font-semibold disabled:opacity-60"
        onClick={() => void onShare()}
      >
        {t("job.invoiceShare")}
      </button>
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
  const [posting, setPosting] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [estAmount, setEstAmount] = useState("");
  const [estNote, setEstNote] = useState("");
  const [partsEta, setPartsEta] = useState("");
  const [partsNote, setPartsNote] = useState("");
  const [estOpen, setEstOpen] = useState(false);
  const [partsOpen, setPartsOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState(false);
  void tick;
  const job = Store.load().jobs.find((j) => j.id === id);

  useEffect(() => {
    setNoteText("");
    setPosting(false);
    setInternalNote(false);
    setEstAmount("");
    setEstNote("");
    setEstOpen(false);
    setDeclineOpen(false);
    setPendingStatus(null);
    setPendingCancel(false);
    const current = Store.load().jobs.find((j) => j.id === id);
    setPartsEta(current?.parts?.eta || "");
    setPartsNote(current?.parts?.note || "");
    setPartsOpen(current?.status === "parts");
  }, [id]);

  useEffect(() => {
    if (shop || !user?.id) return;
    const jobId = id;
    const userId = user.id;
    return () => {
      const current = Store.load().jobs.find((j) => j.id === jobId);
      if (!current) return;
      const latest = Math.max(0, ...current.notes.map((n) => n.at));
      if (latest) markNotesSeen(userId, jobId, latest);
    };
  }, [shop, user?.id, id]);

  if (!job) return <p className="text-muted">{t("job.notFound")}</p>;
  const st = statusMeta(job.status);
  const idx = (PIPELINE_STATUSES as readonly string[]).indexOf(job.status);
  const shopRec = user?.shopId ? Store.shopRecord(user.shopId) : null;
  const dates = localeTag(locale);
  const declined = job.status === "declined";
  const declineReason = declineReasonFromNotes(job.notes);
  const showDecline = shop && canDeclineStatus(job.status);
  const bayCopy = bayPhotoCopy(job, shop, t);
  const baySrc = jobPhotoOf(job);
  const bayFilled = hasBayPhoto(baySrc);
  const seenAt = user?.id ? readSeenNoteAt(user.id, job.id) : 0;
  const latestShop = latestProviderNote(job);
  const latestIsNew = !!(latestShop && !shop && isNewProviderNote(latestShop, seenAt));
  const visibleNotes = shop ? job.notes : customerFacingNotes(job.notes);
  const orderedNotes = notesNewestFirst(visibleNotes);
  const symptomSrc = symptomPhotoOf(job);
  const estimate = job.estimate;
  const hours = Store.hoursFor(job.providerId);
  const ownerPhone =
    Store.load().users.find((u) => u.shopId === job.providerId && u.shopRole === "owner")?.phone ||
    Store.load().users.find((u) => u.id === job.providerId)?.phone ||
    "";
  const shopPhone = firstReachablePhone(hours?.supportPhone, ownerPhone);
  const callCustomerHref = telHref(job.phone);
  const textCustomerHref = smsHref(
    job.phone,
    t(customerSmsKey(job.status), { shop: job.providerName }),
  );
  const callShopHref = telHref(shopPhone);
  const pendingAction = pendingStatus ? statusActionConfirm(job.status, pendingStatus, estimate) : null;
  const ticketId = job.id;

  async function applyShopStatus(next: string, skipEstimate: boolean) {
    const meta = statusMeta(next);
    const res = await Store.setJobStatus(ticketId, next as StatusId, { skipEstimate });
    if (!res.ok) {
      flash?.(translateStoreError(locale, res.error));
      return;
    }
    await Store.addNote(ticketId, "Status set to " + meta.label, "shop");
    flash?.(t("toast.statusUpdated"));
    setPendingStatus(null);
    if (next === "parts") setPartsOpen(true);
    bump();
  }

  async function postUpdate(text: string) {
    if (posting) return;
    const clean = text.trim();
    if (!clean) return;
    const current = Store.load().jobs.find((j) => j.id === id);
    if (!current) return;
    const by = internalNote ? "internal" : "shop";
    if (shouldSkipDuplicateNote(current.notes, clean, by)) {
      flash?.(t("toast.updateDuplicate"));
      return;
    }
    setPosting(true);
    try {
      await Store.addNote(current.id, clean, by);
      setNoteText("");
      flash?.(t("toast.updateSent"));
      bump();
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <Top title={job.id} onBack={onBack} />
      <div className={shop ? "md:grid md:grid-cols-2 md:items-start md:gap-5" : ""}>
        <div>
          <div className="overflow-hidden rounded-xl border border-line bg-surface" data-ticket-block="vehicle">
            <VehicleArt
              make={job.make}
              model={job.model}
              vehiclePhoto={job.vehiclePhoto}
              color={job.color}
              photoSlot={VEHICLE_PHOTO_SLOT}
              className={`block w-full ${shop ? "h-44 md:h-56" : "h-44"}`}
            />
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-dim">{kindText(locale, vehicleKind(job))}</p>
              <h2 className="text-lg font-semibold">{vehicleLabel(job)}</h2>
              <p className="text-sm text-muted">
                {job.name} · {job.providerName}
              </p>
              <p className="mt-1 text-sm font-medium text-fg/80" data-appointment-slot="">
                {t("job.appointment")} · {fmtWhen(job.slot, dates)}
              </p>
              <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold badge-${st.badge}`}>
                {statusText(locale, job.status, shop ? "shop" : "customer")}
              </span>
              {shop && job.flaggedForOwner ? (
                <span className="ml-2 inline-flex rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-bold text-danger" data-owner-flag="">
                  {t("job.flagged")}
                </span>
              ) : null}
              <AddToCalendar job={job} flash={flash} />
              {shop && !declined ? (
                <TicketPhoneRow
                  callHref={callCustomerHref}
                  textHref={textCustomerHref}
                  callLabel={t("job.callCustomer")}
                  hint={t("job.callCustomerHint")}
                />
              ) : null}
              <p className="mt-2 rounded-xl bg-bg2 p-2.5 text-sm text-muted">
                {job.symptoms || t("book.noSymptoms")}
              </p>
            </div>
          </div>

          {symptomSrc ? (
            <div
              className="mt-3 rounded-xl border border-line bg-surface p-4"
              data-ticket-photo={SYMPTOM_PHOTO_SLOT}
              data-symptom-empty="false"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("job.symptomPhoto")}</p>
              <p className="mt-1 text-sm text-muted">{t("job.symptomPhotoHint")}</p>
              <div className="mt-3"><BayPreview src={symptomSrc} /></div>
            </div>
          ) : null}
          {!shop && !user ? (
            <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-guest-ticket="">
              <p className="text-sm leading-relaxed text-muted">{t("job.guestManage")}</p>
              {callShopHref ? (
                <a
                  href={callShopHref}
                  data-call-shop=""
                  className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-accent font-semibold text-ink"
                >
                  <Phone className="size-4 shrink-0" aria-hidden />
                  {t("job.callShop")}
                </a>
              ) : null}
            </div>
          ) : !shop && user && canCustomerCancel(job.status) ? (
            <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-customer-actions="">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("job.manageTitle")}</p>
              {canManageAppointment(job) ? (
              <>
              {!rescheduling ? (
                <>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRescheduling(true)}
                    className="h-11 rounded-xl border border-line bg-surface2 font-semibold"
                    data-reschedule=""
                  >
                    {t("job.reschedule")}
                  </button>
                  <button
                    type="button"
                    disabled={busyAction}
                    data-cancel-appointment=""
                    onClick={() => setPendingCancel(true)}
                    className="h-11 rounded-xl border border-danger/40 bg-danger/10 font-semibold text-danger disabled:opacity-60"
                  >
                    {t("job.cancel")}
                  </button>
                </div>
              {pendingCancel ? (
                <ConfirmBar
                  message={t("job.cancelConfirm")}
                  confirmLabel={t("job.cancel")}
                  onStay={() => setPendingCancel(false)}
                  onConfirm={async () => {
                    if (busyAction) return;
                    setBusyAction(true);
                    const res = await Store.cancelJob(job.id);
                    setBusyAction(false);
                    setPendingCancel(false);
                    if (!res.ok) {
                      flash?.(translateStoreError(locale, res.error));
                      return;
                    }
                    flash?.(t("toast.canceled"));
                    bump();
                  }}
                />
              ) : null}
                </>
              ) : (
                <div className="mt-3">
                  <p className="mb-2 text-sm text-muted">{t("job.pickNewTime")}</p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {Store.openSlots(job.providerId).slice(0, 9).map((d) => (
                      <button
                        key={d.toISOString()}
                        type="button"
                        disabled={busyAction}
                        onClick={async () => {
                          if (busyAction) return;
                          setBusyAction(true);
                          const res = await Store.rescheduleJob(job.id, d.toISOString());
                          setBusyAction(false);
                          if (!res.ok) {
                            flash?.(translateStoreError(locale, res.error));
                            return;
                          }
                          setRescheduling(false);
                          flash?.(t("toast.rescheduled"));
                          bump();
                        }}
                        className="rounded-xl border border-line bg-bg2 p-2 text-xs font-semibold disabled:opacity-60"
                      >
                        {fmtWhen(d.toISOString(), dates)}
                      </button>
                    ))}
                  </div>
                  {Store.openSlots(job.providerId).length === 0 ? (
                    <p className="mt-1 text-sm text-muted">{t("job.noSlots")}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setRescheduling(false)}
                    className="mt-3 text-sm font-semibold text-muted underline"
                  >
                    {t("nav.back")}
                  </button>
                </div>
              )}
              </>
              ) : (
                <div className="mt-3" data-cancel-too-late="">
                  <p className="text-sm leading-relaxed text-muted">{t("job.cancelTooLate")}</p>
                  {callShopHref ? (
                    <a
                      href={callShopHref}
                      data-call-shop=""
                      className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-accent font-semibold text-ink"
                    >
                      <Phone className="size-4 shrink-0" aria-hidden />
                      {t("job.callShop")}
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-ticket-vehicle-photo="">
            <PhotoPicker
              slot={VEHICLE_PHOTO_SLOT}
              compact={shop}
              value={isCustomerVehiclePhoto(job.vehiclePhoto) ? job.vehiclePhoto : ""}
              name={vehicleLabel(job)}
              label={t("vehicle.photoLabel")}
              hint={
                isCustomerVehiclePhoto(job.vehiclePhoto) ? t("vehicle.photoHintTicket") : t("vehicle.photoHint")
              }
              onErr={(msg) => flash?.(translateStoreError(locale, msg))}
              onPick={async (dataUrl) => {
                await Store.saveVehiclePhoto(job.id, dataUrl);
                if (user?.role === "customer") {
                  Store.addCustomerVehicle(user, vehicleFromTicket({ ...job, photo: dataUrl, vehiclePhoto: dataUrl }));
                }
                flash?.(t("toast.vehiclePhotoSaved"));
                bump();
              }}
            />
          </div>

          {(shop || bayFilled) ? (
          <div
            className="mt-3 rounded-xl border border-line bg-surface p-4"
            data-ticket-photo={BAY_PHOTO_SLOT}
            data-bay-empty={bayFilled ? "false" : "true"}
          >
            {shop ? (
              <PhotoPicker
                slot={BAY_PHOTO_SLOT}
                compact
                value={baySrc}
                name={vehicleLabel(job)}
                label={bayCopy.label}
                hint={bayFilled ? bayCopy.hint : t("job.photoHintEmpty")}
                onErr={(msg) => flash?.(translateStoreError(locale, msg))}
                onPick={async (dataUrl) => {
                  await Store.saveJobPhoto(job.id, dataUrl);
                  flash?.(t("toast.bayPhotoSaved"));
                  bump();
                }}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{bayCopy.label}</p>
                  <p className="mt-1 text-sm text-muted">{bayCopy.hint}</p>
                </div>
                <BayPreview src={baySrc} />
              </div>
            )}
          </div>
          ) : null}
          {(estimate || shop || canCustomerDecideEstimate(estimate)) ? (
            <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-estimate-card="">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("job.estimate")}</p>
              {shop ? (
                <>
                  {estimate?.status === "approved" ? (
                    <p className="mt-2 text-sm font-semibold text-accent" data-estimate-status="approved">
                      {t("job.estimateApproved", { amount: formatEstimateAmount(estimate.amount) })}
                    </p>
                  ) : estimate?.status === "declined" ? (
                    <p className="mt-2 text-sm font-semibold text-danger" data-estimate-status="declined">
                      {t("job.estimateDeclined", { amount: formatEstimateAmount(estimate.amount) })}
                    </p>
                  ) : estimate?.status === "skipped" ? (
                    <p className="mt-2 text-sm text-muted" data-estimate-status="skipped">{t("job.estimateSkipped")}</p>
                  ) : estimate?.status === "sent" ? (
                    <p className="mt-2 text-sm" data-estimate-status="sent">
                      {formatEstimateAmount(estimate.amount)}
                      {estimate.note ? ` · ${estimate.note}` : ""} — {t("job.estimateWaiting")}
                    </p>
                  ) : null}
                  {estOpen ? (
                    <form
                      className="mt-3"
                      data-estimate-form=""
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const res = await Store.saveEstimate(job.id, estAmount, estNote);
                        if (!res.ok) {
                          flash?.(translateStoreError(locale, res.error));
                          return;
                        }
                        setEstAmount("");
                        setEstNote("");
                        setEstOpen(false);
                        flash?.(t("toast.estimateSent"));
                        bump();
                      }}
                    >
                      <p className="mb-2 text-sm text-muted">{t("job.estimateHint")}</p>
                      <Field label={t("job.estimateAmount")}>
                        <input
                          className={inputClass}
                          inputMode="decimal"
                          value={estAmount}
                          onChange={(e) => setEstAmount(e.target.value)}
                          placeholder="240"
                          data-estimate-amount=""
                        />
                      </Field>
                      <Field label={t("job.estimateNote")}>
                        <input
                          className={inputClass}
                          value={estNote}
                          onChange={(e) => setEstNote(e.target.value)}
                          placeholder={t("job.estimateNotePh")}
                        />
                      </Field>
                      <button type="submit" className="mt-2 h-11 w-full rounded-xl bg-accent font-semibold text-ink" data-send-estimate="">
                        {t("job.estimateSend")}
                      </button>
                      <button
                        type="button"
                        data-toggle-estimate=""
                        className="mt-2 h-11 w-full rounded-xl border border-line bg-surface2 text-sm font-semibold"
                        onClick={() => setEstOpen(false)}
                      >
                        {t("job.hideForm")}
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      data-toggle-estimate=""
                      className="mt-3 h-11 w-full rounded-xl border border-line bg-surface2 text-sm font-semibold"
                      onClick={() => setEstOpen(true)}
                    >
                      {estimate ? t("job.sendNewEstimate") : t("job.writeEstimate")}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-muted">{t("job.estimateCustomerHint")}</p>
                  {estimate?.status === "sent" ? (
                    <>
                      <p className="mt-2 text-lg font-semibold" data-estimate-status="sent">
                        {formatEstimateAmount(estimate.amount)}
                      </p>
                      {estimate.note ? <p className="text-sm text-muted">{estimate.note}</p> : null}
                      {user ? (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          data-approve-estimate=""
                          className="h-11 rounded-xl bg-accent font-semibold text-ink"
                          onClick={async () => {
                            const res = await Store.decideEstimate(job.id, true);
                            if (!res.ok) {
                              flash?.(translateStoreError(locale, res.error));
                              return;
                            }
                            flash?.(t("toast.estimateApproved"));
                            bump();
                          }}
                        >
                          {t("job.estimateApprove")}
                        </button>
                        <button
                          type="button"
                          data-decline-estimate=""
                          className="h-11 rounded-xl border border-danger/40 bg-danger/10 font-semibold text-danger"
                          onClick={async () => {
                            const res = await Store.decideEstimate(job.id, false);
                            if (!res.ok) {
                              flash?.(translateStoreError(locale, res.error));
                              return;
                            }
                            flash?.(t("toast.estimateDeclined"));
                            bump();
                          }}
                        >
                          {t("job.estimateDecline")}
                        </button>
                      </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted">{t("job.guestManage")}</p>
                      )}
                    </>
                  ) : estimate?.status === "approved" ? (
                    <p className="mt-2 text-sm font-semibold" data-estimate-status="approved">
                      {t("job.estimateApproved", { amount: formatEstimateAmount(estimate.amount) })}
                    </p>
                  ) : estimate?.status === "declined" ? (
                    <p className="mt-2 text-sm" data-estimate-status="declined">
                      {t("job.estimateDeclined", { amount: formatEstimateAmount(estimate.amount) })}
                    </p>
                  ) : estimate?.status === "skipped" ? (
                    <p className="mt-2 text-sm text-muted" data-estimate-status="skipped">{t("job.estimateSkipped")}</p>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
          {(shop || job.parts?.ordered || job.status === "parts") ? (
            <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-parts-card="">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("job.parts")}</p>
              {shop ? (
                <>
                  {job.parts?.ordered ? (
                    <p className="mt-2 text-sm" data-parts-summary="">
                      {t("job.partsCustomer", {
                        eta: job.parts.eta ? t("job.partsEtaLine", { eta: job.parts.eta }) : "",
                      })}
                      {job.parts.note ? ` · ${job.parts.note}` : ""}
                    </p>
                  ) : null}
                  {partsOpen ? (
                    <form
                      className="mt-3"
                      data-parts-form=""
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const res = await Store.saveParts(job.id, partsEta, partsNote, true);
                        if (!res.ok) {
                          flash?.(translateStoreError(locale, res.error));
                          return;
                        }
                        setPartsOpen(false);
                        flash?.(t("toast.partsSaved"));
                        bump();
                      }}
                    >
                      {job.parts?.ordered ? null : <p className="mb-2 text-sm text-muted">{t("job.partsHint")}</p>}
                      <Field label={t("job.partsEta")}>
                        <input
                          className={inputClass}
                          value={partsEta}
                          onChange={(e) => setPartsEta(e.target.value)}
                          placeholder={t("job.partsEtaPh")}
                          data-parts-eta=""
                        />
                      </Field>
                      <Field label={t("job.partsNote")}>
                        <input
                          className={inputClass}
                          value={partsNote}
                          onChange={(e) => setPartsNote(e.target.value)}
                          placeholder={t("job.partsNotePh")}
                        />
                      </Field>
                      <button type="submit" className="mt-2 h-11 w-full rounded-xl bg-accent font-semibold text-ink" data-save-parts="">
                        {t("job.partsSave")}
                      </button>
                      <button
                        type="button"
                        data-toggle-parts=""
                        className="mt-2 h-11 w-full rounded-xl border border-line bg-surface2 text-sm font-semibold"
                        onClick={() => setPartsOpen(false)}
                      >
                        {t("job.hideForm")}
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      data-toggle-parts=""
                      className="mt-3 h-11 w-full rounded-xl border border-line bg-surface2 text-sm font-semibold"
                      onClick={() => setPartsOpen(true)}
                    >
                      {job.parts?.ordered ? t("job.editParts") : t("job.addParts")}
                    </button>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm" data-parts-customer="">
                  {t("job.partsCustomer", {
                    eta: job.parts?.eta ? t("job.partsEtaLine", { eta: job.parts.eta }) : "",
                  })}
                  {job.parts?.note ? ` · ${job.parts.note}` : ""}
                </p>
              )}
            </div>
          ) : null}
          <TicketInvoice job={job} shop={shop} flash={flash} bump={bump} />
          {!shop && latestShop ? (
            <div
              className={`mt-3 rounded-xl border p-4 ${latestIsNew ? "border-accent/50 bg-accent/10" : "border-line bg-surface"}`}
              data-ticket-latest-update=""
            >
              <div className="flex items-center gap-2">
                {latestIsNew ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-ink" data-note-new="">
                    {t("job.newUpdate")}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("job.latestUpdate")}</span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-semibold text-fg">
                {providerNoteLabel(job, t)} · {fmtShort(latestShop.at, dates)}
              </p>
              <p className="mt-1 text-sm leading-relaxed">{translateNote(locale, latestShop.text)}</p>
            </div>
          ) : null}
        </div>
        <div>
          <h2 className="mb-2 mt-4 font-semibold md:mt-0">{t("job.progress")}</h2>
          {declined ? (
            <div className="mb-3 rounded-xl border border-danger/40 bg-danger/10 p-4" data-ticket-status="declined">
              <p className="text-sm font-semibold text-danger">
                {statusText(locale, "declined", shop ? "shop" : "customer")}
              </p>
              <p className="mt-1 text-sm text-muted">{t("job.declinedBanner")}</p>
              {declineReason ? (
                <p className="mt-2 text-sm text-fg">{t("job.declinedReason", { reason: declineReason })}</p>
              ) : null}
            </div>
          ) : (
            <div>
              {pendingAction && pendingAction.kind !== "none" && pendingStatus ? (
                <ConfirmBar
                  message={
                    pendingAction.kind === "repair"
                      ? t("job.repairNoEstimateConfirm")
                      : t("job.statusSkipConfirm", { to: statusText(locale, pendingStatus, "shop") })
                  }
                  onStay={() => setPendingStatus(null)}
                  onConfirm={() => applyShopStatus(pendingStatus, pendingAction.skipEstimate)}
                />
              ) : null}
              {PIPELINE_STATUSES.map((s, i) => {
                const on = i <= idx;
                const row = (
                  <div className="grid grid-cols-[18px_1fr] gap-3 pb-3 text-left">
                    <div className={`mt-0.5 size-[18px] rounded-full border-2 ${on ? "border-accent bg-accent" : "border-dim"}`} />
                    <div>
                      <div className={`text-sm font-semibold ${job.status === s || pendingStatus === s ? "text-accent" : ""}`}>
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
                    data-set-status={s}
                    onClick={() => {
                      if (s === job.status) return;
                      const action = statusActionConfirm(job.status, s, estimate);
                      if (action.kind === "none") {
                        void applyShopStatus(s, false);
                        return;
                      }
                      if (action.kind === "repair") setEstOpen(true);
                      setPendingStatus(s);
                    }}
                  >
                    {row}
                  </button>
                );
              })}
              {shop && job.statusBefore ? (
                <button
                  type="button"
                  data-undo-status=""
                  className="mb-3 h-11 w-full rounded-xl border border-line bg-surface2 text-sm font-semibold"
                  onClick={async () => {
                    const res = await Store.undoJobStatus(job.id);
                    if (!res.ok) {
                      flash?.(translateStoreError(locale, res.error));
                      return;
                    }
                    flash?.(t("toast.statusUndone"));
                    bump();
                  }}
                >
                  {t("job.undoStatus")}
                </button>
              ) : null}
            </div>
          )}
          {showDecline && (
            <div className="mt-1 rounded-xl border border-line bg-surface p-4" data-ticket-action="decline">
              {declineOpen ? (
                <>
                  <p className="text-sm font-semibold">{t("job.decline")}</p>
                  <p className="mt-1 text-sm text-muted">{t("job.declineHint")}</p>
                  <form
                    className="mt-3"
                    data-decline-form=""
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const reason = String(new FormData(e.currentTarget).get("reason") || "").trim();
                      const res = await Store.declineJob(job.id, reason);
                      if (!res.ok) {
                        flash?.(translateStoreError(locale, res.error));
                        return;
                      }
                      flash?.(t("toast.bookingDeclined"));
                      bump();
                    }}
                  >
                    <Field label={t("job.declineReason")}>
                      <textarea name="reason" className={inputClass + " min-h-20"} placeholder={t("job.declineReasonPh")} />
                    </Field>
                    <button
                      type="submit"
                      className="mt-2 h-12 w-full rounded-xl border border-danger/50 bg-danger/10 font-semibold text-danger"
                    >
                      {t("job.declineConfirm")}
                    </button>
                    <button
                      type="button"
                      data-toggle-decline=""
                      className="mt-2 h-11 w-full rounded-xl border border-line bg-surface2 text-sm font-semibold"
                      onClick={() => setDeclineOpen(false)}
                    >
                      {t("job.hideForm")}
                    </button>
                  </form>
                </>
              ) : (
                <button
                  type="button"
                  data-toggle-decline=""
                  className="h-11 w-full rounded-xl border border-line bg-surface2 text-sm font-semibold"
                  onClick={() => setDeclineOpen(true)}
                >
                  {t("job.decline")}
                </button>
              )}
            </div>
          )}
          {shop && user?.role === "shop" && shopRec && !declined && (
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
          {shop && isShopTechnician(user) && !declined && (
            <button
              type="button"
              data-flag-owner=""
              className={`mt-3 h-11 w-full rounded-xl border font-semibold ${
                job.flaggedForOwner ? "border-danger/40 bg-danger/10 text-danger" : "border-line bg-surface2"
              }`}
              onClick={async () => {
                const res = await Store.flagJob(job.id, !job.flaggedForOwner);
                if (!res.ok) {
                  flash?.(translateStoreError(locale, res.error));
                  return;
                }
                flash?.(t(job.flaggedForOwner ? "toast.unflagged" : "toast.flagged"));
                bump();
              }}
            >
              {job.flaggedForOwner ? t("job.unflagOwner") : t("job.flagOwner")}
            </button>
          )}
          {shop && !declined && (
            <div className="mt-3">
              <form
                className="mt-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await postUpdate(noteText);
                }}
              >
                <Field label={internalNote ? t("job.internalNote") : t("job.customerUpdate")}>
                  <textarea
                    name="note"
                    className={inputClass + " min-h-24"}
                    placeholder={t("job.notePh")}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    disabled={posting}
                  />
                </Field>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-amber-400"
                    checked={internalNote}
                    onChange={(e) => setInternalNote(e.target.checked)}
                    data-internal-note=""
                  />
                  {t("job.internalNote")}
                </label>
                <button
                  type="submit"
                  disabled={posting}
                  data-post-update=""
                  className="mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink disabled:opacity-60"
                >
                  {posting ? t("job.posting") : t("job.postUpdate")}
                </button>
              </form>
            </div>
          )}
          <h2 className="mb-2 mt-4 font-semibold">{t("job.updates")}</h2>
          {orderedNotes.map((n, i) => {
            const isNew = !shop && isNewProviderNote(n, seenAt);
            return (
              <div
                key={`${n.at}-${i}`}
                data-job-note=""
                className={`mb-2 rounded-xl p-2.5 text-sm ${isNew ? "border border-accent/40 bg-accent/10 text-fg" : "bg-bg2 text-muted"}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {isNew ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-ink" data-note-new="">
                      {t("job.newUpdate")}
                    </span>
                  ) : null}
                  <strong className="text-fg">
                    {n.by === "shop"
                      ? providerNoteLabel(job, t)
                      : n.by === "internal"
                        ? t("job.noteInternal")
                        : n.by === "customer"
                          ? t("job.noteCustomer")
                          : t("job.system")}
                  </strong>
                  {isInternalNote(n) ? (
                    <span className="rounded-full bg-surface2 px-2 py-0.5 text-[11px] font-semibold" data-internal-badge="">
                      {t("job.noteInternal")}
                    </span>
                  ) : null}
                  <span>· {fmtShort(n.at, dates)}</span>
                </div>
                <p className="mt-1">{translateNote(locale, n.text)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function listedLabel(value: string, t: TranslateFn) {
  return value === OTHER_VALUE ? t("vehicle.other") : value;
}

function splitFromList(value: string | undefined, list: string[]) {
  const v = String(value || "").trim();
  if (!v) return { selected: "", other: "" };
  if (list.includes(v)) return { selected: v, other: "" };
  return { selected: OTHER_VALUE, other: v };
}

function vehicleFromPickerForm(fd: FormData): VehicleFields {
  return {
    year: String(fd.get("year") || ""),
    make: resolveListedOrOther(String(fd.get("make") || ""), String(fd.get("makeOther") || "")),
    model: resolveListedOrOther(String(fd.get("model") || ""), String(fd.get("modelOther") || "")),
    trim: (() => {
      const listed = String(fd.get("trim") || "").trim();
      if (!listed) return "";
      return resolveListedOrOther(listed, String(fd.get("trimOther") || ""));
    })(),
    color: String(fd.get("color") || "").trim(),
    photo: String(fd.get("vehiclePhoto") || "").trim(),
  };
}

function VehiclePicker({
  defaults,
  footerKey = "vehicle.onAppointment",
  optionalOpen,
}: {
  defaults?: VehicleFields;
  footerKey?: MessageKey;
  /** When set, trim/color/photo stay collapsed until true. Account omits this. */
  optionalOpen?: boolean;
}) {
  const makeSplit = splitFromList(defaults?.make, Object.keys(VEHICLE_DATA));
  const [make, setMake] = useState(makeSplit.selected);
  const models = make ? VEHICLE_DATA[make] || [] : [];
  const modelSplit = splitFromList(defaults?.model, models.length ? models : [OTHER_VALUE]);
  const [year, setYear] = useState(defaults?.year || "");
  const [model, setModel] = useState(modelSplit.selected);
  const trimList = model ? trimOptions(make, model) : [];
  const trimSplit = splitFromList(defaults?.trim, trimList);
  const [trim, setTrim] = useState(trimSplit.selected);
  const [makeOther, setMakeOther] = useState(makeSplit.other);
  const [modelOther, setModelOther] = useState(modelSplit.other);
  const [trimOther, setTrimOther] = useState(trimSplit.other);
  const [color, setColor] = useState(defaults?.color || "");
  const [vehiclePhoto, setVehiclePhoto] = useState(defaults?.photo || "");
  const [photoErr, setPhotoErr] = useState("");
  const { locale, t } = useI18n();
  const trims = model ? trimOptions(make, model) : [];
  const showExtras = optionalOpen === undefined || optionalOpen;
  const preview = [
    year,
    resolveListedOrOther(make, makeOther),
    resolveListedOrOther(model, modelOther),
    trim ? resolveListedOrOther(trim, trimOther) : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface" data-vehicle-picker="">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{t("vehicle.title")}</p>
          <p className="text-sm text-muted">{t(optionalOpen === undefined ? "vehicle.sub" : "vehicle.subShort")}</p>
        </div>
        {make ? (
          <VehicleArt
            make={make}
            model={model}
            vehiclePhoto={vehiclePhoto}
            color={color}
            className="h-11 w-[4.5rem] rounded-lg"
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
        {showExtras ? (
          <div data-vehicle-extras="" className="grid gap-3">
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
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-muted">{t("vehicle.color")}</span>
              <SelectWrap>
                <select name="color" className={selectClass} value={color} onChange={(e) => setColor(e.target.value)}>
                  <option value="">{t("vehicle.chooseColor")}</option>
                  {VEHICLE_COLOR_IDS.map((id) => (
                    <option key={id} value={id}>
                      {t(`color.${id}` as MessageKey)}
                    </option>
                  ))}
                </select>
              </SelectWrap>
            </label>
            <div>
              <input type="hidden" name="vehiclePhoto" value={vehiclePhoto} />
              <PhotoPicker
                slot={VEHICLE_PHOTO_SLOT}
                value={vehiclePhoto}
                name={preview || t("vehicle.notChosen")}
                label={t("vehicle.photoLabel")}
                hint={t("vehicle.photoHint")}
                onErr={(msg) => setPhotoErr(translateStoreError(locale, msg))}
                onPick={(dataUrl) => {
                  setPhotoErr("");
                  setVehiclePhoto(dataUrl);
                }}
              />
              {photoErr ? <p className="mt-2 text-sm text-danger">{photoErr}</p> : null}
            </div>
          </div>
        ) : (
          <>
            <input type="hidden" name="trim" value={trim} />
            {trim === OTHER_VALUE ? <input type="hidden" name="trimOther" value={trimOther} /> : null}
            <input type="hidden" name="color" value={color} />
            <input type="hidden" name="vehiclePhoto" value={vehiclePhoto} />
          </>
        )}
      </div>
      <div className="border-t border-line bg-bg2 px-4 py-3">
        <p className="text-sm text-muted">{t(footerKey)}</p>
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

function AccountSettingsPanels() {
  const { t } = useI18n();
  return (
    <>
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.language")}</p>
        <p className="mt-1 mb-3 text-sm text-muted">{t("account.languageHint")}</p>
        <LanguageToggle />
      </div>
      <div className="mt-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.theme")}</p>
        <p className="mt-1 mb-3 text-sm text-muted">{t("account.themeHint")}</p>
        <ThemeToggle />
      </div>
      <div className="mt-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.alerts")}</p>
        <p className="mt-2 text-sm text-muted">{t("account.alertsManageHint")}</p>
      </div>
    </>
  );
}

function NotificationsCard({
  user,
  flash,
  onSaved,
}: {
  user: User;
  flash: (s: string) => void;
  onSaved: (u: User) => void;
}) {
  const { locale, t } = useI18n();
  const [busy, setBusy] = useState(false);
  const supported = notificationsSupported();
  const perm = permissionState();

  const on = notificationsActive(user.alertsOn);


  async function turnOn() {
    setBusy(true);
    try {
      const res = await requestNotificationPermission();
      if (res === "unsupported") {
        flash(t("toast.alertsUnsupported"));
        return;
      }
      if (res !== "granted") {
        const saved = await Store.saveAlerts(user, user.pushToken || "", false);
        if (saved.ok) onSaved(saved.user);
        flash(t("toast.alertsBlocked"));
        return;
      }
      const saved = await Store.saveAlerts(user, user.pushToken || "web-" + user.id, true);
      if (!saved.ok) {
        flash(translateStoreError(locale, saved.error));
        return;
      }
      onSaved(saved.user);
      await showLocalNotification(t("app.name"), t("account.alertsNotifBody"));
      flash(t("toast.alertsOn"));
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    await showLocalNotification(t("app.name"), t("account.alertsNotifBody"));
    flash(t("toast.alertsTestSent"));
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-notifications-card={on ? "on" : "off"}>
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent/15 text-accent">
          <Bell className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{t("account.notifTitle")}</p>
          <p className="mt-0.5 text-sm text-muted">
            {user.role === "customer" ? t("account.alertsCustomer") : t("account.alertsProvider")}
          </p>
          {!supported ? (
            <p className="mt-2 text-xs text-dim">{t("account.notifUnsupported")}</p>
          ) : perm === "denied" ? (
            <p className="mt-2 text-xs text-dim">{t("account.notifBlocked")}</p>
          ) : on ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
                <Bell className="size-3.5" aria-hidden /> {t("account.notifOn")}
              </span>
              <button
                type="button"
                onClick={sendTest}
                className="h-9 rounded-lg border border-line bg-surface2 px-3 text-xs font-semibold"
              >
                {t("account.notifTest")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={turnOn}
              className="mt-3 h-11 w-full rounded-xl bg-accent font-semibold text-ink disabled:opacity-60"
            >
              {t("account.notifEnable")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Account({
  user,
  locked,
  onBack,
  onLogout,
  onDeleted,
  flash,
  bump,
  onSaved,
}: {
  user: User;
  locked: Provider | null;
  onBack: () => void;
  onLogout: () => void;
  onDeleted: () => void;
  flash: (s: string) => void;
  bump: () => void;
  onSaved: (u: User) => void;
}) {
  const { locale, t } = useI18n();
  const shop = user.shopId ? Store.shopRecord(user.shopId) : null;
  const canEditShop = user.role === "shop" && user.shopRole === "owner" && !!shop;
  const tech = isShopTechnician(user);
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
  const [shopBlock, setShopBlock] = useState(normalizeBlockAfterHours(shop?.blockAfterHours));
  const [shopSpecialties, setShopSpecialties] = useState(shop?.specialties || []);
  const [shopCredentials, setShopCredentials] = useState(shop?.credentials || []);
  const [shopArea, setShopArea] = useState(shop?.serviceArea || "");
  const [shopAddress, setShopAddress] = useState(shop?.address || "");
  const [shopYears, setShopYears] = useState(shop?.yearsWrenching || "");
  const [indyDays, setIndyDays] = useState(user.hoursDays || "123456");
  const [indyOpen, setIndyOpen] = useState(user.hoursOpen || "08:00");
  const [indyClose, setIndyClose] = useState(user.hoursClose || "16:00");
  const [indyBlock, setIndyBlock] = useState(normalizeBlockAfterHours(user.blockAfterHours));
  const [indySpecialties, setIndySpecialties] = useState(user.specialties || []);
  const [indyCredentials, setIndyCredentials] = useState(user.credentials || []);
  const [indyArea, setIndyArea] = useState(user.serviceArea || "");
  const [indyAddress, setIndyAddress] = useState(user.address || "");
  const [indyYears, setIndyYears] = useState(user.yearsWrenching || "");
  const [deletePw, setDeletePw] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [vehicles, setVehicles] = useState(() => Store.customerVehicles(user));
  void locked;
  const label =
    user.role === "shop"
      ? user.shopRole === "owner"
        ? t("account.shopOwner")
        : t("account.shopTech")
      : user.role === "independent"
        ? translateDetail(locale, soloMechanicDetail(user.serviceMode))
        : t("account.customer");

  if (settingsOpen) {
    return (
      <div data-account-settings="">
        <Top title={t("account.settings")} onBack={() => setSettingsOpen(false)} />
        <AccountSettingsPanels />
      </div>
    );
  }

  return (
    <div data-account-portal={shopPortalKind(user) || undefined}>
      <Top
        title={t("account.title")}
        onBack={onBack}
        action={
          <button
            type="button"
            data-account-settings-open=""
            className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface"
            aria-label={t("account.settings")}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="size-4" />
          </button>
        }
      />
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <ProfilePhotoEditor
            src={profilePhoto}
            name={user.role === "independent" ? bizName || user.name : shop?.name || user.name}
            hint={
              user.role === "independent" || (user.role === "shop" && user.shopRole === "owner")
                ? t("photo.editPublicHint")
                : t("photo.editAccountHint")
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
      <NotificationsCard user={user} flash={flash} onSaved={onSaved} />
      {user.role === "customer" ? (
        <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-account-vehicles="">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.vehicles")}</p>
          <p className="mt-1 text-sm text-muted">{t("account.vehiclesHint")}</p>
          <div className="mt-3 flex flex-col gap-2">
            {vehicles.length ? (
              vehicles.map((v) => (
                <div
                  key={vehicleKey(v)}
                  className="flex items-center gap-3 rounded-xl border border-line bg-bg2 p-3"
                >
                  <VehicleArt
                    make={v.make}
                    model={v.model}
                    vehiclePhoto={v.photo}
                    color={v.color}
                    className="h-12 w-[4.25rem] shrink-0 rounded-lg"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold">{vehicleLabel(v)}</p>
                    <p className="text-sm text-muted">{kindText(locale, vehicleKind(v))}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">{t("account.vehiclesEmpty")}</p>
            )}
          </div>
          {addingVehicle ? (
            <form
              className="mt-3"
              data-add-vehicle-form=""
              onSubmit={(e) => {
                e.preventDefault();
                const next = vehicleFromPickerForm(new FormData(e.currentTarget));
                if (!isCompleteVehicle(next)) return flash(t("err.fillAll"));
                setVehicles(Store.addCustomerVehicle(user, next));
                setAddingVehicle(false);
                flash(t("account.vehicleSaved"));
              }}
            >
              <VehiclePicker footerKey="account.vehiclePreview" />
              <button type="submit" className="mt-3 h-11 w-full rounded-xl bg-accent font-semibold text-ink">
                {t("account.saveVehicle")}
              </button>
              <button
                type="button"
                className="mt-2 h-11 w-full rounded-xl border border-line bg-surface font-semibold"
                onClick={() => setAddingVehicle(false)}
              >
                {t("account.cancelAdd")}
              </button>
            </form>
          ) : (
            <button
              type="button"
              data-add-vehicle=""
              className="mt-3 h-10 w-full rounded-xl border border-line bg-bg2 text-sm font-semibold"
              onClick={() => setAddingVehicle(true)}
            >
              {t("account.addVehicle")}
            </button>
          )}
        </div>
      ) : null}
      <button
        type="button"
        data-account-settings-open=""
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-left"
        onClick={() => setSettingsOpen(true)}
      >
        <span>
          <span className="block text-sm font-semibold">{t("account.settings")}</span>
          <span className="mt-1 block text-sm text-muted">{t("account.settingsHint")}</span>
        </span>
        <Settings className="size-5 shrink-0 text-muted" />
      </button>
      {tech && shop ? (
        <div className="mt-3 rounded-xl border border-line bg-surface p-4" data-account-tech-shop="">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.techShop", { shop: shop.name })}</p>
          <p className="mt-2 text-sm text-muted">{t("account.techShopHint")}</p>
        </div>
      ) : null}
      {shop && !tech && (
        <form
          className="mt-3 rounded-xl border border-line bg-surface p-4"
          data-account-public-profile="shop"
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
              blockAfterHours: shopBlock,
              specialties: shopSpecialties,
              credentials: shopCredentials,
              serviceArea: shopArea,
              address: shopAddress,
              yearsWrenching: shopYears,
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
          <Fieldset label={t("account.specialties")}>
            <p className="mb-2 text-sm text-muted">{t("account.specialtiesHint")}</p>
            <ChipEditor
              kind="spec"
              value={shopSpecialties}
              onChange={setShopSpecialties}
              canEdit={!!canEditShop}
              empty={t("account.noSpecialties")}
            />
          </Fieldset>
          <Fieldset label={t("account.credentials")}>
            <p className="mb-2 text-sm text-muted">{t("account.credentialsHint")}</p>
            <ChipEditor
              kind="cred"
              value={shopCredentials}
              onChange={setShopCredentials}
              canEdit={!!canEditShop}
              empty={t("account.noCredentials")}
            />
          </Fieldset>
          <Field label={t("account.yearsWrenching")}>
            {canEditShop ? (
              <input
                className={inputClass}
                inputMode="numeric"
                maxLength={2}
                value={shopYears}
                onChange={(e) => setShopYears(sanitizeYearsWrenching(e.target.value))}
                placeholder={t("account.yearsPh")}
              />
            ) : (
              <p className="text-sm text-muted">
                {shop.yearsWrenching ? t("profile.years", { n: shop.yearsWrenching }) : t("account.notSet")}
              </p>
            )}
          </Field>
          <Field label={t("account.serviceArea")}>
            {canEditShop ? (
              <>
                <input
                  className={inputClass}
                  value={shopArea}
                  maxLength={SERVICE_AREA_MAX}
                  onChange={(e) => setShopArea(e.target.value.slice(0, SERVICE_AREA_MAX))}
                  placeholder={t("account.serviceAreaPh")}
                />
                <p className="mt-1 text-right text-xs text-dim tabular-nums">
                  {shopArea.length}/{SERVICE_AREA_MAX}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">{shop.serviceArea || t("account.noServiceArea")}</p>
            )}
          </Field>
          <Field label={t("account.address")}>
            {canEditShop ? (
              <>
                <input
                  className={inputClass}
                  value={shopAddress}
                  maxLength={ADDRESS_MAX}
                  onChange={(e) => setShopAddress(e.target.value.slice(0, ADDRESS_MAX))}
                  placeholder={t("account.addressPh")}
                />
                <p className="mt-1 text-xs text-dim">{t("account.addressHint")}</p>
              </>
            ) : (
              <p className="text-sm text-muted">{shop.address || t("account.noAddress")}</p>
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
          <BlockAfterEditor value={shopBlock} onChange={setShopBlock} canEdit={!!canEditShop} />
          </div>
          {canEditShop ? (
            <button type="submit" className="mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
              {t("account.saveShop")}
            </button>
          ) : null}
          <div className="mt-3 rounded-xl border border-line bg-bg2 p-3" data-account-find-code="">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.findCode")}</p>
            <div className="mt-1 font-mono text-2xl tracking-[0.2em] text-accent">{shop.code}</div>
            <p className="mt-1 text-xs text-dim">{t("account.findCodeHint")}</p>
          </div>
          <p className="mt-3 text-sm text-muted">{t("account.teamCode")}</p>
          <div className="my-2 font-mono text-2xl tracking-[0.2em]" data-account-team-join="">{shop.joinCode || "—"}</div>
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
          data-account-public-profile="independent"
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
              blockAfterHours: indyBlock,
              specialties: indySpecialties,
              credentials: indyCredentials,
              serviceArea: indyArea,
              address: indyAddress,
              yearsWrenching: indyYears,
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
          <Fieldset label={t("account.specialties")}>
            <p className="mb-2 text-sm text-muted">{t("account.specialtiesHint")}</p>
            <ChipEditor
              kind="spec"
              value={indySpecialties}
              onChange={setIndySpecialties}
              canEdit
              empty={t("account.noSpecialties")}
            />
          </Fieldset>
          <Fieldset label={t("account.credentials")}>
            <p className="mb-2 text-sm text-muted">{t("account.credentialsHint")}</p>
            <ChipEditor
              kind="cred"
              value={indyCredentials}
              onChange={setIndyCredentials}
              canEdit
              empty={t("account.noCredentials")}
            />
          </Fieldset>
          <Field label={t("account.yearsWrenching")}>
            <input
              className={inputClass}
              inputMode="numeric"
              maxLength={2}
              value={indyYears}
              onChange={(e) => setIndyYears(sanitizeYearsWrenching(e.target.value))}
              placeholder={t("account.yearsPh")}
            />
          </Field>
          <Field label={t("account.serviceArea")}>
            <input
              className={inputClass}
              value={indyArea}
              maxLength={SERVICE_AREA_MAX}
              onChange={(e) => setIndyArea(e.target.value.slice(0, SERVICE_AREA_MAX))}
              placeholder={t("account.serviceAreaPh")}
            />
            <p className="mt-1 text-right text-xs text-dim tabular-nums">
              {indyArea.length}/{SERVICE_AREA_MAX}
            </p>
          </Field>
          <Field label={t("account.addressOptional")}>
            <input
              className={inputClass}
              value={indyAddress}
              maxLength={ADDRESS_MAX}
              onChange={(e) => setIndyAddress(e.target.value.slice(0, ADDRESS_MAX))}
              placeholder={t("account.addressPh")}
            />
            <p className="mt-1 text-xs text-dim">{t("account.addressIndyHint")}</p>
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
          <BlockAfterEditor value={indyBlock} onChange={setIndyBlock} canEdit />
          </div>
          <button type="submit" className="mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink">
            {t("account.saveProfile")}
          </button>
          <div className="mt-3 rounded-xl border border-line bg-bg2 p-3" data-account-find-code="">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("account.findCode")}</p>
            <div className="mt-1 font-mono text-2xl tracking-[0.2em] text-accent">{user.code || "—"}</div>
            <p className="mt-1 text-xs text-dim">{t("account.qrOnShare")}</p>
          </div>
        </form>
      )}
      <PolicyFooterLinks className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold text-muted" />
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
          {tech ? t("account.deleteBodyTech") : t("account.deleteBody")}
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
          className="mt-3 h-12 w-full rounded-xl border border-red-500/40 bg-red-500/10 font-semibold text-danger"
        >
          {deleting ? t("account.deleting") : t("account.deleteBtn")}
        </button>
      </form>
    </div>
  );
}

const BLOCK_LABELS: Record<BlockAfterHours, MessageKey> = {
  0: "account.blockOff",
  1: "account.block1h",
  2: "account.block2h",
  3: "account.block3h",
  4: "account.block4h",
};

function SlotCalendar({
  providerId,
  selected,
  onSelect,
  locale,
}: {
  providerId: string;
  selected: string;
  onSelect: (iso: string) => void;
  locale: "en" | "es";
}) {
  const { t } = useI18n();
  const slots = Store.weekSlotStates(providerId);
  const byDay = new Map<string, typeof slots>();
  for (const slot of slots) {
    const key = dayKey(slot.date);
    const list = byDay.get(key) || [];
    list.push(slot);
    byDay.set(key, list);
  }
  const firstOpen = slots.find((s) => !s.taken);
  const seed = selected ? new Date(selected) : firstOpen?.date || new Date();
  const [view, setView] = useState({ year: seed.getFullYear(), month: seed.getMonth() });
  const [pickedDay, setPickedDay] = useState(() => dayKey(seed));

  useEffect(() => {
    if (!selected) return;
    const d = new Date(selected);
    if (Number.isNaN(d.getTime())) return;
    setPickedDay(dayKey(d));
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }, [selected]);

  const todayKey = dayKey(new Date());
  const cells = monthGrid(view.year, view.month);
  const rawDaySlots = byDay.get(pickedDay) || [];
  const shownDay = rawDaySlots.length || !firstOpen ? pickedDay : dayKey(firstOpen.date);
  const daySlots = byDay.get(shownDay) || [];
  const minMonth = slots[0]
    ? { year: slots[0].date.getFullYear(), month: slots[0].date.getMonth() }
    : { year: view.year, month: view.month };
  const last = slots.at(-1);
  const maxMonth = last
    ? { year: last.date.getFullYear(), month: last.date.getMonth() }
    : { year: view.year, month: view.month };
  const canPrev =
    view.year > minMonth.year || (view.year === minMonth.year && view.month > minMonth.month);
  const canNext =
    view.year < maxMonth.year || (view.year === maxMonth.year && view.month < maxMonth.month);
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(localeTag(locale), {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-3" data-slot-calendar="" aria-label={t("book.calendarAria")}>
      <div className="rounded-2xl border border-line bg-surface p-3" data-cal-month={monthKey(view.year, view.month)}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            data-cal-prev=""
            disabled={!canPrev}
            aria-label={t("book.prevMonth")}
            className="grid size-10 place-items-center rounded-xl border border-line bg-bg2 disabled:opacity-40"
            onClick={() => setView((v) => addMonths(v.year, v.month, -1))}
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="text-sm font-semibold capitalize">{monthLabel}</p>
          <button
            type="button"
            data-cal-next=""
            disabled={!canNext}
            aria-label={t("book.nextMonth")}
            className="grid size-10 place-items-center rounded-xl border border-line bg-bg2 disabled:opacity-40"
            onClick={() => setView((v) => addMonths(v.year, v.month, 1))}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("book.pickDay")}</p>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
          {(["0", "1", "2", "3", "4", "5", "6"] as const).map((bit) => (
            <span key={bit}>{t(`hours.d${bit}` as MessageKey)}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const items = byDay.get(cell.key) || [];
            const openCount = items.filter((s) => !s.taken).length;
            const state = items.length === 0 ? "closed" : openCount ? "open" : "full";
            const active = shownDay === cell.key;
            const isToday = cell.key === todayKey;
            return (
              <button
                key={cell.key}
                type="button"
                disabled={state === "closed"}
                data-cal-day={cell.key}
                data-cal-state={state}
                aria-pressed={active}
                aria-label={`${cell.date.toLocaleDateString(localeTag(locale), { weekday: "long", month: "short", day: "numeric" })} · ${
                  state === "open" ? t("book.dayOpen") : state === "full" ? t("book.dayFull") : t("book.dayClosed")
                }`}
                className={`relative flex h-10 flex-col items-center justify-center rounded-xl text-sm font-semibold ${
                  !cell.inMonth ? "opacity-40" : ""
                } ${
                  state === "closed"
                    ? "cursor-not-allowed text-dim"
                    : active
                      ? "border border-accent bg-accent/15 text-fg"
                      : state === "full"
                        ? "border border-line bg-surface2 text-dim"
                        : "border border-line bg-bg2 text-fg"
                }`}
                onClick={() => setPickedDay(cell.key)}
              >
                <span>{cell.day}</span>
                {isToday ? <span className="sr-only">{t("book.today")}</span> : null}
                {state === "open" ? (
                  <span className="absolute bottom-1 size-1 rounded-full bg-accent" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <div data-slot-day={shownDay}>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("book.pickTime")}</p>
        {daySlots.length === 0 ? (
          <p className="text-sm text-muted">{t("book.noSlotsDay")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {daySlots.map((slot) => {
              const time = formatClock(
                locale,
                `${String(slot.date.getHours()).padStart(2, "0")}:${String(slot.date.getMinutes()).padStart(2, "0")}`,
              );
              const active = selected === slot.iso;
              return (
                <button
                  key={slot.iso}
                  type="button"
                  disabled={slot.taken}
                  data-slot-iso={slot.iso}
                  data-slot-state={slot.taken ? "blocked" : "open"}
                  aria-pressed={active}
                  className={`rounded-xl border px-2.5 py-2 text-left text-sm font-semibold ${
                    slot.taken
                      ? "cursor-not-allowed border-line bg-surface2 text-dim"
                      : active
                        ? "border-accent bg-accent/15 text-fg"
                        : "border-line bg-bg2 text-fg"
                  }`}
                  onClick={() => onSelect(slot.iso)}
                >
                  <span className="block">{time}</span>
                  {slot.taken ? <span className="mt-0.5 block text-xs font-medium">{t("book.blocked")}</span> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockAfterEditor({
  value,
  onChange,
  canEdit,
}: {
  value: BlockAfterHours;
  onChange: (v: BlockAfterHours) => void;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  return (
    <Field label={t("account.jobLength")}>
      {canEdit ? (
        <div data-block-after-hours="">
          <SelectWrap>
            <select
              className={selectClass}
              value={value}
              onChange={(e) => onChange(normalizeBlockAfterHours(Number(e.target.value)))}
            >
              {BLOCK_AFTER_HOURS_CHOICES.map((hours) => (
                <option key={hours} value={hours}>
                  {t(BLOCK_LABELS[hours])}
                </option>
              ))}
            </select>
          </SelectWrap>
          <p className="mt-2 text-sm text-muted">{t("account.jobLengthHint")}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">{t(BLOCK_LABELS[normalizeBlockAfterHours(value)])}</p>
      )}
    </Field>
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
