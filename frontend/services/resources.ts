import { apiRequest, authPath } from "./api";
import { authorizedRequest } from "./auth";

export type EmployeePublic = {
  employeeId: number;
  firstName: string;
  lastName: string | null;
  email: string;
  phone?: string | null;
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
  reportingManagerEmployeeId?: number | null;
  managerApprovalStatus?: string | null;
  managerComments?: string | null;
  documents?: { documentId: number; fileName: string; fileType: string; contentType: string; fileSize: number }[];
  statusHistory?: {
    historyId: number;
    oldStatus: string | null;
    newStatus: string;
    reason: string | null;
    changedAt: string | null;
  }[];
};

export type AttendanceRecord = {
  attendanceId: number;
  employeeId: number;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  lateMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceDashboard = {
  date: string;
  timezone: string;
  canCheckIn: boolean;
  canCheckOut: boolean;
  checkedIn: boolean;
  checkedOut: boolean;
  status: string;
  lateMinutes: number;
  attendance: AttendanceRecord | null;
};

export type AttendanceHistory = {
  items: AttendanceRecord[];
  summary: {
    totalPresent: number;
    totalHalfDay: number;
    totalAbsent: number;
    totalOnLeave: number;
    totalLate: number;
  };
  page: number;
  pageSize: number;
  total: number;
};

export type AttendanceCorrection = {
  correctionId: number;
  employeeId: number;
  attendanceId: number;
  correctionDate: string;
  correctionType: string;
  correctLoginTime: string | null;
  correctLogoutTime: string | null;
  reason: string;
  supportingDocument: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: number | null;
  hrComments: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewer?: Pick<EmployeePublic, "employeeId" | "firstName" | "lastName" | "email"> | null;
  attendance?: Pick<AttendanceRecord, "attendanceId" | "attendanceDate" | "checkIn" | "checkOut" | "status" | "lateMinutes">;
};

export type CorrectionList = { items: AttendanceCorrection[]; page: number; pageSize: number; total: number };

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

export function patchEmployee(
  employeeId: number,
  body: Partial<{ managerId: number | null; status: string; role: string; departmentId: number }>,
): Promise<EmployeePublic> {
  return authorizedRequest<EmployeePublic>(`/api/v1/employees/${employeeId}`, { method: "PATCH", body });
}

export function listEmployees(): Promise<ItemList<EmployeePublic>> {
  return authorizedRequest<ItemList<EmployeePublic>>("/api/v1/employees?page=1&pageSize=100");
}

export function getDepartment(departmentId: number): Promise<Department> {
  return authorizedRequest<Department>(`/api/v1/departments/${departmentId}`);
}

export function listDepartments(): Promise<ItemList<Department>> {
  return authorizedRequest<ItemList<Department>>("/api/v1/departments?page=1&pageSize=100");
}

export function getOrgSettings(): Promise<OrganisationSettings> {
  return authorizedRequest<OrganisationSettings>("/api/v1/org-settings");
}

export type Holiday = {
  holidayId: number;
  holidayName: string;
  holidayDate: string | null;
};

export function listHolidays(from?: string, to?: string): Promise<{ items: Holiday[] }> {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return authorizedRequest<{ items: Holiday[] }>(`/api/v1/holidays${suffix}`);
}

export function createHoliday(body: { date: string; name: string }): Promise<Holiday> {
  return authorizedRequest<Holiday>("/api/v1/holidays", { method: "POST", body });
}

export type AppNotification = {
  notificationId: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | null;
};

export function listMyNotifications(): Promise<{ items: AppNotification[]; unreadCount?: number }> {
  return authorizedRequest<{ items: AppNotification[]; unreadCount?: number }>("/api/v1/notifications");
}

export function markNotificationRead(notificationId: number): Promise<AppNotification> {
  return authorizedRequest<AppNotification>(`/api/v1/notifications/${notificationId}/read`, { method: "POST" });
}

export function patchOrgSettings(body: Partial<OrganisationSettings>): Promise<OrganisationSettings> {
  return authorizedRequest<OrganisationSettings>("/api/v1/org-settings", { method: "PATCH", body });
}

export function changePassword(body: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
  return authorizedRequest<{ message: string }>(authPath("/change-password"), { method: "POST", body });
}

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(authPath("/forgot-password"), {
    method: "POST",
    body: { email },
  });
}

export function uploadLeaveDocument(
  leaveId: number,
  file: {
    uri: string;
    name: string;
    type: string;
    blob?: Blob;
  },
): Promise<unknown> {

  const body = new FormData();
  body.append("leaveId", String(leaveId));
  if (file.blob) {
    body.append("file", file.blob, file.name);
  } else {
    body.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  }
  return authorizedRequest("/api/v1/documents", { method: "POST", body });
}

export function listLeaveTypes(includeObsolete = false): Promise<ItemList<LeaveType>> {
  const suffix = includeObsolete ? "?includeObsolete=true" : "";
  return authorizedRequest<ItemList<LeaveType>>(`/api/v1/leave-types${suffix}`);
}

export function createLeaveType(body: {
  name: string;
  description?: string | null;
  requiresMedicalDocument?: boolean;
  allowedSex?: string | null;
}): Promise<LeaveType> {
  return authorizedRequest<LeaveType>("/api/v1/leave-types", { method: "POST", body });
}

export function patchLeaveType(
  leaveTypeId: number,
  body: Partial<{
    name: string;
    description: string | null;
    requiresMedicalDocument: boolean;
    allowedSex: string | null;
    obsolete: boolean;
  }>,
): Promise<LeaveType> {
  return authorizedRequest<LeaveType>(`/api/v1/leave-types/${leaveTypeId}`, { method: "PATCH", body });
}

export function deleteLeaveType(leaveTypeId: number): Promise<LeaveType | void> {
  return authorizedRequest<LeaveType | void>(`/api/v1/leave-types/${leaveTypeId}`, { method: "DELETE" });
}

export function listLeaves(status?: string): Promise<ItemList<LeaveApplication>> {
  const query = status ? `?page=1&pageSize=100&status=${encodeURIComponent(status)}` : "?page=1&pageSize=100";
  return authorizedRequest<ItemList<LeaveApplication>>(`/api/v1/leaves${query}`);
}

export function getMyAttendance(month: string, page = 1, pageSize = 10): Promise<AttendanceHistory> {
  const query = new URLSearchParams({ month, page: String(page), pageSize: String(pageSize) });
  return authorizedRequest<AttendanceHistory>(`/api/v1/attendance/me?${query.toString()}`);
}

export function getMyAttendanceDashboard(): Promise<AttendanceDashboard> {
  return authorizedRequest<AttendanceDashboard>("/api/v1/attendance/me/dashboard");
}

export function checkInAttendance(): Promise<AttendanceRecord> {
  return authorizedRequest<AttendanceRecord>("/api/v1/attendance/check-in", { method: "POST", body: {} });
}

export function checkOutAttendance(): Promise<AttendanceRecord> {
  return authorizedRequest<AttendanceRecord>("/api/v1/attendance/check-out", { method: "POST", body: {} });
}

export function listMyCorrections(status?: AttendanceCorrection["status"]): Promise<CorrectionList> {
  const query = new URLSearchParams({ page: "1", pageSize: "100" });
  if (status) query.set("status", status);
  return authorizedRequest<CorrectionList>(`/api/v1/attendance/corrections?${query.toString()}`);
}

export function createAttendanceCorrection(body: {
  correctionDate: string;
  correctionType: string;
  correctLoginTime?: string | null;
  correctLogoutTime?: string | null;
  reason: string;
}): Promise<AttendanceCorrection> {
  return authorizedRequest<AttendanceCorrection>("/api/v1/attendance/corrections", { method: "POST", body });
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

export function getLeave(leaveId: number): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}`);
}

export function updateLeaveDraft(
  leaveId: number,
  body: {
    leaveTypeId: number;
    reason: string;
    selectedDates: { date: string; session: string }[];
  },
): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}`, { method: "PATCH", body });
}

export function submitLeaveDraft(leaveId: number): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/submit`, { method: "POST" });
}

export function withdrawLeave(leaveId: number): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/withdraw`, { method: "POST" });
}

export function approveLeave(leaveId: number, comment?: string): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/approve`, {
    method: "POST",
    body: comment ? { comment } : {},
  });
}

export function rejectLeave(leaveId: number, comment?: string): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/reject`, {
    method: "POST",
    body: comment ? { comment } : {},
  });
}

export function managerApproveLeave(leaveId: number, comment?: string): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/manager-approve`, {
    method: "POST",
    body: comment ? { comment } : {},
  });
}

export function managerRejectLeave(leaveId: number, comment?: string): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/manager-reject`, {
    method: "POST",
    body: comment ? { comment } : {},
  });
}

export function cancelLeave(leaveId: number): Promise<LeaveApplication> {
  return authorizedRequest<LeaveApplication>(`/api/v1/leaves/${leaveId}/cancel`, { method: "POST" });
}

export async function downloadLeaveDocument(
  documentId: number,
  fileName: string,
): Promise<void> {
  const { getApiBaseUrl } = await import("./api");
  const { getSession } = await import("./auth");
  const session = await getSession();
  const response = await fetch(`${getApiBaseUrl()}/api/v1/documents/${documentId}`, {
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error("Unable to download document.");
  }
  const blob = await response.blob();
  if (typeof document !== "undefined" && typeof URL !== "undefined") {
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(href);
    return;
  }
  const FileSystem = require("expo-file-system") as {
    documentDirectory?: string | null;
    writeAsStringAsync?: (path: string, data: string, options: { encoding: string }) => Promise<void>;
  };
  const dir = FileSystem.documentDirectory;
  if (!dir || !FileSystem.writeAsStringAsync) {
    return;
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }
  const base64 = globalThis.btoa(binary);
  await FileSystem.writeAsStringAsync(`${dir}Symbiotic Medical Documents/${fileName}`, base64, {
    encoding: "base64",
  });
}
