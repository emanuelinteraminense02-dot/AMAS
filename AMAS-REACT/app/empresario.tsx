import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

// Placeholder – próxima tela da trilha de migração
export default function EmpresarioScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.emoji}>🚧</Text>
        <Text style={s.title}>Portal do Empresário</Text>
        <Text style={s.sub}>Esta tela será migrada em breve.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.azulDeep },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  emoji: { fontSize: 40 },
  title: { fontSize: 18, fontWeight: '800', color: colors.white, textAlign: 'center' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
});
