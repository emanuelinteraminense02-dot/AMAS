import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { apiAdmin, apiAssociados } from '@/services/api';
import { formatMoney } from '@/utils/format';
import { Card, CardTitleRow, AdminButton, LoadingBlock } from '@/components/admin/AdminUI';
import type { AdminSection } from '../adminNav';
import type { Associado, Estatisticas } from '@/types';

const STAT_CARDS: { key: keyof Estatisticas; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; money?: boolean }[] = [
  { key: 'total', label: 'Total de Associados', icon: 'people', color: colors.azulDeep },
  { key: 'regulares', label: 'Regulares', icon: 'checkmark-circle', color: colors.success },
  { key: 'inadim', label: 'Inadimplentes', icon: 'warning', color: colors.danger },
  { key: 'emAnalise', label: 'Em Análise', icon: 'hourglass', color: colors.warning },
  { key: 'totalArrecadado', label: 'Total Arrecadado', icon: 'cash', color: '#2563eb', money: true },
  { key: 'alertasPendentes', label: 'Alertas Pendentes', icon: 'notifications', color: '#ea580c' },
];

interface MesData {
  mes: string;
  valor: number;
}

interface DashboardSectionProps {
  onNavigate: (section: AdminSection) => void;
}

export function DashboardSection({ onNavigate }: DashboardSectionProps) {
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [meses, setMeses] = useState<MesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const est = (await apiAdmin.getDashboard()) as Estatisticas;
        const assocs = (await apiAssociados.listar()) as Associado[];

        const mesesMap: Record<string, number> = {};
        assocs.forEach((a) => {
          const historico = (a.historico as { status?: string; mes?: string; data?: string; valor?: number }[]) || [];
          historico.forEach((c) => {
            if (c.status === 'Aprovado') {
              const k = c.mes || c.data || '';
              mesesMap[k] = (mesesMap[k] || 0) + parseFloat(String(c.valor || 0));
            }
          });
        });
        const chaves = Object.keys(mesesMap).slice(-6);

        if (mounted) {
          setStats(est);
          setMeses(chaves.map((mes) => ({ mes, valor: mesesMap[mes] })));
        }
      } catch {
        // silencioso — os cards mostram 0 se a chamada falhar
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingBlock text="Carregando dashboard..." />;

  const est: Estatisticas = stats || { total: 0, regulares: 0 };
  const totalStatus = (est.regulares || 0) + (est.inadim || 0) + (est.emAnalise || 0) + (est.pendentes || 0);
  const maiorMes = Math.max(1, ...meses.map((m) => m.valor));

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.statsGrid}>
        {STAT_CARDS.map((sc) => (
          <View key={sc.key} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${sc.color}1A` }]}>
              <Ionicons name={sc.icon} size={18} color={sc.color} />
            </View>
            <Text style={styles.statVal}>{sc.money ? formatMoney(Number(est[sc.key] || 0)) : String(est[sc.key] ?? 0)}</Text>
            <Text style={styles.statLabel}>{sc.label}</Text>
          </View>
        ))}
      </View>

      <Card>
        <CardTitleRow title="Status dos Associados" icon="pie-chart-outline" />
        {totalStatus === 0 ? (
          <Text style={styles.emptyChart}>Sem dados suficientes ainda.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            <View style={styles.stackedBar}>
              {[
                { v: est.regulares || 0, c: colors.success },
                { v: est.inadim || 0, c: colors.danger },
                { v: est.emAnalise || 0, c: colors.warning },
                { v: est.pendentes || 0, c: colors.cinzaSoft },
              ].map((seg, i) =>
                seg.v > 0 ? (
                  <View key={i} style={{ flex: seg.v, backgroundColor: seg.c, height: '100%' }} />
                ) : null
              )}
            </View>
            <View style={styles.legendRow}>
              <LegendDot color={colors.success} label={`Regular (${est.regulares || 0})`} />
              <LegendDot color={colors.danger} label={`Inadimplente (${est.inadim || 0})`} />
            </View>
            <View style={styles.legendRow}>
              <LegendDot color={colors.warning} label={`Em análise (${est.emAnalise || 0})`} />
              <LegendDot color={colors.cinzaSoft} label={`Pendente (${est.pendentes || 0})`} />
            </View>
          </View>
        )}
      </Card>

      <Card>
        <CardTitleRow title="Contribuições por Mês" icon="stats-chart-outline" />
        {meses.length === 0 ? (
          <Text style={styles.emptyChart}>Nenhuma contribuição aprovada registrada ainda.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {meses.map((m) => (
              <View key={m.mes}>
                <View style={styles.barRowLabel}>
                  <Text style={styles.barMonth}>{m.mes}</Text>
                  <Text style={styles.barValue}>{formatMoney(m.valor)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.max(4, (m.valor / maiorMes) * 100)}%` }]} />
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <CardTitleRow title="Ações Rápidas" icon="flash-outline" />
        <View style={styles.quickActions}>
          <AdminButton label="Mesa de Operações" icon="file-tray-full-outline" onPress={() => onNavigate('mesa')} />
          <AdminButton label="Enviar Broadcast" icon="megaphone-outline" onPress={() => onNavigate('broadcast')} />
          <AdminButton label="Ver Inadimplentes" icon="bar-chart-outline" onPress={() => onNavigate('relatorios')} />
          <AdminButton label="Monitor ao Vivo" icon="pulse-outline" onPress={() => onNavigate('monitor')} />
        </View>
      </Card>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 11.5, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    width: '47.5%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.sm,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statVal: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  emptyChart: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  stackedBar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: colors.surface },
  legendRow: { flexDirection: 'row', gap: spacing.sm },
  barRowLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barMonth: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  barValue: { fontSize: 12, color: colors.textMuted },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.azulMid, borderRadius: 4 },
  quickActions: { gap: 8 },
});
