import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  apiErrorMessage,
  getMyAttendance,
  type AttendanceHistory,
  type AttendanceRecord,
} from "../../../services/resources";
import {
  formatDateIST,
  formatDateTimeIST,
  formatTimeIST,
  getTodayIST,
} from "../../utils/date";
import { ScreenGradient } from "../../components/ui/AppChrome";
import {
  TopNavBar,
  useTopNavContentInset,
} from "../../components/ui/AdminComponents";
import { EmployeeBottomNavBar } from "../../components/ui/EmployeeComponents";
import { DatePickerModal } from "../../components/ui/DatePickerModal";

import { colors as themeColors } from "../../theme";

const colors = {
  ...themeColors,
  card: themeColors.surfaceContainerLowest,
  low: themeColors.surfaceContainerLow,
  high: themeColors.surfaceContainerHigh,
  container: themeColors.surfaceContainer,

  // Stronger readable secondary text.
  secondaryStrong: themeColors.onSurfaceVariant,

  text: themeColors.onSurface,
};

type Filter = "all" | "Present" | "Absent" | "exceptions";

function monthFromDate(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, value] = month.split("-").map(Number);

  return monthFromDate(
    new Date(Date.UTC(year, value - 1 + delta, 1))
  );
}

function monthTitle(month: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00.000Z`));
}

function dayLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function duration(
  checkIn: string | null,
  checkOut: string | null
): string | null {
  if (!checkIn || !checkOut) return null;

  const minutes = Math.max(
    0,
    Math.floor(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000
    )
  );

  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(
    2,
    "0"
  )}m`;
}

function statusText(status: string): string {
  return status.replaceAll("-", " ").replaceAll("_", " ");
}

function isException(item: AttendanceRecord): boolean {
  return (
    item.status === "Absent" ||
    item.status === "Half-Day" ||
    item.lateMinutes > 0 ||
    (item.checkIn !== null && item.checkOut === null)
  );
}

export default function MyAttendanceScreen() {
  const router = useRouter();
  const topInset = useTopNavContentInset();

  const [month, setMonth] = useState(() => getTodayIST().slice(0, 7));
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [data, setData] = useState<AttendanceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await getMyAttendance(month, page, 50));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month, page]);

  // Clear stale data immediately when month changes
  // so old records don't linger.
  useEffect(() => {
    setData(null);
    setFilter("all");
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = useMemo(
    () =>
      (data?.items ?? []).filter((item) => {
        if (filter === "all") return true;
        if (filter === "exceptions") return isException(item);
        return item.status === filter;
      }),
    [data, filter]
  );

  const totalPages = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 50))
  );

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Value for DatePickerModal: selected date or first day of current attendance month.
  const datePickerValue = selectedDateStr && selectedDateStr.startsWith(month) ? selectedDateStr : `${month}-01`;

  const filterCount = (name: Filter) => {
    const items = data?.items ?? [];

    if (name === "all") return data?.total ?? 0;
    if (name === "exceptions") return items.filter(isException).length;

    return items.filter((item) => item.status === name).length;
  };

  return (
    <ScreenGradient>
      <View style={styles.safeArea}>
        <TopNavBar
          title="My Attendance"
          showBack
          onBack={() => router.push("/(tabs)")}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: topInset },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.monthCard}>
            <View style={styles.monthCenter}>
              <View style={styles.monthTitleRow}>
                <MaterialIcons
                  name="calendar-month"
                  size={17}
                  color={colors.primary}
                />
                <Text style={styles.monthTitle}>
                  {monthTitle(month)}
                </Text>
              </View>

              <Text style={styles.monthMeta}>
                {data?.total ?? 0} recorded days • IST ledger
              </Text>
            </View>
          </View>

          <View style={styles.metricGrid}>
            <Metric
              label="Present"
              value={data?.summary.totalPresent ?? 0}
              icon="check-circle"
            />

            <Metric
              label="Absent"
              value={data?.summary.totalAbsent ?? 0}
              icon="cancel"
            />

            <Metric
              label="Half-Day"
              value={data?.summary.totalHalfDay ?? 0}
              icon="timelapse"
            />

            <Metric
              label="On Leave"
              value={data?.summary.totalOnLeave ?? 0}
              icon="event-busy"
            />
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => {
                setMonth(shiftMonth(month, -1));
                setPage(1);
              }}
              style={styles.navBtn}
            >
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={colors.secondaryStrong}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDatePickerOpen(true)}
              style={styles.navCenter}
              activeOpacity={0.7}
            >
              <Text style={styles.navTitle}>
                {monthTitle(month)}
              </Text>

              <Text style={styles.navMeta}>
                Asia/Kolkata
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMonth(shiftMonth(month, 1));
                setPage(1);
              }}
              style={styles.navBtn}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={colors.secondaryStrong}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.rangeCard}
            onPress={() =>
              router.push("/attendance-corrections" as never)
            }
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="rule"
              size={16}
              color={colors.secondaryStrong}
            />

            <Text style={styles.rangeText}>
              Attendance corrections
            </Text>

            <MaterialIcons
              name="arrow-forward"
              size={16}
              color={colors.secondaryStrong}
            />
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {(
              ["all", "Present", "Absent", "exceptions"] as Filter[]
            ).map((name) => (
              <TouchableOpacity
                key={name}
                onPress={() => setFilter(name)}
                style={[
                  styles.filter,
                  filter === name && styles.filterActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === name && styles.filterTextActive,
                  ]}
                >
                  {name === "all"
                    ? "All"
                    : name === "exceptions"
                      ? "Exceptions"
                      : name}{" "}
                  ({filterCount(name)})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedDateStr && selectedDateStr.startsWith(month) ? (
            <View style={styles.selectedDateBanner}>
              <MaterialIcons name="event" size={16} color={colors.primary} />
              <Text style={styles.selectedDateText}>
                Filter: {dayLabel(selectedDateStr)}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDateStr(null)}>
                <MaterialIcons name="close" size={16} color={colors.secondaryStrong} />
              </TouchableOpacity>
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.loader}
            />
          ) : null}

          {error ? (
            <Text selectable style={styles.error}>
              {error}
            </Text>
          ) : null}

          {!loading && !error && visibleItems.length === 0 ? (
            <Text style={styles.empty}>
              No attendance records match this filter.
            </Text>
          ) : null}

          {visibleItems.map((item) => (
            <AttendanceCard
              key={item.attendanceId}
              item={item}
              isHighlighted={selectedDateStr === item.attendanceDate}
              onPress={() => setSelected(item)}
            />
          ))}

          <View style={styles.pagination}>
            <View style={styles.pageRow}>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  page === 1 && styles.disabled,
                ]}
                disabled={page === 1}
                onPress={() =>
                  setPage((value) => value - 1)
                }
              >
                <MaterialIcons
                  name="chevron-left"
                  size={22}
                  color={colors.secondaryStrong}
                />
              </TouchableOpacity>

              <Text style={styles.pageText}>
                Page {page} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  page >= totalPages && styles.disabled,
                ]}
                disabled={page >= totalPages}
                onPress={() =>
                  setPage((value) => value + 1)
                }
              >
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={colors.secondaryStrong}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.loaded}>
              {visibleItems.length} of {data?.total ?? 0} records
              loaded (IST)
            </Text>
          </View>
        </ScrollView>

        <DetailsSheet
          item={selected}
          onClose={() => setSelected(null)}
        />

        <DatePickerModal
          visible={datePickerOpen}
          value={datePickerValue}
          onClose={() => setDatePickerOpen(false)}
          onSelect={(date) => {
            setMonth(date.slice(0, 7));
            setSelectedDateStr(date);
            setPage(1);
          }}
          minYear={2020}
          maxYear={Number(getTodayIST().slice(0, 4)) + 1}
        />

        <EmployeeBottomNavBar activeRoute="attendance" />
      </View>
    </ScreenGradient>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>

      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>

        <MaterialIcons
          name={icon}
          size={16}
          color={colors.secondaryStrong}
        />
      </View>
    </View>
  );
}

function AttendanceCard({
  item,
  isHighlighted,
  onPress,
}: {
  item: AttendanceRecord;
  isHighlighted?: boolean;
  onPress: () => void;
}) {
  const workDuration = duration(item.checkIn, item.checkOut);
  const missingOut =
    item.checkIn !== null && item.checkOut === null;

  return (
    <TouchableOpacity
      style={[
        styles.record,
        (item.status === "Weekly Off" ||
          item.status === "Holiday") &&
          styles.restRecord,
        isHighlighted && styles.highlightedRecord,
      ]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={styles.recordTop}>
        <View style={styles.recordTitleRow}>
          <Text style={styles.recordDate}>
            {dayLabel(item.attendanceDate)}
          </Text>

          <View
            style={[
              styles.statusPill,
              item.status === "Present" && styles.presentPill,
              item.status === "Absent" && styles.absentPill,
              item.status === "Half-Day" && styles.halfDayPill,
              item.status === "On Leave" && styles.leavePill,
              item.status === "Holiday" && styles.holidayPill,
              item.status === "Weekly Off" && styles.weeklyOffPill,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                item.status === "Present" &&
                  styles.presentPillText,
                item.status === "Absent" &&
                  styles.absentPillText,
                item.status === "Half-Day" &&
                  styles.halfDayPillText,
                item.status === "On Leave" &&
                  styles.leavePillText,
                item.status === "Holiday" &&
                  styles.holidayPillText,
                item.status === "Weekly Off" &&
                  styles.weeklyOffPillText,
              ]}
            >
              {missingOut
                ? "MISSING OUT"
                : statusText(item.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.duration}>
          {workDuration ??
            (missingOut ? "Action required" : "—")}
        </Text>
      </View>

      <View style={styles.recordBottom}>
        <View style={styles.timeRow}>
          <MaterialIcons
            name="login"
            size={14}
            color={colors.secondaryStrong}
          />

          <Text style={styles.recordMetaStrong}>
            {item.checkIn
              ? formatTimeIST(item.checkIn, false)
              : "No check-in"}
          </Text>

          <Text style={styles.arrow}>→</Text>

          <MaterialIcons
            name={missingOut ? "error" : "logout"}
            size={14}
            color={
              missingOut
                ? colors.error
                : colors.secondaryStrong
            }
          />

          <Text style={styles.recordMetaStrong}>
            {item.checkOut
              ? formatTimeIST(item.checkOut, false)
              : "Missing check-out"}
          </Text>
        </View>

        <Text style={styles.recordMeta}>
          {item.lateMinutes > 0
            ? `Late: ${item.lateMinutes} min`
            : "View details"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function DetailsSheet({
  item,
  onClose,
}: {
  item: AttendanceRecord | null;
  onClose: () => void;
}) {
  if (!item) return null;

  const workDuration =
    duration(item.checkIn, item.checkOut) ?? "In progress";

  return (
    <Modal
      transparent
      animationType="slide"
      visible
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={() => {}}
        >
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.eyebrow}>
                ATTENDANCE DETAILS
              </Text>

              <Text style={styles.sheetTitle}>
                {formatDateIST(
                  `${item.attendanceDate}T00:00:00.000Z`,
                  "full"
                )}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={onClose}
            >
              <MaterialIcons
                name="close"
                size={22}
                color={colors.secondaryStrong}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.detailStatus}>
            <Text style={styles.metricLabel}>
              RECORDED STATE
            </Text>

            <Text style={styles.detailStatusText}>
              {statusText(item.status)}
            </Text>
          </View>

          <Detail
            label="Check-in verification"
            value={formatDateTimeIST(item.checkIn)}
          />

          <Detail
            label="Check-out verification"
            value={formatDateTimeIST(item.checkOut)}
          />

          <Detail
            label="Working duration"
            value={workDuration}
          />

          <Detail
            label="Arrival deviation"
            value={
              item.lateMinutes > 0
                ? `${item.lateMinutes} min late`
                : "On time"
            }
          />

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>
              Close Details
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text selectable style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  content: {
    padding: 16,
    paddingBottom: 36,
    gap: 12,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },

  brand: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  brandText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 11,
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },

  monthCard: {
    backgroundColor: colors.low,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },

  monthCenter: {
    alignItems: "center",
    gap: 2,
  },

  monthMenu: {
    gap: 8,
    paddingTop: 4,
  },

  monthTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  monthTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },

  monthMeta: {
    fontSize: 11,
    color: colors.secondaryStrong,
  },

  metricGrid: {
    flexDirection: "row",
    gap: 8,
  },

  metric: {
    flex: 1,
    minHeight: 82,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.secondaryStrong,
    textTransform: "uppercase",
  },

  metricValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  metricValue: {
    fontSize: 21,
    fontWeight: "600",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },

  rangeCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  rangeText: {
    color: colors.secondaryStrong,
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },

  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },

  filter: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.card,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
    textTransform: "uppercase",
  },

  filterTextActive: {
    color: colors.onPrimary,
  },

  loader: {
    marginVertical: 28,
  },

  error: {
    color: colors.error,
    padding: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
  },

  empty: {
    color: colors.secondaryStrong,
    textAlign: "center",
    paddingVertical: 28,
  },

  record: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  restRecord: {
    backgroundColor: colors.low,
  },

  recordTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  recordTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },

  recordDate: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },

  statusPill: {
    backgroundColor: colors.high,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  statusPillText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: "700",
  },

  presentPill: {
    backgroundColor: colors.successWash,
  },

  presentPillText: {
    color: colors.success,
  },

  absentPill: {
    backgroundColor: colors.error + "14",
  },

  absentPillText: {
    color: colors.error,
  },

  halfDayPill: {
    backgroundColor: colors.warningWash,
  },

  halfDayPillText: {
    color: colors.warning,
  },

  leavePill: {
    backgroundColor: colors.indigoWash,
  },

  leavePillText: {
    color: "#2563EB",
  },

  holidayPill: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
  },

  holidayPillText: {
    color: "#7C3AED",
  },

  weeklyOffPill: {
    backgroundColor: colors.surfaceContainer,
  },

  weeklyOffPillText: {
    color: colors.secondaryStrong,
  },

  duration: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },

  recordBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flex: 1,
  },

  recordMeta: {
    color: colors.secondary,
    fontSize: 11,
  },

  recordMetaStrong: {
    color: colors.secondaryStrong,
    fontSize: 11,
    fontWeight: "500",
  },

  arrow: {
    color: colors.secondaryStrong,
    marginHorizontal: 2,
  },

  pagination: {
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },

  pageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  pageButton: {
    width: 44,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.low,
    alignItems: "center",
    justifyContent: "center",
  },

  pageText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },

  loaded: {
    color: colors.secondaryStrong,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  disabled: {
    opacity: 0.4,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 12,
  },

  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.high,
  },

  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  eyebrow: {
    color: colors.secondaryStrong,
    fontSize: 10,
    fontWeight: "700",
  },

  sheetTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
  },

  detailStatus: {
    padding: 12,
    backgroundColor: colors.low,
    borderRadius: 8,
    gap: 4,
  },

  detailStatusText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.container,
  },

  detailLabel: {
    color: colors.secondaryStrong,
    fontSize: 12,
  },

  detailValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },

  closeButton: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  closeButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  navBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  navCenter: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flex: 1,
    marginHorizontal: 12,
  },

  navTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  navMeta: {
    fontSize: 11,
    color: colors.secondaryStrong,
  },

  selectedDateBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 4,
  },

  selectedDateText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginLeft: 6,
  },

  highlightedRecord: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
});