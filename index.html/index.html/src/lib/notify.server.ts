import { env } from "@/lib/env.server";
import type { Job } from "@/lib/store";

function carLine(job: Job) {
  return `${job.year} ${job.make} ${job.model}`.trim();
}

const PING_STATUSES = new Set(["enroute", "parts", "ready"]);

export function e164(raw: string) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d.startsWith("1")) return "+" + d;
  if (String(raw || "").startsWith("+") && d.length >= 10) return "+" + d;
  return "";
}

export function smsBody(job: Job) {
  const car = carLine(job) || "vehicle";
  const shop = job.providerName || "Your shop";
  if (job.status === "enroute") return `${shop}: we're headed in for your ${car}. Open Mechanics Helper to track it.`;
  if (job.status === "parts") return `${shop}: waiting on parts for your ${car}. We'll update the board when they land.`;
  if (job.status === "ready") return `${shop}: your ${car} is ready for pickup. Job ${job.id}.`;
  return `${shop}: status update on your ${car} (${job.id}).`;
}

export async function sendSms(to: string, body: string) {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM");
  const dest = e164(to);
  if (!sid || !token || !from || !dest) {
    return { ok: false as const, skipped: true as const, error: "SMS is not connected yet." };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: dest, From: from, Body: body.slice(0, 320) }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false as const, skipped: false as const, error: text.slice(0, 180) };
  }
  return { ok: true as const };
}

export async function sendPush(token: string, title: string, body: string) {
  const key = env("FCM_SERVER_KEY");
  if (!key || !token) {
    return { ok: false as const, skipped: true as const, error: "Push is not connected yet." };
  }
  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: "key=" + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body },
      data: { title, body },
      priority: "high",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false as const, skipped: false as const, error: text.slice(0, 180) };
  }
  return { ok: true as const };
}

export async function pingJob(job: Job, previous: string | undefined, pushToken?: string) {
  if (!job.status || job.status === previous) return { sms: "skip", push: "skip" };
  if (!PING_STATUSES.has(job.status)) return { sms: "skip", push: "skip" };
  const body = smsBody(job);
  const title = job.providerName || "Mechanics Helper";
  const sms =
    job.notifySms === false || !job.phone
      ? { ok: false as const, skipped: true as const }
      : await sendSms(job.phone, body);
  const push = pushToken ? await sendPush(pushToken, title, body) : { ok: false as const, skipped: true as const };
  return {
    sms: sms.ok ? "sent" : sms.skipped ? "skip" : "fail",
    push: push.ok ? "sent" : "skipped" in push && push.skipped ? "skip" : "fail",
  };
}
