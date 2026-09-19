/** Same year/make/model/trim shape already stored on booking tickets. */
export type VehicleFields = {
  year: string;
  make: string;
  model: string;
  trim?: string;
  /** Customer photo of this car — never a shop/account avatar. */
  photo?: string;
  color?: string;
};

export const CUSTOMER_VEHICLES_KEY = "mh.vehicles";

export function normalizeVehicle(v: Partial<VehicleFields> | null | undefined): VehicleFields {
  return {
    year: String(v?.year || "").trim(),
    make: String(v?.make || "").trim(),
    model: String(v?.model || "").trim(),
    trim: String(v?.trim || "").trim(),
    photo: String(v?.photo || "").trim(),
    color: String(v?.color || "").trim(),
  };
}

export function vehicleKey(v: Partial<VehicleFields> | null | undefined): string {
  const n = normalizeVehicle(v);
  return [n.year, n.make, n.model, n.trim || ""].map((s) => s.toLowerCase()).join("|");
}

export function isCompleteVehicle(v: Partial<VehicleFields> | null | undefined): boolean {
  const n = normalizeVehicle(v);
  return Boolean(n.year && n.make && n.model);
}

export function vehicleFromTicket(
  j: Partial<VehicleFields> & { vehiclePhoto?: string; createdAt?: number } | null | undefined,
): VehicleFields {
  return normalizeVehicle({
    year: j?.year,
    make: j?.make,
    model: j?.model,
    trim: j?.trim,
    photo: j?.photo || j?.vehiclePhoto,
    color: j?.color,
  });
}

export function mergeCustomerVehicles(
  jobs: Array<Partial<VehicleFields> & { vehiclePhoto?: string; createdAt?: number }>,
  extras: VehicleFields[] = [],
): VehicleFields[] {
  const out: VehicleFields[] = [];
  const seen = new Set<string>();
  const add = (v: Partial<VehicleFields> & { vehiclePhoto?: string }) => {
    const n = vehicleFromTicket(v);
    if (!isCompleteVehicle(n)) return;
    const k = vehicleKey(n);
    if (seen.has(k)) {
      const existing = out.find((row) => vehicleKey(row) === k);
      if (existing) {
        if (!existing.photo && n.photo) existing.photo = n.photo;
        if (!existing.color && n.color) existing.color = n.color;
      }
      return;
    }
    seen.add(k);
    out.push(n);
  };
  extras.forEach(add);
  [...jobs]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .forEach(add);
  return out;
}

function readAll(): Record<string, VehicleFields[]> {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(CUSTOMER_VEHICLES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, VehicleFields[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readSavedVehicles(userId: string): VehicleFields[] {
  if (!userId) return [];
  return (readAll()[userId] || []).map(normalizeVehicle).filter(isCompleteVehicle);
}

export function writeSavedVehicles(userId: string, list: VehicleFields[]) {
  if (!userId || typeof localStorage === "undefined") return;
  const all = readAll();
  all[userId] = list.map(normalizeVehicle).filter(isCompleteVehicle);
  localStorage.setItem(CUSTOMER_VEHICLES_KEY, JSON.stringify(all));
}

export function addSavedVehicle(userId: string, vehicle: VehicleFields): VehicleFields[] {
  const extras = readSavedVehicles(userId);
  const n = normalizeVehicle(vehicle);
  if (!isCompleteVehicle(n)) return extras;
  const i = extras.findIndex((v) => vehicleKey(v) === vehicleKey(n));
  if (i >= 0) {
    extras[i] = {
      ...extras[i],
      ...n,
      photo: n.photo || extras[i].photo,
      color: n.color || extras[i].color,
    };
    writeSavedVehicles(userId, extras);
    return extras;
  }
  const next = [n, ...extras];
  writeSavedVehicles(userId, next);
  return next;
}
