import { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { sessaoStorage, apiAssociados, apiMensagens } from '@/services/api';
import { registrarLog } from '@/services/adminHelpers';
import { Topbar } from '@/screens/admin/components/Topbar';
import { AssocSidebar } from '@/screens/associado/components/AssocSidebar';
import { ASSOC_NAV, AssociadoSection } from '@/screens/associado/assocNav';
import { LoadingBlock } from '@/components/admin/AdminUI';

// Sections
import { PerfilSection } from '@/screens/associado/sections/PerfilSection';
import { MensagensSection } from '@/screens/associado/sections/MensagensSection';
import { FinanceiroSection } from '@/screens/associado/sections/FinanceiroSection';
import { EnviarSection } from '@/screens/associado/sections/EnviarSection';
import { HistoricoSection } from '@/screens/associado/sections/HistoricoSection';
import { CarteirinhaSection } from '@/screens/associado/sections/CarteirinhaSection';
import { ParceirosSection } from '@/screens/associado/sections/ParceirosSection';
import { EventosSectionAssoc } from '@/screens/associado/sections/EventosSectionAssoc';
import type { Associado, Sessao } from '@/types';

export default function AssociadoScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [assoc, setAssoc] = useState<Associado | null>(null);
  const [checando, setChecando] = useState(true);

  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [secaoAtiva, setSecaoAtiva] = useState<AssociadoSection>('perfil');
  const [badgeMensagens, setBadgeMensagens] = useState(0);

  // ─── Session guard ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const s = await sessaoStorage.get();
      if (!s || s.perfil !== 'associado') {
        router.replace('/login');
        return;
      }
      setSessao(s);
      await carregarAssoc(s);
      setChecando(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarAssoc = useCallback(async (s?: Sessao) => {
    const sessaoAtual = s || sessao;
    if (!sessaoAtual) return;
    try {
      const dados = (await apiAssociados.buscarPorId(sessaoAtual.id)) as Associado;
      // Carrega histórico de contribuições na mesma chamada
      const historico = await apiAssociados.getContribuicoes(sessaoAtual.id).catch(() => []);
      setAssoc({ ...dados, historico });
    } catch {
      // Sessão inválida ou API offline
    }
  }, [sessao]);

  // Badge de mensagens não lidas
  const atualizarBadgeMensagens = useCallback(async (n: number) => {
    setBadgeMensagens(n);
  }, []);

  function navegar(secao: AssociadoSection) {
    setSecaoAtiva(secao);
    setSidebarAberta(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  async function logout() {
    if (sessao) registrarLog('Logout', sessao.nome, 'associado', 'Sessão encerrada');
    setSidebarAberta(false);
    setSessao(null);
    try {
      await sessaoStorage.clear();
    } finally {
      router.replace('/login');
    }
  }

  if (checando || !assoc) return <LoadingBlock text="Carregando seu painel..." />;

  const navItem = ASSOC_NAV.find((n) => n.key === secaoAtiva) || ASSOC_NAV[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar
        title={navItem.title}
        subtitle={navItem.subtitle}
        onOpenMenu={() => setSidebarAberta(true)}
      />

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content}>
        <SecaoAtiva
          secao={secaoAtiva}
          assoc={assoc}
          onUpdated={() => carregarAssoc()}
          onNavigate={navegar}
          onBadgeMensagens={atualizarBadgeMensagens}
        />
      </ScrollView>

      <AssocSidebar
        visible={sidebarAberta}
        onClose={() => setSidebarAberta(false)}
        active={secaoAtiva}
        onSelect={navegar}
        nome={assoc.nome}
        matricula={assoc.matricula}
        foto={assoc.foto as string | undefined}
        badgeMensagens={badgeMensagens}
        onLogout={logout}
      />
    </SafeAreaView>
  );
}

interface SecaoAtivaProps {
  secao: AssociadoSection;
  assoc: Associado;
  onUpdated: () => Promise<void>;
  onNavigate: (s: AssociadoSection) => void;
  onBadgeMensagens: (n: number) => void;
}

function SecaoAtiva({ secao, assoc, onUpdated, onNavigate, onBadgeMensagens }: SecaoAtivaProps) {
  switch (secao) {
    case 'perfil':
      return <PerfilSection assoc={assoc} onUpdated={onUpdated} />;
    case 'mensagens':
      return <MensagensSection assocId={assoc.id} onBadgeChange={onBadgeMensagens} />;
    case 'financeiro':
      return (
        <FinanceiroSection
          assoc={assoc}
          onUpdated={onUpdated}
          onNavigateEnviar={() => onNavigate('enviar')}
        />
      );
    case 'enviar':
      return <EnviarSection assoc={assoc} onUpdated={onUpdated} />;
    case 'historico':
      return <HistoricoSection assoc={assoc} />;
    case 'carteirinha':
      return <CarteirinhaSection assoc={assoc} />;
    case 'parceiros':
      return <ParceirosSection />;
    case 'eventos':
      return <EventosSectionAssoc assocId={assoc.id} />;
    default:
      return <PerfilSection assoc={assoc} onUpdated={onUpdated} />;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
});
