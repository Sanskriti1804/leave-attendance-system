import { Prisma } from "../../../generated/prisma/client.js";
import { getOrganisationSettings } from "../../shared/organisation-settings/service.js";
import { HttpError } from "../../shared/utils/http-error.js";
import { findLeaveTypeById } from "../leave-types/repository.js";
import * as leavePolicyRepository from "./repository.js";
import type { CreateLeavePolicyBody, ListLeavePoliciesQuery, UpdateLeavePolicyBody } from "./validation.js";

function toPolicyResponse(policy: {
  policyId: number;
  leaveTypeId: number;
  medicalDocumentAfterDays: number | null;
  includeWeekends: boolean;
  includeHolidays: boolean;
  maxDays: Prisma.Decimal | null;
  obsolete: boolean;
}) {
  return {
    policyId: policy.policyId,
    leaveTypeId: policy.leaveTypeId,
    medicalDocumentAfterDays: policy.medicalDocumentAfterDays,
    includeWeekends: policy.includeWeekends,
    includeHolidays: policy.includeHolidays,
    maxDays: policy.maxDays === null ? null : Number(policy.maxDays),
    obsolete: policy.obsolete,
  };
}

function toDecimal(value: number | null | undefined): Prisma.Decimal | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return new Prisma.Decimal(value);
}

export async function getOrganisationLeaveConfig() {
  return getOrganisationSettings();
}

export async function getLeaveAdvanceConfig(): Promise<{ timezone: string; maxAdvanceDays: number }> {
  const settings = await getOrganisationLeaveConfig();
  return {
    timezone: settings.timezone,
    maxAdvanceDays: settings.maxAdvanceDays,
  };
}

export async function isMedicalDocumentRequired(leaveTypeId: number, numberOfDays: number): Promise<boolean> {
  const leaveType = await findLeaveTypeById(leaveTypeId);
  if (!leaveType || leaveType.obsolete) {
    throw new HttpError(422, "LEAVE_TYPE_NOT_ELIGIBLE", "Leave type not found or is obsolete");
  }
  if (!leaveType.requiresMedicalDocument) {
    return false;
  }

  const settings = await getOrganisationLeaveConfig();
  const policy = await leavePolicyRepository.findActivePolicyByLeaveTypeId(leaveTypeId);
  const exceedsDays = policy?.medicalDocumentAfterDays ?? settings.medicalDocExceedsDays;

  if (numberOfDays > exceedsDays) {
    return true;
  }
  if (numberOfDays > 0 && numberOfDays <= exceedsDays) {
    return !settings.medicalDocOptional1To2Days;
  }
  return false;
}

export async function listLeavePolicies(query: ListLeavePoliciesQuery) {
  const rows = await leavePolicyRepository.findManyLeavePolicies({
    leaveTypeId: query.leaveTypeId,
    includeObsolete: query.includeObsolete === true,
  });
  return { items: rows.map(toPolicyResponse) };
}

export async function getLeavePolicy(policyId: number) {
  const policy = await leavePolicyRepository.findLeavePolicyById(policyId);
  if (!policy) {
    throw new HttpError(404, "NOT_FOUND", "Leave policy not found");
  }
  return toPolicyResponse(policy);
}

export async function createLeavePolicy(body: CreateLeavePolicyBody) {
  const leaveType = await findLeaveTypeById(body.leaveTypeId);
  if (!leaveType || leaveType.obsolete) {
    throw new HttpError(422, "LEAVE_TYPE_NOT_ELIGIBLE", "Leave type not found or is obsolete");
  }
  const created = await leavePolicyRepository.createLeavePolicy({
    leaveTypeId: body.leaveTypeId,
    medicalDocumentAfterDays: body.medicalDocumentAfterDays ?? null,
    includeWeekends: body.includeWeekends ?? false,
    includeHolidays: body.includeHolidays ?? false,
    maxDays: toDecimal(body.maxDays) ?? null,
  });
  return toPolicyResponse(created);
}

export async function updateLeavePolicy(policyId: number, body: UpdateLeavePolicyBody) {
  await getLeavePolicy(policyId);
  const updated = await leavePolicyRepository.updateLeavePolicy(policyId, {
    medicalDocumentAfterDays: body.medicalDocumentAfterDays,
    includeWeekends: body.includeWeekends,
    includeHolidays: body.includeHolidays,
    maxDays: toDecimal(body.maxDays),
    obsolete: body.obsolete,
  });
  return toPolicyResponse(updated);
}
