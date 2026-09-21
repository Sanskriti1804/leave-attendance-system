import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator } from "react-native";
import {
  apiErrorMessage,
  createLeaveType,
  deleteLeaveType,
  getMe,
  listLeaveTypes,
  patchLeaveType,
  type LeaveType,
} from "../../../services/resources";
import { colors } from "../../theme";
import { ScreenGradient, ThemedDialog } from "../../components/ui/AppChrome";
import { BottomNavBar, TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";

export default function LeaveTypesScreen() {
  const topInset = useTopNavContentInset();
  const [items, setItems] = useState<LeaveType[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [medical, setMedical] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMe();
      setCanEdit(me.role === "admin");
      const listed = await listLeaveTypes(true);
      setItems(listed.items);
    } catch (err) {
      setDialog({ title: "Unable to load leave types", message: apiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title="Leave Types" showBack />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topInset }]}>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {items.map((row) => (
            <View key={row.leaveTypeId} style={styles.card}>
              <Text style={styles.name}>{row.name}</Text>
              <Text style={styles.meta}>
                {row.requiresMedicalDocument ? "Medical document" : "No medical document"} · {row.obsolete ? "Inactive" : "Active"}
              </Text>
              {canEdit ? (
                <View style={styles.row}>
                  <TouchableOpacity onPress={() => void patchLeaveType(row.leaveTypeId, { obsolete: !row.obsolete }).then(() => load())}>
                    <Text style={styles.link}>{row.obsolete ? "Activate" : "Deactivate"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      void deleteLeaveType(row.leaveTypeId)
                        .then(() => load())
                        .catch((err) => setDialog({ title: "Could not delete", message: apiErrorMessage(err) }))
                    }
                  >
                    <Text style={styles.link}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))}
          {canEdit ? (
            <View style={styles.card}>
              <Text style={styles.name}>Add leave type</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.secondary} />
              <TouchableOpacity onPress={() => setMedical((value) => !value)}>
                <Text style={styles.meta}>{medical ? "☑" : "☐"} Requires medical document</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.save}
                onPress={() => {
                  if (!name.trim()) {
                    setDialog({ title: "Name required", message: "Enter a leave type name." });
                    return;
                  }
                  void createLeaveType({ name: name.trim(), requiresMedicalDocument: medical })
                    .then(() => {
                      setName("");
                      setMedical(false);
                      return load();
                    })
                    .catch((err) => setDialog({ title: "Could not create", message: apiErrorMessage(err) }));
                }}
              >
                <Text style={styles.saveText}>Create type</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.meta}>Guest Admin can view leave types only.</Text>
          )}
        </ScrollView>
        <BottomNavBar activeRoute="more" />
        <ThemedDialog
          visible={dialog != null}
          title={dialog?.title ?? ""}
          message={dialog?.message}
          onRequestClose={() => setDialog(null)}
          actions={[{ label: "OK", onPress: () => setDialog(null), primary: true }]}
        />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, padding: 18, gap: 8 },
  name: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  meta: { fontSize: 12, color: colors.secondary },
  row: { flexDirection: "row", gap: 16 },
  link: { fontSize: 13, fontWeight: "700", color: colors.primary },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, paddingHorizontal: 12, color: colors.onSurface, backgroundColor: colors.surfaceContainerLow },
  save: { backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: "center" },
  saveText: { color: colors.onPrimary, fontWeight: "700" },
});
