import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { apiAssociados } from '@/services/api';
import { formatDataCurta, formatMoney } from '@/utils/format';
import { Card, CardTitleRow, AdminButton, LoadingBlock } from '@/components/admin/AdminUI';
import { ModalSheet } from '@/components/admin/ModalSheet';
import type { Associado, StatusAssociado } from '@/types';

interface ParcelaAtraso {
  mes: string;
  vencimento?: string;
  valor: number;
}

const STATUS_CONFIG: Record<StatusAssociado, { icon: keyof typeof Ionicons.glyphMap; color: string; desc: string }> = {
  'Regular':      { icon: 'checkmark-circle', color: colors.success, desc: 'Você está em dia com suas contribuições. Continue assim!' },
  'Inadimplente': { icon: 'close-circle',     color: colors.danger,  desc: 'Você possui contribuições em atraso. Regularize para manter seus benefícios.' },
  'Em análise':   { icon: 'hourglass',        color: colors.warning, desc: 'Seu comprovante está sendo analisado. Aguarde a confirmação.' },
  'Pendente':     { icon: 'ellipse-outline',  color: colors.textMuted, desc: 'Você ainda não enviou sua contribuição deste mês.' },
};

interface FinanceiroSectionProps {
  assoc: Associado;
  onUpdated: () => Promise<void>;
  onNavigateEnviar: () => void;
}

export function FinanceiroSection({ assoc, onUpdated, onNavigateEnviar }: FinanceiroSectionProps) {
  const [parcela, setParcela] = useState<ParcelaAtraso | null>(null);
  const [obs, setObs] = useState('');
  const [enviando, setEnviando] = useState(false);

  const status = (assoc.status || 'Pendente') as StatusAssociado;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pendente'];
  const parcelas: ParcelaAtraso[] = (assoc.parcelasAtraso as ParcelaAtraso[] | undefined) || [];
  const historico = (assoc.historico as { status?: string; mes?: string; data?: string; msgAdmin?: string }[] | undefined) || [];
  const msgsAdmin = historico.filter((c) => c.msgAdmin);

  async function pagarParcela() {
    if (!parcela) return;
    if (!obs.trim()) {
      Alert.alert('Atenção', 'Descreva brevemente o comprovante.');
      return;
    }
    setEnviando(true);
    try {
      await apiAssociados.adicionarContribuicao(assoc.id, {
        valor: parcela.valor,
        arquivo: 'comprovante_parcela.pdf',
        mes: parcela.mes,
        status: 'Em análise',
        observacoes: obs.trim() || 'Pagamento de parcela em atraso',
      });
      // Remove parcela paga da lista
      const novasParcelas = parcelas.filter((p) => p.mes !== parcela.mes);
      await apiAssociados.atualizar(assoc.id, { parcelasAtraso: novasParcelas });
      await onUpdated();
      setParcela(null);
      setObs('');
      Alert.alert('Enviado!', 'Pagamento registrado. Aguarde análise do administrador.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível registrar o pagamento.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      {/* Status card */}
      <Card style={styles.statusCard}>
        <Ionicons name={cfg.icon} size={36} color={cfg.color} />
        <Text style={[styles.statusText, { color: cfg.color }]}>{status}</Text>
        <Text style={styles.statusDesc}>{cfg.desc}</Text>
        {status !== 'Regular' && (
          <AdminButton label="Enviar comprovante" icon="cloud-upload-outline" variant="primary" fullWidth onPress={onNavigateEnviar} />
        )}
      </Card>

      {/* Parcelas em atraso */}
      <Card>
        <CardTitleRow title="Parcelas em Atraso" icon="warning-outline" />
        {parcelas.length === 0 ? (
          <View style={styles.emptyRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.emptyText}>Nenhuma parcela em atraso.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {parcelas.map((p, i) => (
              <View key={i} style={styles.parcelaItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.parcelaMes}>{p.mes}</Text>
                  {p.vencimento ? (
                    <Text style={styles.parcelaVenc}>Vencimento: {formatDataCurta(p.vencimento)}</Text>
                  ) : null}
                </View>
                <Text style={styles.parcelaValor}>{formatMoney(p.valor)}</Text>
                <AdminButton
                  label="Pagar"
                  icon="card-outline"
                  variant="primary"
                  small
                  onPress={() => { setParcela(p); setObs(''); }}
                />
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Mensagens do admin */}
      {msgsAdmin.length > 0 && (
        <Card>
          <CardTitleRow title="Mensagens do Administrador" icon="mail-unread-outline" />
          <View style={{ gap: spacing.sm }}>
            {msgsAdmin.map((c, i) => (
              <View key={i} style={styles.msgAdminItem}>
                <Text style={styles.msgAdminHeader}>
                  📋 Ref: {c.mes || c.data} — {c.status}
                </Text>
                <Text style={styles.msgAdminTexto}>{c.msgAdmin}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Modal pagamento parcela */}
      <ModalSheet
        visible={!!parcela}
        onClose={() => setParcela(null)}
        title="Registrar Pagamento"
        subtitle={parcela ? `${parcela.mes} — ${formatMoney(parcela.valor)}` : undefined}
        footer={
          <>
            <AdminButton label="Cancelar" onPress={() => setParcela(null)} variant="outline" fullWidth />
            <AdminButton label="Confirmar" onPress={pagarParcela} variant="primary" fullWidth loading={enviando} />
          </>
        }
      >
        <Text style={styles.fieldLabel}>Observação / descrição do comprovante *</Text>
        <TextInput
          style={styles.textarea}
          value={obs}
          onChangeText={setObs}
          placeholder="Ex: Pago via PIX em 10/07/2026..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />
        <Text style={styles.aviso}>
          ⚠️ Após confirmar, o administrador analisará seu pagamento e atualizará sua situação.
        </Text>
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  statusText: { fontSize: 18, fontWeight: '800' },
  statusDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  emptyText: { color: colors.success, fontSize: 12.5, fontWeight: '600' },
  parcelaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  parcelaMes: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  parcelaVenc: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  parcelaValor: { fontSize: 13.5, fontWeight: '700', color: colors.danger },
  msgAdminItem: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.sm },
  msgAdminHeader: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  msgAdminTexto: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  textarea: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5,
    color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  aviso: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
});
