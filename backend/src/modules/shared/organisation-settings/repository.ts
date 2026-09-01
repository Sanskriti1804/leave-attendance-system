import type { ConfigurationSetting } from "../../../generated/prisma/client.js";
import { prisma } from "../db/index.js";

export const ORGANISATION_SETTING_CATEGORY = "organisation";

export function findOrganisationSettings(): Promise<ConfigurationSetting[]> {
  return prisma.configurationSetting.findMany({
    where: { settingCategory: ORGANISATION_SETTING_CATEGORY },
    orderBy: { settingKey: "asc" },
  });
}

export function upsertOrganisationSetting(data: {
  settingKey: string;
  settingValue: string;
  settingType: string;
}): Promise<ConfigurationSetting> {
  return prisma.configurationSetting.upsert({
    where: {
      settingCategory_settingKey: {
        settingCategory: ORGANISATION_SETTING_CATEGORY,
        settingKey: data.settingKey,
      },
    },
    create: {
      settingCategory: ORGANISATION_SETTING_CATEGORY,
      settingKey: data.settingKey,
      settingValue: data.settingValue,
      settingType: data.settingType,
    },
    update: {
      settingValue: data.settingValue,
      settingType: data.settingType,
    },
  });
}
