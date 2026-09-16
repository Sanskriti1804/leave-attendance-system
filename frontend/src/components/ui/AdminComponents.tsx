import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewProps } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, pageGradient } from "../../theme";
import { RoleBottomNav } from "./AppChrome";

export const TOP_NAV_EXTRA_PAD = 10;
export const TOP_NAV_INNER_HEIGHT = 72;

export function useTopNavContentInset(): number {
  const insets = useSafeAreaInsets();
  return insets.top + TOP_NAV_EXTRA_PAD + TOP_NAV_INNER_HEIGHT;
}

export function ProfileIcon() {
  return (
    <View style={styles.profileIconContainer}>
      <MaterialIcons name="person" size={18} color="#ffffff" />
    </View>
  );
}

export function TopNavBar({
  title = "ADMIN Dashboard",
  showBack = false,
  right,
}: {
  title?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <LinearGradient
      colors={[...pageGradient.colors]}
      locations={[...pageGradient.locations]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.navContainer, { paddingTop: insets.top + TOP_NAV_EXTRA_PAD }]}
    >
      <View style={styles.navContent}>
        <View style={styles.navRow}>
          <View style={styles.navTitleContainer}>
            {showBack ? (
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.navTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <View style={styles.navProfileContainer}>{right ?? <ProfileIcon />}</View>
        </View>
      </View>
    </LinearGradient>
  );
}

export function HROperationsCard({ name, role, day, date }: { name: string, role: string, day: string, date: string }) {
  return (
    <LinearGradient
      colors={['rgba(0, 168, 153, 0.15)', 'rgba(38, 169, 225, 0.12)', 'rgba(255, 255, 255, 0.7)']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hrCard}
    >
      <View style={styles.hrCardHeader}>
        <Text style={styles.hrCardTitle}>HR OPERATIONS</Text>
      </View>
      <View style={styles.hrCardInner}>
        <View style={styles.hrCardInnerCol}>
          <Text style={styles.hrCardName}>{name}</Text>
          <Text style={styles.hrCardRole}>{role}</Text>
        </View>
        <View style={[styles.hrCardInnerCol, { alignItems: 'flex-end' }]}>
          <Text style={styles.hrCardDay}>{day}</Text>
          <Text style={styles.hrCardDate}>{date}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

export function ContentCard({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.contentCard, style]} {...props}>
      {children}
    </View>
  );
}

interface StatsCardProps {
  title: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  count: string;
  countColor?: string;
  subtitle: string;
  borderColor: string;
  onPress?: () => void;
}

export function StatsCard({ title, iconName, iconColor, count, countColor = '#1c1b1b', subtitle, borderColor, onPress }: StatsCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.statsCard, { borderLeftColor: borderColor }]}
    >
      <View style={styles.statsCardHeader}>
        <Text style={styles.statsCardTitle}>{title}</Text>
        <MaterialIcons name={iconName} size={16} color={iconColor} />
      </View>
      <View style={styles.statsCardBody}>
        <Text style={[styles.statsCardCount, { color: countColor }]}>{count}</Text>
        <Text style={styles.statsCardSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function BottomNavBar({ activeRoute }: { activeRoute: "home" | "leave" | "people" | "reports" | "more" }) {
  return <RoleBottomNav variant="admin" activeRoute={activeRoute} />;
}

const styles = StyleSheet.create({
  profileIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  navContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 50,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navContent: {
    height: TOP_NAV_INNER_HEIGHT,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  navTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#1c1b1b',
    letterSpacing: -0.3,
    flex: 1,
    flexShrink: 1,
  },
  navProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  hrCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
    gap: 12
  },
  hrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  hrCardTitle: {
    fontFamily: 'Inter',
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.7
  },
  hrCardInner: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  hrCardInnerCol: {
    flexDirection: 'column'
  },
  hrCardName: {
    fontFamily: 'Inter',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    color: '#000'
  },
  hrCardRole: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000',
    marginTop: 2
  },
  hrCardDay: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#000'
  },
  hrCardDate: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginTop: 2
  },
  contentCard: {
    backgroundColor: 'rgb(222, 223, 227)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 5,
  },
  statsCard: {
    backgroundColor: 'rgb(222, 223, 227)',
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    padding: 12,
    height: 80,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statsCardTitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#585f6c'
  },
  statsCardBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  statsCardCount: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '600'
  },
  statsCardSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#585f6c'
  },
});
