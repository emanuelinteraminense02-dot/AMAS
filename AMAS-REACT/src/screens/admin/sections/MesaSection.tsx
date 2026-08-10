import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';
import { apiAssociados } from '@/services/api';
import { formatMoney } from '@/utils/format';
import { Card, AdminButton, EmptyState, LoadingBlock, Badge } from '@/components/admin/AdminUI';
import { PromptModal } from '@/components/admin/PromptModal';
import type { Associado, Contribuicao } from '@/types';

interface PendenteItem {
  assoc: Associado;
  contrib: Contribuicao;
}

function statusNormalizado(v?: string) {
  return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function MesaSection() {
  const [pendentes, setPendentes] = useState<PendenteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recusaAlvo, setRecusaAlvo] = useState<PendenteItem | null>(null);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const assocs = (await apiAssociados.listar()) as Associado[];
      const porAssoc = await Promise.all(
        assocs.map(async (assoc) => ({
          assoc,
          contribs: ((await apiAssociados.getContribuicoes(assoc.id).catch(() => [])) as Contribuicao[]) || [],
        }))
      );
      const lista = porAssoc.flatMap(({ assoc, contribs }) =>
        contribs
          .filter((c) => statusNormalizado(c.status) === 'em analise')
          .map((contrib) => ({ assoc, contrib }))
      );
      setPendentes(lista);
    } catch {
      setPendentes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function aprovar(item: PendenteItem) {
    setProcessandoId(item.contrib.id);
    try {
      await apiAssociados.atualizarStatusContribuicao(item.contrib.id, 'Aprovado', '');
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível aprovar.');
    } finally {
      setProcessandoId(null);
    }
  }

  async function confirmarRecusa(motivo: string) {
    if (!recusaAlvo) return;
    if (!motivo.trim()) {
      Alert.alert('Atenção', 'Informe o motivo da recusa.');
      return;
    }
    try {
      await apiAssociados.atualizarStatusContribuicao(recusaAlvo.contrib.id, 'Recusado', motivo.trim());
      setRecusaAlvo(null);
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível recusar.');
    }
  }

  if (loading) return <LoadingBlock text="Carregando comprovantes..." />;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.countRow}>
        <Badge status={pendentes.length > 0 ? 'Em análise' : 'Regular'} />
        <Text style={styles.countText}>{pendentes.length} pendente{pendentes.length === 1 ? '' : 's'}</Text>
      </View>

      {pendentes.length === 0 ? (
        <Card>
          <EmptyState text="Nenhum comprovante aguardando análise." icon="checkmark-done-outline" />
        </Card>
      ) : (
        pendentes.map((item) => (
          <Card key={item.contrib.id} style={styles.item}>
            <View style={styles.itemHeader}>
              <Ionicons name="person-circle-outline" size={20} color={colors.azulDeep} />
              <Text style={styles.nome}>{item.assoc.nome}</Text>
              <Badge status="Em análise" small />
            </View>
            <Text style={styles.det}>
              {item.assoc.matricula || '—'} · {item.contrib.mes} · {formatMoney(item.contrib.valor)} · {item.contrib.data}
            </Text>
            {item.contrib.observacoes ? <Text style={styles.obs}>✎ {item.contrib.observacoes}</Text> : null}
            <Text style={styles.arquivo}>📎 {item.contrib.arquivo || '—'}</Text>
            <View style={styles.acoes}>
              <AdminButton
                label="Aprovar"
                icon="checkmark-circle"
                variant="success"
                small
                fullWidth
                loading={processandoId === item.contrib.id}
                onPress={() => aprovar(item)}
              />
              <AdminButton label="Recusar" icon="close-circle" variant="danger" small fullWidth onPress={() => setRecusaAlvo(item)} />
            </View>
          </Card>
        ))
      )}

      <PromptModal
        visible={!!recusaAlvo}
        title="Recusar Comprovante"
        message="Informe o motivo da recusa. O associado será notificado."
        placeholder="Ex: Comprovante ilegível, valor incorreto..."
        confirmLabel="Confirmar Recusa"
        onCancel={() => setRecusaAlvo(null)}
        onConfirm={confirmarRecusa}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countText: { fontSize: 12.5, color: colors.textMuted },
  item: { gap: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  nome: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  det: { fontSize: 12, color: colors.textMuted },
  obs: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
  arquivo: { fontSize: 11.5, color: colors.textMuted },
  acoes: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
