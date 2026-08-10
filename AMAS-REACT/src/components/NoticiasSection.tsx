import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';
import { SectionHeader } from './SectionHeader';
import { NoticiaCard } from './NoticiaCard';
import { NoticiaModal } from './NoticiaModal';
import type { Noticia } from '@/types';

const NOTICIAS_INICIAL = 3;

interface NoticiasSectionProps {
  noticias: Noticia[];
  erro: boolean;
}

export function NoticiasSection({ noticias, erro }: NoticiasSectionProps) {
  const [expandido, setExpandido] = useState(false);
  const [selecionada, setSelecionada] = useState<Noticia | null>(null);

  const temMais = noticias.length > NOTICIAS_INICIAL;
  const visiveis = expandido ? noticias : noticias.slice(0, NOTICIAS_INICIAL);

  return (
    <View style={styles.container}>
      <SectionHeader label="Fique por dentro" title="Últimas notícias" />

      {erro ? (
        <Text style={styles.placeholder}>Não foi possível carregar as notícias agora.</Text>
      ) : noticias.length === 0 ? (
        <Text style={styles.placeholder}>Nenhuma notícia publicada ainda.</Text>
      ) : (
        <>
          {visiveis.map((noticia, index) => (
            <NoticiaCard
              key={noticia.id}
              noticia={noticia}
              destaque={Boolean(noticia.destaque) && index === 0}
              onPress={() => setSelecionada(noticia)}
            />
          ))}

          {temMais ? (
            <TouchableOpacity style={styles.verMaisBtn} onPress={() => setExpandido((v) => !v)} activeOpacity={0.8}>
              <Text style={styles.verMaisText}>
                {expandido ? 'Ver menos' : `Ver todas as ${noticias.length} notícias`}
              </Text>
              <Ionicons name={expandido ? 'chevron-up' : 'chevron-down'} size={15} color={colors.azulMid} />
            </TouchableOpacity>
          ) : null}
        </>
      )}

      <NoticiaModal noticia={selecionada} onClose={() => setSelecionada(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
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
  },
  verMaisText: { color: colors.azulMid, fontWeight: '700', fontSize: 13 },
});
