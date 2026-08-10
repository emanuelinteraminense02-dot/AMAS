import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';
import { getResetsPendentes, processarResetAdmin } from '@/services/adminHelpers';
import { Card, AdminButton, EmptyState, LoadingBlock } from '@/components/admin/AdminUI';
import type { ResetPendente } from '@/types';

interface RecuperacaoSectionProps {
  adminNome?: string;
}

export function RecuperacaoSection({ adminNome }: RecuperacaoSectionProps) {
  const [pendentes, setPendentes] = useState<ResetPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setPendentes(await getResetsPendentes());
    } catch {
      setPendentes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function confirmarReset(p: ResetPendente) {
    Alert.alert(
      'Resetar senha',
      `Resetar a senha de ${p.nome}?\nSenha será redefinida para "123456" e o usuário deverá trocá-la no próximo acesso.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            setProcessandoId(p.id);
            try {
              await processarResetAdmin(p.id, p._colecao, adminNome);
              await carregar();
            } catch (e) {
              Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível resetar.');
            } finally {
              setProcessandoId(null);
            }
          },
        },
      ]
    );
  }

  if (loading) return <LoadingBlock text="Carregando solicitações de reset..." />;

  if (pendentes.length === 0) {
    return (
      <Card>
        <EmptyState text="Nenhuma solicitação de recuperação pendente." icon="key-outline" />
      </Card>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Text style={styles.aviso}>
        ⚠️ Ao confirmar, a senha será redefinida para "123456" e o usuário precisará trocá-la no próximo login.
      </Text>

      {pendentes.map((p) => (
        <Card key={`${p._colecao}-${p.id}`} style={styles.item}>
          <View style={styles.itemHeader}>
            <View style={styles.iconWrap}>
              <Ionicons name={p._colecao === 'usuarios' ? 'business-outline' : 'person-outline'} size={18} color={colors.azulDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nome}>{p.nome}</Text>
              <Text style={styles.sub}>{p.email}</Text>
              <Text style={styles.sub}>{p.tipoLabel}</Text>
              {p.dataResetSolicit ? (
                <Text style={styles.data}>
                  Solicitado em {new Date(p.dataResetSolicit).toLocaleString('pt-BR')}
                </Text>
              ) : null}
            </View>
          </View>

          <AdminButton
            label="Resetar senha para 123456"
            icon="key-outline"
            variant="danger"
            small
            loading={processandoId === p.id}
            onPress={() => confirmarReset(p)}
          />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: { fontSize: 12.5, color: colors.textMuted, backgroundColor: '#fef3c7', padding: spacing.md, borderRadius: 8, lineHeight: 18 },
  item: { gap: 10 },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  nome: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  data: { fontSize: 11, color: colors.textMuted, marginTop: 3, fontStyle: 'italic' },
});
