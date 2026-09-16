import { translate, type Locale } from "@/lib/i18n";

export type DiagReply = { text: string; chips: string[]; urgency?: "urgent" | "soon" | "normal" };

export function greet(locale: Locale = "en"): DiagReply {
  return {
    text: translate(locale, "diag.greet"),
    chips: [
      translate(locale, "diag.chip.checkEngine"),
      translate(locale, "diag.chip.wontStart"),
      translate(locale, "diag.chip.brakeNoise"),
      translate(locale, "diag.chip.overheating"),
      translate(locale, "diag.chip.shaking"),
      translate(locale, "diag.chip.leak"),
    ],
  };
}

function has(t: string, words: string[]) {
  return words.some((w) => t.includes(w));
}

function block(
  locale: Locale,
  urgency: DiagReply["urgency"],
  lead: string,
  bullets: string[],
  chips: string[],
): DiagReply {
  const tag =
    urgency === "urgent"
      ? translate(locale, "diag.urgentTag")
      : urgency === "soon"
        ? translate(locale, "diag.soonTag")
        : translate(locale, "diag.normalTag");
  return { text: [lead, "", ...bullets.map((b) => "• " + b), "", tag].join("\n"), chips, urgency };
}

export function isBookChip(text: string): boolean {
  return /book|reservar/i.test(text);
}

export function reply(text: string, locale: Locale = "en"): DiagReply {
  const t = (text || "").toLowerCase();
  if (has(t, ["overheat", "steam", "coolant", "running hot", "sobrecalent", "vapor", "refrigerante", "se calienta"])) {
    return block(
      locale,
      "urgent",
      translate(locale, "diag.overheat.lead"),
      [
        translate(locale, "diag.overheat.b1"),
        translate(locale, "diag.overheat.b2"),
        translate(locale, "diag.overheat.b3"),
      ],
      [translate(locale, "diag.overheat.chip")],
    );
  }
  if (
    has(t, [
      "won't start",
      "wont start",
      "no start",
      "click",
      "dead battery",
      "no arranca",
      "no prende",
      "no enciende",
      "batería muerta",
      "bateria muerta",
    ])
  ) {
    return block(
      locale,
      "soon",
      translate(locale, "diag.nostart.lead"),
      [translate(locale, "diag.nostart.b1"), translate(locale, "diag.nostart.b2")],
      [translate(locale, "diag.nostart.chip")],
    );
  }
  if (has(t, ["check engine", "engine light", "luz del motor", "luz de check", "testigo del motor"])) {
    return block(
      locale,
      "soon",
      translate(locale, "diag.cel.lead"),
      [translate(locale, "diag.cel.b1"), translate(locale, "diag.cel.b2")],
      [translate(locale, "diag.cel.chip")],
    );
  }
  if (has(t, ["brake", "grinding", "squeak", "squeal", "pedal", "freno", "rechin", "chilla"])) {
    return block(
      locale,
      "soon",
      translate(locale, "diag.brake.lead"),
      [translate(locale, "diag.brake.b1"), translate(locale, "diag.brake.b2")],
      [translate(locale, "diag.brake.chip")],
    );
  }
  if (has(t, ["shake", "vibration", "wobble", "tiembla", "vibrac", "vibra", "tambalea"])) {
    return block(
      locale,
      "soon",
      translate(locale, "diag.shake.lead"),
      [translate(locale, "diag.shake.b1")],
      [translate(locale, "diag.shake.chip")],
    );
  }
  if (has(t, ["leak", "puddle", "dripping", "fuga", "gotea", "charco", "líquido", "liquido"])) {
    return block(
      locale,
      "soon",
      translate(locale, "diag.leak.lead"),
      [translate(locale, "diag.leak.b1"), translate(locale, "diag.leak.b2")],
      [translate(locale, "diag.leak.chip")],
    );
  }
  if (t.length < 12) {
    return {
      text: translate(locale, "diag.more"),
      chips: [
        translate(locale, "diag.chip.checkEngine"),
        translate(locale, "diag.chip.wontStart"),
        translate(locale, "diag.chip.brakeNoise"),
      ],
    };
  }
  return block(
    locale,
    "normal",
    translate(locale, "diag.generic.lead"),
    [translate(locale, "diag.generic.b1"), translate(locale, "diag.generic.b2")],
    [translate(locale, "diag.generic.chip")],
  );
}
