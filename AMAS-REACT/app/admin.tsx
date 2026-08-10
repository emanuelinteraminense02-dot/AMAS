import { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { sessaoStorage } from '@/services/api';
import { apiAdmin, apiAssociados, apiEmpresarios } from '@/services/api';
import { registrarLog } from '@/services/adminHelpers';
import { Topbar } from '@/screens/admin/components/Topbar';
import { Sidebar } from '@/screens/admin/components/Sidebar';
import { ADMIN_NAV, AdminSection } from '@/screens/admin/adminNav';
import { LoadingBlock } from '@/components/admin/AdminUI';

// Sections
import { DashboardSection } from '@/screens/admin/sections/DashboardSection';
import { MesaSection } from '@/screens/admin/sections/MesaSection';
import { AssociadosSection } from '@/screens/admin/sections/AssociadosSection';
import { BroadcastSection } from '@/screens/admin/sections/BroadcastSection';
import { AlertasSection } from '@/screens/admin/sections/AlertasSection';
import { ContratosSection } from '@/screens/admin/sections/ContratosSection';
import { RelatoriosSection } from '@/screens/admin/sections/RelatoriosSection';
import { MonitorSection } from '@/screens/admin/sections/MonitorSection';
import { NoticiasAdminSection } from '@/screens/admin/sections/NoticiasAdminSection';
import { EventosAdminSection } from '@/screens/admin/sections/EventosAdminSection';
import { SolicitacoesSection } from '@/screens/admin/sections/SolicitacoesSection';
import { RecuperacaoSection } from '@/screens/admin/sections/RecuperacaoSection';
import type { Sessao } from '@/types';

export default function AdminScreen() {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [checando, setChecando] = useState(true);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [secaoAtiva, setSecaoAtiva] = useState<AdminSection>('dashboard');
  const scrollRef = useRef<ScrollView>(null);

  // Badge counters
  const [badgeMesa, setBadgeMesa] = useState(0);
  const [badgeAlertas, setBadgeAlertas] = useState(0);
  const [badgeRecuperacao, setBadgeRecuperacao] = useState(0);

  // ─── Session guard ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const s = await sessaoStorage.get();
      if (!s || s.perfil !== 'admin') {
        router.replace('/login');
        return;
      }
      setSessao(s);
      setChecando(false);
    })();
  }, [router]);

  // ─── Badge counts ──────────────────────────────────────────────
  const carregarBadges = useCallback(async () => {
    try {
      const [assocs, emps, alertas, solics] = await Promise.allSettled([
        apiAssociados.listar(),
        apiEmpresarios.listar(),
        apiAdmin.getAlertas(),
        apiAdmin.getSolicitacoes(),
      ]);

      // Mesa: contribuições "Em análise"
      if (assocs.status === 'fulfilled') {
        const list = assocs.value as { id: number }[];
        const contribs = await Promise.all(
          list.map((a) =>
            apiAssociados.getContribuicoes(a.id).catch(() => []) as Promise<{ status?: string }[]>
          )
        );
        const pendentes = contribs.flat().filter((c) => {
          const s = String(c.status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return s === 'em analise';
        }).length;
        setBadgeMesa(pendentes);

        // Recuperação
        if (emps.status === 'fulfilled') {
          const empList = emps.value as { resetSolicitado?: boolean }[];
          const assocList = list as unknown as { resetSolicitado?: boolean }[];
          const resets = [...assocList, ...empList].filter((u) => u.resetSolicitado).length;
          setBadgeRecuperacao(resets);
        }
      }

      // Alertas não lidos
      if (alertas.status === 'fulfilled') {
        setBadgeAlertas((alertas.value as { lido?: boolean }[]).filter((a) => !a.lido).length);
      }
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    if (!checando && sessao) carregarBadges();
  }, [checando, sessao, carregarBadges]);

  function navegar(secao: AdminSection) {
    setSecaoAtiva(secao);
    setSidebarAberta(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    carregarBadges();
  }

  async function logout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          if (sessao) registrarLog('Logout', sessao.nome, 'admin', 'Sessão encerrada');
          await sessaoStorage.clear();
          router.replace('/login');
        },
      },
    ]);
  }

  if (checando) return <LoadingBlock text="Verificando acesso..." />;

  const navItem = ADMIN_NAV.find((n) => n.key === secaoAtiva) || ADMIN_NAV[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar title={navItem.title} subtitle={navItem.subtitle} onOpenMenu={() => setSidebarAberta(true)} />

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content}>
        <SecaoAtiva
          secao={secaoAtiva}
          onNavigate={navegar}
          adminNome={sessao?.nome}
        />
      </ScrollView>

      <Sidebar
        visible={sidebarAberta}
        onClose={() => setSidebarAberta(false)}
        active={secaoAtiva}
        onSelect={navegar}
        adminNome={sessao?.nome || 'Administrador'}
        badges={{ mesa: badgeMesa, alertas: badgeAlertas, recuperacao: badgeRecuperacao }}
        onLogout={logout}
      />
    </SafeAreaView>
  );
}

function SecaoAtiva({ secao, onNavigate, adminNome }: { secao: AdminSection; onNavigate: (s: AdminSection) => void; adminNome?: string }) {
  switch (secao) {
    case 'dashboard':   return <DashboardSection onNavigate={onNavigate} />;
    case 'mesa':        return <MesaSection />;
    case 'associados':  return <AssociadosSection />;
    case 'broadcast':   return <BroadcastSection />;
    case 'alertas':     return <AlertasSection />;
    case 'contratos':   return <ContratosSection />;
    case 'relatorios':  return <RelatoriosSection />;
    case 'monitor':     return <MonitorSection />;
    case 'noticias':    return <NoticiasAdminSection />;
    case 'eventos':     return <EventosAdminSection />;
    case 'solicitacoes':return <SolicitacoesSection />;
    case 'recuperacao': return <RecuperacaoSection adminNome={adminNome} />;
    default:            return <DashboardSection onNavigate={onNavigate} />;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
});
