import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatHoursLabel,
  interpolate,
  messages,
  privacySections,
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
  assert.match(formatHoursLabel("es", { hoursDays: "123456", hoursOpen: "08:00", hoursClose: "16:00" }), /Lun–Sáb/);
  assert.equal(privacySections("es")[0].title, "Para quién es esto");
});
