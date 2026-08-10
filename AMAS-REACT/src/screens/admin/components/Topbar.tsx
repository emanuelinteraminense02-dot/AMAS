import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';

interface TopbarProps {
  title: string;
  subtitle: string;
  onOpenMenu: () => void;
}

export function Topbar({ title, subtitle, onOpenMenu }: TopbarProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const update = () => setClock(new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }));
    update();
    const id = setInterval(update, 1000 * 30);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onOpenMenu} hitSlop={10} style={styles.menuBtn}>
        <Ionicons name="menu" size={22} color={colors.azulDeep} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Text style={styles.clock}>{clock}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  clock: { fontSize: 10.5, color: colors.textMuted },
});
