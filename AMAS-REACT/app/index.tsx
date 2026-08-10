import { useRef } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useHomeData } from '@/hooks/useHomeData';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { NoticiasSection } from '@/components/NoticiasSection';
import { EventosSection } from '@/components/EventosSection';
import { SobreSection } from '@/components/SobreSection';
import { BeneficiosSection } from '@/components/BeneficiosSection';
import { AssociarForm } from '@/components/AssociarForm';
import { ContatoSection } from '@/components/ContatoSection';
import { Footer } from '@/components/Footer';

// Posições verticais aproximadas de cada seção, para o scroll suave
// equivalente aos links de âncora (#noticias, #associar...) da versão web.
type SectionKey = 'noticias' | 'associar';

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<SectionKey, number>>>({});

  const {
    estatisticas,
    noticias,
    eventos,
    loading,
    refreshing,
    erroEstatisticas,
    erroNoticias,
    erroEventos,
    refresh,
  } = useHomeData();

  function scrollToSection(key: SectionKey) {
    const y = sectionOffsets.current[key];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }
  }

  function registerOffset(key: SectionKey) {
    return (event: { nativeEvent: { layout: { y: number } } }) => {
      sectionOffsets.current[key] = event.nativeEvent.layout.y;
    };
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.azulDeep} />}
      >
        <Hero
          total={estatisticas.total}
          regulares={estatisticas.regulares}
          onAssociar={() => scrollToSection('associar')}
          onVerNovidades={() => scrollToSection('noticias')}
        />

        <View onLayout={registerOffset('noticias')}>
          <NoticiasSection noticias={loading ? [] : noticias} erro={erroNoticias} />
        </View>

        <EventosSection eventos={loading ? [] : eventos} erro={erroEventos} />

        <SobreSection />

        <BeneficiosSection />

        <View onLayout={registerOffset('associar')}>
          <AssociarForm />
        </View>

        <ContatoSection onAssociar={() => scrollToSection('associar')} />

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgCard },
  scroll: { flex: 1, backgroundColor: colors.bg },
});
