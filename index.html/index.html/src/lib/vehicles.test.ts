import assert from "node:assert/strict";
import { test } from "node:test";
import { trimOptions } from "./trims.ts";
import {
  OTHER_VALUE,
  VEHICLE_DATA,
  carImage,
  isCustomerVehiclePhoto,
  pickVehicleImage,
  resolveListedOrOther,
  vehicleKind,
  vehicleTint,
} from "./vehicles.ts";

test("Mercedes C320 and C230 Kompressor are selectable as models", () => {
  const models = VEHICLE_DATA["Mercedes-Benz"];
  assert.ok(models.includes("C320"), "C320 missing from Mercedes models");
  assert.ok(models.includes("C230 Kompressor"), "C230 Kompressor missing from Mercedes models");
  assert.ok(models.includes("C230"), "C230 missing from Mercedes models");
  assert.equal(models.at(-1), OTHER_VALUE);
});

test("C-Class trims group C320, C230 Kompressor, and related US C-Class badges", () => {
  const trims = trimOptions("Mercedes-Benz", "C-Class");
  for (const badge of ["C230", "C230 Kompressor", "C240", "C250", "C280", "C300", "C320", "C350", "C63 AMG"]) {
    assert.ok(trims.includes(badge), `${badge} missing from C-Class trims`);
  }
});

test("C320 and C230 Kompressor as models still offer a trim list", () => {
  assert.ok(trimOptions("Mercedes-Benz", "C320").includes("3.2 V6"));
  assert.ok(trimOptions("Mercedes-Benz", "C230 Kompressor").includes("Kompressor"));
});

test("everyday US coverage gained common shop cars", () => {
  assert.ok(VEHICLE_DATA.Nissan.includes("Ariya"));
  assert.ok(VEHICLE_DATA.Chevrolet.includes("C/K 1500"));
  assert.ok(VEHICLE_DATA.Honda.includes("CRX"));
  assert.ok(VEHICLE_DATA.Toyota.includes("T100"));
  assert.ok(VEHICLE_DATA.BMW.includes("328i"));
  assert.ok(trimOptions("BMW", "3 Series").includes("328i"));
  assert.ok(trimOptions("BMW", "3 Series").includes("325i"));
});

test("Other make/model/trim free-text keeps the stored year/make/model/trim shape", () => {
  assert.ok(Object.prototype.hasOwnProperty.call(VEHICLE_DATA, OTHER_VALUE));
  assert.deepEqual(VEHICLE_DATA[OTHER_VALUE], [OTHER_VALUE]);
  assert.equal(resolveListedOrOther("Mercedes-Benz", "ignored"), "Mercedes-Benz");
  assert.equal(resolveListedOrOther("Other", "Saab"), "Saab");
  assert.equal(resolveListedOrOther("Other", "  "), OTHER_VALUE);
  assert.equal(resolveListedOrOther("Other", "CRX"), "CRX");
  assert.ok(trimOptions("Honda", "Civic").includes(OTHER_VALUE));
  assert.ok(trimOptions("Other", "Other").includes(OTHER_VALUE));
});

test("vehicleKind maps body types and unknown falls back to sedan", () => {
  assert.equal(vehicleKind({ make: "Toyota", model: "Camry" }), "sedan");
  assert.equal(vehicleKind({ make: "Honda", model: "Civic" }), "sedan");
  assert.equal(vehicleKind({ make: "Honda", model: "Civic Hatchback" }), "hatchback");
  assert.equal(vehicleKind({ make: "Volkswagen", model: "Golf" }), "hatchback");
  assert.equal(vehicleKind({ make: "Honda", model: "Fit" }), "hatchback");
  assert.equal(vehicleKind({ make: "Toyota", model: "Prius" }), "hatchback");
  assert.equal(vehicleKind({ make: "Honda", model: "Civic Coupe" }), "coupe");
  assert.equal(vehicleKind({ make: "Honda", model: "Accord Coupe" }), "coupe");
  assert.equal(vehicleKind({ make: "Audi", model: "A5" }), "coupe");
  assert.equal(vehicleKind({ make: "BMW", model: "2 Series Gran Coupe" }), "sedan");
  assert.equal(vehicleKind({ make: "Honda", model: "CR-V" }), "suv");
  assert.equal(vehicleKind({ make: "Subaru", model: "Outback" }), "suv");
  assert.equal(vehicleKind({ make: "Jeep", model: "Wrangler" }), "suv");
  assert.equal(vehicleKind({ make: "Ford", model: "F-150" }), "truck");
  assert.equal(vehicleKind({ make: "Toyota", model: "Tacoma" }), "truck");
  assert.equal(vehicleKind({ make: "Honda", model: "Odyssey" }), "van");
  assert.equal(vehicleKind({ make: "Chrysler", model: "Pacifica" }), "van");
  assert.equal(vehicleKind({ make: "Ford", model: "Mustang" }), "sports");
  assert.equal(vehicleKind({ make: "Honda", model: "Civic Si" }), "sports");
  assert.equal(vehicleKind({ make: "Honda", model: "Civic Type R" }), "sports");
  assert.equal(vehicleKind({ make: "Chevrolet", model: "Camaro" }), "sports");
  assert.equal(vehicleKind({ make: "Mystery", model: "Unknown" }), "sedan");
  assert.equal(vehicleKind({}), "sedan");
});

test("carImage and pickVehicleImage prefer a customer photo and fall back by kind", () => {
  assert.equal(carImage({ make: "Toyota", model: "Camry" }), "/img/car-sedan.jpg");
  assert.equal(carImage({ make: "Honda", model: "Civic Hatchback" }), "/img/car-hatchback.jpg");
  assert.equal(carImage({ make: "Honda", model: "Civic Coupe" }), "/img/car-coupe.jpg");
  assert.equal(carImage({ make: "Honda", model: "CR-V" }), "/img/car-suv.jpg");
  assert.equal(carImage({ make: "Ford", model: "F-150" }), "/img/car-truck.jpg");
  assert.equal(carImage({ make: "Honda", model: "Odyssey" }), "/img/car-van.jpg");
  assert.equal(carImage({ make: "Ford", model: "Mustang" }), "/img/car-sports.jpg");
  assert.equal(carImage({ make: "??", model: "" }), "/img/car-sedan.jpg");

  const generic = pickVehicleImage({ make: "Toyota", model: "Camry", color: "red" });
  assert.equal(generic.fromCustomer, false);
  assert.equal(generic.src, "/img/car-sedan.jpg");
  assert.equal(generic.kind, "sedan");
  assert.ok(generic.tint);
  assert.equal(generic.tint?.hex, "#c23030");

  const custom = pickVehicleImage({
    make: "Toyota",
    model: "Camry",
    vehiclePhoto: "data:image/jpeg;base64,abc",
    color: "red",
  });
  assert.equal(custom.fromCustomer, true);
  assert.equal(custom.src, "data:image/jpeg;base64,abc");
  assert.equal(custom.tint, null);

  assert.equal(isCustomerVehiclePhoto("/img/car-sedan.jpg"), false);
  assert.equal(isCustomerVehiclePhoto("data:image/jpeg;base64,abc"), true);
  const white = vehicleTint("white");
  const red = vehicleTint("red");
  assert.ok(white && red);
  assert.notEqual(white.hex, red.hex);
});
