import { fromCivilDate } from "../utils/dates.js";
import { HttpError } from "../utils/http-error.js";
import { toCsv, toExcelXml, toPdf, type ReportTable } from "./exporters.js";
import * as reportsRepository from "./repository.js";
import type { ReportQuery, ReportSlug } from "./validation.js";

function personName(row: { firstName: string; lastName: string | null } | null | undefined): string {
  if (!row) {
    return "";
  }
  return [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
}

function departmentName(row: { departmentName?: string } | null | undefined): string {
  return row?.departmentName?.trim() || "Unassigned";
}

function monthKey(civil: string): string {
  return civil.slice(0, 7);
}

function assertRange(from: string, to: string): void {
  if (from > to) {
    throw new HttpError(422, "INVALID_RANGE", "from must be on or before to");
  }
  const days = Math.floor((fromCivilDate(to).getTime() - fromCivilDate(from).getTime()) / 86400000) + 1;
  if (days > 366) {
    throw new HttpError(422, "RANGE_TOO_LARGE", "Report range cannot exceed 366 days");
  }
}

function table(slug: ReportSlug, from: string, to: string, columns: string[], rows: string[][]): ReportTable {
  return { slug, from, to, columns, rows };
}

async function buildLeaveTable(slug: ReportSlug, query: ReportQuery): Promise<ReportTable> {
  const leaves = await reportsRepository.findLeavesForRange(query);
  if (slug === "leave-employee") {
    return table(slug, query.from, query.to, ["Employee", "Department", "Type", "Start", "End", "Days", "Status"], leaves.map((row) => [
      personName(row.employee),
      departmentName(row.employee.department),
      row.leaveType.name,
      reportsRepository.civil(row.startDate),
      reportsRepository.civil(row.endDate),
      String(row.numberOfDays),
      row.status,
    ]));
  }
  if (slug === "leave-department") {
    const buckets = new Map<string, { count: number; days: number }>();
    for (const row of leaves) {
      const key = departmentName(row.employee.department);
      const current = buckets.get(key) ?? { count: 0, days: 0 };
      current.count += 1;
      current.days += Number(row.numberOfDays);
      buckets.set(key, current);
    }
    return table(slug, query.from, query.to, ["Department", "Applications", "Days"], [...buckets.entries()].map(([name, value]) => [
      name,
      String(value.count),
      String(value.days),
    ]));
  }
  if (slug === "leave-monthly") {
    const buckets = new Map<string, { count: number; days: number }>();
    for (const row of leaves) {
      const key = monthKey(reportsRepository.civil(row.startDate));
      const current = buckets.get(key) ?? { count: 0, days: 0 };
      current.count += 1;
      current.days += Number(row.numberOfDays);
      buckets.set(key, current);
    }
    return table(slug, query.from, query.to, ["Month", "Applications", "Days"], [...buckets.entries()].map(([name, value]) => [
      name,
      String(value.count),
      String(value.days),
    ]));
  }
  if (slug === "leave-type") {
    const buckets = new Map<string, { count: number; days: number }>();
    for (const row of leaves) {
      const key = row.leaveType.name;
      const current = buckets.get(key) ?? { count: 0, days: 0 };
      current.count += 1;
      current.days += Number(row.numberOfDays);
      buckets.set(key, current);
    }
    return table(slug, query.from, query.to, ["Leave type", "Applications", "Days"], [...buckets.entries()].map(([name, value]) => [
      name,
      String(value.count),
      String(value.days),
    ]));
  }
  const decisions = leaves.filter((row) => row.status === "APPROVED" || row.status === "REJECTED");
  return table(slug, query.from, query.to, ["Employee", "Type", "Status", "Reviewer", "Reviewed"], decisions.map((row) => [
    personName(row.employee),
    row.leaveType.name,
    row.status,
    personName(row.reviewer),
    row.reviewedAt ? row.reviewedAt.toISOString() : "",
  ]));
}

async function buildAttendanceTable(slug: ReportSlug, query: ReportQuery): Promise<ReportTable> {
  const rows = await reportsRepository.findAttendanceForRange(query);
  const mapped = slug === "attendance-late"
    ? rows.filter((row) => row.lateMinutes > 0)
    : slug === "attendance-missing-logout"
      ? rows.filter((row) => Boolean(row.checkIn) && !row.checkOut)
      : rows;
  if (slug === "attendance-daily" || slug === "attendance-late" || slug === "attendance-missing-logout") {
    const columns =
      slug === "attendance-late"
        ? ["Date", "Employee", "Department", "Status", "Late minutes"]
        : ["Date", "Employee", "Department", "Status", "Check-in", "Check-out"];
    return table(
      slug,
      query.from,
      query.to,
      columns,
      mapped.map((row) => {
        const base = [
          reportsRepository.civil(row.attendanceDate),
          personName(row.employee),
          departmentName(row.employee.department),
          row.status,
        ];
        if (slug === "attendance-late") {
          return [...base, String(row.lateMinutes)];
        }
        return [...base, row.checkIn?.toISOString() ?? "", row.checkOut?.toISOString() ?? ""];
      }),
    );
  }
  if (slug === "attendance-monthly") {
    const buckets = new Map<string, { count: number; late: number }>();
    for (const row of mapped) {
      const key = monthKey(reportsRepository.civil(row.attendanceDate));
      const current = buckets.get(key) ?? { count: 0, late: 0 };
      current.count += 1;
      current.late += row.lateMinutes;
      buckets.set(key, current);
    }
    return table(slug, query.from, query.to, ["Month", "Records", "Late minutes"], [...buckets.entries()].map(([name, value]) => [
      name,
      String(value.count),
      String(value.late),
    ]));
  }
  const buckets = new Map<string, { count: number; late: number }>();
  for (const row of mapped) {
    const key = personName(row.employee) || String(row.employeeId);
    const current = buckets.get(key) ?? { count: 0, late: 0 };
    current.count += 1;
    current.late += row.lateMinutes;
    buckets.set(key, current);
  }
  return table(slug, query.from, query.to, ["Employee", "Records", "Late minutes"], [...buckets.entries()].map(([name, value]) => [
    name,
    String(value.count),
    String(value.late),
  ]));
}

export async function buildReport(slug: ReportSlug, query: ReportQuery): Promise<ReportTable> {
  assertRange(query.from, query.to);
  if (slug.startsWith("leave-")) {
    return buildLeaveTable(slug, query);
  }
  return buildAttendanceTable(slug, query);
}

export async function renderReport(slug: ReportSlug, query: ReportQuery): Promise<{
  contentType: string;
  filename: string;
  body: string | Buffer;
  json?: ReportTable;
}> {
  const built = await buildReport(slug, query);
  if (query.format === "csv") {
    return { contentType: "text/csv; charset=utf-8", filename: `${slug}.csv`, body: toCsv(built) };
  }
  if (query.format === "xlsx") {
    return {
      contentType: "application/vnd.ms-excel",
      filename: `${slug}.xls`,
      body: toExcelXml(built),
    };
  }
  if (query.format === "pdf") {
    return { contentType: "application/pdf", filename: `${slug}.pdf`, body: toPdf(built) };
  }
  return { contentType: "application/json; charset=utf-8", filename: `${slug}.json`, body: JSON.stringify(built), json: built };
}
