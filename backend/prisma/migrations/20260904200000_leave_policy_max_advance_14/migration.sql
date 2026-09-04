-- Replace the previous half-week / 4-day org default with 14 calendar days
-- only where the old default is still stored.
UPDATE "ConfigurationSetting"
SET "settingValue" = '14'
WHERE "settingCategory" = 'organisation'
  AND "settingKey" = 'maxAdvanceDays'
  AND "settingValue" = '4';
