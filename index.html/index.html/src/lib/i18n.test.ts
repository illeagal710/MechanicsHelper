import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TIME_12H,
  formatClock,
  formatHoursLabel,
  interpolate,
  localeTag,
  messages,
  privacySections,
  termsSections,
  statusText,
  translate,
  translateDetail,
  translateNote,
  translateStoreError,
} from "./i18n.ts";

test("English and Spanish dictionaries share the same keys", () => {
  const enKeys = Object.keys(messages.en).sort();
  const esKeys = Object.keys(messages.es).sort();
  assert.deepEqual(esKeys, enKeys);
});

test("every Spanish string is filled in", () => {
  for (const [key, value] of Object.entries(messages.es)) {
    assert.ok(value.trim().length > 0, `empty Spanish string for ${key}`);
  }
});

test("interpolate replaces named placeholders", () => {
  assert.equal(interpolate("Hi {name}", { name: "Maya" }), "Hi Maya");
  assert.equal(translate("es", "toast.hi", { name: "Maya" }), "Hola Maya");
});

test("store errors and known notes translate without changing source text", () => {
  assert.equal(
    translateStoreError("es", "Email/phone or password is wrong."),
    "El correo/teléfono o la contraseña es incorrecta.",
  );
  assert.equal(translateNote("es", "Booked from customer app."), "Reservado desde la app del cliente.");
  assert.equal(translateNote("es", "Status set to Scheduled"), "Estado cambiado a Programado");
  assert.equal(translateDetail("es", "Mobile mechanic"), "Mecánico a domicilio");
});

test("status labels stay distinct between shop and customer", () => {
  assert.equal(statusText("en", "ready", "shop"), "Ready for pickup");
  assert.equal(statusText("es", "ready", "customer"), "Tu vehículo está listo");
});

test("production store errors and hours labels translate", () => {
  assert.equal(
    translateStoreError("es", "That time is already booked. Pick another slot."),
    "Ese horario ya está ocupado. Elige otro.",
  );
  assert.equal(translateStoreError("es", "Password is wrong."), "La contraseña es incorrecta.");
  assert.equal(
    translateStoreError("es", "That reset code is wrong or expired."),
    "Ese código es incorrecto o ya caducó.",
  );
  assert.match(formatHoursLabel("es", { hoursDays: "123456", hoursOpen: "08:00", hoursClose: "16:00" }), /Lun–Sáb/);
  assert.equal(privacySections("es")[0].title, "Para quién es esto");
  assert.match(privacySections("en").map((s) => s.title).join(" "), /Accounts|Photos|Helper AI|Password/);
  assert.match(privacySections("en").find((s) => s.title === "Photos")?.body || "", /bay/i);
  assert.match(privacySections("en").find((s) => s.title === "Password and username recovery")?.body || "", /Resend/);
  assert.match(privacySections("en").find((s) => s.title === "Helper AI")?.body || "", /Groq/);
  assert.match(privacySections("en").find((s) => s.title === "Contact")?.body || "", /support@mechanicshelper\.app/);
  assert.equal(termsSections("es")[0].title, "Usar la app");
  assert.match(termsSections("en").map((s) => s.body).join(" "), /support@mechanicshelper\.app/);
  assert.match(translate("en", "support.body"), /support@mechanicshelper\.app/);
  assert.match(translate("es", "support.bayTitle"), /bahía/i);
  assert.equal(translate("en", "welcome.terms"), "Terms");
  assert.equal(translate("es", "welcome.terms"), "Términos");
});

function assertMeridiem(label: string) {
  assert.match(label, /[AaPp]\.?\s*[Mm]/);
  assert.doesNotMatch(label, /\b(?:1[3-9]|2[0-3]):/);
}

test("clock and hours labels use 12-hour AM/PM in English and Spanish", () => {
  assert.match(formatClock("en", "08:00"), /8:00\s*AM/i);
  assert.match(formatClock("en", "13:00"), /1:00\s*PM/i);
  assertMeridiem(formatClock("es", "08:00"));
  assertMeridiem(formatClock("es", "13:00"));
  assert.match(formatClock("es", "13:00"), /1:00/);

  const hoursEn = formatHoursLabel("en", { hoursDays: "123456", hoursOpen: "08:00", hoursClose: "16:00" });
  const hoursEs = formatHoursLabel("es", { hoursDays: "123456", hoursOpen: "08:00", hoursClose: "16:00" });
  assert.match(hoursEn, /8:00\s*AM/i);
  assert.match(hoursEn, /4:00\s*PM/i);
  assert.doesNotMatch(hoursEn, /16:/);
  assert.doesNotMatch(hoursEs, /16:/);
  assertMeridiem(hoursEs);
});

test("theme labels exist in English and Spanish", () => {
  assert.equal(translate("en", "theme.light"), "Light");
  assert.equal(translate("en", "theme.dark"), "Dark");
  assert.equal(translate("en", "account.theme"), "Theme");
  assert.equal(translate("es", "theme.light"), "Claro");
  assert.equal(translate("es", "theme.dark"), "Oscuro");
  assert.equal(translate("es", "account.theme"), "Tema");
  assert.match(translate("es", "account.themeHint"), /claro|oscuro/i);
});

test("helper fence, loading, and fallback strings exist in English and Spanish", () => {
  assert.match(translate("en", "diag.refuse"), /cars, vehicles, repair/i);
  assert.match(translate("es", "diag.refuse"), /autos, vehículos, reparación/i);
  assert.equal(translate("en", "diag.loading"), "Looking that up…");
  assert.equal(translate("es", "diag.loading"), "Revisando eso…");
  assert.match(translate("en", "diag.error"), /shop rules/i);
  assert.match(translate("es", "diag.error"), /reglas del taller/i);
});

test("booking symptoms are marked optional in English and Spanish", () => {
  assert.match(translate("en", "book.whatsGoingOn"), /optional/i);
  assert.match(translate("es", "book.whatsGoingOn"), /opcional/i);
  assert.match(translate("en", "book.symptomsHint"), /optional/i);
  assert.match(translate("es", "book.symptomsHint"), /opcional/i);
  assert.equal(translate("en", "book.noSymptoms"), "No description");
  assert.equal(translate("es", "book.noSymptoms"), "Sin descripción");
});

test("profile vs bay photo labels exist in English and Spanish", () => {
  assert.equal(translate("en", "photo.choose"), "Choose photo");
  assert.equal(translate("en", "photo.take"), "Take photo");
  assert.equal(translate("es", "photo.choose"), "Elegir foto");
  assert.equal(translate("es", "photo.take"), "Tomar foto");
  assert.match(translate("es", "photo.profileEmpty"), /silueta/i);
  assert.match(translate("es", "job.photoHint"), /ticket/);
});

test("Other vehicle free-text labels exist in English and Spanish", () => {
  assert.equal(translate("en", "vehicle.whichMake"), "Which make?");
  assert.equal(translate("en", "vehicle.whichModel"), "Which model?");
  assert.equal(translate("es", "vehicle.whichMake"), "¿Qué marca?");
  assert.equal(translate("es", "vehicle.whichModel"), "¿Qué modelo?");
  assert.equal(translate("es", "vehicle.other"), "Otro");
});

test("booking slot timestamps format 12-hour AM/PM via locale tags", () => {
  const morning = new Date(2026, 8, 17, 8, 0, 0).toISOString();
  const afternoon = new Date(2026, 8, 17, 13, 0, 0).toISOString();
  const fmt = (iso: string, locale: string) =>
    new Date(iso).toLocaleString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      ...TIME_12H,
    });
  assert.match(fmt(morning, localeTag("en")), /8:00\s*AM/i);
  assert.match(fmt(afternoon, localeTag("en")), /1:00\s*PM/i);
  assertMeridiem(fmt(morning, localeTag("es")));
  assertMeridiem(fmt(afternoon, localeTag("es")));
  assert.match(fmt(afternoon, localeTag("es")), /1:00/);
});
