export type DiagReply = { text: string; chips: string[]; urgency?: "urgent" | "soon" | "normal" };

export function greet(): DiagReply {
  return {
    text: "I'm the shop helper. Tell me the year, make, and model if you have them, then what's going on — a noise, a light, a smell, a leak, or how it drives.\n\nI can narrow likely causes. If the car isn't safe to drive, say so.",
    chips: ["Check engine light", "Won't start", "Brake noise", "Overheating", "Shaking", "Leak under the car"],
  };
}

function has(t: string, words: string[]) {
  return words.some((w) => t.includes(w));
}

function block(urgency: DiagReply["urgency"], lead: string, bullets: string[], chips: string[]): DiagReply {
  const tag =
    urgency === "urgent"
      ? "Urgency: don't keep driving it if you can avoid it."
      : urgency === "soon"
        ? "Urgency: book this week, sooner if it's changing fast."
        : "Urgency: a normal appointment is fine unless something new shows up.";
  return { text: [lead, "", ...bullets.map((b) => "• " + b), "", tag].join("\n"), chips, urgency };
}

export function reply(text: string): DiagReply {
  const t = (text || "").toLowerCase();
  if (has(t, ["overheat", "steam", "coolant", "running hot"])) {
    return block("urgent", "Overheating is one of the fastest ways to wreck an engine.", [
      "If the gauge is high or you see steam: pull over and shut it down.",
      "Common causes: low coolant, thermostat, water pump, fan, head gasket.",
      "Book a cooling-system check.",
    ], ["Book cooling-system check"]);
  }
  if (has(t, ["won't start", "wont start", "no start", "click", "dead battery"])) {
    return block("soon", "A no-start is very bookable — we don't need you to guess the part.", [
      "Clicks usually mean a weak battery or a bad connection.",
      "If it cranks but never catches, think fuel, spark, or a sensor.",
    ], ["Book no-start diagnosis"]);
  }
  if (has(t, ["check engine", "engine light"])) {
    return block("soon", "A check-engine light is a stored fault code — a clue, not a parts list.", [
      "We scan it first. Same light can be a gas cap or a misfire.",
      "A flashing light is an active misfire — don't ignore it.",
    ], ["Book a scan + diagnosis"]);
  }
  if (has(t, ["brake", "grinding", "squeak", "squeal", "pedal"])) {
    return block("soon", "Brake noise can be cheap wear indicators or pads that are gone.", [
      "Tell us which end, and whether it happens cold or after a drive.",
      "A soft or sinking pedal is urgent — hydraulic problem.",
    ], ["Book brake inspection"]);
  }
  if (has(t, ["shake", "vibration", "wobble"])) {
    return block("soon", "Vibration is usually tires, a bent wheel, or rotors if it happens while braking.", [
      "Note the mph when it starts and whether the steering wheel shakes.",
    ], ["Book vibration diagnosis"]);
  }
  if (has(t, ["leak", "puddle", "dripping"])) {
    return block("soon", "A drip is easier to find when it's still wet.", [
      "Sweet green/orange is often coolant. Thick brown/black is oil.",
      "Park on cardboard overnight if you can.",
    ], ["Book leak inspection"]);
  }
  if (t.length < 12) {
    return { text: "Give me a bit more. For example: “2018 Civic, grinds when I brake going downhill.”", chips: ["Check engine light", "Won't start", "Brake noise"] };
  }
  return block("normal", "I have enough to start a ticket, even if the cause isn't obvious yet.", [
    "A good visit starts with what you feel/hear/smell and when it started.",
    "I can drop this description into a booking.",
  ], ["Book this diagnosis"]);
}
