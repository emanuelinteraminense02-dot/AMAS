import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';
import { apiAdmin } from '@/services/api';
import { Card, AdminButton, EmptyState, LoadingBlock } from '@/components/admin/AdminUI';
import type { AlertaEmpresario } from '@/types';

export function AlertasSection() {
  const [alertas, setAlertas] = useState<AlertaEmpresario[]>([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setAlertas((await apiAdmin.getAlertas()) as AlertaEmpresario[]);
    } catch {
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function resolver(id: number) {
    setProcessandoId(id);
    try {
      await apiAdmin.marcarAlertaLido(id);
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível atualizar.');
    } finally {
      setProcessandoId(null);
    }
  }

  if (loading) return <LoadingBlock text="Carregando alertas..." />;

  if (alertas.length === 0) {
    return (
      <Card>
        <EmptyState text="Nenhum alerta recebido." icon="notifications-off-outline" />
      </Card>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      {alertas.map((a) => (
        <Card key={a.id} style={[styles.item, a.lido && styles.itemLido]}>
          <View style={styles.header}>
            {a.urgente ? (
              <View style={[styles.tag, styles.tagUrgente]}>
                <Ionicons name="alert-circle" size={12} color="#dc2626" />
                <Text style={[styles.tagText, { color: '#dc2626' }]}>URGENTE</Text>
              </View>
            ) : (
              <View style={[styles.tag, styles.tagNormal]}>
                <Text style={[styles.tagText, { color: '#b45309' }]}>Normal</Text>
              </View>
            )}
            <Text style={styles.de} numberOfLines={1}>De: {a.empresarioNome}</Text>
          </View>
          <Text style={styles.data}>{new Date(a.data).toLocaleString('pt-BR')}</Text>
          <Text style={styles.titulo}>{a.titulo}</Text>
          <Text style={styles.msg}>{a.mensagem}</Text>
          {!a.lido ? (
            <AdminButton
              label="Marcar como resolvido"
              icon="checkmark-outline"
              small
              loading={processandoId === a.id}
              onPress={() => resolver(a.id)}
            />
          ) : (
            <View style={styles.resolvidoRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.resolvidoText}>Resolvido</Text>
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { gap: 6 },
  itemLido: { opacity: 0.65 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  tagUrgente: { backgroundColor: '#fee2e2' },
  tagNormal: { backgroundColor: '#fef3c7' },
  tagText: { fontSize: 10.5, fontWeight: '800' },
  de: { fontSize: 12, color: colors.textMuted, flex: 1 },
  data: { fontSize: 11, color: colors.textMuted },
  titulo: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  msg: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  resolvidoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  resolvidoText: { fontSize: 11.5, color: colors.textMuted },
});
