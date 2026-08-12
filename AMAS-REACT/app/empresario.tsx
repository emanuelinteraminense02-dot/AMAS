import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { sessaoStorage } from '@/services/api';
import { registrarLog } from '@/services/adminHelpers';
import type { Sessao } from '@/types';

// Placeholder – próxima tela da trilha de migração
export default function EmpresarioScreen() {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);

  useEffect(() => {
    (async () => {
      const sessaoAtual = await sessaoStorage.get();
      if (!sessaoAtual || sessaoAtual.perfil !== 'empresario') {
        router.replace('/login');
        return;
      }
      setSessao(sessaoAtual);
    })();
  }, [router]);

  function logout() {
    if (sessao) registrarLog('Logout', sessao.nome, 'empresario', 'Sessão encerrada');
    setSessao(null);
    void sessaoStorage.clear().finally(() => router.replace('/login'));
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.emoji}>🚧</Text>
        <Text style={s.title}>Portal do Empresário</Text>
        <Text style={s.sub}>Esta tela será migrada em breve.</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <Text style={s.logoutText}>Sair</Text>
        </TouchableOpacity>
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
  logoutBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  logoutText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
