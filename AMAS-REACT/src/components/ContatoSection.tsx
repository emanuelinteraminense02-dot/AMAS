import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { SectionHeader } from './SectionHeader';

const CONTATOS = [
  { icon: 'location-outline' as const, titulo: 'Endereço', texto: 'Av. Central, s/n – São Sebastião, DF' },
  { icon: 'mail-outline' as const, titulo: 'Email', texto: 'contato@amas.org.br' },
  { icon: 'call-outline' as const, titulo: 'Telefone', texto: '(61) 3000-0000' },
  { icon: 'time-outline' as const, titulo: 'Horário', texto: 'Seg–Sex: 8h às 18h' },
];

interface ContatoSectionProps {
  onAssociar: () => void;
}

export function ContatoSection({ onAssociar }: ContatoSectionProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SectionHeader
        label="Fale conosco"
        title="Entre em contato"
        subtitle="Estamos sempre disponíveis para tirar suas dúvidas e receber sugestões."
      />

      {CONTATOS.map((item) => (
        <View key={item.titulo} style={styles.item}>
          <View style={styles.itemIcon}>
            <Ionicons name={item.icon} size={16} color={colors.azulMid} />
          </View>
          <View>
            <Text style={styles.itemTitulo}>{item.titulo}</Text>
            <Text style={styles.itemTexto}>{item.texto}</Text>
          </View>
        </View>
      ))}

      <View style={styles.ctaCard}>
        <Ionicons name="rocket-outline" size={28} color={colors.white} />
        <Text style={styles.ctaTitle}>Pronto para transformar São Sebastião?</Text>
        <Text style={styles.ctaText}>Junte-se a centenas de associados que já fazem a diferença na nossa cidade.</Text>
        <TouchableOpacity style={styles.ctaBtnPrimary} onPress={onAssociar} activeOpacity={0.9}>
          <Text style={styles.ctaBtnPrimaryText}>Associar-se agora</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaBtnOutline} onPress={() => router.push('/login')} activeOpacity={0.85}>
          <Text style={styles.ctaBtnOutlineText}>Já sou associado – Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitulo: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  itemTexto: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
  ctaCard: {
    backgroundColor: colors.azulDeep,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadow.md,
  },
  ctaTitle: { color: colors.white, fontSize: 17, fontWeight: '800', textAlign: 'center', marginTop: 10, marginBottom: 6 },
  ctaText: { color: colors.textOnDarkMuted, fontSize: 12.5, textAlign: 'center', marginBottom: spacing.md },
  ctaBtnPrimary: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaBtnPrimaryText: { color: colors.azulDeep, fontWeight: '800', fontSize: 14 },
  ctaBtnOutline: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.pill,
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
  },
  ctaBtnOutlineText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
