import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bookingSymptomsFromChat,
  diagnoseLocal,
  isBookChip,
  isCarTopic,
  isOffTopic,
  refuse,
  reply,
} from "./diagnose.ts";
import { GROQ_CHAT_URL, diagnoseWithLlm } from "./diagnose-llm.server.ts";
import { translate } from "./i18n.ts";

test("fence allows car / repair / maintenance topics", () => {
  assert.equal(isCarTopic("Brake noise"), true);
  assert.equal(isCarTopic("Overheating"), true);
  assert.equal(isCarTopic("2018 Civic grinds when I brake going downhill"), true);
  assert.equal(isCarTopic("Mi Honda no arranca"), true);
  assert.equal(isCarTopic("Check engine light"), true);
});

test("fence allows year+model and no-start phrases", () => {
  const exact = "2018 civic not starting";
  assert.equal(isCarTopic(exact), true);
  const civicNoStart = diagnoseLocal(exact, "en");
  assert.notEqual(civicNoStart.source, "refuse");
  assert.equal(civicNoStart.source, "keyword");
  assert.match(civicNoStart.text, /no-start is very bookable/i);
  assert.ok(civicNoStart.chips.some(isBookChip));

  assert.equal(isCarTopic("won't start"), true);
  assert.equal(isCarTopic("my civic won't start"), true);
  assert.equal(isCarTopic("2018 civic"), true);
  assert.equal(isCarTopic("Honda Civic"), true);

  assert.equal(isCarTopic("What's the capital of France?"), false);
  assert.equal(diagnoseLocal("What's the capital of France?", "en").source, "refuse");
});

test("2018 civic is a car topic and gets a vehicle answer, not refuse or tell-me-more", () => {
  assert.equal(isCarTopic("2018 civic"), true);
  const civic = diagnoseLocal("2018 civic", "en");
  assert.notEqual(civic.source, "refuse");
  assert.equal(civic.source, "keyword");
  assert.doesNotMatch(civic.text, /give me a bit more/i);
  assert.match(civic.text, /enough to start a ticket/i);
  assert.ok(civic.chips.some(isBookChip));
});

test("grinds when stopping is a car topic and uses the brake keyword path", () => {
  assert.equal(isCarTopic("grinds when stopping"), true);
  assert.equal(isCarTopic("grinding when I brake"), true);
  assert.equal(isCarTopic("squeaks when braking"), true);
  const grind = diagnoseLocal("grinds when stopping", "en");
  assert.notEqual(grind.source, "refuse");
  assert.equal(grind.source, "keyword");
  assert.match(grind.text, /Brake noise can be cheap wear indicators/i);
  assert.ok(grind.chips.some((c) => /book brake inspection/i.test(c)));
});

test("fence refuses non-car topics in English and Spanish", () => {
  assert.equal(isCarTopic("What's the capital of France?"), false);
  assert.equal(isOffTopic("What's the capital of France?"), true);
  assert.equal(isCarTopic("Write me a poem about the moon"), false);
  assert.equal(isCarTopic("How do I bake a cake for a birthday party?"), false);
  assert.equal(isCarTopic("Cuéntame un chiste sobre política"), false);
  assert.equal(isOffTopic("Cuéntame un chiste sobre política"), true);

  const en = diagnoseLocal("What's the capital of France?", "en");
  assert.equal(en.source, "refuse");
  assert.equal(en.text, translate("en", "diag.refuse"));
  assert.ok(en.chips.length > 0);

  const es = diagnoseLocal("Cómo hornear un pastel de chocolate para una fiesta", "es");
  assert.equal(es.source, "refuse");
  assert.equal(es.text, translate("es", "diag.refuse"));
});

test("keyword reply still matches brake and overheating rules", () => {
  const brake = reply("Brake noise", "en");
  assert.equal(brake.source, "keyword");
  assert.match(brake.text, /Brake noise can be cheap wear indicators/i);
  assert.ok(brake.chips.some(isBookChip));

  const grind = reply("grinds when stopping", "en");
  assert.match(grind.text, /Brake noise can be cheap wear indicators/i);
  assert.ok(grind.chips.some(isBookChip));

  const hot = reply("se calienta", "es");
  assert.equal(hot.urgency, "urgent");
  assert.ok(hot.chips.some(isBookChip));
});

test("missing GROQ_API_KEY falls back to keyword diagnose.ts", async () => {
  const local = diagnoseLocal("Brake noise", "en");
  const res = await diagnoseWithLlm("Brake noise", "en", { apiKey: "" });
  assert.equal(res.source, "keyword");
  assert.equal(res.text, local.text);
  assertNoBusyPrefix(res.text);
  assert.match(res.text, /Brake noise can be cheap wear indicators/i);
  assert.ok(res.chips.some((c) => /book brake inspection/i.test(c)));
});

function assertNoBusyPrefix(text: string) {
  assert.doesNotMatch(text, /helper is busy/i);
  assert.doesNotMatch(text, /Using shop rules/i);
  assert.doesNotMatch(text, /shop rules instead/i);
  assert.doesNotMatch(text, /asistente está ocupado/i);
  assert.doesNotMatch(text, /reglas del taller/i);
}

test("missing GROQ_API_KEY still answers 2018 civic not starting", async () => {
  const exact = "2018 civic not starting";
  const res = await diagnoseWithLlm(exact, "en", { apiKey: "" });
  const local = diagnoseLocal(exact, "en");
  assert.notEqual(res.source, "refuse");
  assert.equal(res.source, "keyword");
  assert.equal(res.text, local.text);
  assert.match(res.text, /no-start is very bookable/i);
  assertNoBusyPrefix(res.text);
  assert.ok(res.chips.some(isBookChip));
});

test("missing key still refuses non-car topics without calling Groq", async () => {
  let called = 0;
  const fetchMock: typeof fetch = async () => {
    called += 1;
    return new Response("nope", { status: 500 });
  };
  const res = await diagnoseWithLlm("Write me a love poem about the ocean tonight", "en", {
    apiKey: "gsk_should_not_be_used",
    fetch: fetchMock,
  });
  assert.equal(called, 0);
  assert.equal(res.source, "refuse");
  assert.equal(res.text, translate("en", "diag.refuse"));
  assertNoBusyPrefix(res.text);
});

test("HTTP 429 falls back to keyword rules without a busy prefix", async () => {
  let called = 0;
  const fetchMock: typeof fetch = async (input) => {
    called += 1;
    assert.equal(String(input), GROQ_CHAT_URL);
    return new Response("rate limited", { status: 429 });
  };
  const local = diagnoseLocal("Brake noise", "en");
  const res = await diagnoseWithLlm("Brake noise", "en", {
    apiKey: "gsk_test",
    fetch: fetchMock,
  });
  assert.equal(called, 1);
  assert.equal(res.source, "keyword");
  assert.equal(res.text, local.text);
  assertNoBusyPrefix(res.text);
  assert.match(res.text, /Brake noise can be cheap wear indicators/i);
  assert.ok(res.chips.some(isBookChip));
});

test("provider error falls back to keyword rules without a busy prefix", async () => {
  const fetchMock: typeof fetch = async () => new Response("nope", { status: 500 });
  const exact = "2018 civic not starting";
  const local = diagnoseLocal(exact, "en");
  const res = await diagnoseWithLlm(exact, "en", {
    apiKey: "gsk_test",
    fetch: fetchMock,
  });
  assert.notEqual(res.source, "refuse");
  assert.equal(res.source, "keyword");
  assert.equal(res.text, local.text);
  assertNoBusyPrefix(res.text);
  assert.match(res.text, /no-start is very bookable/i);
  assert.ok(res.chips.some(isBookChip));
});

test("Spanish Groq failure returns only the keyword answer", async () => {
  const fetchMock: typeof fetch = async () => new Response("rate limited", { status: 429 });
  const prompt = "Mi Honda no arranca";
  const local = diagnoseLocal(prompt, "es");
  const res = await diagnoseWithLlm(prompt, "es", {
    apiKey: "gsk_test",
    fetch: fetchMock,
  });
  assert.equal(res.source, "keyword");
  assert.equal(res.text, local.text);
  assertNoBusyPrefix(res.text);
  assert.ok(res.chips.some(isBookChip));
});

test("year+model and grind phrases reach Groq when a key is set", async () => {
  const seen: string[] = [];
  const fetchMock: typeof fetch = async (_input, init) => {
    const body = JSON.parse(String((init as RequestInit)?.body || "{}")) as {
      messages?: { role?: string; content?: string }[];
    };
    seen.push(body.messages?.find((m) => m.role === "user")?.content || "");
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                text: "Shop answer for that vehicle.",
                chips: ["Book a look"],
                urgency: "normal",
                refused: false,
              }),
            },
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  const civic = await diagnoseWithLlm("2018 civic", "en", { apiKey: "gsk_test", fetch: fetchMock });
  const grind = await diagnoseWithLlm("grinds when stopping", "en", {
    apiKey: "gsk_test",
    fetch: fetchMock,
  });
  assert.deepEqual(seen, ["2018 civic", "grinds when stopping"]);
  assert.equal(civic.source, "llm");
  assert.equal(grind.source, "llm");
  assert.match(civic.text, /Shop answer for that vehicle/);
});

test("Groq refuse on a car topic falls back to keyword, not refuse()", async () => {
  const fetchMock: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ refused: true, text: "nope" }) } }],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  const civic = await diagnoseWithLlm("2018 civic", "en", { apiKey: "gsk_test", fetch: fetchMock });
  assert.notEqual(civic.source, "refuse");
  assert.equal(civic.source, "keyword");
  assert.match(civic.text, /enough to start a ticket/i);
  assertNoBusyPrefix(civic.text);

  const grind = await diagnoseWithLlm("grinds when stopping", "en", {
    apiKey: "gsk_test",
    fetch: fetchMock,
  });
  assert.notEqual(grind.source, "refuse");
  assert.equal(grind.source, "keyword");
  assert.match(grind.text, /Brake noise can be cheap wear indicators/i);
  assertNoBusyPrefix(grind.text);
});

test("missing key still answers 2018 civic and grinds when stopping", async () => {
  const civic = await diagnoseWithLlm("2018 civic", "en", { apiKey: "" });
  assert.notEqual(civic.source, "refuse");
  assert.equal(civic.text, diagnoseLocal("2018 civic", "en").text);
  assert.doesNotMatch(civic.text, /give me a bit more/i);
  assertNoBusyPrefix(civic.text);

  const grind = await diagnoseWithLlm("grinds when stopping", "en", { apiKey: "" });
  assert.notEqual(grind.source, "refuse");
  assert.match(grind.text, /Brake noise can be cheap wear indicators/i);
  assertNoBusyPrefix(grind.text);
});

test("successful Groq JSON is used and keeps a Book chip", async () => {
  const fetchMock: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                text: "Pads may be worn. Have the shop measure them.",
                chips: ["Ask more"],
                urgency: "soon",
                refused: false,
              }),
            },
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  const res = await diagnoseWithLlm("Brake noise", "en", {
    apiKey: "gsk_test",
    fetch: fetchMock,
  });
  assert.equal(res.source, "llm");
  assert.match(res.text, /Pads may be worn/);
  assert.ok(res.chips.some(isBookChip));
});

test("refuse() copy is bilingual", () => {
  assert.match(refuse("en").text, /cars, vehicles, repair/i);
  assert.match(refuse("es").text, /autos, vehículos, reparación/i);
});

test("Book chip prefills only user text from before that reply", () => {
  const chat = [
    { role: "bot", text: "greet" },
    { role: "user", text: "Brake noise" },
    { role: "bot", text: "pads" },
    { role: "user", text: "What's the capital of France?" },
    { role: "bot", text: "refuse" },
  ];
  assert.equal(bookingSymptomsFromChat(chat, 2), "Brake noise");
  assert.equal(bookingSymptomsFromChat(chat, 4), "Brake noise — What's the capital of France?");
});
