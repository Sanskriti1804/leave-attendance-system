import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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
};

export default function MyLeaveListScreen() {
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leave Management</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="tune" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <View style={styles.profileAvatar}>
            <MaterialIcons name="person" size={18} color={colors.onPrimary} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        <View style={styles.topRow}>
          <View>
            <Text style={styles.topLabel}>LEAVE RECORDS</Text>
            <Text style={styles.empName}>Priya Khanna</Text>
          </View>
          <TouchableOpacity style={styles.applyBtn}>
            <MaterialIcons name="add" size={18} color={colors.onPrimary} />
            <Text style={styles.applyBtnText}>Apply Leave</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContainer}>
          <TouchableOpacity style={activeFilter === 'all' ? styles.filterChipActive : styles.filterChip} onPress={() => setActiveFilter('all')}>
            <Text style={activeFilter === 'all' ? styles.filterChipTextActive : styles.filterChipText}>All</Text>
            <View style={activeFilter === 'all' ? styles.filterBadgeActive : styles.filterBadge}>
              <Text style={styles.filterBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={activeFilter === 'pending' ? styles.filterChipActive : styles.filterChip} onPress={() => setActiveFilter('pending')}>
            <Text style={activeFilter === 'pending' ? styles.filterChipTextActive : styles.filterChipText}>Pending</Text>
            <View style={activeFilter === 'pending' ? styles.filterBadgeActive : styles.filterBadge}>
              <Text style={styles.filterBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={activeFilter === 'approved' ? styles.filterChipActive : styles.filterChip} onPress={() => setActiveFilter('approved')}>
            <Text style={activeFilter === 'approved' ? styles.filterChipTextActive : styles.filterChipText}>Approved</Text>
            <View style={activeFilter === 'approved' ? styles.filterBadgeActive : styles.filterBadge}>
              <Text style={styles.filterBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={activeFilter === 'history' ? styles.filterChipActive : styles.filterChip} onPress={() => setActiveFilter('history')}>
            <Text style={activeFilter === 'history' ? styles.filterChipTextActive : styles.filterChipText}>Past / History</Text>
            <View style={activeFilter === 'history' ? styles.filterBadgeActive : styles.filterBadge}>
              <Text style={styles.filterBadgeText}>1</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.listContainer}>
          
          {/* Card 1: Pending */}
          {(activeFilter === 'all' || activeFilter === 'pending') && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>Medical Leave</Text>
                    <View style={styles.statusBadgePending}>
                      <MaterialIcons name="hourglass-top" size={12} color={colors.onSurface} />
                      <Text style={styles.statusBadgeTextPending}>Pending HR Review</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDate}>Oct 26, 2026 – Oct 29, 2026</Text>
                  <Text style={styles.cardDuration}>Duration: 3 Days (Full-time)</Text>
                </View>
                <View style={styles.cardIconBox}>
                  <MaterialIcons name="medical-services" size={18} color={colors.onSurface} />
                </View>
              </View>

              <View style={styles.cardReasonBox}>
                <View style={styles.reasonRow}>
                  <MaterialIcons name="assignment" size={16} color={colors.onSurface} />
                  <Text style={styles.reasonText}>Reason: Post-operative recovery • Medical Cert Attached</Text>
                </View>
                <View style={styles.fileRow}>
                  <MaterialIcons name="lock" size={14} color={colors.secondary} />
                  <Text style={styles.fileText}>Medical file included</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.footerTime}>
                  <MaterialIcons name="schedule" size={16} color={colors.secondary} />
                  <Text style={styles.footerTimeText}>Submitted 4 hours ago</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn}>
                  <MaterialIcons name="undo" size={16} color={colors.onSurface} />
                  <Text style={styles.actionBtnText}>Withdraw Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Card 2: Approved */}
          {(activeFilter === 'all' || activeFilter === 'approved') && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>Casual Leave</Text>
                    <View style={styles.statusBadgeApproved}>
                      <MaterialIcons name="check-circle" size={12} color={colors.onPrimary} />
                      <Text style={styles.statusBadgeTextApproved}>Approved</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDate}>Sep 14, 2026</Text>
                  <Text style={styles.cardDuration}>Duration: 1 Day • Half-day Second 4h</Text>
                </View>
                <View style={styles.cardIconBox}>
                  <MaterialIcons name="event-available" size={18} color={colors.onSurface} />
                </View>
              </View>

              <View style={styles.cardReasonBox}>
                <View style={styles.reasonRow}>
                  <MaterialIcons name="description" size={16} color={colors.onSurface} />
                  <Text style={styles.reasonText}>Reason: Family matter commitment</Text>
                </View>
                <View style={styles.fileRow}>
                  <MaterialIcons name="verified-user" size={16} color={colors.secondary} />
                  <Text style={styles.fileText}>Approved by HR and TL</Text>
                </View>
              </View>
            </View>
          )}

          {/* Card 3: Rejected */}
          {(activeFilter === 'all' || activeFilter === 'history') && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>Annual Leave</Text>
                    <View style={styles.statusBadgeRejected}>
                      <MaterialIcons name="cancel" size={12} color={colors.onSurface} />
                      <Text style={styles.statusBadgeTextRejected}>Rejected</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDate}>Aug 18, 2026 – Aug 20, 2026</Text>
                  <Text style={styles.cardDuration}>Duration: 3 Days (Full-time)</Text>
                </View>
                <View style={styles.cardIconBox}>
                  <MaterialIcons name="event-busy" size={18} color={colors.onSurface} />
                </View>
              </View>

              <View style={styles.cardCommentBox}>
                <View style={styles.commentHeader}>
                  <MaterialIcons name="chat-bubble" size={16} color={colors.onSurface} />
                  <Text style={styles.commentTitle}>HR CLARIFICATION COMMENT</Text>
                </View>
                <Text style={styles.commentDesc}>"HR Note: High sprint freeze period during release cycle. Please reschedule with manager."</Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.footerTime}>
                  <MaterialIcons name="history" size={16} color={colors.secondary} />
                  <Text style={styles.footerTimeText}>Logged on Aug 02, 2026</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>Resubmit New</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Card 4: Draft */}
          {(activeFilter === 'all' || activeFilter === 'pending') && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>Casual Leave</Text>
                    <View style={styles.statusBadgeDraft}>
                      <MaterialIcons name="edit-note" size={12} color={colors.onSurface} />
                      <Text style={styles.statusBadgeTextDraft}>Draft</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDate}>Nov 12, 2026</Text>
                  <Text style={styles.cardDuration}>Duration: 1 Day • Pending Submission</Text>
                </View>
                <View style={styles.cardIconBox}>
                  <MaterialIcons name="drafts" size={18} color={colors.onSurface} />
                </View>
              </View>

              <View style={styles.cardDraftBox}>
                <Text style={styles.draftText}>Draft saved locally 2 days ago</Text>
                <Text style={styles.draftBadge}>UNSENT</Text>
              </View>

              <View style={styles.cardFooterRight}>
                <TouchableOpacity style={styles.actionBtn}>
                  <MaterialIcons name="delete" size={16} color={colors.onSurface} />
                  <Text style={styles.actionBtnText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnPrimary}>
                  <MaterialIcons name="edit" size={16} color={colors.onPrimary} />
                  <Text style={styles.actionBtnPrimaryText}>Edit Draft</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { paddingBottom: 64, gap: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  topLabel: { fontSize: 11, fontWeight: '600', color: colors.secondary, letterSpacing: 0.5 },
  empName: { fontSize: 20, fontWeight: '600', color: colors.onSurface, marginTop: 4 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 16, height: 44, borderRadius: 8, gap: 8 },
  applyBtnText: { fontSize: 14, fontWeight: '500', color: colors.onPrimary },
  filtersScroll: { flexGrow: 0 },
  filtersContainer: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  filterChipActive: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, height: 36, paddingHorizontal: 12, borderRadius: 8, gap: 8 },
  filterChipTextActive: { fontSize: 12, fontWeight: '500', color: colors.onPrimary },
  filterBadgeActive: { backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, height: 36, paddingHorizontal: 12, borderRadius: 8, gap: 8 },
  filterChipText: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  filterBadge: { backgroundColor: colors.surfaceContainerHighest, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  filterBadgeText: { fontSize: 11, fontWeight: '600', color: colors.onSurface },
  listContainer: { paddingHorizontal: 16, gap: 12 },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  statusBadgePending: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeTextPending: { fontSize: 11, fontWeight: '600', color: colors.onSurface },
  statusBadgeApproved: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeTextApproved: { fontSize: 11, fontWeight: '600', color: colors.onPrimary },
  statusBadgeRejected: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerHighest, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeTextRejected: { fontSize: 11, fontWeight: '600', color: colors.onSurface },
  statusBadgeDraft: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeTextDraft: { fontSize: 11, fontWeight: '600', color: colors.onSurface },
  cardDate: { fontSize: 14, fontWeight: '500', color: colors.onSurface, marginTop: 4 },
  cardDuration: { fontSize: 12, color: colors.secondary },
  cardIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  cardReasonBox: { backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 8, gap: 8 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reasonText: { fontSize: 12, color: colors.onSurface, flex: 1 },
  fileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 4 },
  fileText: { fontSize: 12, color: colors.secondary, flex: 1, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  footerTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerTimeText: { fontSize: 12, color: colors.secondary },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, height: 44, paddingHorizontal: 12, borderRadius: 8, gap: 4 },
  actionBtnText: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  cardCommentBox: { backgroundColor: colors.surfaceContainer, padding: 12, borderRadius: 8, gap: 4 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentTitle: { fontSize: 11, fontWeight: '600', color: colors.onSurface, letterSpacing: 0.5 },
  commentDesc: { fontSize: 12, color: colors.onSurfaceVariant, paddingLeft: 24, lineHeight: 18 },
  cardDraftBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 8 },
  draftText: { fontSize: 12, color: colors.secondary, fontStyle: 'italic' },
  draftBadge: { fontSize: 11, fontWeight: '600', color: colors.secondary, letterSpacing: 0.5 },
  cardFooterRight: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingTop: 4, gap: 8 },
  actionBtnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, height: 44, paddingHorizontal: 16, borderRadius: 8, gap: 4 },
  actionBtnPrimaryText: { fontSize: 12, fontWeight: '500', color: colors.onPrimary },
});
