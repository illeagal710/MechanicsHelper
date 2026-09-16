import { translate, type Locale } from "./i18n.ts";
import { VEHICLE_DATA } from "./vehicles.ts";

export type DiagSource = "llm" | "keyword" | "refuse";
export type DiagUrgency = "urgent" | "soon" | "normal";
export type DiagReply = {
  text: string;
  chips: string[];
  urgency?: DiagUrgency;
  source?: DiagSource;
};

const MAKE_RE = new RegExp(
  `\\b(?:${Object.keys(VEHICLE_DATA)
    .filter((make) => make !== "Other")
    .map((make) => make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})\\b`,
  "i",
);

/** Vehicle types, parts, symptoms, repair/maintenance — EN + ES stems. */
const CAR_STEMS = [
  "overheat",
  "steam",
  "coolant",
  "running hot",
  "sobrecalent",
  "vapor",
  "refrigerante",
  "se calienta",
  "won't start",
  "wont start",
  "no start",
  "dead battery",
  "no arranca",
  "no prende",
  "no enciende",
  "batería muerta",
  "bateria muerta",
  "check engine",
  "engine light",
  "luz del motor",
  "luz de check",
  "testigo del motor",
  "brake",
  "grinding",
  "squeak",
  "squeal",
  "freno",
  "rechin",
  "chilla",
  "shake",
  "vibration",
  "wobble",
  "tiembla",
  "vibrac",
  "vibra",
  "tambalea",
  "leak",
  "puddle",
  "dripping",
  "fuga",
  "gotea",
  "charco",
  "weather stripp",
  "vehicle",
  "vehículo",
  "vehiculo",
  "engine",
  "motor",
  "transmission",
  "transmisión",
  "transmision",
  "mechanic",
  "mecánic",
  "mecanic",
  "taller",
  "repair",
  "reparar",
  "reparación",
  "reparacion",
  "maintenance",
  "mantenimiento",
  "diagnos",
  "inspecc",
  "inspect",
  "oil change",
  "cambio de aceite",
  "tune-up",
  "tune up",
  "alternator",
  "alternador",
  "radiator",
  "radiador",
  "thermostat",
  "termostato",
  "water pump",
  "bomba de agua",
  "head gasket",
  "junta de cabeza",
  "spark plug",
  "bujía",
  "bujia",
  "starter",
  "arrancador",
  "suspension",
  "suspensión",
  "suspension",
  "strut",
  "amortiguador",
  "muffler",
  "silenciador",
  "catalytic",
  "catalítico",
  "catalitico",
  "exhaust",
  "escape",
  "clutch",
  "embrague",
  "axle",
  "cv joint",
  "rótula",
  "rotula",
  "rotor",
  "caliper",
  "pinza",
  "balata",
  "pad wear",
  "abs",
  "tpms",
  "obd",
  "misfire",
  "falla de encendido",
  "rough idle",
  "ralentí",
  "ralenti",
  "stalling",
  "se apaga",
  "knocking",
  "golpeteo",
  "whining",
  "chirrido",
  "power steering",
  "dirección",
  "direccion",
  "steering",
  "volante",
  "alignment",
  "alineación",
  "alineacion",
  "tire",
  "tyre",
  "llanta",
  "neumático",
  "neumatico",
  "windshield",
  "parabrisas",
  "wiper",
  "limpiaparabrisas",
  "battery",
  "batería",
  "bateria",
  "alternat",
  "serpentine",
  "correa",
  "timing belt",
  "banda de tiempo",
  "coolant hose",
  "manguera",
  "heater core",
  "cabin filter",
  "filtro",
  "fuel pump",
  "bomba de gasolina",
  "injector",
  "inyector",
  "turbo",
  "supercharger",
  "kompressor",
  "driveshaft",
  "cardán",
  "cardan",
  "differential",
  "diferencial",
  "transfer case",
  "wheel bearing",
  "balero",
  "rodamiento",
  "check-engine",
  "acelera",
  "accelerate",
  "odometer",
  "kilometraje",
  "mileage",
  "aceite",
  "antifreeze",
  "anticongelante",
  "transmission fluid",
  "brake fluid",
  "líquido de frenos",
  "liquido de frenos",
  "chevy",
  "volkswagen",
  "mercedes",
  "pickup",
  "minivan",
  "suv",
  "motorcycle",
  "motocicleta",
  "hybrid",
  "híbrido",
  "hibrido",
  "ev battery",
  "charging port",
  "puerto de carga",
];

const CAR_WORD_RE =
  /\b(?:car|cars|truck|trucks|van|vans|suv|suvs|auto|autos|coche|coches|carro|carros|camión|camion|camiones|vehicle|vehicles|engine|motor|motors|oil|tire|tires|rpm|belt|hose|pad|pads|axle|fuel|spark|idle|stall|clutch|exhaust|battery|batería|bateria|llanta|llantas|aceite|pedal|pedals|brakes|brake|frenos|freno)\b/i;

const OFF_TOPIC_STEMS = [
  "recipe",
  "receta",
  "poem",
  "poema",
  "poetry",
  "homework",
  "tarea escolar",
  "essay",
  "ensayo",
  "crypto",
  "bitcoin",
  "stock price",
  "stock market",
  "precio de la acción",
  "precio de la accion",
  "javascript",
  "typescript",
  "python code",
  "write code",
  "write a song",
  "canción",
  "cancion",
  "politics",
  "política",
  "politica",
  "election",
  "elecciones",
  "weather today",
  "what's the weather",
  "whats the weather",
  "qué tiempo hace",
  "que tiempo hace",
  "capital of",
  "capital de",
  "movie",
  "película",
  "pelicula",
  "nba",
  "nfl score",
  "who won the",
  "bake a cake",
  "hornear",
  "love poem",
  "tell me a joke",
  "cuéntame un chiste",
  "cuentame un chiste",
];

function has(t: string, words: string[]) {
  return words.some((w) => t.includes(w));
}

function normalized(text: string): string {
  return (text || "").toLowerCase();
}

export function bookingSymptomsFromChat(
  messages: { role: string; text: string }[],
  bookAt: number,
): string {
  return messages
    .slice(0, Math.max(0, bookAt))
    .filter((m) => m.role === "user")
    .map((m) => m.text)
    .join(" — ");
}

export function isBookChip(text: string): boolean {
  return /book|reservar/i.test(text);
}

export function isOffTopic(text: string): boolean {
  const t = normalized(text);
  if (!t.trim()) return false;
  const carRepair = CAR_WORD_RE.test(t) || has(t, CAR_STEMS);
  if (carRepair) return false;
  return has(t, OFF_TOPIC_STEMS);
}

export function isCarTopic(text: string): boolean {
  const t = normalized(text);
  if (!t.trim()) return false;
  if (isOffTopic(text)) return false;
  return CAR_WORD_RE.test(t) || has(t, CAR_STEMS) || MAKE_RE.test(text);
}

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
    source: "keyword",
  };
}

export function refuse(locale: Locale = "en"): DiagReply {
  return {
    text: translate(locale, "diag.refuse"),
    chips: [
      translate(locale, "diag.chip.checkEngine"),
      translate(locale, "diag.chip.brakeNoise"),
      translate(locale, "diag.chip.overheating"),
    ],
    source: "refuse",
  };
}

function block(
  locale: Locale,
  urgency: DiagUrgency,
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
  return {
    text: [lead, "", ...bullets.map((b) => "• " + b), "", tag].join("\n"),
    chips,
    urgency,
    source: "keyword",
  };
}

/** Keyword-only shop rules. No fence — callers that need the fence use diagnoseLocal. */
export function reply(text: string, locale: Locale = "en"): DiagReply {
  const t = normalized(text);
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
      source: "keyword",
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

/** Hard fence + keyword rules. Used when Groq is unset or the provider fails. */
export function diagnoseLocal(text: string, locale: Locale = "en"): DiagReply {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return { ...reply("", locale), source: "keyword" };
  }
  if (!isCarTopic(trimmed)) {
    if (trimmed.length < 12) return { ...reply(trimmed, locale), source: "keyword" };
    return refuse(locale);
  }
  return { ...reply(trimmed, locale), source: "keyword" };
}

export function ensureBookChip(res: DiagReply, locale: Locale = "en"): DiagReply {
  if (res.source === "refuse") return res;
  if (res.chips.some(isBookChip)) return res;
  return {
    ...res,
    chips: [...res.chips, translate(locale, "diag.generic.chip")],
  };
}

export function withUrgencyTag(res: DiagReply, locale: Locale = "en"): DiagReply {
  if (!res.urgency || res.source === "refuse") return res;
  const tag =
    res.urgency === "urgent"
      ? translate(locale, "diag.urgentTag")
      : res.urgency === "soon"
        ? translate(locale, "diag.soonTag")
        : translate(locale, "diag.normalTag");
  if (res.text.includes(tag)) return res;
  return { ...res, text: `${res.text}\n\n${tag}` };
}
