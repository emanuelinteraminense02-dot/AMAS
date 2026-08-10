import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export function Footer() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>AMAS</Text>
      <Text style={styles.desc}>
        Associação dedicada ao desenvolvimento social, econômico e comunitário de São Sebastião – DF.
      </Text>
      <View style={styles.divider} />
      <Text style={styles.copy}>© 2026 AMAS – Associação de São Sebastião. Todos os direitos reservados.</Text>
      <Text style={styles.copySub}>Desenvolvido com ♥ para a comunidade</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.azulBright, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  brand: { color: colors.white, fontWeight: '800', fontSize: 18, marginBottom: 8 },
  desc: { color: 'rgba(255,255,255,0.6)', fontSize: 12.5, lineHeight: 19, marginBottom: spacing.lg },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: spacing.md },
  copy: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5 },
  copySub: { color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginTop: 4 },
});
