import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const colors = {
  surface: "#fcf9f8",
  primary: "#000000",
  onPrimary: "#ffffff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f6f3f2",
  surfaceContainer: "#f0edec",
  surfaceContainerHigh: "#ebe7e7",
  surfaceContainerHighest: "#e5e2e1",
  secondary: "#585f6c",
  error: "#ba1a1a",
  border: "#cfc4c5",
  onSurface: "#1c1b1b",
  onSurfaceVariant: "#4c4546",
  secondaryFixedDim: "#c0c7d6",
};

export default function ApplyLeaveScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply Leave Request</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="more-vert" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <View style={styles.profileAvatar}>
            <MaterialIcons name="person" size={18} color={colors.onPrimary} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Micro Policy Guidance Banner */}
        <View style={styles.policyBanner}>
          <MaterialIcons name="verified-user" size={18} color={colors.secondary} style={styles.policyIcon} />
          <Text style={styles.policyText}>Advance booking limit: Max ~2 week forward notice compliant.</Text>
        </View>

        {/* Employee Context Header */}
        <View style={styles.empCard}>
          <View style={styles.empCardRow}>
            <View style={styles.empInfoLeft}>
              <View style={styles.empInitialsBox}>
                <Text style={styles.empInitials}>AC</Text>
              </View>
              <View>
                <Text style={styles.empName}>Anand Chadda</Text>
                <Text style={styles.empRole}>Engineering & DevOps</Text>
              </View>
            </View>
            <View style={styles.approverBox}>
              <Text style={styles.approverLabel}>APPROVER</Text>
              <Text style={styles.approverName}>Marcus Vance</Text>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leave Type</Text>
            <Text style={styles.requiredLabel}>REQUIRED</Text>
          </View>

          <View style={styles.leaveTypeGrid}>
            <TouchableOpacity style={styles.leaveTypeItemActive}>
              <View style={styles.leaveTypeIconRow}>
                <MaterialIcons name="medical-services" size={18} color={colors.onPrimary} />
                <MaterialIcons name="check-circle" size={16} color={colors.onPrimary} />
              </View>
              <Text style={styles.leaveTypeTextActive}>Medical / Sick</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.leaveTypeItem}>
              <View style={styles.leaveTypeIconRow}>
                <MaterialIcons name="event-available" size={18} color={colors.secondary} />
                <View style={styles.radioDot} />
              </View>
              <Text style={styles.leaveTypeText}>Casual Leave</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.leaveTypeItem}>
              <View style={styles.leaveTypeIconRow}>
                <MaterialIcons name="beach-access" size={18} color={colors.secondary} />
                <View style={styles.radioDot} />
              </View>
              <Text style={styles.leaveTypeText}>Planned Leave</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.leaveTypeItem}>
              <View style={styles.leaveTypeIconRow}>
                <MaterialIcons name="money-off" size={18} color={colors.secondary} />
                <View style={styles.radioDot} />
              </View>
              <Text style={styles.leaveTypeText}>Emergency Leave</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarTitleRow}>
              <MaterialIcons name="date-range" size={20} color={colors.primary} />
              <View>
                <Text style={styles.calendarTitle}>Leave Schedule & Calendar</Text>
                <Text style={styles.calendarSubtitle}>Today: Monday, Oct 19, 2026</Text>
              </View>
            </View>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>OCT 2026</Text>
            </View>
          </View>

          <View style={styles.calendarBox}>
            <View style={styles.calendarNav}>
              <Text style={styles.calendarMonthText}>October 2026</Text>
              <View style={styles.calendarNavBtns}>
                <MaterialIcons name="chevron-left" size={18} color={colors.secondary} />
                <MaterialIcons name="chevron-right" size={18} color={colors.secondary} />
              </View>
            </View>
            <View style={styles.calendarDaysRow}>
              {['M','T','W','T','F','S','S'].map((day, i) => (
                <Text key={i} style={[styles.calendarDayHeader, (i===5||i===6) && styles.calendarDayHeaderWeekend]}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              <Text style={styles.calTextOff}>28</Text><Text style={styles.calTextOff}>29</Text><Text style={styles.calTextOff}>30</Text><Text style={styles.calText}>1</Text><Text style={styles.calText}>2</Text><Text style={styles.calTextWeekend}>3</Text><Text style={styles.calTextWeekend}>4</Text>
              <Text style={styles.calText}>5</Text><Text style={styles.calText}>6</Text><Text style={styles.calText}>7</Text><Text style={styles.calText}>8</Text><Text style={styles.calText}>9</Text><Text style={styles.calTextWeekend}>10</Text><Text style={styles.calTextWeekend}>11</Text>
              <Text style={styles.calText}>12</Text><Text style={styles.calText}>13</Text><Text style={styles.calText}>14</Text><Text style={styles.calText}>15</Text><Text style={styles.calText}>16</Text><Text style={styles.calTextWeekend}>17</Text><Text style={styles.calTextWeekend}>18</Text>
              <View style={styles.calTextToday}><Text style={styles.calTextTodayStr}>19</Text></View><Text style={styles.calText}>20</Text><Text style={styles.calText}>21</Text><Text style={styles.calText}>22</Text><Text style={styles.calText}>23</Text><Text style={styles.calTextWeekend}>24</Text><Text style={styles.calTextWeekend}>25</Text>
              <View style={styles.calTextSelLeft}><Text style={styles.calTextSelStr}>26</Text></View><View style={styles.calTextSelMid}><Text style={styles.calTextSelStr}>27</Text></View><View style={styles.calTextSelMid}><Text style={styles.calTextSelStr}>28</Text></View><View style={styles.calTextSelRight}><Text style={styles.calTextSelStr}>29</Text></View><Text style={styles.calText}>30</Text><Text style={styles.calTextWeekend}>31</Text><Text style={styles.calTextOff}>1</Text>
            </View>
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: colors.primary}]} />
                <Text style={styles.legendText}>Full Day Leave</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: colors.secondaryFixedDim, borderColor: colors.secondary, borderWidth: 1}]} />
                <Text style={styles.legendText}>Half Day Leave</Text>
              </View>
            </View>
          </View>

          <View style={styles.dateRangeBox}>
            <View style={styles.dateRangeItem}>
              <Text style={styles.dateRangeLabel}>FROM (INCLUSIVE)</Text>
              <View style={styles.dateRangeValRow}>
                <MaterialIcons name="calendar-today" size={18} color={colors.secondary} />
                <Text style={styles.dateRangeVal}>Oct 26, 2026</Text>
              </View>
              <Text style={styles.dateRangeDay}>Monday</Text>
            </View>
            <View style={styles.dateRangeItem}>
              <Text style={styles.dateRangeLabel}>TO (INCLUSIVE)</Text>
              <View style={styles.dateRangeValRow}>
                <MaterialIcons name="event" size={18} color={colors.secondary} />
                <Text style={styles.dateRangeVal}>Oct 29, 2026</Text>
              </View>
              <Text style={styles.dateRangeDay}>Thursday</Text>
            </View>
          </View>

          <View style={styles.durationResult}>
            <View>
              <Text style={styles.durationTitle}>3 Working Days</Text>
              <Text style={styles.durationSubtitle}>Mon Oct 26 – Thu Oct 29</Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationBadgeText}>3.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>Absence Justification</Text>
          <TextInput
            style={styles.reasonInput}
            multiline
            numberOfLines={3}
            value="Post-operative surgical recovery following outpatient procedure. Doctor advised strict rest."
            editable={false}
          />
          <Text style={styles.charCount}>84 / 500</Text>
        </View>

        <View style={styles.uploadCard}>
          <View style={styles.uploadHeader}>
            <View style={styles.uploadTitleRow}>
              <MaterialIcons name="attachment" size={18} color={colors.primary} />
              <Text style={styles.uploadTitle}>Medical Document Upload</Text>
            </View>
            <Text style={styles.uploadSubtitle}>Medical Certificate Required (Absences {'>'} 2 days)</Text>
          </View>
          <View style={styles.fileCard}>
            <View style={styles.fileInfo}>
              <View style={styles.fileIconBox}>
                <MaterialIcons name="picture-as-pdf" size={20} color={colors.onPrimary} />
              </View>
              <View>
                <Text style={styles.fileName}>medical_cert_oct26.pdf</Text>
                <Text style={styles.fileSize}>1.4 MB •</Text>
              </View>
            </View>
          </View>
          <Text style={styles.uploadFormats}>Accepted Formats: PDF, JPG, PNG (Max 15MB)</Text>
        </View>

        <View style={styles.attestCard}>
          <View style={styles.attestHeaderRow}>
            <Text style={styles.attestTitle}>Operational Notification</Text>
            <View style={styles.attestBadge}>
              <Text style={styles.attestBadgeText}>MANAGER_PROOF_REQUIRED</Text>
            </View>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkbox}>
              <MaterialIcons name="check" size={16} color={colors.onPrimary} />
            </View>
            <Text style={styles.checkboxText}>
              I certify that I have notified my reporting manager (<Text style={styles.checkboxTextBold}>Manisha Verma</Text>) in advance or via formal channel regarding this surgical absence.
            </Text>
          </View>
        </View>

        <View style={styles.submitActions}>
          <TouchableOpacity style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Submit Leave Application</Text>
            <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.draftBtn}>
            <Text style={styles.draftBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 56, backgroundColor: 'rgba(252, 249, 248, 0.9)',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceContainer,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 64, gap: 12 },
  policyBanner: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, backgroundColor: colors.surfaceContainerLow, borderRadius: 12, gap: 8, marginTop: 12 },
  policyIcon: { marginTop: 2 },
  policyText: { fontSize: 12, color: colors.onSurfaceVariant, flex: 1, lineHeight: 16 },
  empCard: { padding: 16, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12 },
  empCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  empInitialsBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  empInitials: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  empName: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  empRole: { fontSize: 12, color: colors.secondary },
  approverBox: { alignItems: 'flex-end', paddingLeft: 8 },
  approverLabel: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  approverName: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  formSection: { marginTop: 16, gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  requiredLabel: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  leaveTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  leaveTypeItemActive: { width: '48%', backgroundColor: colors.primary, padding: 12, borderRadius: 8 },
  leaveTypeItem: { width: '48%', backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: 8 },
  leaveTypeIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaveTypeTextActive: { fontSize: 14, fontWeight: '500', color: colors.onPrimary, marginTop: 8 },
  leaveTypeText: { fontSize: 14, fontWeight: '500', color: colors.onSurface, marginTop: 8 },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.surfaceContainerHigh },
  calendarCard: { backgroundColor: colors.surfaceContainerLowest, padding: 16, borderRadius: 12, gap: 16 },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.surfaceContainer, paddingBottom: 8 },
  calendarTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calendarTitle: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  calendarSubtitle: { fontSize: 12, color: colors.secondary },
  monthBadge: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  monthBadgeText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  calendarBox: { backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 12, gap: 12 },
  calendarNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  calendarMonthText: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  calendarNavBtns: { flexDirection: 'row', gap: 4 },
  calendarDaysRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 },
  calendarDayHeader: { width: '14%', textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.secondary },
  calendarDayHeaderWeekend: { color: colors.onSurfaceVariant },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calTextOff: { width: '14%', textAlign: 'center', paddingVertical: 8, fontSize: 12, color: 'rgba(88, 95, 108, 0.4)' },
  calText: { width: '14%', textAlign: 'center', paddingVertical: 8, fontSize: 12, color: colors.onSurface },
  calTextWeekend: { width: '14%', textAlign: 'center', paddingVertical: 8, fontSize: 12, color: 'rgba(88, 95, 108, 0.7)', backgroundColor: 'rgba(235, 231, 231, 0.4)' },
  calTextToday: { width: '14%', alignItems: 'center', justifyContent: 'center' },
  calTextTodayStr: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.primary, textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: 'bold', color: colors.primary, backgroundColor: colors.surfaceContainerLowest },
  calTextSelLeft: { width: '14%', backgroundColor: colors.primary, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calTextSelMid: { width: '14%', backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  calTextSelRight: { width: '14%', backgroundColor: colors.primary, borderTopRightRadius: 16, borderBottomRightRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calTextSelStr: { color: colors.onPrimary, fontSize: 12, fontWeight: '500', paddingVertical: 8 },
  calendarLegend: { flexDirection: 'row', gap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.surfaceContainer, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: colors.onSurface },
  dateRangeBox: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  dateRangeItem: { width: '48%', backgroundColor: colors.surfaceContainerLow, padding: 8, borderRadius: 8, gap: 4, borderWidth: 1, borderColor: colors.surfaceContainer },
  dateRangeLabel: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  dateRangeValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateRangeVal: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  dateRangeDay: { fontSize: 12, color: colors.secondary },
  durationResult: { backgroundColor: 'rgba(235, 231, 231, 0.6)', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  durationTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  durationSubtitle: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  durationBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  durationBadgeText: { fontSize: 16, fontWeight: '600', color: colors.onPrimary },
  reasonCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 8 },
  reasonTitle: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  reasonInput: { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface, fontSize: 14, borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  uploadCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 12 },
  uploadHeader: { gap: 4 },
  uploadTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  uploadTitle: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  uploadSubtitle: { fontSize: 12, color: colors.secondary },
  fileCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileIconBox: { width: 40, height: 40, borderRadius: 4, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileName: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  fileSize: { fontSize: 12, color: colors.secondary },
  uploadFormats: { fontSize: 12, color: colors.secondary, paddingHorizontal: 4 },
  attestCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 12 },
  attestHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attestTitle: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  attestBadge: { backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  attestBadgeText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 4, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxText: { flex: 1, fontSize: 12, color: colors.onSurface, lineHeight: 18 },
  checkboxTextBold: { fontWeight: '500' },
  submitActions: { marginTop: 8, gap: 8 },
  submitBtn: { width: '100%', height: 48, backgroundColor: colors.primary, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { fontSize: 14, fontWeight: '500', color: colors.onPrimary },
  draftBtn: { width: '100%', height: 48, backgroundColor: colors.surfaceContainerLowest, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  draftBtnText: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
});
