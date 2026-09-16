import { env } from "@/lib/env.server";

export type MailResult =
  | { ok: true; provider: "resend" | "mailgun" }
  | { ok: false; skipped: true; error: string }
  | { ok: false; skipped: false; error: string };

export function mailerConfigured() {
  return Boolean(env("RESEND_API_KEY") || (env("MAILGUN_API_KEY") && env("MAILGUN_DOMAIN")));
}

function fromAddress() {
  return env("RESEND_FROM") || env("MAIL_FROM") || "Mechanics Helper <onboarding@resend.dev>";
}

export async function sendEmail(opts: { to: string; subject: string; text: string }): Promise<MailResult> {
  const to = String(opts.to || "").trim();
  if (!to || !to.includes("@")) {
    return { ok: false as const, skipped: true as const, error: "No email address." };
  }

  const resend = env("RESEND_API_KEY");
  if (resend) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + resend,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [to],
        subject: opts.subject,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false as const, skipped: false as const, error: text.slice(0, 180) };
    }
    return { ok: true as const, provider: "resend" };
  }

  const mgKey = env("MAILGUN_API_KEY");
  const mgDomain = env("MAILGUN_DOMAIN");
  if (mgKey && mgDomain) {
    const auth = Buffer.from(`api:${mgKey}`).toString("base64");
    const res = await fetch(`https://api.mailgun.net/v3/${mgDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        from: fromAddress(),
        to,
        subject: opts.subject,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false as const, skipped: false as const, error: text.slice(0, 180) };
    }
    return { ok: true as const, provider: "mailgun" };
  }

  return { ok: false as const, skipped: true as const, error: "Email is not connected yet." };
}

export function revealRecoveryCode() {
  if (env("MH_RECOVERY_DEV_CODE") === "1" || env("SEED_DEMO") === "1") return true;
  return !env("DATABASE_URL");
}
