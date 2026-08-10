import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { formatDataCurta } from '@/utils/format';
import type { Associado } from '@/types';

interface CarteirinhaSectionProps {
  assoc: Associado;
}

export function CarteirinhaSection({ assoc }: CarteirinhaSectionProps) {
  const isRegular = assoc.status === 'Regular';

  return (
    <View style={{ gap: spacing.md }}>
      {/* Card visual */}
      <View style={styles.card}>
        {/* Header do card */}
        <View style={styles.cardHeader}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>A</Text>
          </View>
          <View>
            <Text style={styles.orgName}>AMAS</Text>
            <Text style={styles.orgSub}>Associação de São Sebastião</Text>
          </View>
          <View style={styles.rfidIcon}>
            <Ionicons name="wifi-outline" size={20} color="rgba(255,255,255,0.4)" />
          </View>
        </View>

        {/* Avatar + nome */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.azulDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nome}>{assoc.nome || '—'}</Text>
            <Text style={styles.profissao}>{assoc.profissao || '—'}</Text>
          </View>
        </View>

        {/* Infos */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>MATRÍCULA</Text>
            <Text style={styles.infoValue}>{assoc.matricula || '—'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>MEMBRO DESDE</Text>
            <Text style={styles.infoValue}>{formatDataCurta(assoc.dataEntrada) || '—'}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={[styles.statusBadge, { backgroundColor: isRegular ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)', borderColor: isRegular ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)' }]}>
          <Ionicons
            name={isRegular ? 'checkmark-circle' : 'warning'}
            size={13}
            color={isRegular ? '#16a34a' : '#dc2626'}
          />
          <Text style={[styles.statusText, { color: isRegular ? '#16a34a' : '#dc2626' }]}>
            {isRegular ? 'Adimplente' : assoc.status || 'Pendente'}
          </Text>
        </View>

        {/* Decoração */}
        <View style={styles.stripe} />
      </View>

      {/* Info adicional */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={16} color={colors.azulMid} />
        <Text style={styles.infoTxt}>
          Apresente esta carteirinha para acessar os benefícios exclusivos nas empresas parceiras da AMAS.
        </Text>
      </View>

      {!isRegular && (
        <View style={styles.alertCard}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={styles.alertTxt}>
            Sua carteirinha pode ter restrições enquanto a situação não estiver regular. Regularize suas contribuições.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.azulDeep,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  logoBadge: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoBadgeText: { color: colors.douradoClaro, fontWeight: '800', fontSize: 18 },
  orgName: { color: colors.white, fontWeight: '800', fontSize: 15 },
  orgSub: { color: 'rgba(255,255,255,0.55)', fontSize: 10.5 },
  rfidIcon: { marginLeft: 'auto' },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: colors.azulMid,
    alignItems: 'center', justifyContent: 'center',
  },
  nome: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 3 },
  profissao: { color: 'rgba(255,255,255,0.65)', fontSize: 12.5 },
  infoGrid: {
    flexDirection: 'row', gap: spacing.xl,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: spacing.md, marginBottom: spacing.md,
  },
  infoItem: {},
  infoLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8 },
  infoValue: { color: colors.white, fontWeight: '700', fontSize: 13.5, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, borderWidth: 1,
  },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  stripe: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 4, backgroundColor: colors.azulMid,
  },
  infoCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: `${colors.azulDeep}0D`, borderRadius: radius.sm,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  infoTxt: { flex: 1, fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  alertCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#fef3c7', borderRadius: radius.sm,
    padding: spacing.md,
  },
  alertTxt: { flex: 1, fontSize: 12.5, color: '#92400e', lineHeight: 18 },
});
