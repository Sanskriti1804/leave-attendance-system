import type { ConfigurationSetting } from "../../../generated/prisma/client.js";
import * as organisationSettingsRepository from "./repository.js";
import type { UpdateOrganisationSettingsBody } from "./validation.js";

export type OrganisationSettings = {
  timezone: string;
  workStart: string | null;
  workEnd: string | null;
  graceMinutes: number;
  weeklyOffDow: number[];
  leaveCountExcludesWeekends: boolean;
  leaveCountExcludesHolidays: boolean;
  medicalDocOptional1To2Days: boolean;
  medicalDocExceedsDays: number;
  maxAdvanceDays: number;
};

const DEFAULTS: OrganisationSettings = {
  timezone: "America/New_York",
  workStart: null,
  workEnd: null,
  graceMinutes: 0,
  weeklyOffDow: [],
  leaveCountExcludesWeekends: false,
  leaveCountExcludesHolidays: false,
  medicalDocOptional1To2Days: true,
  medicalDocExceedsDays: 2,
  maxAdvanceDays: 14,
};

type SettingType = "string" | "number" | "boolean" | "json";

const KEY_TYPES: Record<keyof OrganisationSettings, SettingType> = {
  timezone: "string",
  workStart: "string",
  workEnd: "string",
  graceMinutes: "number",
  weeklyOffDow: "json",
  leaveCountExcludesWeekends: "boolean",
  leaveCountExcludesHolidays: "boolean",
  medicalDocOptional1To2Days: "boolean",
  medicalDocExceedsDays: "number",
  maxAdvanceDays: "number",
};

function parseValue(row: ConfigurationSetting): unknown {
  if (row.settingType === "number") {
    return Number(row.settingValue);
  }
  if (row.settingType === "boolean") {
    return row.settingValue === "true";
  }
  if (row.settingType === "json") {
    return JSON.parse(row.settingValue) as unknown;
  }
  return row.settingValue;
}

function serializeValue(value: unknown, type: SettingType): string {
  if (type === "json") {
    return JSON.stringify(value);
  }
  if (value === null) {
    return "";
  }
  return String(value);
}

function toOrganisationSettings(rows: ConfigurationSetting[]): OrganisationSettings {
  const settings: OrganisationSettings = { ...DEFAULTS, weeklyOffDow: [...DEFAULTS.weeklyOffDow] };
  for (const row of rows) {
    if (!(row.settingKey in KEY_TYPES)) {
      continue;
    }
    const key = row.settingKey as keyof OrganisationSettings;
    const parsed = parseValue(row);
    if (key === "workStart" || key === "workEnd") {
      settings[key] = parsed === "" || parsed == null ? null : String(parsed);
      continue;
    }
    (settings[key] as unknown) = parsed;
  }
  return settings;
}

export async function getOrganisationSettings(): Promise<OrganisationSettings> {
  const rows = await organisationSettingsRepository.findOrganisationSettings();
  return toOrganisationSettings(rows);
}

export async function updateOrganisationSettings(
  body: UpdateOrganisationSettingsBody,
): Promise<OrganisationSettings> {
  const entries = Object.entries(body).filter(([, value]) => value !== undefined) as Array<
    [keyof OrganisationSettings, OrganisationSettings[keyof OrganisationSettings]]
  >;

  for (const [key, value] of entries) {
    const settingType = KEY_TYPES[key];
    await organisationSettingsRepository.upsertOrganisationSetting({
      settingKey: key,
      settingType,
      settingValue: serializeValue(value, settingType),
    });
  }

  return getOrganisationSettings();
}
