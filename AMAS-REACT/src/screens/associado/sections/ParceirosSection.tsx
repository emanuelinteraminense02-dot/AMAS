import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { apiEmpresarios } from '@/services/api';
import { formatDataCurta } from '@/utils/format';
import { Card, EmptyState, LoadingBlock, SearchInput } from '@/components/admin/AdminUI';
import type { ContratoEmpresa, Empresario } from '@/types';

interface EmpresaNormalizada extends Empresario {
  contrato: ContratoEmpresa;
}

function normalizarEmpresa(emp: Empresario): EmpresaNormalizada {
  let contrato: ContratoEmpresa = {};
  if (emp.contrato) {
    contrato = typeof emp.contrato === 'string'
      ? (() => { try { return JSON.parse(emp.contrato as string); } catch { return {}; } })()
      : emp.contrato as ContratoEmpresa;
  }
  return { ...emp, contrato };
}

function contratoValidado(c: ContratoEmpresa) {
  return c?.beneficiosValidados === true || (c?.beneficiosValidados as unknown) === 'true';
}

export function ParceirosSection() {
  const [todas, setTodas] = useState<EmpresaNormalizada[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const emps = (await apiEmpresarios.listar()) as Empresario[];
        const valid = emps
          .map(normalizarEmpresa)
          .filter((e) => e.contrato.beneficioOfertado && contratoValidado(e.contrato));
        setTodas(valid);
      } catch {
        setTodas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtradas = useMemo(() => {
    const b = busca.toLowerCase().trim();
    if (!b) return todas;
    return todas.filter(
      (e) =>
        e.nome.toLowerCase().includes(b) ||
        (e.contrato.beneficioOfertado || '').toLowerCase().includes(b)
    );
  }, [todas, busca]);

  if (loading) return <LoadingBlock text="Carregando parceiros..." />;

  return (
    <View style={{ gap: spacing.md }}>
      <SearchInput value={busca} onChangeText={setBusca} placeholder="Buscar empresa ou benefício..." />

      {filtradas.length === 0 ? (
        <Card>
          <EmptyState
            text={busca ? `Nenhuma empresa encontrada para "${busca}".` : 'Nenhuma empresa parceira disponível no momento.'}
            icon="storefront-outline"
          />
        </Card>
      ) : (
        filtradas.map((emp) => {
          const c = emp.contrato;
          const vig = c.dataVigencia ? formatDataCurta(c.dataVigencia) : null;
          return (
            <View key={emp.id} style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons name="business" size={20} color={colors.azulDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{emp.nome}</Text>
                  <Text style={styles.tipo}>{c.tipoAcordo || 'Empresa Parceira'}</Text>
                </View>
                <View style={styles.validadoBadge}>
                  <Ionicons name="shield-checkmark" size={11} color="#15803d" />
                  <Text style={styles.validadoText}>Validado</Text>
                </View>
              </View>

              {/* Benefício destaque */}
              <View style={styles.beneficioBlock}>
                <Text style={styles.beneficioLabel}>Benefício exclusivo para associados</Text>
                <Text style={styles.beneficioValor}>{c.beneficioOfertado}</Text>
              </View>

              {/* Detalhes */}
              {c.descricaoBeneficios ? (
                <Text style={styles.desc}>{c.descricaoBeneficios}</Text>
              ) : null}

              {c.regrasUtilizacao ? (
                <View style={styles.regrasBlock}>
                  <Ionicons name="information-circle-outline" size={13} color={colors.azulMid} />
                  <Text style={styles.regrasText}>{c.regrasUtilizacao}</Text>
                </View>
              ) : null}

              {/* Footer */}
              <View style={styles.footer}>
                {emp.telefone ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.metaText}>{emp.telefone}</Text>
                  </View>
                ) : null}
                {vig ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.metaText}>Válido até {vig}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })
      )}

      <Text style={styles.count}>
        {filtradas.length} empresa{filtradas.length !== 1 ? 's' : ''} parceira{filtradas.length !== 1 ? 's' : ''} disponível{filtradas.length !== 1 ? 'is' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: spacing.md, ...shadow.sm, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  nome: { fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  tipo: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  validadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill,
  },
  validadoText: { fontSize: 10, fontWeight: '700', color: '#15803d' },
  beneficioBlock: {
    backgroundColor: `${colors.azulDeep}0A`,
    borderRadius: radius.sm, padding: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: colors.azulMid,
  },
  beneficioLabel: { fontSize: 10.5, fontWeight: '700', color: colors.azulMid, marginBottom: 3 },
  beneficioValor: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary },
  desc: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  regrasBlock: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  regrasText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11.5, color: colors.textMuted },
  count: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
});
