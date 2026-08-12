import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/constants/theme';
import { ADMIN_NAV, AdminNavItem, AdminSection } from '../adminNav';

const SIDEBAR_WIDTH = Math.min(300, Dimensions.get('window').width * 0.82);

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
  adminNome: string;
  badges: Partial<Record<'mesa' | 'alertas' | 'recuperacao', number>>;
  onLogout: () => void;
}

export function Sidebar({ visible, onClose, active, onSelect, adminNome, badges, onLogout }: SidebarProps) {
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Pressable
        style={[StyleSheet.absoluteFill, styles.backdrop, !visible && styles.backdropHidden]}
        onPress={onClose}
      />
      <Animated.View style={[styles.sidebar, { width: SIDEBAR_WIDTH, transform: [{ translateX }] }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <View style={styles.avatarWrap}>
              <Ionicons name="shield-checkmark" size={26} color={colors.douradoClaro} />
              <Text style={styles.adminNome} numberOfLines={1}>{adminNome}</Text>
              <Text style={styles.adminSub}>Acesso total</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            {ADMIN_NAV.map((item: AdminNavItem) => {
              const isActive = item.key === active;
              const badgeCount = item.badge ? badges[item.badge as keyof typeof badges] : undefined;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => onSelect(item.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={item.icon} size={18} color={isActive ? colors.azulDeep : 'rgba(255,255,255,0.8)'} />
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {badgeCount ? (
                    <View style={styles.badgeCount}>
                      <Text style={styles.badgeCountText}>{badgeCount}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(15,17,32,0.5)' },
  backdropHidden: { backgroundColor: 'transparent' },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.azulDeep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatarWrap: { gap: 2 },
  adminNome: { color: colors.white, fontWeight: '800', fontSize: 15, marginTop: 6 },
  adminSub: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5 },
  closeBtn: { padding: 4 },
  nav: { flex: 1, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: radius.sm,
    marginBottom: 3,
  },
  navItemActive: { backgroundColor: colors.white },
  navLabel: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '600' },
  navLabelActive: { color: colors.azulDeep, fontWeight: '800' },
  badgeCount: {
    backgroundColor: colors.douradoClaro,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeCountText: { color: colors.azulDeep, fontSize: 10, fontWeight: '800' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoutText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 13 },
});
