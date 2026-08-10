import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';
import { formatDataPublica } from '@/utils/format';
import type { Noticia } from '@/types';

interface NoticiaModalProps {
  noticia: Noticia | null;
  onClose: () => void;
}

export function NoticiaModal({ noticia, onClose }: NoticiaModalProps) {
  return (
    <Modal visible={!!noticia} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>{noticia?.titulo || 'Notícia'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body}>
            <Text style={styles.meta}>
              {formatDataPublica(noticia?.publicadaEm)} · ✍️ {noticia?.autor || 'AMAS'}
            </Text>
            {noticia?.resumo ? <Text style={styles.resumo}>{noticia.resumo}</Text> : null}
            <Text style={styles.conteudo}>{noticia?.conteudo || ''}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,17,32,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '80%',
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  meta: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  resumo: {
    fontSize: 13.5,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: 20,
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  conteudo: { fontSize: 14, color: colors.textPrimary, lineHeight: 22, paddingBottom: spacing.lg },
});
