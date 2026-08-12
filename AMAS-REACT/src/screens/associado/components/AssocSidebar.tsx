import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Animated, Dimensions, Pressable, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/constants/theme';
import { ASSOC_NAV, AssociadoNavItem, AssociadoSection } from '../assocNav';

const SIDEBAR_WIDTH = Math.min(290, Dimensions.get('window').width * 0.8);

interface AssocSidebarProps {
  visible: boolean;
  onClose: () => void;
  active: AssociadoSection;
  onSelect: (s: AssociadoSection) => void;
  nome: string;
  matricula?: string;
  foto?: string;
  badgeMensagens: number;
  onLogout: () => void;
}

export function AssocSidebar({
  visible, onClose, active, onSelect,
  nome, matricula, foto, badgeMensagens, onLogout,
}: AssocSidebarProps) {
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
          {/* Avatar + info */}
          <View style={styles.header}>
            <View style={styles.avatarWrap}>
              {foto
                ? <Image source={{ uri: foto }} style={styles.avatarImg} />
                : <View style={styles.avatarPlaceholder}><Ionicons name="person" size={26} color={colors.azulMid} /></View>
              }
            </View>
            <Text style={styles.nome} numberOfLines={2}>{nome}</Text>
            <Text style={styles.matricula}>Matrícula: {matricula || '—'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            {ASSOC_NAV.map((item: AssociadoNavItem) => {
              const isActive = item.key === active;
              const count = item.badge === 'mensagens' ? badgeMensagens : 0;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => onSelect(item.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={item.icon} size={18} color={isActive ? colors.azulDeep : 'rgba(255,255,255,0.85)'} />
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{count}</Text>
                    </View>
                  )}
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
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.azulDeep },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingTop: spacing.md,
  },
  avatarWrap: { marginBottom: spacing.sm },
  avatarImg: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.azulMid },
  avatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  nome: { color: colors.white, fontWeight: '800', fontSize: 14.5, marginBottom: 2 },
  matricula: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5 },
  closeBtn: { position: 'absolute', top: spacing.md, right: spacing.md, padding: 4 },
  nav: { flex: 1, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    borderRadius: radius.sm, marginBottom: 3,
  },
  navItemActive: { backgroundColor: colors.white },
  navLabel: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '600' },
  navLabelActive: { color: colors.azulDeep, fontWeight: '800' },
  badge: {
    backgroundColor: colors.douradoClaro, borderRadius: radius.pill,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: colors.azulDeep, fontSize: 10, fontWeight: '800' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    paddingVertical: 12, borderRadius: radius.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  logoutText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 13 },
});
