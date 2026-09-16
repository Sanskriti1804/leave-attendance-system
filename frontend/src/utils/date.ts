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
