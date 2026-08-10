import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { SectionHeader } from './SectionHeader';

const VALORES = [
  {
    icon: <Ionicons name="locate" size={18} color={colors.azulMid} />,
    titulo: 'Missão',
    texto: 'Promover o desenvolvimento social, econômico e comunitário de São Sebastião através da união e cooperação entre seus membros.',
  },
  {
    icon: <MaterialCommunityIcons name="binoculars" size={18} color={colors.azulMid} />,
    titulo: 'Visão',
    texto: 'Ser reconhecida como a principal força de transformação da cidade, referência em gestão associativa no DF.',
  },
  {
    icon: <MaterialCommunityIcons name="diamond-stone" size={18} color={colors.azulMid} />,
    titulo: 'Valores',
    texto: 'Transparência, solidariedade, inclusão, respeito à diversidade e compromisso com o bem-estar coletivo.',
  },
];

export function SobreSection() {
  return (
    <View style={styles.container}>
      <SectionHeader
        label="Nossa identidade"
        title="Mais que uma associação, um movimento"
        subtitle="Nascemos do desejo de transformar São Sebastião em uma cidade mais forte, justa e próspera para todos."
      />

      {VALORES.map((valor) => (
        <View key={valor.titulo} style={styles.valorItem}>
          <View style={styles.valorIcon}>{valor.icon}</View>
          <View style={{ flex: 1 }}>
            <Text style={styles.valorTitulo}>{valor.titulo}</Text>
            <Text style={styles.valorTexto}>{valor.texto}</Text>
          </View>
        </View>
      ))}

      <View style={[styles.visualCard, styles.visualCardMain]}>
        <View style={styles.visualHeader}>
          <Ionicons name="business" size={16} color={colors.white} />
          <Text style={styles.visualHeaderText}>São Sebastião – DF</Text>
        </View>
        <Text style={styles.visualText}>
          Uma cidade vibrante, em constante crescimento, com uma comunidade unida e determinada.
        </Text>
        <View style={styles.tagsRow}>
          {['Comércio local', 'Educação', 'Cultura', 'Desenvolvimento'].map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.smallCardsRow}>
        <View style={[styles.visualCard, styles.visualCardSm]}>
          <MaterialCommunityIcons name="handshake" size={20} color={colors.azulDeep} />
          <Text style={styles.smallCardTitulo}>Parceria e União</Text>
          <Text style={styles.smallCardTexto}>Juntos somos mais fortes</Text>
        </View>
        <View style={[styles.visualCard, styles.visualCardSm, styles.visualCardAccent]}>
          <Ionicons name="trending-up" size={20} color={colors.douradoEscuro} />
          <Text style={styles.smallCardTitulo}>Crescimento</Text>
          <Text style={styles.smallCardTexto}>Novos associados todo mês</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  valorItem: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  valorIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valorTitulo: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  valorTexto: { fontSize: 12.5, color: colors.textMuted, lineHeight: 18 },
  visualCard: { borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  visualCardMain: { backgroundColor: colors.azulDeep, ...shadow.md },
  visualHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  visualHeaderText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  visualText: { color: colors.textOnDarkMuted, fontSize: 12.5, lineHeight: 18, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  tagText: { color: colors.white, fontSize: 11 },
  smallCardsRow: { flexDirection: 'row', gap: spacing.sm },
  visualCardSm: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  visualCardAccent: { backgroundColor: '#fdf6e8' },
  smallCardTitulo: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 8 },
  smallCardTexto: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
});
