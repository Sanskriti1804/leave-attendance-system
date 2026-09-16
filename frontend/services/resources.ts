import { authPath } from "./api";
import { authorizedRequest } from "./auth";

export type EmployeePublic = {
  employeeId: number;
  firstName: string;
  lastName: string | null;
  email: string;
  departmentId: number;
  role: string;
  managerId: number | null;
  joiningDate: string | null;
  createdAt: string;
  status: string;
  obsolete: boolean;
  sex?: string | null;
};

export type Department = {
  departmentId: number;
  departmentName: string;
  obsolete: boolean;
};

export type OrganisationSettings = {
  timezone: string;
  workStart: string | null;
  workEnd: string | null;
  graceMinutes: number;
  weeklyOffDow: number[];
  leaveCountExcludesWeekends?: boolean;
  leaveCountExcludesHolidays?: boolean;
  medicalDocOptional1To2Days?: boolean;
  medicalDocExceedsDays?: number;
  maxAdvanceDays: number;
};

export type LeaveType = {
  leaveTypeId: number;
  name: string;
  description: string | null;
  requiresMedicalDocument: boolean;
  allowedSex: string | null;
  obsolete: boolean;
};

export type LeaveApplication = {
  leaveId: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  durationType: string;
  halfDayType: string | null;
  numberOfDays: number;
  reason: string;
  status: string;
  hrComments: string | null;
  createdAt: string;
  selectedDates: { date: string; session: string; unit: number }[];
};

type ItemList<T> = { items: T[]; total?: number };

export function displayName(employee: { firstName: string; lastName: string | null } | null | undefined): string {
  if (!employee) {
    return "Employee";
  }
  return [employee.firstName, employee.lastName].filter(Boolean).join(" ");
}

export function apiErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return "Request failed.";
}

export function getMe(): Promise<EmployeePublic> {
  return authorizedRequest<EmployeePublic>(authPath("/me"));
}

export function getEmployee(employeeId: number): Promise<EmployeePublic> {
  return authorizedRequest<EmployeePublic>(`/api/v1/employees/${employeeId}`);
}

export function listEmployees(): Promise<ItemList<EmployeePublic>> {
  return authorizedRequest<ItemList<EmployeePublic>>("/api/v1/employees?page=1&pageSize=100");
}

export function getDepartment(departmentId: number): Promise<Department> {
  return authorizedRequest<Department>(`/api/v1/departments/${departmentId}`);
}

export function getOrgSettings(): Promise<OrganisationSettings> {
  return authorizedRequest<OrganisationSettings>("/api/v1/org-settings");
}

export function patchOrgSettings(body: Partial<OrganisationSettings>): Promise<OrganisationSettings> {
  return authorizedRequest<OrganisationSettings>("/api/v1/org-settings", { method: "PATCH", body });
}

export function changePassword(body: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
  return authorizedRequest<{ message: string }>(authPath("/change-password"), { method: "POST", body });
}

export function listLeaveTypes(): Promise<ItemList<LeaveType>> {
  return authorizedRequest<ItemList<LeaveType>>("/api/v1/leave-types");
}

export function listLeaves(status?: string): Promise<ItemList<LeaveApplication>> {
  const query = status ? `?page=1&pageSize=100&status=${encodeURIComponent(status)}` : "?page=1&pageSize=100";
  return authorizedRequest<ItemList<LeaveApplication>>(`/api/v1/leaves${query}`);
}

export function createLeave(body: {
  leaveTypeId: number;
  reason: string;
  selectedDates: { date: string; session: string }[];
}): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>("/api/v1/leaves", { method: "POST", body });
}

export function createLeaveDraft(body: {
  leaveTypeId: number;
  reason: string;
  selectedDates: { date: string; session: string }[];
}): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>("/api/v1/leaves/drafts", { method: "POST", body });
}

export function submitLeaveDraft(leaveId: number): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/submit`, { method: "POST" });
}

export function withdrawLeave(leaveId: number): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/withdraw`, { method: "POST" });
}

export function approveLeave(leaveId: number): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/approve`, {
    method: "POST",
    body: {},
  });
}

export function rejectLeave(leaveId: number, comment?: string): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/reject`, {
    method: "POST",
    body: comment ? { comment } : {},
  });
}
