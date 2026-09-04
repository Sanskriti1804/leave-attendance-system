export function toCivilDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

export function fromCivilDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function todayInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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
