export const DEFAULT_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET = "+05:30";
export const IST_OFFSET_MINUTES = 330;

function formatCivilDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

/**
 * Converts a Date object or null to a civil date string (YYYY-MM-DD).
 */
export function toCivilDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

/**
 * Parses a civil date string (YYYY-MM-DD) into a UTC Date object at midnight.
 */
export function fromCivilDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/**
 * Returns today's civil date (YYYY-MM-DD) in the specified time zone.
 */
export function todayInTimeZone(timeZone: string = DEFAULT_TIMEZONE): string {
  return formatCivilDate(new Date(), timeZone);
}

/**
 * Returns today's civil date (YYYY-MM-DD) in Indian Standard Time (Asia/Kolkata).
 */
export function todayInIst(): string {
  return todayInTimeZone(DEFAULT_TIMEZONE);
}

/**
 * Formats a UTC Date to an ISO 8601 string with an IST (+05:30) offset.
 * e.g., 2026-09-15T14:35:00.000+05:30
 * Represents the exact UTC instant while carrying the IST offset.
 */
export function toIsoWithIstOffset(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  const istOffsetMs = IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  const iso = istDate.toISOString();
  return iso.replace("Z", IST_OFFSET);
}

/**
 * Derives the civil work date in the specified timezone (default Asia/Kolkata)
 * and returns both the civil date (YYYY-MM-DD) and a UTC Date object representing
 * midnight of that date for database indexing.
 */
export function getWorkDate(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE,
): { civilDate: string; dateObj: Date } {
  const civilDate = formatCivilDate(date, timeZone);
  const dateObj = fromCivilDate(civilDate);

  return {
    civilDate,
    dateObj,
  };
}

/**
 * Calculates late minutes against a configured work start time (HH:mm)
 * evaluated in the organization's time zone (default Asia/Kolkata / IST).
 */
export function calculateLateMinutes(
  checkIn: Date,
  workStart: string | null,
  graceMinutes = 0,
  timeZone: string = DEFAULT_TIMEZONE,
): number {
  if (!workStart) {
    return 0;
  }

  const [startHourStr, startMinStr] = workStart.split(":");
  const startHour = Number.parseInt(startHourStr, 10);
  const startMin = Number.parseInt(startMinStr, 10);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMin) ||
    startHour < 0 ||
    startHour > 23 ||
    startMin < 0 ||
    startMin > 59
  ) {
    return 0;
  }

  const workStartMinutes = startHour * 60 + startMin;

  // Extract hours and minutes of checkIn in the target timezone
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(checkIn);

  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minPart = parts.find((p) => p.type === "minute")?.value ?? "0";
  const checkInHour = Number.parseInt(hourPart, 10);
  const checkInMin = Number.parseInt(minPart, 10);

  const checkInMinutes = checkInHour * 60 + checkInMin;
  const allowedThreshold = workStartMinutes + graceMinutes;

  if (checkInMinutes > allowedThreshold) {
    return checkInMinutes - workStartMinutes;
  }

  return 0;
}

export function addCalendarDays(civilDate: string, days: number): string {
  const date = fromCivilDate(civilDate);
  date.setUTCDate(date.getUTCDate() + days);
  return toCivilDate(date)!;
}

export function isoWeekday(civilDate: string): number {
  const utcDay = fromCivilDate(civilDate).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}
