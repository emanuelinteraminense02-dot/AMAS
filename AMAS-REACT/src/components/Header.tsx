import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/constants/theme';

export function Header() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Image source={require('../../assets/logo-amas.png')} style={styles.logoImage} />
        <Text style={styles.logoText}>AMAS</Text>
      </View>

      <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')} activeOpacity={0.85}>
        <Ionicons name="log-in-outline" size={16} color={colors.white} />
        <Text style={styles.loginBtnText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 32, height: 32, borderRadius: 16 },
  logoText: { color: colors.azulDeep, fontWeight: '800', fontSize: 18, letterSpacing: 0.3 },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.azulDeep,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  loginBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
