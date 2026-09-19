import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BAY_PHOTO_SLOT,
  PROFILE_PHOTO_SLOT,
  SYMPTOM_PHOTO_SLOT,
  VEHICLE_PHOTO_SLOT,
  jobPhotoOf,
  hasBayPhoto,
  profilePhotoOf,
  sanitizeJobPatch,
  symptomPhotoOf,
  ticketPhotoSlots,
  ticketVehiclePhotoOf,
  withJobPhoto,
} from "./photos.ts";
import { carImage } from "./vehicles.ts";
import type { Job, Shop, User } from "./store.ts";

const customer: User = {
  id: "u-c",
  name: "Maya",
  email: "maya@example.com",
  phone: "555",
  role: "customer",
  pass: "",
  photo: "data:profile-customer",
};

const shopOwner: User = {
  id: "u-s",
  name: "Desk",
  email: "shop@example.com",
  phone: "555",
  role: "shop",
  pass: "",
  shopId: "s-1",
  shopRole: "owner",
  photo: "data:user-should-not-win",
};

const shop: Shop = {
  id: "s-1",
  name: "Riverside",
  code: "RIV4",
  ownerId: "u-s",
  techs: [],
  photo: "data:shop-logo",
};

const job: Job = {
  id: "MH-1",
  createdAt: 1,
  providerId: "s-1",
  providerType: "shop",
  providerName: "Riverside",
  name: "Maya",
  email: "maya@example.com",
  phone: "555",
  year: "2019",
  make: "Honda",
  model: "CR-V",
  symptoms: "Brakes",
  slot: new Date().toISOString(),
  status: "repair",
  notes: [],
  photo: "data:bay",
  jobPhoto: "data:bay",
};

test("profile, bay, and vehicle ticket slots are distinct keys", () => {
  assert.notEqual(PROFILE_PHOTO_SLOT, BAY_PHOTO_SLOT);
  assert.notEqual(VEHICLE_PHOTO_SLOT, BAY_PHOTO_SLOT);
  assert.notEqual(VEHICLE_PHOTO_SLOT, PROFILE_PHOTO_SLOT);
});

test("shop owner profile photo is the shop logo, not the user or job photo", () => {
  assert.equal(profilePhotoOf(shopOwner, shop), "data:shop-logo");
  assert.notEqual(profilePhotoOf(shopOwner, shop), jobPhotoOf(job));
  assert.notEqual(profilePhotoOf(shopOwner, shop), shopOwner.photo);
});

test("customer profile photo is the user photo, never the bay photo", () => {
  assert.equal(profilePhotoOf(customer), "data:profile-customer");
  assert.notEqual(profilePhotoOf(customer), jobPhotoOf(job));
});

test("unset profile photo is empty so the UI can show a silhouette", () => {
  assert.equal(profilePhotoOf({ ...customer, photo: "" }), "");
  assert.equal(profilePhotoOf(shopOwner, { ...shop, photo: "" }), "");
});

test("sanitizeJobPatch only keeps job ticket fields and the bay photo key", () => {
  const cleaned = sanitizeJobPatch({
    status: "ready",
    assignedTo: "Alex",
    jobPhoto: "data:bay-new",
    photo: "data:profile-leak",
    name: "Should not copy",
    email: "leak@example.com",
    bio: "profile bio",
    specialties: ["brakes"],
    serviceArea: "Riverside",
    role: "independent",
    notes: [{ at: 1, text: "must not ride a photo patch", by: "shop" }],
  });
  assert.deepEqual(cleaned, {
    status: "ready",
    assignedTo: "Alex",
    jobPhoto: "data:bay-new",
  });
  assert.equal("photo" in cleaned, false);
  assert.equal("bio" in cleaned, false);
  assert.equal("notes" in cleaned, false);
});

test("legacy job { photo } still maps to jobPhoto when it is not a profile object", () => {
  const cleaned = sanitizeJobPatch({ photo: "data:legacy-bay" });
  assert.equal(cleaned.jobPhoto, "data:legacy-bay");
});

test("a profile-shaped payload cannot write a bay photo via generic photo", () => {
  const cleaned = sanitizeJobPatch({
    photo: "data:profile",
    role: "customer",
    bio: "",
  });
  assert.equal(cleaned.jobPhoto, undefined);
});

test("withJobPhoto writes both jobPhoto and legacy photo aliases on the job only", () => {
  const next = withJobPhoto(job, "data:new-bay");
  assert.equal(next.jobPhoto, "data:new-bay");
  assert.equal(next.photo, "data:new-bay");
  assert.equal(jobPhotoOf(next), "data:new-bay");
});

test("ticket hero and bay photo are independent slots", () => {
  const slots = ticketPhotoSlots(job);
  assert.equal(slots.bay, "data:bay");
  assert.equal(slots.vehicle, carImage(job));
  assert.notEqual(slots.vehicle, slots.bay);
  assert.doesNotMatch(slots.vehicle, /data:bay/);
});

test("saving a bay photo does not replace the vehicle hero", () => {
  const before = ticketVehiclePhotoOf(job);
  const after = withJobPhoto(job, "data:wooden-door");
  assert.equal(ticketVehiclePhotoOf(after), before);
  assert.equal(ticketVehiclePhotoOf(after), carImage(job));
  assert.equal(jobPhotoOf(after), "data:wooden-door");
  const slots = ticketPhotoSlots(after);
  assert.equal(slots.vehicle, carImage(job));
  assert.equal(slots.bay, "data:wooden-door");
  assert.notEqual(slots.vehicle, slots.bay);
});

test("ticket hero stays vehicle art when the bay slot is empty", () => {
  const emptyBay = { ...job, photo: "", jobPhoto: "" };
  const slots = ticketPhotoSlots(emptyBay);
  assert.equal(slots.bay, "");
  assert.equal(slots.vehicle, carImage(emptyBay));
  assert.ok(slots.vehicle.length > 0);
});

test("ticketVehiclePhotoOf ignores jobPhoto even if it looks like a car picture", () => {
  const spoofed = withJobPhoto(job, "/img/car-sedan.jpg");
  assert.equal(jobPhotoOf(spoofed), "/img/car-sedan.jpg");
  assert.equal(ticketVehiclePhotoOf(spoofed), carImage(job));
  assert.equal(ticketPhotoSlots(spoofed).vehicle, carImage(job));
});

test("hasBayPhoto is false for empty placeholders so the UI can stay compact", () => {
  assert.equal(hasBayPhoto(""), false);
  assert.equal(hasBayPhoto("   "), false);
  assert.equal(hasBayPhoto(undefined), false);
  assert.equal(hasBayPhoto(jobPhotoOf({ photo: "", jobPhoto: "" })), false);
  assert.equal(hasBayPhoto("data:image/jpeg;base64,abc"), true);
  assert.equal(hasBayPhoto(jobPhotoOf(job)), true);
});

test("symptom photo is a third ticket slot, independent of bay and vehicle hero", () => {
  assert.notEqual(SYMPTOM_PHOTO_SLOT, BAY_PHOTO_SLOT);
  assert.notEqual(SYMPTOM_PHOTO_SLOT, VEHICLE_PHOTO_SLOT);
  const withSymptom = { ...job, symptomPhoto: "data:symptom" };
  const slots = ticketPhotoSlots(withSymptom);
  assert.equal(slots.symptom, "data:symptom");
  assert.equal(slots.bay, "data:bay");
  assert.equal(slots.vehicle, carImage(job));
  assert.equal(symptomPhotoOf(withJobPhoto(withSymptom, "data:new-bay")), "data:symptom");
  assert.equal("symptomPhoto" in sanitizeJobPatch({ symptomPhoto: "data:leak", status: "repair" }), false);
});
