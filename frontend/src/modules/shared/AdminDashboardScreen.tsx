import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getSession } from "../../../services/auth";
import {
  displayName,
  getMe,
  listEmployees,
  listLeaves,
  type EmployeePublic,
  type LeaveApplication,
} from "../../../services/resources";
import { TopNavBar, HROperationsCard, ContentCard, StatsCard, BottomNavBar } from "../../components/ui/AdminComponents";
import { UIFallbackIndicator } from "../../components/ui/UIFallback";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const reviewHref = (process.env.EXPO_PUBLIC_ADMIN_LEAVE_REVIEW as string | undefined) || "/leave/admin-review";
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [pending, setPending] = useState<LeaveApplication[]>([]);
  const [approved, setApproved] = useState<LeaveApplication[]>([]);
  const [query, setQuery] = useState("");
  const [employeeTotal, setEmployeeTotal] = useState<number | null>(null);

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
          const [pendingLeaves, approvedLeaves] = await Promise.all([
            listLeaves("PENDING_HR_REVIEW"),
            listLeaves("APPROVED"),
          ]);
          if (!cancelled) {
            setPending(pendingLeaves.items);
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

  const filteredEmployees = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((row) =>
      `${row.firstName} ${row.lastName ?? ""} ${row.email}`.toLowerCase().includes(term),
    );
  }, [employees, query]);

  const today = new Date().toISOString().slice(0, 10);
  const onLeaveToday = approved.filter((row) => row.startDate <= today && row.endDate >= today).length;

  return (
    <LinearGradient
      colors={['rgba(0, 168, 153, 0.45)', 'rgba(240, 248, 252, 0.75)', 'rgba(38, 169, 225, 0.48)']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <TopNavBar />
        
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 16, paddingBottom: 100, gap: 16 }}>
          <HROperationsCard 
            name={me ? displayName(me).toUpperCase() : "PREETI KAUR"}
            role={me?.role ?? "Human Resource"}
            day={new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            date={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          />

          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', marginVertical: 3 }} />

          <ContentCard style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="search" size={20} color="#585f6c" />
            <TextInput 
              style={{ flex: 1, fontFamily: 'Inter', fontSize: 12, color: '#1c1b1b' }}
              placeholder="Search employees, records, or departments..."
              placeholderTextColor="#585f6c"
              value={query}
              onChangeText={setQuery}
            />
          </ContentCard>

          <ContentCard style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '600', color: '#585f6c', textTransform: 'uppercase', letterSpacing: 0.6 }}>Live Workforce</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <Text style={{ fontFamily: 'Inter', fontSize: 30, fontWeight: '600', color: '#1c1b1b' }}>{employeeTotal ?? "67"}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: '500', color: '#585f6c' }}>Active Entities (IN)</Text>
                  {employeeTotal === null && <UIFallbackIndicator />}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#1c1b1b' }}>86.3%</Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: '#000', textTransform: 'uppercase' }}>Net Present</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              <View style={{ width: '48%' }}>
                <StatsCard title="Present" iconName="how-to-reg" iconColor="#1c1b1b" count="62" subtitle="86.3%" borderColor="rgb(0, 168, 153)" />
              </View>
              <View style={{ width: '48%' }}>
                <StatsCard title="On Leave" iconName="event-busy" iconColor="#1c1b1b" count={onLeaveToday > 0 ? onLeaveToday.toString() : "6"} subtitle="Approved" borderColor="rgb(38, 169, 225)" />
                {onLeaveToday === 0 && <UIFallbackIndicator style={{ position: 'absolute', top: 8, right: 8 }} />}
              </View>
              <View style={{ width: '48%' }}>
                <StatsCard title="Absent" iconName="person-off" iconColor="#ba1a1a" countColor="#ba1a1a" count="6" subtitle=" " borderColor="rgb(239, 68, 68)" />
              </View>
              <View style={{ width: '48%' }}>
                <StatsCard title="Unmarked" iconName="pending" iconColor="#585f6c" count="2" subtitle="No Punch" borderColor="rgb(107, 114, 128)" />
              </View>
            </View>

            <View style={{ backgroundColor: 'rgb(222, 223, 227)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.4)', borderRadius: 12, marginTop: 4, padding: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8 }}>
                 <View style={{ flexDirection: 'column' }}>
                    <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#1c1b1b' }}>Pending Leave Reviews</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '600', color: '#585f6c', textTransform: 'uppercase' }}>{pending.length} Requests</Text>
                    </View>
                 </View>
                 <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <Text style={{ backgroundColor: 'rgba(0,0,0,0.08)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)', borderRadius: 9999, fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, color: '#1c1b1b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, overflow: 'hidden' }}>{pending.length} REQ</Text>
                    <TouchableOpacity style={{ backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, minHeight: 32, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push(reviewHref as never)}>
                       <Text style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: '600', color: '#fff' }}>Review Queue</Text>
                    </TouchableOpacity>
                 </View>
              </View>
            </View>
          </ContentCard>

          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', marginVertical: 2 }} />

          <View style={{ flexDirection: 'column', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginTop: 6, marginBottom: 3, gap: 4 }}>
              <MaterialIcons name="bolt" size={16} color="#1c1b1b" />
              <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', color: '#1c1b1b', letterSpacing: 0.6 }}>Requires HR Action</Text>
            </View>

            {pending.slice(0, 5).map(leave => {
              const employee = employees.find((row) => row.employeeId === leave.employeeId);
              return (
                <ContentCard key={leave.leaveId}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'column' }}>
                      <Text style={{ fontFamily: 'Inter', fontSize: 16, fontWeight: '500', color: '#1c1b1b' }}>{employee ? displayName(employee) : `EMP-${leave.employeeId}`}</Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#585f6c', marginTop: 2 }}>{leave.status} • {leave.numberOfDays} Days ({leave.startDate} - {leave.endDate})</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#f6f3f2', padding: 8, borderRadius: 4, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#585f6c' }}>Awaiting Review</Text>
                    <TouchableOpacity onPress={() => router.push(reviewHref as never)}>
                      <MaterialIcons name="arrow-forward" size={16} color="#585f6c" />
                    </TouchableOpacity>
                  </View>
                </ContentCard>
              );
            })}
            
            {filteredEmployees.slice(0, 3).map((row) => (
              <ContentCard key={`emp-${row.employeeId}`}>
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{ fontFamily: 'Inter', fontSize: 16, fontWeight: '500', color: '#1c1b1b' }}>{displayName(row)}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#585f6c', marginTop: 2 }}>{row.email} · {row.role}</Text>
                </View>
              </ContentCard>
            ))}
          </View>
        </ScrollView>
        <BottomNavBar activeRoute="home" />
      </SafeAreaView>
    </LinearGradient>
  );
}
