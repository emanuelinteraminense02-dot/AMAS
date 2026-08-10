import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiMensagens } from '@/services/api';
import { Card, CardTitleRow, AdminButton, EmptyState, LoadingBlock } from '@/components/admin/AdminUI';
import type { Mensagem } from '@/types';

const DESTINATARIOS: { label: string; value: Mensagem['destinatarios'] }[] = [
  { label: 'Todos (Associados + Empresários)', value: 'todos' },
  { label: 'Apenas Associados', value: 'associados' },
  { label: 'Apenas Empresários', value: 'empresarios' },
];

export function BroadcastSection() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [destino, setDestino] = useState<Mensagem['destinatarios']>('todos');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setMensagens((await apiMensagens.listar()) as Mensagem[]);
    } catch {
      setMensagens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function enviar() {
    if (!titulo.trim() || !corpo.trim()) {
      Alert.alert('Atenção', 'Preencha título e conteúdo.');
      return;
    }
    setEnviando(true);
    try {
      await apiMensagens.enviar({ titulo: titulo.trim(), corpo: corpo.trim(), destinatarios: destino, remetente: 'Administrador AMAS' });
      setTitulo('');
      setCorpo('');
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível enviar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <CardTitleRow title="Disparar Mensagem" icon="megaphone-outline" />

        <Text style={styles.label}>Destinatários *</Text>
        <View style={{ gap: 8, marginBottom: spacing.sm }}>
          {DESTINATARIOS.map((d) => (
            <TouchableOpacity
              key={d.value}
              onPress={() => setDestino(d.value)}
              style={[styles.destChip, destino === d.value && styles.destChipActive]}
            >
              <View style={[styles.radio, destino === d.value && styles.radioActive]} />
              <Text style={[styles.destChipText, destino === d.value && styles.destChipTextActive]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Título da mensagem *</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ex: Aviso de assembleia"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Conteúdo *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={corpo}
          onChangeText={setCorpo}
          placeholder="Redija aqui o comunicado completo..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={6}
        />

        <AdminButton label="Enviar para todos" icon="send" variant="primary" fullWidth loading={enviando} onPress={enviar} />
      </Card>

      <Card>
        <CardTitleRow title="Mensagens Enviadas" icon="mail-open-outline" />
        {loading ? (
          <LoadingBlock text="Carregando mensagens..." />
        ) : mensagens.length === 0 ? (
          <EmptyState text="Nenhuma mensagem enviada ainda." icon="mail-outline" />
        ) : (
          <View style={{ gap: 10 }}>
            {mensagens.map((m) => (
              <View key={m.id} style={styles.msgItem}>
                <Text style={styles.msgTitulo}>{m.titulo}</Text>
                <Text style={styles.msgMeta}>Para: {m.destinatarios} · {new Date(m.data).toLocaleString('pt-BR')}</Text>
                <Text style={styles.msgMeta}>✓ {(m.lidas || []).length} lida(s)</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  destChip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  destChipActive: { borderColor: colors.azulDeep, backgroundColor: `${colors.azulDeep}0D` },
  destChipText: { fontSize: 12.5, color: colors.textSecondary },
  destChipTextActive: { color: colors.azulDeep, fontWeight: '700' },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.azulDeep, backgroundColor: colors.azulDeep },
  msgItem: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  msgTitulo: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  msgMeta: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
});
