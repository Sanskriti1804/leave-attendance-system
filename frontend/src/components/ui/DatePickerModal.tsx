import React, { useState, useMemo, useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../theme";

export interface DatePickerModalProps {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onClose: () => void;
  onSelect: (date: string) => void;
  minYear?: number;
  maxYear?: number;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function DatePickerModal({
  visible,
  value,
  onClose,
  onSelect,
  minYear = 2020,
  maxYear = 2030,
}: DatePickerModalProps) {
  const initialDate = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [value, visible]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(value);
  
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  useEffect(() => {
    if (visible) {
      const d = initialDate;
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelectedDate(value);
      setShowMonthDropdown(false);
      setShowYearDropdown(false);
    }
  }, [visible, initialDate, value]);

  const years = useMemo(() => {
    const y = [];
    for (let i = minYear; i <= maxYear; i++) y.push(i);
    return y;
  }, [minYear, maxYear]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 0 is Monday
    
    const days = [];
    // Previous month filler
    const prevMonth = new Date(viewYear, viewMonth, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ day: prevMonth.getDate() - i, currentMonth: false, dateStr: '' });
    }
    
    // Current month
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const monthStr = String(viewMonth + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      days.push({ day: i, currentMonth: true, dateStr: `${viewYear}-${monthStr}-${dayStr}` });
    }
    
    // Next month filler
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, dateStr: '' });
    }
    
    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={() => {
          if (showMonthDropdown) setShowMonthDropdown(false);
          if (showYearDropdown) setShowYearDropdown(false);
        }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerDropdowns}>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => { setShowMonthDropdown(!showMonthDropdown); setShowYearDropdown(false); }}>
                <Text style={styles.dropdownText}>{MONTHS[viewMonth].toUpperCase()}</Text>
                <MaterialIcons name="expand-more" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => { setShowYearDropdown(!showYearDropdown); setShowMonthDropdown(false); }}>
                <Text style={styles.dropdownText}>{viewYear}</Text>
                <MaterialIcons name="expand-more" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.headerNav}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <MaterialIcons name="chevron-left" size={20} color={colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <MaterialIcons name="chevron-right" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekRow}>
            {DAYS.map(d => (
              <Text key={d} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, index) => {
              const isSelected = item.currentMonth && item.dateStr === selectedDate;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  disabled={!item.currentMonth}
                  onPress={() => item.currentMonth && setSelectedDate(item.dateStr)}
                >
                  <Text style={[
                    styles.dayText, 
                    !item.currentMonth && styles.dayTextDisabled,
                    isSelected && styles.dayTextSelected
                  ]}>
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtnSecondary} onPress={onClose}>
              <Text style={styles.actionBtnTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => {
              if (selectedDate) onSelect(selectedDate);
              onClose();
            }}>
              <Text style={styles.actionBtnTextPrimary}>Select</Text>
            </TouchableOpacity>
          </View>

          {/* Dropdowns Overlays */}
          {showMonthDropdown && (
            <View style={[styles.dropdownPopup, { left: 16 }]}>
              <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, i) => (
                  <TouchableOpacity key={m} style={[styles.dropdownItem, viewMonth === i && styles.dropdownItemSelected]} onPress={() => { setViewMonth(i); setShowMonthDropdown(false); }}>
                    <Text style={[styles.dropdownItemText, viewMonth === i && styles.dropdownItemTextSelected]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {showYearDropdown && (
            <View style={[styles.dropdownPopup, { left: 120 }]}>
              <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                {years.map(y => (
                  <TouchableOpacity key={y} style={[styles.dropdownItem, viewYear === y && styles.dropdownItemSelected]} onPress={() => { setViewYear(y); setShowYearDropdown(false); }}>
                    <Text style={[styles.dropdownItemText, viewYear === y && styles.dropdownItemTextSelected]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialog: {
    width: 320,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    zIndex: 10,
  },
  headerDropdowns: {
    flexDirection: "row",
    gap: 8,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  headerNav: {
    flexDirection: "row",
    gap: 4,
  },
  navBtn: {
    padding: 4,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
  },
  dayTextDisabled: {
    color: colors.secondary,
    opacity: 0.5,
  },
  dayTextSelected: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnTextSecondary: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  actionBtnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnTextPrimary: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  dropdownPopup: {
    position: "absolute",
    top: 50,
    width: 140,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    zIndex: 20,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownItemSelected: {
    backgroundColor: colors.surfaceContainerLow,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.text,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});
