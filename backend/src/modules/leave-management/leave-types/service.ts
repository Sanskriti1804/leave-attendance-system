import { HttpError } from "../../shared/utils/http-error.js";
import * as leaveTypeRepository from "./repository.js";
import type { CreateLeaveTypeBody, ListLeaveTypesQuery, UpdateLeaveTypeBody } from "./validation.js";

function toLeaveTypeResponse(leaveType: {
  leaveTypeId: number;
  name: string;
  description: string | null;
  requiresMedicalDocument: boolean;
  allowedSex: string | null;
  obsolete: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    leaveTypeId: leaveType.leaveTypeId,
    name: leaveType.name,
    description: leaveType.description,
    requiresMedicalDocument: leaveType.requiresMedicalDocument,
    allowedSex: leaveType.allowedSex,
    obsolete: leaveType.obsolete,
    createdAt: leaveType.createdAt.toISOString(),
    updatedAt: leaveType.updatedAt.toISOString(),
  };
}

export async function assertEmployeeEligibleForLeaveType(
  leaveTypeId: number,
  employeeSex: string | null,
): Promise<void> {
  const leaveType = await leaveTypeRepository.findLeaveTypeById(leaveTypeId);
  if (!leaveType || leaveType.obsolete) {
    throw new HttpError(422, "LEAVE_TYPE_NOT_ELIGIBLE", "Leave type not found or is obsolete");
  }
  if (!leaveType.allowedSex || leaveType.allowedSex === "unspecified") {
    return;
  }
  if (!employeeSex || employeeSex === "unspecified" || employeeSex !== leaveType.allowedSex) {
    throw new HttpError(422, "LEAVE_TYPE_NOT_ELIGIBLE", "Employee is not eligible for this leave type");
  }
}

export async function listLeaveTypes(query: ListLeaveTypesQuery) {
  const rows = await leaveTypeRepository.findManyLeaveTypes({
    includeObsolete: query.includeObsolete === true,
  });
  return { items: rows.map(toLeaveTypeResponse) };
}

export async function getLeaveType(leaveTypeId: number) {
  const leaveType = await leaveTypeRepository.findLeaveTypeById(leaveTypeId);
  if (!leaveType) {
    throw new HttpError(404, "NOT_FOUND", "Leave type not found");
  }
  return toLeaveTypeResponse(leaveType);
}

export async function createLeaveType(body: CreateLeaveTypeBody) {
  const created = await leaveTypeRepository.createLeaveType({
    name: body.name,
    description: body.description ?? null,
    requiresMedicalDocument: body.requiresMedicalDocument ?? false,
    allowedSex: body.allowedSex ?? null,
  });
  return toLeaveTypeResponse(created);
}

export async function updateLeaveType(leaveTypeId: number, body: UpdateLeaveTypeBody) {
  await getLeaveType(leaveTypeId);
  const updated = await leaveTypeRepository.updateLeaveType(leaveTypeId, {
    name: body.name,
    description: body.description,
    requiresMedicalDocument: body.requiresMedicalDocument,
    allowedSex: body.allowedSex,
    obsolete: body.obsolete,
  });
  return toLeaveTypeResponse(updated);
}

export async function deleteLeaveType(leaveTypeId: number) {
  await getLeaveType(leaveTypeId);
  const [applicationCount, policyCount] = await leaveTypeRepository.countLeaveTypeUsage(leaveTypeId);
  if (applicationCount > 0 || policyCount > 0) {
    const deactivated = await leaveTypeRepository.updateLeaveType(leaveTypeId, { obsolete: true });
    return toLeaveTypeResponse(deactivated);
  }
  await leaveTypeRepository.deleteLeaveType(leaveTypeId);
  return null;
}
