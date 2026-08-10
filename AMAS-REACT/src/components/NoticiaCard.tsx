import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { formatDataPublica } from '@/utils/format';
import type { CategoriaNoticia, Noticia } from '@/types';

const CAT_ICON: Record<CategoriaNoticia, { lib: 'ion' | 'mci'; name: string }> = {
  comunicado: { lib: 'ion', name: 'megaphone' },
  parceria: { lib: 'mci', name: 'handshake' },
  social: { lib: 'ion', name: 'heart' },
  evento: { lib: 'ion', name: 'calendar' },
  conquista: { lib: 'ion', name: 'trophy' },
  capacitacao: { lib: 'ion', name: 'book' },
};

const CAT_LABEL: Record<CategoriaNoticia, string> = {
  comunicado: 'Comunicado',
  parceria: 'Parceria',
  social: 'Ação Social',
  evento: 'Evento',
  conquista: 'Conquista',
  capacitacao: 'Capacitação',
};

const CAT_COLOR: Record<CategoriaNoticia, string> = {
  comunicado: colors.azulMid,
  parceria: '#0891b2',
  social: '#e11d48',
  evento: '#7c3aed',
  conquista: '#16a34a',
  capacitacao: '#2563eb',
};

function CategoriaIcon({ categoria, color }: { categoria: CategoriaNoticia; color: string }) {
  const icon = CAT_ICON[categoria] ?? { lib: 'ion' as const, name: 'newspaper' };
  if (icon.lib === 'mci') return <MaterialCommunityIcons name={icon.name as never} size={12} color={color} />;
  return <Ionicons name={icon.name as never} size={12} color={color} />;
}

interface NoticiaCardProps {
  noticia: Noticia;
  destaque?: boolean;
  onPress: () => void;
}

export function NoticiaCard({ noticia, destaque, onPress }: NoticiaCardProps) {
  const categoria = (noticia.categoria || 'comunicado') as CategoriaNoticia;
  const cor = CAT_COLOR[categoria] ?? colors.azulMid;

  return (
    <TouchableOpacity
      style={[styles.card, destaque && styles.cardDestaque]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.stripe, { backgroundColor: cor }]} />
      <View style={styles.body}>
        <View style={styles.metaTop}>
          <View style={[styles.catPill, { backgroundColor: `${cor}1A` }]}>
            <CategoriaIcon categoria={categoria} color={cor} />
            <Text style={[styles.catText, { color: cor }]}>{CAT_LABEL[categoria] || categoria}</Text>
          </View>
          {noticia.destaque ? <Text style={styles.destaqueTag}>⭐ Destaque</Text> : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>{noticia.titulo || 'Sem título'}</Text>
        <Text style={styles.resumo} numberOfLines={destaque ? 4 : 2}>
          {noticia.resumo || 'Sem resumo disponível.'}
        </Text>

        <View style={styles.footer}>
          <View style={styles.footerDate}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={styles.footerDateText}>{formatDataPublica(noticia.publicadaEm)}</Text>
          </View>
          <Text style={styles.lerMais}>Ler mais →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  cardDestaque: { ...shadow.md },
  stripe: { width: 4 },
  body: { flex: 1, padding: spacing.md },
  metaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  catText: { fontSize: 10.5, fontWeight: '700' },
  destaqueTag: { fontSize: 10.5, color: colors.douradoEscuro, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  resumo: { fontSize: 12.5, color: colors.textMuted, lineHeight: 18, marginBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerDate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerDateText: { fontSize: 11, color: colors.textMuted },
  lerMais: { fontSize: 11.5, color: colors.azulMid, fontWeight: '700' },
});
