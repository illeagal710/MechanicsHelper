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

  const hot = reply("se calienta", "es");
  assert.equal(hot.urgency, "urgent");
  assert.ok(hot.chips.some(isBookChip));
});

test("missing GROQ_API_KEY falls back to keyword diagnose.ts", async () => {
  const res = await diagnoseWithLlm("Brake noise", "en", { apiKey: "" });
  assert.equal(res.source, "keyword");
  assert.match(res.text, /Brake noise can be cheap wear indicators/i);
  assert.ok(res.chips.some((c) => /book brake inspection/i.test(c)));
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
});

test("HTTP 429 falls back to keyword rules", async () => {
  let called = 0;
  const fetchMock: typeof fetch = async (input) => {
    called += 1;
    assert.equal(String(input), GROQ_CHAT_URL);
    return new Response("rate limited", { status: 429 });
  };
  const res = await diagnoseWithLlm("Brake noise", "en", {
    apiKey: "gsk_test",
    fetch: fetchMock,
  });
  assert.equal(called, 1);
  assert.equal(res.source, "keyword");
  assert.match(res.text, /shop rules/i);
  assert.match(res.text, /Brake noise can be cheap wear indicators/i);
  assert.ok(res.chips.some(isBookChip));
});

test("provider error falls back to keyword rules", async () => {
  const fetchMock: typeof fetch = async () => new Response("nope", { status: 500 });
  const res = await diagnoseWithLlm("Check engine light", "en", {
    apiKey: "gsk_test",
    fetch: fetchMock,
  });
  assert.equal(res.source, "keyword");
  assert.match(res.text, /stored fault code/i);
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
