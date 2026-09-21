import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import {
  apiErrorMessage,
  createLeaveType,
  deleteLeaveType,
  getMe,
  listLeaveTypes,
  patchLeaveType,
  type LeaveType,
} from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

export default function WebLeaveTypesScreen() {
  const [items, setItems] = useState<LeaveType[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [medical, setMedical] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getMe();
      setCanEdit(me.role === "admin");
      setItems((await listLeaveTypes(true)).items);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <WebShell title="Leave Types" variant="admin" activeRoute="more" showBack>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {items.map((row) => (
        <WebCard key={row.leaveTypeId}>
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
                    .catch((err) => setError(apiErrorMessage(err)))
                }
              >
                <Text style={styles.link}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </WebCard>
      ))}
      {canEdit ? (
        <WebCard>
          <Text style={styles.name}>Add leave type</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.secondary} />
          <TouchableOpacity onPress={() => setMedical((value) => !value)}>
            <Text style={styles.meta}>{medical ? "☑" : "☐"} Requires medical document</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.save}
            onPress={() => {
              if (!name.trim()) {
                setError("Enter a leave type name.");
                return;
              }
              void createLeaveType({ name: name.trim(), requiresMedicalDocument: medical })
                .then(() => {
                  setName("");
                  setMedical(false);
                  return load();
                })
                .catch((err) => setError(apiErrorMessage(err)));
            }}
          >
            <Text style={styles.saveText}>Create type</Text>
          </TouchableOpacity>
        </WebCard>
      ) : (
        <Text style={styles.meta}>Guest Admin can view leave types only.</Text>
      )}
    </WebShell>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 4 },
  row: { flexDirection: "row", gap: 16, marginTop: 8 },
  link: { fontWeight: "700", color: colors.primary },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, marginTop: 8, color: colors.onSurface, backgroundColor: "#fff" },
  save: { marginTop: 12, backgroundColor: colors.primary, borderRadius: 8, padding: 12, alignItems: "center" },
  saveText: { color: colors.onPrimary, fontWeight: "700" },
  err: { color: colors.error },
});
