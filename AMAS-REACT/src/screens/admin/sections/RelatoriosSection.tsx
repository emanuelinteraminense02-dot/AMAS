import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing } from '@/constants/theme';
import { apiAdmin, apiAssociados } from '@/services/api';
import { formatMoney } from '@/utils/format';
import { Card, CardTitleRow, AdminButton, LoadingBlock } from '@/components/admin/AdminUI';
import type { Associado, Estatisticas } from '@/types';


export function RelatoriosSection() {
  const [inadimplentes, setInadimplentes] = useState<Associado[]>([]);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [assocs, est] = await Promise.all([
          apiAssociados.listar() as Promise<Associado[]>,
          apiAdmin.getDashboard() as Promise<Estatisticas>,
        ]);
        setInadimplentes(assocs.filter((a) => a.status === 'Inadimplente'));
        setStats(est);
      } catch {
        setInadimplentes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function montarTexto() {
    const data = new Date().toLocaleString('pt-BR');
    return (
      `RELATÓRIO DE INADIMPLENTES – AMAS\n${data}\n\n` +
      inadimplentes.map((a, i) => `${i + 1}. ${a.nome} | ${a.cpf} | ${a.telefone || '—'} | ${a.matricula || '—'}`).join('\n')
    );
  }

  async function copiar() {
    await Clipboard.setStringAsync(montarTexto());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function compartilhar() {
    await Share.share({ message: montarTexto() });
  }

  if (loading) return <LoadingBlock text="Carregando relatórios..." />;

  const est: Estatisticas = stats || { total: 0, regulares: 0 };
  const linhasResumo: [string, string][] = [
    ['Total de Associados', String(est.total ?? 0)],
    ['Regulares', String(est.regulares ?? 0)],
    ['Inadimplentes', String(est.inadim ?? 0)],
    ['Em análise', String(est.emAnalise ?? 0)],
    ['Pendentes', String(est.pendentes ?? 0)],
    ['Total Arrecadado (aprovado)', formatMoney(est.totalArrecadado ?? 0)],
    ['Alertas não resolvidos', String(est.alertasPendentes ?? 0)],
  ];

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <CardTitleRow
          title="Relatório de Inadimplentes"
          icon="warning-outline"
          action={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <AdminButton label={copiado ? 'Copiado!' : 'Copiar'} icon="copy-outline" small onPress={copiar} />
              <AdminButton label="Compartilhar" icon="share-social-outline" small onPress={compartilhar} />
            </View>
          }
        />
        {inadimplentes.length === 0 ? (
          <Text style={styles.okText}>Nenhum associado inadimplente!</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {inadimplentes.map((a) => (
              <View key={a.id} style={styles.row}>
                <Text style={styles.rowNome} numberOfLines={1}>{a.nome}</Text>
                <Text style={styles.rowDet}>{a.cpf} · {a.telefone || '—'} · {a.matricula || '—'}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <CardTitleRow title="Resumo Geral" icon="bar-chart-outline" />
        {linhasResumo.map(([label, valor]) => (
          <View key={label} style={styles.statRow}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statVal}>{valor}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  okText: { color: colors.success, fontWeight: '700', fontSize: 13 },
  row: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
  rowNome: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  rowDet: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  statLabel: { fontSize: 12.5, color: colors.textSecondary },
  statVal: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});
