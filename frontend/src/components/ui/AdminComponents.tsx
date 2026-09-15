import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewProps } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ProfileIcon() {
  return (
    <View style={styles.profileIconContainer}>
      <MaterialIcons name="person" size={18} color="#ffffff" />
    </View>
  );
}

export function TopNavBar() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.navContainer, { paddingTop: insets.top }]}>
      <View style={styles.navContent}>
        <View style={styles.navRow}>
          <View style={styles.navTitleContainer}>
            <Text style={styles.navTitle}>ADMIN Dashboard</Text>
          </View>
          <View style={styles.navProfileContainer}>
            <ProfileIcon />
          </View>
        </View>
      </View>
    </View>
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

export function BottomNavBar({ activeRoute }: { activeRoute: 'home' | 'leave' | 'people' | 'reports' | 'more' }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const navItems = [
    { id: 'home', label: 'Home', icon: 'dashboard', route: '/admin' },
    { id: 'leave', label: 'Leave', icon: 'event-available', route: '/leave/admin-review' },
    { id: 'people', label: 'People', icon: 'group', route: '/people' },
    { id: 'reports', label: 'Reports', icon: 'query-stats', route: '/reports' },
    { id: 'more', label: 'More', icon: 'more-horiz', route: '/settings' },
  ];

  return (
    <View style={[styles.bottomNavContainer, { bottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.bottomNavContent}>
        {navItems.map((item) => {
          const isActive = activeRoute === item.id;
          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.bottomNavItem}
              onPress={() => router.push(item.route as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.bottomNavIconContainer, isActive && styles.bottomNavIconContainerActive]}>
                <MaterialIcons 
                  name={item.icon as keyof typeof MaterialIcons.glyphMap} 
                  size={20} 
                  color={isActive ? "#ffffff" : "#9ca3af"} 
                />
              </View>
              <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  navContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 50,
    backgroundColor: 'transparent'
  },
  navContent: {
    height: 80,
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
    gap: 8
  },
  navTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#1c1b1b',
    letterSpacing: -0.3
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
  bottomNavContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    backgroundColor: '#111111',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 8,
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavIconContainerActive: {
    backgroundColor: '#2A2A2E',
  },
  bottomNavLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#9ca3af',
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: '#ffffff',
  }
});
