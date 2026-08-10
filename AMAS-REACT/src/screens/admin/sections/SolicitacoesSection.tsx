import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { apiAdmin } from '@/services/api';
import { formatDataCurta } from '@/utils/format';
import { Card, AdminButton, EmptyState, LoadingBlock, Badge } from '@/components/admin/AdminUI';
import { ModalSheet } from '@/components/admin/ModalSheet';
import { PromptModal } from '@/components/admin/PromptModal';
import type { Solicitacao } from '@/types';

export function SolicitacoesSection() {
  const [lista, setLista] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [recusaAlvo, setRecusaAlvo] = useState<Solicitacao | null>(null);
  const [detalheAlvo, setDetalheAlvo] = useState<Solicitacao | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setLista((await apiAdmin.getSolicitacoes()) as Solicitacao[]);
    } catch {
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function aprovar(id: number) {
    setProcessandoId(id);
    try {
      await apiAdmin.aprovarSolicitacao(id);
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível aprovar.');
    } finally {
      setProcessandoId(null);
    }
  }

  async function confirmarRecusa(motivo: string) {
    if (!recusaAlvo) return;
    try {
      await apiAdmin.recusarSolicitacao(recusaAlvo.id, motivo.trim());
      setRecusaAlvo(null);
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível recusar.');
    }
  }

  if (loading) return <LoadingBlock text="Carregando solicitações..." />;

  const pendentes = lista.filter((s) => !s.status || s.status === 'Pendente');
  const processadas = lista.filter((s) => s.status && s.status !== 'Pendente');

  return (
    <View style={{ gap: spacing.md }}>
      {pendentes.length === 0 ? (
        <Card><EmptyState text="Nenhuma solicitação pendente." icon="person-add-outline" /></Card>
      ) : (
        pendentes.map((s) => (
          <Card key={s.id} style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome}>{s.nome}</Text>
                <Text style={styles.sub}>{s.tipoSolicitante === 'empresa' ? `Empresa · ${s.cnpj}` : `CPF: ${s.cpf}`}</Text>
                <Text style={styles.sub}>{s.email} · {s.telefone}</Text>
                {s.dataSolicitacao ? <Text style={styles.sub}>Enviado em {formatDataCurta(s.dataSolicitacao)}</Text> : null}
              </View>
              <Badge status="Pendente" small />
            </View>
            <Text style={styles.obsTitulo}>Motivação:</Text>
            <Text style={styles.obs} numberOfLines={3}>{s.observacoes || '—'}</Text>
            <View style={styles.acoes}>
              <AdminButton label="Ver detalhes" icon="eye-outline" small fullWidth onPress={() => setDetalheAlvo(s)} />
              <AdminButton label="Aprovar" icon="checkmark-circle" variant="success" small fullWidth loading={processandoId === s.id} onPress={() => aprovar(s.id)} />
              <AdminButton label="Recusar" icon="close-circle" variant="danger" small fullWidth onPress={() => setRecusaAlvo(s)} />
            </View>
          </Card>
        ))
      )}

      {processadas.length > 0 ? (
        <Card>
          <Text style={styles.processadasTitulo}>Já processadas ({processadas.length})</Text>
          {processadas.map((s) => (
            <View key={s.id} style={styles.processadaRow}>
              <Text style={styles.processadaNome} numberOfLines={1}>{s.nome}</Text>
              <Badge status={s.status!} small />
            </View>
          ))}
        </Card>
      ) : null}

      <ModalSheet visible={!!detalheAlvo} onClose={() => setDetalheAlvo(null)} title="Detalhes da Solicitação" subtitle={detalheAlvo?.nome}>
        {detalheAlvo ? (
          <View style={{ gap: 6 }}>
            {([
              ['Tipo', detalheAlvo.tipoSolicitante === 'empresa' ? 'Empresa' : 'Pessoa Física'],
              detalheAlvo.tipoSolicitante === 'empresa' ? ['CNPJ', detalheAlvo.cnpj || '—'] : ['CPF', detalheAlvo.cpf || '—'],
              ['Telefone', detalheAlvo.telefone], ['E-mail', detalheAlvo.email],
              ['Endereço', detalheAlvo.endereco], ['Profissão / Ramo', detalheAlvo.profissao],
              ['Enviado em', detalheAlvo.dataSolicitacao ? formatDataCurta(detalheAlvo.dataSolicitacao) : '—'],
            ] as [string, string][]).map((par) => (
              <View key={par[0]} style={styles.dadoRow}>
                <Text style={styles.dadoLabel}>{par[0]}</Text>
                <Text style={styles.dadoVal}>{par[1]}</Text>
              </View>
            ))}
            <Text style={styles.obsTitulo}>Motivação:</Text>
            <Text style={styles.obs}>{detalheAlvo.observacoes || '—'}</Text>
          </View>
        ) : null}
      </ModalSheet>

      <PromptModal
        visible={!!recusaAlvo}
        title="Recusar Solicitação"
        message="Informe o motivo da recusa (opcional, mas recomendado)."
        placeholder="Ex: Documentação incompleta..."
        confirmLabel="Confirmar Recusa"
        onCancel={() => setRecusaAlvo(null)}
        onConfirm={confirmarRecusa}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: { gap: 6 },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nome: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  obsTitulo: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 4 },
  obs: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  acoes: { flexDirection: 'row', gap: 6, marginTop: 4 },
  processadasTitulo: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  processadaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  processadaNome: { fontSize: 12.5, color: colors.textSecondary, flex: 1 },
  dadoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  dadoLabel: { fontSize: 12, color: colors.textMuted },
  dadoVal: { fontSize: 12.5, color: colors.textPrimary, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
