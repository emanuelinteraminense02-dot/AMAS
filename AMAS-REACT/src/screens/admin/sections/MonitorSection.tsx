import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';
import { apiAdmin } from '@/services/api';
import { Card, CardTitleRow, AdminButton, EmptyState, LoadingBlock } from '@/components/admin/AdminUI';
import type { LogEntry, PerfilLog } from '@/types';

const ICON_MAP: Record<PerfilLog, keyof typeof Ionicons.glyphMap> = {
  admin: 'shield-outline',
  associado: 'person-outline',
  empresario: 'business-outline',
  sistema: 'hardware-chip-outline',
};

const PERFIL_LABEL: Record<PerfilLog, string> = {
  admin: 'Admin',
  associado: 'Associado',
  empresario: 'Empresário',
  sistema: 'Sistema',
};

function timeDiff(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora há pouco';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return new Date(iso).toLocaleString('pt-BR');
}

export function MonitorSection() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setLog((await apiAdmin.getLog()) as LogEntry[]);
    } catch {
      setLog([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <CardTitleRow
          title="Monitor de Atividades"
          icon="pulse-outline"
          action={<AdminButton label="Atualizar" icon="refresh-outline" small onPress={carregar} />}
        />
        {loading ? (
          <LoadingBlock text="Carregando log..." />
        ) : log.length === 0 ? (
          <EmptyState text="Nenhuma atividade registrada." icon="time-outline" />
        ) : (
          <View style={{ gap: 10 }}>
            {log.map((l, i) => (
              <View key={l.id ?? i} style={styles.item}>
                <View style={styles.iconWrap}>
                  <Ionicons name={ICON_MAP[l.perfil] || 'help-outline'} size={16} color={colors.azulDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.acao}>{l.acao}</Text>
                  <Text style={styles.meta}>{l.usuario} · {timeDiff(l.data)}</Text>
                  {l.detalhes ? <Text style={styles.det}>{l.detalhes}</Text> : null}
                </View>
                <View style={styles.perfilTag}>
                  <Text style={styles.perfilTagText}>{PERFIL_LABEL[l.perfil] || l.perfil}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  acao: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  det: { fontSize: 11.5, color: colors.textSecondary, marginTop: 3 },
  perfilTag: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  perfilTagText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
});
