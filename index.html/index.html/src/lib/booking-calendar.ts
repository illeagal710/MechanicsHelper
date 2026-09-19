/** Month-grid booking: days customers can pick, times from shop hours. */

export const SLOT_STEP_MIN = 90;
export const BOOKING_HORIZON_DAYS = 28;
/** Classic bay times — 90 minutes with a lunch gap after 11:00. */
export const DEFAULT_SLOT_TIMES = ["08:00", "09:30", "11:00", "13:00", "14:30", "16:00"];

export type HoursLike = {
  hoursDays?: string;
  hoursOpen?: string;
  hoursClose?: string;
};

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function minutesOf(t: string): number {
  const [h, m] = String(t || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Prefer the classic bay clock; generate 90-minute steps only if none of those fit. */
export function slotTimesFromHours(h?: HoursLike, stepMin = SLOT_STEP_MIN): string[] {
  const open = minutesOf(h?.hoursOpen || "08:00");
  const close = minutesOf(h?.hoursClose || "16:00");
  if (close < open || stepMin <= 0) return [];
  const fitted = DEFAULT_SLOT_TIMES.filter((t) => {
    const m = minutesOf(t);
    return m >= open && m <= close;
  });
  if (fitted.length) return fitted;
  const times: string[] = [];
  for (let m = open; m <= close; m += stepMin) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    times.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return times;
}

/** Upcoming slots on open days, including leftover times today, through `horizonDays`. */
export function generateSlots(
  now: Date,
  h?: HoursLike,
  horizonDays = BOOKING_HORIZON_DAYS,
): Date[] {
  const days = h?.hoursDays || "123456";
  const times = slotTimesFromHours(h);
  const out: Date[] = [];
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let d = 0; d <= horizonDays; d++) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d);
    if (!days.includes(String(day.getDay()))) continue;
    for (const t of times) {
      const [hh, mm] = t.split(":").map(Number);
      const dt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm, 0, 0);
      if (dt.getTime() <= now.getTime()) continue;
      out.push(dt);
    }
  }
  return out;
}

export type MonthCell = {
  key: string;
  date: Date;
  inMonth: boolean;
  day: number;
};

/** Sunday-start month grid covering every day of `month` (0–11). */
export function monthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const cells: MonthCell[] = [];
  for (let i = 0; i < total; i++) {
    const date = new Date(year, month, 1 - startPad + i);
    cells.push({
      key: dayKey(date),
      date,
      inMonth: date.getMonth() === month,
      day: date.getDate(),
    });
  }
  return cells;
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
