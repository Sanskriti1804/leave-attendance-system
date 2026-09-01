export function toCivilDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

export function fromCivilDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
