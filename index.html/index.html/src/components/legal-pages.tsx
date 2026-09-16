import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LanguageToggle, useI18n } from "@/lib/i18n-context";
import { ThemeToggle } from "@/lib/theme-context";
import { privacySections, termsSections } from "@/lib/i18n";
import { SUPPORT_EMAIL } from "@/lib/legal";

export function PolicyFooterLinks({
  className = "mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold text-muted",
}: {
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <nav aria-label={t("legal.linksAria")} data-policy-links="" className={className}>
      <Link to="/privacy" className="underline-offset-2 hover:text-fg hover:underline">
        {t("welcome.privacy")}
      </Link>
      <Link to="/terms" className="underline-offset-2 hover:text-fg hover:underline">
        {t("welcome.terms")}
      </Link>
      <Link to="/support" className="underline-offset-2 hover:text-fg hover:underline">
        {t("welcome.support")}
      </Link>
    </nav>
  );
}

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div
      data-policy-page=""
      className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-bg shadow-[0_0_0_1px_var(--color-line)]"
    >
      <header className="flex items-center justify-between gap-2 px-4 pt-3" data-app-header="">
        <Link to="/" className="min-w-0">
          <img
            src="/img/logo-wordmark.png"
            alt={t("app.name")}
            data-brand-wordmark=""
            className="h-[72px] w-auto max-w-[min(220px,58%)] object-contain object-left"
          />
        </Link>
        <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted">
          <ThemeToggle compact />
          <LanguageToggle compact />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 pb-16 pt-3">
        <div className="mb-4 flex items-center gap-2.5">
          <Link
            to="/"
            className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface"
            aria-label={t("nav.back")}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        {children}
        <PolicyFooterLinks />
      </main>
    </div>
  );
}

function SectionList({ sections }: { sections: { title: string; body: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {sections.map((s) => (
        <section key={s.title} className="rounded-xl border border-line bg-surface p-4">
          <h2 className="font-semibold">{s.title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
        </section>
      ))}
    </div>
  );
}

export function PrivacyPage() {
  const { locale, t } = useI18n();
  return (
    <LegalShell title={t("legal.privacy")}>
      <p className="mb-2 text-sm text-muted">{t("legal.updated")}</p>
      <p className="mb-3 text-sm leading-relaxed text-muted">{t("legal.notAdvice")}</p>
      <SectionList sections={privacySections(locale)} />
    </LegalShell>
  );
}

export function TermsPage() {
  const { locale, t } = useI18n();
  return (
    <LegalShell title={t("legal.terms")}>
      <p className="mb-2 text-sm text-muted">{t("legal.updated")}</p>
      <p className="mb-3 text-sm leading-relaxed text-muted">{t("legal.notAdvice")}</p>
      <SectionList sections={termsSections(locale)} />
    </LegalShell>
  );
}

export function SupportPage() {
  const { t } = useI18n();
  return (
    <LegalShell title={t("support.title")}>
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-sm leading-relaxed text-muted">{t("support.intro")}</p>
        <p className="mt-3 font-semibold text-fg">{t("support.thisApp")}</p>
        <a
          className="mt-1 block text-[17px] font-semibold text-accent"
          href={`mailto:${SUPPORT_EMAIL}`}
        >
          {SUPPORT_EMAIL}
        </a>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("support.body")}</p>
      </div>
      <div className="mt-3 rounded-xl border border-line bg-surface p-4">
        <p className="font-semibold text-fg">{t("support.bayTitle")}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("support.bayBody")}</p>
      </div>
    </LegalShell>
  );
}
