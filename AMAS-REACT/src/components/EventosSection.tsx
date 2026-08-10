import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';
import { SectionHeader } from './SectionHeader';
import { EventoRow } from './EventoRow';
import type { Evento } from '@/types';

const EVENTOS_INICIAL = 3;

interface EventosSectionProps {
  eventos: Evento[];
  erro: boolean;
}

export function EventosSection({ eventos, erro }: EventosSectionProps) {
  const [expandido, setExpandido] = useState(false);

  const visiveisOrdenados = useMemo(() => {
    return eventos
      .filter((evento) => {
        const status = evento.status || 'Aberto';
        if (status === 'Cancelado') return false;
        if (status === 'Encerrado') return Boolean(evento.destaque);
        return true;
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [eventos]);

  const temMais = visiveisOrdenados.length > EVENTOS_INICIAL;
  const visiveis = expandido ? visiveisOrdenados : visiveisOrdenados.slice(0, EVENTOS_INICIAL);

  return (
    <View style={styles.container}>
      <SectionHeader label="Agenda AMAS" title="Próximos eventos" />

      {erro ? (
        <Text style={styles.placeholder}>Não foi possível carregar os eventos agora.</Text>
      ) : visiveisOrdenados.length === 0 ? (
        <Text style={styles.placeholder}>Nenhum evento programado no momento.</Text>
      ) : (
        <>
          {visiveis.map((evento) => (
            <EventoRow key={evento.id} evento={evento} />
          ))}

          {temMais ? (
            <TouchableOpacity style={styles.verMaisBtn} onPress={() => setExpandido((v) => !v)} activeOpacity={0.8}>
              <Text style={styles.verMaisText}>
                {expandido ? 'Ver menos' : `Ver todos os ${visiveisOrdenados.length} eventos`}
              </Text>
              <Ionicons name={expandido ? 'chevron-up' : 'chevron-down'} size={15} color={colors.azulMid} />
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, backgroundColor: colors.surface },
  placeholder: { color: colors.textMuted, fontSize: 13.5, textAlign: 'center', paddingVertical: spacing.lg },
  verMaisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    marginTop: 4,
    backgroundColor: colors.bgCard,
  },
  verMaisText: { color: colors.azulMid, fontWeight: '700', fontSize: 13 },
});
