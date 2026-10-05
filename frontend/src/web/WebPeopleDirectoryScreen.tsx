import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity } from "react-native";
import { getSession } from "../../services/auth";
import {
  apiErrorMessage,
  displayName,
  getMe,
  getOrgSettings,
  listDepartments,
  listEmployees,
  patchOrgSettings,
  type Department,
  type EmployeePublic,
} from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { UserAvatar } from "../components/ui/UserAvatar";
import { ThemedDialog, ThemedToast } from "../components/ui/AppChrome";
import { matchesPeopleQuery } from "../utils/workforce";

export default function WebPeopleDirectoryScreen() {
  const [items, setItems] = useState<EmployeePublic[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [selected, setSelected] = useState<EmployeePublic | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [approverId, setApproverId] = useState<number | null>(null);
  const [teamLeadIds, setTeamLeadIds] = useState<number[]>([]);
  const [teamApprovers, setTeamApprovers] = useState<{ departmentId: number; employeeId: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getSession();
        const profile = await getMe().catch(() => null);
        const [people, depts, settings] = await Promise.all([
          listEmployees(),
          listDepartments().catch(() => ({ items: [] as Department[] })),
          getOrgSettings().catch(() => null),
        ]);
        if (!cancelled) {
          setMe(profile);
          setItems(people.items);
          setDepartments(depts.items);
          setApproverId(settings?.leaveApproverEmployeeId ?? null);
          setTeamLeadIds(settings?.teamLeadEmployeeIds ?? []);
          setTeamApprovers(settings?.teamApprovers ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load directory.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const deptName = (id: number) => departments.find((row) => row.departmentId === id)?.departmentName ?? `Department ${id}`;
  const canAssign = me?.role === "admin";

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function designateTeamLead(lead: EmployeePublic) {
    if (!canAssign) {
      setToast("Guest Admin cannot change reporting relationships.");
      return;
    }
    setSaving(true);
    try {
      const nextIds = teamLeadIds.includes(lead.employeeId) ? teamLeadIds : [...teamLeadIds, lead.employeeId];
      const settings = await patchOrgSettings({ teamLeadEmployeeIds: nextIds });
      setTeamLeadIds(settings.teamLeadEmployeeIds ?? nextIds);
      setToast(`${displayName(lead)} is now Team Lead for ${deptName(lead.departmentId)}.`);
    } catch (err) {
      setToast(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeTeamLead(lead: EmployeePublic) {
    if (!canAssign) {
      setToast("Guest Admin cannot change reporting relationships.");
      return;
    }
    setSaving(true);
    try {
      const nextIds = teamLeadIds.filter((id) => id !== lead.employeeId);
      const settings = await patchOrgSettings({ teamLeadEmployeeIds: nextIds });
      setTeamLeadIds(settings.teamLeadEmployeeIds ?? nextIds);
      setSelected(null);
      setToast(`${displayName(lead)} is no longer Team Lead.`);
    } catch (err) {
      setToast(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function designateApprover(person: EmployeePublic) {
    if (!canAssign) {
      setToast("Guest Admin cannot change reporting relationships.");
      return;
    }
    const current = teamApprovers.find((row) => row.departmentId === person.departmentId && row.employeeId !== person.employeeId);
    if (current) {
      setToast("This team already has an Approver. Remove that Approver before assigning another.");
      return;
    }
    setSaving(true);
    try {
      const next = [
        ...teamApprovers.filter((row) => row.departmentId !== person.departmentId),
        { departmentId: person.departmentId, employeeId: person.employeeId },
      ];
      const settings = await patchOrgSettings({ teamApprovers: next });
      setTeamApprovers(settings.teamApprovers ?? next);
      setToast(`${displayName(person)} is now the Approver for ${deptName(person.departmentId)}.`);
    } catch (err) {
      setToast(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeApprover(person: EmployeePublic) {
    if (!canAssign) {
      setToast("Guest Admin cannot change reporting relationships.");
      return;
    }
    setSaving(true);
    try {
      const next = teamApprovers.filter((row) => row.employeeId !== person.employeeId);
      const settings = await patchOrgSettings({ teamApprovers: next });
      setTeamApprovers(settings.teamApprovers ?? next);
      setToast(`${displayName(person)} is no longer the Approver.`);
    } catch (err) {
      setToast(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const { hrPeople, groups } = useMemo(() => {
    const filtered = items.filter((row) => matchesPeopleQuery(row, query, deptName(row.departmentId)));
    const hr = filtered.filter((row) => row.role === "admin");
    const byDept = new Map<string, EmployeePublic[]>();
    for (const row of filtered) {
      if (row.role === "admin") continue;
      const name = deptName(row.departmentId);
      const list = byDept.get(name) ?? [];
      list.push(row);
      byDept.set(name, list);
    }
    return { hrPeople: hr, groups: [...byDept.entries()].sort(([a], [b]) => a.localeCompare(b)) };
  }, [departments, items, query]);

  return (
    <WebShell title="People" variant="admin" activeRoute="people">
      <TextInput
        style={styles.search}
        placeholder="Search name, email, role, or team"
        value={query}
        onChangeText={setQuery}
        placeholderTextColor={colors.secondary}
      />
      <Text style={styles.meta}>
        {items.length} people · {departments.length || "—"} teams
      </Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.meta}>{error}</Text> : null}
      {hrPeople.length > 0 ? (
        <WebCard>
          <Text style={styles.group}>HR · {hrPeople.length}</Text>
          <View style={styles.grid}>
            {hrPeople.map((row) => (
              <TouchableOpacity key={row.employeeId} style={styles.personCard} activeOpacity={0.8} onPress={() => setSelected(row)}>
                <UserAvatar employee={row} size={40} />
                <Text style={styles.name}>{displayName(row)}</Text>
                <Text style={styles.meta}>{row.email}</Text>
                <Text style={styles.td}>EMP-{row.employeeId} · {row.role.replaceAll("_", " ")}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </WebCard>
      ) : null}
      {groups.map(([department, people]) => (
        <WebCard key={department}>
          <Text style={styles.group}>{department} · {people.length}</Text>
          <View style={styles.grid}>
            {people.map((row) => (
              <TouchableOpacity key={row.employeeId} style={styles.personCard} activeOpacity={0.8} onPress={() => setSelected(row)}>
                <UserAvatar employee={row} size={40} />
                <Text style={styles.name}>{displayName(row)}</Text>
                {teamLeadIds.includes(row.employeeId) ? <Text style={styles.lead}>Team Lead</Text> : null}
                {teamApprovers.some((entry) => entry.employeeId === row.employeeId) ? <Text style={styles.lead}>Approver</Text> : null}
                <Text style={styles.meta}>{row.email}</Text>
                <Text style={styles.td}>EMP-{row.employeeId} · {row.role.replaceAll("_", " ")}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </WebCard>
      ))}
      {!loading && groups.length === 0 && hrPeople.length === 0 ? <Text style={styles.meta}>No people match this search.</Text> : null}
      <ThemedDialog
        visible={selected != null}
        title={selected ? displayName(selected) : ""}
        onRequestClose={() => setSelected(null)}
        actions={
          selected
            ? [
                { label: "Close", onPress: () => setSelected(null) },
                ...(canAssign
                  ? [
                      teamLeadIds.includes(selected.employeeId)
                        ? { label: saving ? "Saving…" : "Remove Team Lead", onPress: () => void removeTeamLead(selected), primary: true }
                        : { label: saving ? "Saving…" : "Team Lead", onPress: () => void designateTeamLead(selected), primary: true },
                      teamApprovers.some((entry) => entry.departmentId === selected.departmentId && entry.employeeId === selected.employeeId)
                        ? { label: saving ? "Saving…" : "Remove Approver", onPress: () => void removeApprover(selected) }
                        : { label: saving ? "Saving…" : "Approver", onPress: () => void designateApprover(selected) },
                    ]
                  : []),
              ]
            : []
        }
      >
        {selected ? (
          <View style={{ gap: 6 }}>
            {teamLeadIds.includes(selected.employeeId) ? <Text style={styles.lead}>Team Lead</Text> : null}
            {teamApprovers.some((entry) => entry.employeeId === selected.employeeId) ? <Text style={styles.lead}>Approver</Text> : null}
            <Text style={styles.meta}>{selected.email}</Text>
            <Text style={styles.meta}>{deptName(selected.departmentId)}</Text>
            <Text style={styles.td}>{selected.role.replaceAll("_", " ")} · EMP-{selected.employeeId}</Text>
            <Text style={styles.td}>
              Approver: {(() => {
                const entry = teamApprovers.find((row) => row.departmentId === selected.departmentId);
                const approver = entry ? items.find((row) => row.employeeId === entry.employeeId) : null;
                return approver ? displayName(approver) : "Not assigned";
              })()}
            </Text>
          </View>
        ) : null}
      </ThemedDialog>
      <ThemedToast message={toast} />
    </WebShell>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, minHeight: 44, color: colors.onSurface },
  meta: { fontSize: 12, color: colors.secondary },
  group: { fontSize: 12, fontWeight: "700", color: colors.secondary, textTransform: "uppercase", marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  personCard: {
    flexGrow: 1,
    flexBasis: 180,
    maxWidth: 280,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 12,
    gap: 6,
  },
  name: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  lead: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  td: { fontSize: 13, color: colors.onSurface },
});
