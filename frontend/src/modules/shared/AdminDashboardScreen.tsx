import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, LayoutAnimation, Platform, UIManager } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { getSession } from "../../../services/auth";
import {
  displayName,
  getMe,
  listEmployees,
  listLeaves,
  type EmployeePublic,
  type LeaveApplication,
} from "../../../services/resources";
import { ScreenGradient } from "../../components/ui/AppChrome";
import { TopNavBar, HROperationsCard, ContentCard, StatsCard, BottomNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { UIFallbackIndicator } from "../../components/ui/UIFallback";
import { computeWorkforce, civilToday } from "../../utils/workforce";
import { colors } from "../../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const topInset = useTopNavContentInset();
  const reviewHref = (process.env.EXPO_PUBLIC_ADMIN_LEAVE_REVIEW as string | undefined) || "/leave/admin-review";
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [pending, setPending] = useState<LeaveApplication[]>([]);
  const [approved, setApproved] = useState<LeaveApplication[]>([]);
  const [query, setQuery] = useState("");
  const [employeeTotal, setEmployeeTotal] = useState<number | null>(null);
  const [openMetric, setOpenMetric] = useState<"present" | "leave" | "inactive" | "pending" | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        try {
          const profile = await getMe();
          if (!cancelled) setMe(profile);
        } catch {
          if (!cancelled) setMe((session?.user as EmployeePublic | undefined) ?? null);
        }
        try {
          const people = await listEmployees();
          if (!cancelled) {
            setEmployees(people.items);
            setEmployeeTotal(people.total ?? people.items.length);
          }
        } catch {
          // Keep the HR action list usable; do not surface auth/fetch errors here.
        }
        try {
          const [pendingLeaves, submittedLeaves, approvedLeaves] = await Promise.all([
            listLeaves("PENDING_HR_REVIEW"),
            listLeaves("SUBMITTED"),
            listLeaves("APPROVED"),
          ]);
          if (!cancelled) {
            setPending([...pendingLeaves.items, ...submittedLeaves.items]);
            setApproved(approvedLeaves.items);
          }
        } catch {
          // Same as getMe: a failed list must not replace the action queue with a 401 string.
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const todayCivil = civilToday();
  const workforce = useMemo(() => computeWorkforce(employees, approved, todayCivil), [employees, approved, todayCivil]);
  const onLeaveIds = new Set(
    approved.filter((row) => row.status === "APPROVED" && row.startDate <= todayCivil && row.endDate >= todayCivil).map((row) => row.employeeId),
  );
  const metricNames =
    openMetric === "present"
      ? employees.filter((row) => row.status === "ACTIVE" && !row.obsolete && !onLeaveIds.has(row.employeeId)).map(displayName)
      : openMetric === "leave"
        ? employees.filter((row) => onLeaveIds.has(row.employeeId)).map(displayName)
        : openMetric === "inactive"
          ? employees.filter((row) => row.status !== "ACTIVE" || row.obsolete).map(displayName)
          : openMetric === "pending"
            ? pending.map((row) => {
                const person = employees.find((employee) => employee.employeeId === row.employeeId);
                return person ? displayName(person) : `Leave #${row.leaveId}`;
              })
            : [];
  const toggleMetric = (key: "present" | "leave" | "inactive" | "pending") => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMetric((current) => (current === key ? null : key));
  };

  return (
    <ScreenGradient>
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavBar title="Admin Dashboard" />
        
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: topInset, paddingHorizontal: 16, paddingBottom: 112, gap: 18 }}>
          <HROperationsCard 
            name={me ? displayName(me).toUpperCase() : "—"}
            role={me?.role ?? "—"}
            day={new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            date={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          />

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

          <ContentCard style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="search" size={20} color={colors.secondary} />
            <TextInput 
              style={{ flex: 1, fontFamily: 'Inter', fontSize: 14, color: colors.onSurface }}
              placeholder="Search employees, records, or departments..."
              placeholderTextColor={colors.secondary}
              value={query}
              onChangeText={setQuery}
            />
          </ContentCard>

          <ContentCard style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '600', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Live Workforce</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <Text style={{ fontFamily: 'Inter', fontSize: 28, fontWeight: '600', color: colors.onSurface }}>{employeeTotal === null ? "..." : workforce.active}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: '500', color: colors.secondary }}>Active Entities (IN)</Text>
                  {employeeTotal === null && <UIFallbackIndicator />}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: colors.onSurface }}>{employeeTotal === null ? "..." : `${workforce.percent}%`}</Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: colors.secondary, textTransform: 'uppercase' }}>Net Present</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              <View style={{ width: '48%' }}>
                <StatsCard title="Present" iconName="how-to-reg" iconColor={colors.onSurface} count={employeeTotal === null ? "..." : workforce.present.toString()} subtitle={`${workforce.percent}%`} borderColor={colors.accent} onPress={() => toggleMetric("present")} />
              </View>
              <View style={{ width: '48%' }}>
                <StatsCard title="On Leave" iconName="event-busy" iconColor={colors.onSurface} count={employeeTotal === null ? "..." : workforce.onLeave.toString()} subtitle="Approved" borderColor={colors.sessionSecondHalf} onPress={() => toggleMetric("leave")} />
              </View>
              <View style={{ width: '48%' }}>
                <StatsCard title="Inactive" iconName="person-off" iconColor={colors.error} countColor={colors.error} count={employeeTotal === null ? "..." : workforce.inactive.toString()} subtitle="Not Active" borderColor={colors.error} onPress={() => toggleMetric("inactive")} />
              </View>
              <View style={{ width: '48%' }}>
                <StatsCard title="Pending reviews" iconName="pending" iconColor={colors.secondary} count={pending.length.toString()} subtitle="Live queue" borderColor={colors.secondary} onPress={() => toggleMetric("pending")} />
              </View>
            </View>
            {openMetric ? (
              <View style={{ gap: 4 }}>
                {metricNames.length === 0 ? <Text style={{ fontFamily: "Inter", fontSize: 12, color: colors.secondary }}>No matching people.</Text> : null}
                {metricNames.slice(0, 8).map((name) => (
                  <Text key={name} style={{ fontFamily: "Inter", fontSize: 13, color: colors.onSurface }}>{name}</Text>
                ))}
              </View>
            ) : null}

            <View style={{ backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 14, marginTop: 4, padding: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
                 <View style={{ flexDirection: 'column' }}>
                    <Text style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: colors.onSurface }}>Pending Leave Reviews</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '600', color: colors.secondary, textTransform: 'uppercase' }}>{pending.length} Requests</Text>
                    </View>
                 </View>
                 <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <Text style={{ backgroundColor: colors.surfaceContainerHigh, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 9999, fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, color: colors.onSurface, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, overflow: 'hidden' }}>{pending.length} REQ</Text>
                    <TouchableOpacity style={{ backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, minHeight: 34, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push(reviewHref as never)}>
                       <Text style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: '600', color: colors.onPrimary }}>Review Queue</Text>
                    </TouchableOpacity>
                 </View>
              </View>
            </View>
          </ContentCard>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 2 }} />

          <View style={{ flexDirection: 'column', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginTop: 6, marginBottom: 3, gap: 4 }}>
              <MaterialIcons name="bolt" size={16} color={colors.onSurface} />
              <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', color: colors.onSurface, letterSpacing: 0.8 }}>HR Quick Actions</Text>
            </View>
            {[
              { label: "Leave approval / review", route: reviewHref, icon: "assignment-turned-in" as const },
              { label: "Leave types", route: "/leave/types", icon: "category" as const },
              { label: "Holiday management", route: "/org-settings", icon: "event" as const },
              { label: "Attendance corrections", route: "/attendance-corrections", icon: "rule" as const },
              { label: "People directory", route: "/people", icon: "groups" as const },
              { label: "Organisation settings", route: "/org-settings", icon: "tune" as const },
            ].map((action) => (
              <TouchableOpacity key={action.label} onPress={() => router.push(action.route as never)} activeOpacity={0.75}>
                <ContentCard>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <MaterialIcons name={action.icon} size={18} color={colors.onSurface} />
                      <Text style={{ fontFamily: "Inter", fontSize: 15, fontWeight: "600", color: colors.onSurface }}>{action.label}</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={16} color={colors.secondary} />
                  </View>
                </ContentCard>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <BottomNavBar activeRoute="home" />
      </SafeAreaView>
    </ScreenGradient>
  );
}
