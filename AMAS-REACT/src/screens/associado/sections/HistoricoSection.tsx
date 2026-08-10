import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { formatMoney } from '@/utils/format';
import { Card, EmptyState, Badge } from '@/components/admin/AdminUI';
import type { Associado, Contribuicao } from '@/types';

interface HistoricoSectionProps {
  assoc: Associado;
}

export function HistoricoSection({ assoc }: HistoricoSectionProps) {
  const historico: Contribuicao[] = ((assoc.historico as Contribuicao[] | undefined) || [])
    .slice()
    .reverse();

  if (historico.length === 0) {
    return <Card><EmptyState text="Nenhuma contribuição registrada ainda." icon="time-outline" /></Card>;
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Text style={styles.total}>{historico.length} contribuição{historico.length !== 1 ? 'ões' : ''} no total</Text>
      {historico.map((c) => (
        <View key={c.id} style={styles.row}>
          <View style={styles.rowTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mes}>{c.mes || c.data || '—'}</Text>
              {c.data && c.mes ? <Text style={styles.data}>{c.data}</Text> : null}
            </View>
            <Text style={styles.valor}>{formatMoney(c.valor)}</Text>
            <Badge status={c.status} small />
          </View>
          {c.observacoes ? <Text style={styles.obs}>📎 {c.observacoes}</Text> : null}
          {c.msgAdmin ? (
            <View style={styles.msgAdmin}>
              <Text style={styles.msgAdminLabel}>💬 Admin:</Text>
              <Text style={styles.msgAdminText}>{c.msgAdmin}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  total: { fontSize: 12.5, color: colors.textMuted, paddingHorizontal: 2 },
  row: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mes: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  data: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  valor: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  obs: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  msgAdmin: {
    flexDirection: 'row', gap: 6, backgroundColor: colors.surface,
    borderRadius: radius.sm, padding: 8, marginTop: 4,
  },
  msgAdminLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textSecondary },
  msgAdminText: { fontSize: 11.5, color: colors.textSecondary, flex: 1, lineHeight: 17 },
});
