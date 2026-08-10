import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';
import { apiMensagens } from '@/services/api';
import { Card, EmptyState, LoadingBlock } from '@/components/admin/AdminUI';
import type { Mensagem } from '@/types';

interface MensagensSectionProps {
  assocId: number;
  onBadgeChange: (n: number) => void;
}

export function MensagensSection({ assocId, onBadgeChange }: MensagensSectionProps) {
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const todas = (await apiMensagens.listarAssociados()) as Mensagem[];
      // Filtra mensagens destinadas a este associado (todos ou associados)
      const minhas = todas.filter(
        (m) => m.destinatarios === 'todos' || m.destinatarios === 'associados'
      );
      setMsgs(minhas);
      const naoLidas = minhas.filter((m) => !(m.lidas || []).includes(assocId)).length;
      onBadgeChange(naoLidas);
    } catch {
      setMsgs([]);
    } finally {
      setLoading(false);
    }
  }, [assocId, onBadgeChange]);

  useEffect(() => { carregar(); }, [carregar]);

  async function marcarLida(msg: Mensagem) {
    if ((msg.lidas || []).includes(assocId)) return;
    try {
      await apiMensagens.marcarLida(msg.id, assocId);
      await carregar();
    } catch {
      Alert.alert('Erro', 'Não foi possível marcar como lida.');
    }
  }

  if (loading) return <LoadingBlock text="Carregando mensagens..." />;

  if (msgs.length === 0) {
    return <Card><EmptyState text="Nenhuma mensagem recebida ainda." icon="mail-outline" /></Card>;
  }

  return (
    <View style={{ gap: spacing.md }}>
      {msgs.map((m) => {
        const lida = (m.lidas || []).includes(assocId);
        return (
          <View key={m.id} style={[styles.card, !lida && styles.cardNaoLida]}>
            {!lida && <View style={styles.dotIndicator} />}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.titulo, !lida && styles.tituloNaoLido]}>
                  {m.titulo}
                </Text>
                <Text style={styles.meta}>
                  De: {m.remetente || 'AMAS'} · {new Date(m.data).toLocaleString('pt-BR')}
                </Text>
              </View>
              {lida
                ? <View style={styles.lidaBadge}><Text style={styles.lidaText}>Lida</Text></View>
                : (
                  <TouchableOpacity onPress={() => marcarLida(m)} style={styles.marcarBtn} activeOpacity={0.8}>
                    <Text style={styles.marcarBtnText}>Marcar lida</Text>
                  </TouchableOpacity>
                )
              }
            </View>
            <Text style={styles.corpo}>{m.corpo}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardNaoLida: {
    borderColor: `${colors.azulDeep}40`,
    backgroundColor: `${colors.azulDeep}06`,
  },
  dotIndicator: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.azulMid,
    marginBottom: 8,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  titulo: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  tituloNaoLido: { fontWeight: '800' },
  meta: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  lidaBadge: {
    backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill,
  },
  lidaText: { fontSize: 10.5, color: '#15803d', fontWeight: '700' },
  marcarBtn: {
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill,
  },
  marcarBtnText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  corpo: { fontSize: 13.5, color: colors.textSecondary, lineHeight: 20 },
});
