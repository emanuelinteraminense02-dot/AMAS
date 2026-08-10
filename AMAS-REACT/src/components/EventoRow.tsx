import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { diasRestantes, mesAbrev } from '@/utils/format';
import type { Evento, TipoEvento } from '@/types';

const TIPO_ICON: Record<TipoEvento, { lib: 'ion' | 'mci'; name: string }> = {
  social: { lib: 'ion', name: 'heart' },
  capacitacao: { lib: 'ion', name: 'book' },
  parceria: { lib: 'mci', name: 'handshake' },
  cultural: { lib: 'ion', name: 'sparkles' },
  reuniao: { lib: 'ion', name: 'people' },
};

const TIPO_LABEL: Record<TipoEvento, string> = {
  social: 'Ação Social',
  capacitacao: 'Capacitação',
  parceria: 'Parceria',
  cultural: 'Cultural',
  reuniao: 'Assembleia',
};

const COUNTDOWN_COLOR: Record<string, string> = {
  enc: colors.textMuted,
  embreve: colors.warning,
  realizado: colors.textMuted,
  hoje: colors.danger,
  breve: colors.warning,
  futuro: colors.success,
};

function TipoIcon({ tipo, color }: { tipo: TipoEvento; color: string }) {
  const icon = TIPO_ICON[tipo] ?? { lib: 'ion' as const, name: 'calendar' };
  if (icon.lib === 'mci') return <MaterialCommunityIcons name={icon.name as never} size={11} color={color} />;
  return <Ionicons name={icon.name as never} size={11} color={color} />;
}

interface EventoRowProps {
  evento: Evento;
}

export function EventoRow({ evento }: EventoRowProps) {
  const [, month, day] = (evento.data || '').split('-');
  const status = evento.status || 'Aberto';
  const countdown = diasRestantes(evento.data, status);
  const vagasTotais = Number(evento.vagasTotais ?? evento.vagas ?? 0);
  const inscritos = Number(evento.inscricoes ?? 0);
  const vagasRestantes = vagasTotais > 0 ? Math.max(0, vagasTotais - inscritos) : null;
  const percentual = vagasTotais > 0 ? Math.min(100, Math.round((inscritos / vagasTotais) * 100)) : null;
  const corBarra = percentual === null ? colors.success : percentual >= 90 ? colors.danger : percentual >= 60 ? colors.warning : colors.success;
  const tipo = (evento.tipo || 'social') as TipoEvento;

  const statusBadge =
    status === 'Aberto'
      ? { text: 'Inscrições abertas', bg: '#dcfce7', color: '#15803d' }
      : status === 'Em Breve'
        ? { text: 'Em breve', bg: '#fef3c7', color: '#b45309' }
        : { text: 'Encerrado', bg: '#e5e7eb', color: '#4b5563' };

  return (
    <View style={styles.row}>
      <View style={styles.dateBlock}>
        <Text style={styles.day}>{day || '--'}</Text>
        <Text style={styles.month}>{mesAbrev(month)}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.badgesRow}>
          <View style={styles.tipoPill}>
            <TipoIcon tipo={tipo} color={colors.azulDeep} />
            <Text style={styles.tipoText}>{TIPO_LABEL[tipo] || tipo}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}>
            <Text style={[styles.statusText, { color: statusBadge.color }]}>{statusBadge.text}</Text>
          </View>
        </View>

        <Text style={styles.titulo} numberOfLines={2}>{evento.titulo || 'Evento sem título'}</Text>
        <Text style={styles.desc} numberOfLines={2}>{evento.descricao || 'Descrição não informada.'}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{evento.horario || 'Horário a confirmar'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{evento.local || 'Local a confirmar'}</Text>
          </View>
        </View>

        {percentual !== null && status !== 'Encerrado' ? (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percentual}%`, backgroundColor: corBarra }]} />
            </View>
            <Text style={styles.progressLabel}>
              {vagasRestantes === 0
                ? 'Esgotado'
                : `${vagasRestantes} vaga${vagasRestantes === 1 ? '' : 's'} restante${vagasRestantes === 1 ? '' : 's'}`}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.countdown, { color: COUNTDOWN_COLOR[countdown.cls] }]}>{countdown.txt}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  dateBlock: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 8,
  },
  day: { fontSize: 20, fontWeight: '800', color: colors.azulDeep },
  month: { fontSize: 11, color: colors.douradoEscuro, fontWeight: '700', textTransform: 'uppercase' },
  info: { flex: 1 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tipoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  tipoText: { fontSize: 10.5, fontWeight: '700', color: colors.azulDeep },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  statusText: { fontSize: 10.5, fontWeight: '700' },
  titulo: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  desc: { fontSize: 12.5, color: colors.textMuted, lineHeight: 18, marginBottom: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11.5, color: colors.textMuted },
  progressWrap: { marginBottom: 6 },
  progressTrack: { height: 5, backgroundColor: colors.surface, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  progressLabel: { fontSize: 10.5, color: colors.textMuted, marginTop: 3 },
  countdown: { fontSize: 11.5, fontWeight: '800', alignSelf: 'flex-start' },
});
