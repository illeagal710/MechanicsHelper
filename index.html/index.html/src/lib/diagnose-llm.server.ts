import { env } from "./env.server.ts";
import {
  diagnoseLocal,
  ensureBookChip,
  isCarTopic,
  refuse,
  withUrgencyTag,
  type DiagReply,
  type DiagUrgency,
} from "./diagnose.ts";
import { translate, type Locale } from "./i18n.ts";

export const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_TIMEOUT_MS = 12_000;
const MAX_TEXT = 2000;

export type DiagnoseLlmOpts = {
  apiKey?: string;
  model?: string;
  fetch?: typeof fetch;
};

function readApiKey(opts?: DiagnoseLlmOpts): string | undefined {
  if (opts && Object.prototype.hasOwnProperty.call(opts, "apiKey")) {
    return opts.apiKey?.trim() || undefined;
  }
  return env("GROQ_API_KEY");
}

function readModel(opts?: DiagnoseLlmOpts): string {
  if (opts?.model?.trim()) return opts.model.trim();
  return env("GROQ_MODEL") || DEFAULT_GROQ_MODEL;
}

function systemPrompt(locale: Locale): string {
  const lang = locale === "es" ? "Spanish" : "English";
  const book = locale === "es" ? "Reservar" : "Book";
  return [
    "You are Mechanics Helper, a shop assistant.",
    "You may ONLY help with cars, vehicles, repair, and maintenance.",
    "If the user asks about anything else, set refused to true.",
    "You are not a certified inspection. Be practical and concise.",
    `Reply in ${lang}.`,
    "Return JSON only, no markdown:",
    `{"text":"string","chips":["${book} …"],"urgency":"urgent"|"soon"|"normal","refused":false}`,
    `When refused is false, include 1-3 short chips and at least one chip that starts with "${book}".`,
  ].join(" ");
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence?.[1] ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function parseLlmReply(raw: string, locale: Locale): DiagReply | null {
  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as {
    text?: unknown;
    chips?: unknown;
    urgency?: unknown;
    refused?: unknown;
  };
  if (obj.refused === true) return refuse(locale);
  const text = typeof obj.text === "string" ? obj.text.trim() : "";
  if (!text) return null;
  const chips = Array.isArray(obj.chips)
    ? obj.chips.filter((c): c is string => typeof c === "string" && c.trim().length > 0).map((c) => c.trim().slice(0, 60)).slice(0, 4)
    : [];
  const urgency: DiagUrgency | undefined =
    obj.urgency === "urgent" || obj.urgency === "soon" || obj.urgency === "normal" ? obj.urgency : undefined;
  return withUrgencyTag(
    ensureBookChip(
      {
        text: text.slice(0, MAX_TEXT),
        chips,
        urgency,
        source: "llm",
      },
      locale,
    ),
    locale,
  );
}

async function callGroq(
  text: string,
  locale: Locale,
  apiKey: string,
  model: string,
  fetchImpl: typeof fetch,
): Promise<DiagReply | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), GROQ_TIMEOUT_MS);
  try {
    const res = await fetchImpl(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt(locale) },
          { role: "user", content: text.slice(0, 1500) },
        ],
      }),
      signal: ac.signal,
    });
    if (res.status === 429 || !res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseLlmReply(content, locale);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Server-side diagnose: Groq when GROQ_API_KEY is set, keyword rules otherwise.
 * 429 / provider errors fall back to diagnoseLocal. Non-car topics are fenced
 * before any network call.
 */
export async function diagnoseWithLlm(
  text: string,
  locale: Locale = "en",
  opts?: DiagnoseLlmOpts,
): Promise<DiagReply> {
  const local = diagnoseLocal(text, locale);
  if (local.source === "refuse") return local;
  if (!isCarTopic(text)) return local;

  const apiKey = readApiKey(opts);
  if (!apiKey) return local;

  const llm = await callGroq(text, locale, apiKey, readModel(opts), opts?.fetch ?? fetch);
  if (!llm) {
    return {
      ...local,
      text: `${translate(locale, "diag.error")}\n\n${local.text}`,
    };
  }
  return llm;
}
