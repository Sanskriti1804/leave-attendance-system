import type { EmployeePublic, LeaveApplication } from "../../services/resources";

export function civilToday(timeZone?: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function matchesPeopleQuery(
  employee: EmployeePublic,
  query: string,
  departmentName?: string,
): boolean {
  const term = query.trim().toLowerCase();
  if (!term) {
    return true;
  }
  const haystack = [
    employee.firstName,
    employee.lastName ?? "",
    employee.email,
    employee.role,
    `emp-${employee.employeeId}`,
    departmentName ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

export function computeWorkforce(employees: EmployeePublic[], approvedLeaves: LeaveApplication[], today: string) {
  const active = employees.filter((row) => row.status === "ACTIVE" && !row.obsolete);
  const onLeaveIds = new Set(
    approvedLeaves
      .filter((row) => row.status === "APPROVED" && row.startDate <= today && row.endDate >= today)
      .map((row) => row.employeeId),
  );
  const onLeave = onLeaveIds.size;
  const present = Math.max(0, active.length - onLeave);
  const inactive = employees.filter((row) => row.status !== "ACTIVE" || row.obsolete).length;
  const percent = active.length === 0 ? 0 : Math.round((present / active.length) * 1000) / 10;
  return {
    active: active.length,
    present,
    onLeave,
    inactive,
    percent,
  };
}
