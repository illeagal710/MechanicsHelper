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

test("landing welcome body uses Leon QR/referral copy in English and Spanish", () => {
  assert.equal(
    translate("en", "welcome.body"),
    "Customers track repairs. Shops and independents each get a QR or referral code so people land on the right bay.",
  );
  assert.equal(
    translate("es", "welcome.body"),
    "Los clientes siguen las reparaciones. Cada taller e independiente recibe un QR o un código de referido para que la gente llegue al lugar correcto.",
  );
  assert.doesNotMatch(translate("en", "welcome.body"), /find code/i);
  assert.doesNotMatch(translate("es", "welcome.body"), /comparten un código/);
});

test("welcome find-code field says Shop or Mechanic code, not demo codes", () => {
  assert.equal(translate("en", "welcome.haveCode"), "Shop or Mechanic code");
  assert.equal(translate("en", "welcome.codePlaceholder"), "Shop or Mechanic code");
  assert.equal(translate("es", "welcome.haveCode"), "Código de taller o mecánico");
  assert.equal(translate("es", "welcome.codePlaceholder"), "Código de taller o mecánico");
  for (const locale of ["en", "es"] as const) {
    const blob = `${translate(locale, "welcome.haveCode")} ${translate(locale, "welcome.codePlaceholder")}`;
    assert.doesNotMatch(blob, /demo/i);
    assert.doesNotMatch(blob, /RIV4/);
    assert.doesNotMatch(blob, /LEON/);
  }
});

test("EN and ES treat LEON as a claimable example, not a reserved taken code", () => {
  assert.match(translate("en", "register.findCodePh"), /LEON/);
  assert.match(translate("es", "register.findCodePh"), /LEON/);
  assert.match(translate("en", "register.findCodeHint"), /Unique/i);
  assert.match(translate("es", "register.findCodeHint"), /nadie|único/i);
  assert.equal(translate("en", "err.findCodeTaken"), "That find code is already taken.");
  assert.equal(translate("es", "err.findCodeTaken"), "Ese código ya está en uso.");
  assert.doesNotMatch(translate("en", "welcome.demoCodes"), /LEON/);
  assert.doesNotMatch(translate("es", "welcome.demoCodes"), /LEON/);
  assert.match(translate("en", "welcome.demoCodes"), /RIV4/);
  assert.match(translate("es", "welcome.demoCodes"), /RIV4/);
});

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
  assert.equal(translateNote("es", "Booking declined."), "Cita rechazada.");
  assert.equal(translateNote("es", "Booking declined: Bay is full."), "Cita rechazada: Bay is full.");
  assert.equal(translateDetail("es", "Mobile mechanic"), "Mecánico a domicilio");
  assert.equal(translateStoreError("es", "That find code is already taken."), "Ese código ya está en uso.");
  assert.equal(
    translateStoreError("es", "The customer find code and team join code must be different."),
    "El código para clientes y el código de equipo deben ser distintos.",
  );
  assert.equal(
    translateStoreError("es", "That's the customer find code. Ask the owner for the team join code."),
    "Ese es el código para clientes. Pide al dueño el código de equipo.",
  );
});

test("share and account copy keep find code and team join separate", () => {
  for (const locale of ["en", "es"] as const) {
    assert.doesNotMatch(translate(locale, "share.rotateShop"), /same code|mismo código/i);
    assert.doesNotMatch(translate(locale, "account.customersUseCode"), /same code|mismo código/i);
    assert.match(translate(locale, "account.findCodeHint"), /not the team|no es el código de equipo/i);
    assert.match(translate(locale, "share.teamJoinHint"), /customers never|los clientes nunca/i);
  }
});

test("status labels stay distinct between shop and customer", () => {
  assert.equal(statusText("en", "ready", "shop"), "Ready for pickup");
  assert.equal(statusText("es", "ready", "customer"), "Tu vehículo está listo");
  assert.equal(statusText("en", "declined", "shop"), "Declined");
  assert.equal(statusText("es", "declined", "customer"), "El taller rechazó esta cita");
  assert.equal(statusText("en", "done", "shop"), "Completed");
  assert.equal(statusText("es", "done", "customer"), "Recogido — gracias");
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

test("Account Settings label exists in English and Spanish", () => {
  assert.equal(translate("en", "account.settings"), "Settings");
  assert.equal(translate("es", "account.settings"), "Ajustes");
  assert.match(translate("en", "account.settingsHint"), /language|theme|alert/i);
  assert.match(translate("es", "account.settingsHint"), /idioma|tema|alerta/i);
});

test("customer Account vehicle labels exist in English and Spanish", () => {
  assert.equal(translate("en", "account.vehicles"), "My vehicles");
  assert.equal(translate("es", "account.vehicles"), "Mis vehículos");
  assert.equal(translate("en", "account.addVehicle"), "+ Add vehicle");
  assert.equal(translate("es", "account.addVehicle"), "+ Agregar vehículo");
  assert.equal(translate("en", "book.yourVehicles"), "Your vehicles");
  assert.equal(translate("es", "book.yourVehicles"), "Tus vehículos");
});

test("helper fence, loading, and fallback strings exist in English and Spanish", () => {
  assert.match(translate("en", "diag.refuse"), /cars, vehicles, repair/i);
  assert.match(translate("es", "diag.refuse"), /autos, vehículos, reparación/i);
  assert.equal(translate("en", "diag.loading"), "Looking that up…");
  assert.equal(translate("es", "diag.loading"), "Revisando eso…");
  assert.match(translate("en", "diag.error"), /shop rules/i);
  assert.match(translate("es", "diag.error"), /reglas del taller/i);
});

test("shop technician portal copy exists in English and Spanish", () => {
  assert.equal(translate("en", "shop.techBadge", { shop: "Riverside Auto" }), "Technician · Riverside Auto");
  assert.equal(translate("es", "shop.techBadge", { shop: "Riverside Auto" }), "Técnico · Riverside Auto");
  assert.equal(translate("en", "shop.assignedToYou"), "Assigned to you");
  assert.equal(translate("es", "shop.assignedToYou"), "Asignado a ti");
  assert.match(translate("en", "shop.techWorkHint"), /assigned/i);
  assert.match(translate("es", "shop.techWorkHint"), /asignad/i);
  assert.match(translate("en", "account.techShopHint"), /owner/i);
  assert.match(translate("en", "account.techShopHint"), /job length/i);
  assert.match(translate("es", "account.techShopHint"), /dueño/i);
  assert.match(translate("es", "account.techShopHint"), /duraci[oó]n/i);
  assert.match(translate("en", "account.deleteBodyTech"), /does not delete the shop/i);
  assert.match(translate("es", "account.deleteBodyTech"), /no elimina el taller/i);
});

test("job length / block-after-booking copy exists in English and Spanish", () => {
  assert.equal(translate("en", "account.jobLength"), "Job length / block after booking");
  assert.equal(translate("es", "account.jobLength"), "Duración del trabajo / bloquear después de reservar");
  assert.match(translate("en", "account.jobLengthHint"), /3 hours|default/i);
  assert.match(translate("es", "account.jobLengthHint"), /3 horas/i);
  assert.equal(translate("en", "account.blockOff"), "Off (same start only)");
  assert.equal(translate("es", "account.blockOff"), "Apagado (solo la misma hora)");
  assert.equal(translate("en", "account.block3h"), "3 hours");
  assert.equal(translate("es", "account.block3h"), "3 horas");
  assert.equal(translate("en", "book.blocked"), "Blocked");
  assert.equal(translate("es", "book.blocked"), "Bloqueado");
  assert.match(translate("en", "book.takenHint"), /job length|block/i);
  assert.match(translate("es", "book.takenHint"), /duraci[oó]n|bloquea/i);
});

test("shop history and decline copy exists in English and Spanish", () => {
  assert.equal(translate("en", "shop.history"), "History");
  assert.equal(translate("es", "shop.history"), "Historial");
  assert.equal(translate("en", "job.decline"), "Decline booking");
  assert.equal(translate("es", "job.decline"), "Rechazar cita");
  assert.equal(translate("en", "job.declineConfirm"), "Decline this booking");
  assert.equal(translate("es", "job.declineConfirm"), "Rechazar esta cita");
  assert.match(translate("en", "job.declineHint"), /time slot|customer/i);
  assert.match(translate("es", "job.declineHint"), /horario|cliente/i);
  assert.equal(
    translateStoreError("es", "Only incoming or scheduled bookings can be declined."),
    "Solo se pueden rechazar citas nuevas o programadas.",
  );
});

test("public shop profile labels exist in English and Spanish", () => {
  assert.equal(translate("en", "account.specialties"), "Specialties");
  assert.equal(translate("es", "account.specialties"), "Especialidades");
  assert.equal(translate("en", "account.credentials"), "Credentials");
  assert.equal(translate("es", "account.credentials"), "Credenciales");
  assert.match(translate("en", "account.serviceArea"), /based in|service area/i);
  assert.match(translate("es", "account.serviceArea"), /zona|base/i);
  assert.equal(translate("en", "spec.mobile"), "Mobile service");
  assert.equal(translate("es", "spec.mobile"), "Servicio móvil");
  assert.equal(translate("en", "cred.ase"), "ASE");
  assert.equal(translate("es", "cred.mobile_license"), "Licencia móvil");
  assert.equal(translate("en", "profile.basedIn", { area: "Riverside" }), "Based in Riverside");
  assert.equal(translate("es", "profile.basedIn", { area: "Riverside" }), "Con base en Riverside");
  assert.equal(translate("en", "profile.years", { n: 14 }), "14 years");
  assert.equal(translate("es", "profile.years", { n: 14 }), "14 años");
  assert.match(translate("en", "privacy.store.body"), /specialties|credentials|service area/i);
  assert.match(translate("es", "privacy.store.body"), /especialidades|credenciales|zona/i);
});

test("linked customer booking copy hides the shop directory in English and Spanish", () => {
  assert.equal(translate("en", "book.withShop", { name: "Riverside Auto" }), "Booking with Riverside Auto");
  assert.equal(translate("es", "book.withShop", { name: "Riverside Auto" }), "Reservando con Riverside Auto");
  assert.match(translate("en", "book.linkHint"), /not a directory/i);
  assert.match(translate("es", "book.linkHint"), /no es un directorio/i);
  assert.equal(translate("en", "book.linkTitle"), "Link your shop");
  assert.equal(translate("es", "book.linkTitle"), "Vincula tu taller");
  assert.doesNotMatch(translate("en", "home.chooseDifferent"), /choose a different shop/i);
  assert.match(translate("en", "home.chooseDifferent"), /find code/i);
});

test("booking symptoms are marked optional in English and Spanish", () => {
  assert.match(translate("en", "book.whatsGoingOn"), /optional/i);
  assert.match(translate("es", "book.whatsGoingOn"), /opcional/i);
  assert.match(translate("en", "book.symptomsHint"), /optional/i);
  assert.match(translate("es", "book.symptomsHint"), /opcional/i);
  assert.equal(translate("en", "book.noSymptoms"), "No description");
  assert.equal(translate("es", "book.noSymptoms"), "Sin descripción");
});

test("vehicle photo hint exists in English and Spanish", () => {
  assert.equal(translate("en", "vehicle.photoHint"), "Add photo for a better match");
  assert.match(translate("es", "vehicle.photoHint"), /foto/i);
  assert.equal(translate("en", "kind.hatchback"), "hatchback");
  assert.equal(translate("en", "kind.coupe"), "coupe");
  assert.equal(translate("es", "kind.coupe"), "cupé");
  assert.equal(translate("en", "color.red"), "Red");
  assert.equal(translate("es", "color.red"), "Rojo");
  assert.match(translate("en", "privacy.photos.body"), /not a public directory/i);
  assert.match(translate("es", "privacy.photos.body"), /directorio/i);
});

test("profile vs bay photo labels exist in English and Spanish", () => {
  assert.equal(translate("en", "photo.choose"), "Choose photo");
  assert.equal(translate("en", "photo.take"), "Take photo");
  assert.equal(translate("es", "photo.choose"), "Elegir foto");
  assert.equal(translate("es", "photo.take"), "Tomar foto");
  assert.match(translate("es", "photo.profileEmpty"), /silueta/i);
  assert.match(translate("es", "job.photoHint"), /ampliar/);
  assert.match(translate("en", "job.photoHint"), /tap to enlarge/i);
  assert.match(translate("en", "job.photoHintEmpty"), /optional/i);
  assert.doesNotMatch(translate("en", "job.photoHintEmpty"), /tap to enlarge/i);
  assert.equal(translate("en", "photo.addBay"), "Add photo");
  assert.equal(translate("es", "photo.addBay"), "Agregar foto");
  assert.equal(translate("en", "photo.noBay"), "No progress photo yet");
  assert.match(translate("es", "job.photoHintEmpty"), /opcional/i);
  assert.match(translate("en", "job.photoHint"), /working on or the part/i);
  assert.equal(translate("en", "job.workPhoto"), "Bay photo");
  assert.equal(translate("es", "job.workPhoto"), "Foto de la bahía");
  assert.equal(translate("en", "job.progressPhoto"), "Progress photo");
  assert.equal(translate("es", "job.progressPhoto"), "Foto del avance");
  assert.match(translate("en", "job.workPhotoHint"), /tap to enlarge/i);
  assert.doesNotMatch(translate("en", "job.workPhotoHint"), /not the vehicle photo/i);
  assert.doesNotMatch(translate("en", "job.workPhotoHint"), /\bshop\b/i);
  assert.match(translate("es", "job.workPhotoHint"), /toca para ampliar/i);
  assert.equal(translate("en", "job.bayUpdate"), "Bay update");
  assert.equal(translate("es", "job.bayUpdate"), "Actualización de bahía");
  assert.equal(translate("en", "job.updateFrom", { name: "Leon Mobile Repair" }), "Update from Leon Mobile Repair");
  assert.equal(translate("es", "job.updateFrom", { name: "Leon Mobile Repair" }), "Actualización de Leon Mobile Repair");
  assert.equal(translate("en", "job.newUpdate"), "New update");
  assert.equal(translate("es", "job.newUpdate"), "Nueva actualización");
  assert.equal(translate("en", "toast.updateSent"), "Update posted");
  assert.equal(translate("es", "toast.updateSent"), "Actualización publicada");
  assert.match(translate("en", "toast.updateDuplicate"), /just posted/i);
  assert.equal(translate("en", "job.posting"), "Posting…");
  assert.equal(translate("es", "job.posting"), "Publicando…");
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
