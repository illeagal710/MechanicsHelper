import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isCompleteVehicle,
  mergeCustomerVehicles,
  normalizeVehicle,
  vehicleKey,
} from "./customer-vehicles.ts";

test("normalize and key stay on year/make/model/trim", () => {
  const n = normalizeVehicle({ year: " 2019 ", make: "Honda", model: "CR-V", trim: " EX " });
  assert.deepEqual(n, { year: "2019", make: "Honda", model: "CR-V", trim: "EX", photo: "", color: "" });
  assert.equal(vehicleKey(n), "2019|honda|cr-v|ex");
  assert.equal(isCompleteVehicle({ year: "2019", make: "Honda", model: "" }), false);
  assert.equal(isCompleteVehicle(n), true);
});

test("merge prefers extras then newest tickets, without a second car profile", () => {
  const merged = mergeCustomerVehicles(
    [
      { year: "2019", make: "Honda", model: "CR-V", createdAt: 10 },
      { year: "2016", make: "Ford", model: "F-150", createdAt: 20 },
      { year: "2019", make: "Honda", model: "CR-V", trim: "", createdAt: 30 },
    ],
    [{ year: "2018", make: "Honda", model: "Civic" }],
  );
  assert.deepEqual(
    merged.map((v) => `${v.year} ${v.make} ${v.model}`),
    ["2018 Honda Civic", "2019 Honda CR-V", "2016 Ford F-150"],
  );
});

test("merge fills photo and color from a later ticket when extras omitted them", () => {
  const merged = mergeCustomerVehicles(
    [{ year: "2019", make: "Honda", model: "CR-V", vehiclePhoto: "data:car", color: "red", createdAt: 10 }],
    [{ year: "2019", make: "Honda", model: "CR-V" }],
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].photo, "data:car");
  assert.equal(merged[0].color, "red");
});
