import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { SectionHeader } from './SectionHeader';

const BENEFICIOS = [
  {
    icon: <Ionicons name="business-outline" size={20} color={colors.azulMid} />,
    titulo: 'Descontos em parceiros',
    texto: 'Acesse descontos e condições especiais em empresas parceiras da AMAS espalhadas por toda São Sebastião.',
  },
  {
    icon: <Ionicons name="globe-outline" size={20} color={colors.white} />,
    titulo: 'Rede de conexões',
    texto: 'Conecte-se com líderes, empreendedores e profissionais que compartilham do mesmo propósito de transformação.',
    featured: true,
  },
  {
    icon: <Ionicons name="book-outline" size={20} color={colors.azulMid} />,
    titulo: 'Capacitações e cursos',
    texto: 'Acesso prioritário a treinamentos, workshops e eventos voltados ao desenvolvimento pessoal e profissional.',
  },
  {
    icon: <Ionicons name="people-outline" size={20} color={colors.azulMid} />,
    titulo: 'Voz ativa',
    texto: 'Participe das assembleias e decisões da associação. Sua opinião conta e molda o futuro da AMAS.',
  },
  {
    icon: <Ionicons name="shield-checkmark-outline" size={20} color={colors.azulMid} />,
    titulo: 'Reconhecimento oficial',
    texto: 'Receba sua carteirinha e seja reconhecido como parte integrante da transformação de São Sebastião.',
  },
  {
    icon: <MaterialCommunityIcons name="hand-heart" size={20} color={colors.azulMid} />,
    titulo: 'Ações sociais',
    texto: 'Participe de mutirões, campanhas solidárias e iniciativas que fazem a diferença na vida da comunidade.',
  },
];

export function BeneficiosSection() {
  return (
    <View style={styles.container}>
      <SectionHeader
        label="Por que se associar"
        title="Benefícios exclusivos para nossos membros"
        subtitle="Faça parte de uma rede que valoriza cada membro e trabalha pelo bem de todos."
      />

      {BENEFICIOS.map((b) => (
        <View key={b.titulo} style={[styles.card, b.featured && styles.cardFeatured]}>
          {b.featured ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Mais popular</Text>
            </View>
          ) : null}
          <View style={[styles.iconWrap, b.featured && styles.iconWrapFeatured]}>{b.icon}</View>
          <Text style={[styles.cardTitulo, b.featured && styles.textOnDark]}>{b.titulo}</Text>
          <Text style={[styles.cardTexto, b.featured && styles.textOnDarkMuted]}>{b.texto}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  cardFeatured: { backgroundColor: colors.azulDeep, ...shadow.md },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.douradoClaro,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 8,
  },
  badgeText: { fontSize: 10.5, fontWeight: '800', color: colors.azulDeep },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconWrapFeatured: { backgroundColor: 'rgba(255,255,255,0.12)' },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  cardTexto: { fontSize: 12.5, color: colors.textMuted, lineHeight: 18 },
  textOnDark: { color: colors.white },
  textOnDarkMuted: { color: colors.textOnDarkMuted },
});
