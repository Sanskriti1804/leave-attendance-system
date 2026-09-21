export const IST_TIMEZONE = "Asia/Kolkata";

function formatCivilDateIST(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

/**
 * Returns today's date in IST formatted as YYYY-MM-DD.
 */
export function getTodayIST(): string {
  return formatCivilDateIST(new Date());
}

export function addCalendarDaysIST(civilDate: string, days: number): string {
  const date = new Date(`${civilDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. Matches backend `isoWeekday`. */
export function isoWeekdayCivil(civilDate: string): number {
  const utcDay = new Date(`${civilDate}T00:00:00.000Z`).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}

/**
 * Formats a Date or ISO string in IST time.
 * e.g., "14:35:27 IST" or "14:35 IST"
 */
export function formatTimeIST(
  dateInput: Date | string | null | undefined,
  includeSeconds = true,
): string {
  if (!dateInput) return "--:-- IST";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "--:-- IST";

  const options: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  if (includeSeconds) {
    options.second = "2-digit";
  }

  return `${new Intl.DateTimeFormat("en-GB", options).format(date)} IST`;
}

/**
 * Formats a Date or ISO string into an IST date string.
 * e.g., "Wednesday, 15 September 2026" or "15 Sep 2026"
 */
export function formatDateIST(
  dateInput: Date | string | null | undefined,
  format: "full" | "short" = "full",
): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "—";

  if (format === "short") {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: IST_TIMEZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Formats a Date or ISO string into an IST date and time.
 * e.g., "15 Sep 2026, 14:35 IST"
 */
export function formatDateTimeIST(
  dateInput: Date | string | null | undefined,
): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "—";

  const datePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${datePart}, ${timePart} IST`;
}

/**
 * Returns live running clock time string in IST:
 * e.g., "14:35:27 IST"
 */
export function getLiveClockIST(): string {
  return formatTimeIST(new Date(), true);
}

export function formatDurationMinutes(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  return `${Math.floor(safe / 60)}h ${String(safe % 60).padStart(2, "0")}m`;
}

export function workingMinutes(
  checkIn: string | null | undefined,
  checkOut?: string | null,
): number {
  if (!checkIn) return 0;
  const start = new Date(checkIn).getTime();
  if (Number.isNaN(start)) return 0;
  const end = checkOut ? new Date(checkOut).getTime() : Date.now();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 60000));
}

export function enumerateCivilRange(from: string, to: string): string[] {
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addCalendarDaysIST(cursor, 1);
  }
  return dates;
}
