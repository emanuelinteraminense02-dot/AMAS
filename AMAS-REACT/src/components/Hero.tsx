import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';

function useAnimatedCounter(target: number) {
  const [value, setValue] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalValue = Number(target || 0);
    const step = Math.max(1, Math.ceil(finalValue / 30));
    let current = 0;
    timerRef.current = setInterval(() => {
      current = Math.min(current + step, finalValue);
      setValue(current);
      if (current >= finalValue && timerRef.current) clearInterval(timerRef.current);
    }, 40);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [target]);

  return value;
}

interface HeroProps {
  total: number;
  regulares: number;
  onAssociar: () => void;
  onVerNovidades: () => void;
}

export function Hero({ total, regulares, onAssociar, onVerNovidades }: HeroProps) {
  const statTotal = useAnimatedCounter(total);
  const statRegular = useAnimatedCounter(regulares);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Ionicons name="location" size={13} color={colors.douradoClaro} />
        <Text style={styles.badgeText}>Associação de São Sebastião – DF</Text>
      </View>

      <Text style={styles.title}>
        Unindo a comunidade,{'\n'}
        <Text style={styles.titleHighlight}>fortalecendo</Text> a cidade
      </Text>

      <Text style={styles.desc}>
        A AMAS conecta lideranças, empreendedores e cidadãos comprometidos com o desenvolvimento
        social e econômico de São Sebastião.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onAssociar} activeOpacity={0.9}>
          <Text style={styles.btnPrimaryText}>Quero me associar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={onVerNovidades} activeOpacity={0.85}>
          <Text style={styles.btnOutlineText}>Ver novidades</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{statTotal}</Text>
          <Text style={styles.statLabel}>Associados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{statRegular}</Text>
          <Text style={styles.statLabel}>Regulares</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>3+</Text>
          <Text style={styles.statLabel}>Anos de atuação</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.azulDeep,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(232,168,42,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  badgeText: { color: colors.douradoClaro, fontSize: 12, fontWeight: '700' },
  title: { ...typography.h1, color: colors.white, marginBottom: spacing.md },
  titleHighlight: { color: colors.douradoClaro },
  desc: { ...typography.body, color: colors.textOnDarkMuted, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.xl },
  btnPrimary: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radius.pill,
  },
  btnPrimaryText: { color: colors.azulDeep, fontWeight: '800', fontSize: 14.5 },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radius.pill,
  },
  btnOutlineText: { color: colors.white, fontWeight: '700', fontSize: 14.5 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statNum: { color: colors.douradoClaro, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.textOnDarkMuted, fontSize: 11.5, marginTop: 2, textAlign: 'center' },
});
