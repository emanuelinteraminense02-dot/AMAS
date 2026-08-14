import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { apiAuth, apiRecuperacao, sessaoStorage } from '@/services/api';
import { registrarLog } from '@/services/adminHelpers';
import type { Perfil, Sessao } from '@/types';

type Painel = 'login' | 'redefinir' | 'esqueci';

function senhaScore(v: string) {
  let s = 0;
  if (v.length >= 6) s++;
  if (v.length >= 10) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

const SCORE_LABEL = ['', 'Fraca', 'Fraca', 'Média', 'Boa', 'Forte'];
const SCORE_COLOR = ['', colors.danger, colors.danger, colors.warning, colors.success, '#15803d'];

export default function LoginScreen() {
  const router = useRouter();

  const [painel, setPainel] = useState<Painel>('login');

  // Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroLogin, setErroLogin] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Redefinir
  const [pendingSessao, setPendingSessao] = useState<Sessao | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [erroRedef, setErroRedef] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Esqueci
  const [esqueciEmail, setEsqueciEmail] = useState('');
  const [erroEsqueci, setErroEsqueci] = useState('');
  const [enviadoOk, setEnviadoOk] = useState('');
  const [enviandoEsqueci, setEnviandoEsqueci] = useState(false);

  function redirecionar(perfil: Perfil) {
    if (perfil === 'admin') router.replace('/admin');
    else if (perfil === 'associado') router.replace('/associado');
    else router.replace('/empresario');
  }

  async function handleLogin() {
    setErroLogin('');
    if (!email.trim() || !senha.trim()) {
      setErroLogin('Preencha todos os campos.');
      return;
    }
    setCarregando(true);
    try {
      const usuario = await apiAuth.login(email.trim(), senha.trim());
      const perfil = usuario.perfil || 'associado';
      const u = usuario as unknown as Record<string, unknown>;
      if (u.primeiroLogin || u.senhaExpirada) {
        const sessaoTemp: Sessao = { ...usuario };
        await sessaoStorage.set(sessaoTemp);
        registrarLog('Login com senha expirada', usuario.nome, perfil, 'Redirecionado para troca obrigatória');
        setPendingSessao(sessaoTemp);
        setPainel('redefinir');
      } else {
        registrarLog('Login realizado', usuario.nome, perfil, 'Acesso via tela de login');
        await sessaoStorage.set(usuario);
        redirecionar(perfil);
      }
    } catch (e) {
      setErroLogin(e instanceof Error ? e.message : 'E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleRedefinir() {
    setErroRedef('');
    if (!novaSenha || !confirmaSenha) { setErroRedef('Preencha os dois campos.'); return; }
    if (novaSenha !== confirmaSenha) { setErroRedef('As senhas não coincidem.'); return; }
    if (!pendingSessao) { setPainel('login'); return; }
    const colecao = pendingSessao.perfil === 'associado' ? 'associados' : 'usuarios';
    setSalvandoSenha(true);
    try {
      const res = await apiRecuperacao.definirNovaSenha(pendingSessao.id, colecao, novaSenha);
      if (!res.ok) { setErroRedef(res.erro || 'Erro ao salvar senha.'); return; }
      const sessaoAtualizada: Sessao = { ...pendingSessao };
      await sessaoStorage.set(sessaoAtualizada);
      registrarLog('Nova senha definida', pendingSessao.nome, pendingSessao.perfil, 'Senha redefinida com sucesso após reset');
      redirecionar(pendingSessao.perfil);
    } catch (e) {
      setErroRedef(e instanceof Error ? e.message : 'Erro ao salvar senha.');
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function handleEsqueci() {
    setErroEsqueci('');
    if (!esqueciEmail.trim()) { setErroEsqueci('Informe o e-mail.'); return; }
    setEnviandoEsqueci(true);
    try {
      const res = await apiRecuperacao.solicitarReset(esqueciEmail.trim());
      if (!res.ok) { setErroEsqueci(res.erro || 'Erro ao enviar solicitação.'); return; }
      setEnviadoOk(`Solicitação enviada para ${res.nome} (${res.tipo}). Aguarde o administrador processar o reset.`);
    } catch (e) {
      setErroEsqueci(e instanceof Error ? e.message : 'Erro ao enviar solicitação.');
    } finally {
      setEnviandoEsqueci(false);
    }
  }

  const score = senhaScore(novaSenha);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image source={require('../assets/logo-amas.png')} style={styles.logoImage} />
          <Text style={styles.logoText}>AMAS</Text>
          <Text style={styles.logoSub}>Sistema de Gestão</Text>
        </View>

        {/* ─── Painel Login ─── */}
        {painel === 'login' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entrar no sistema</Text>
            <Text style={styles.cardSubtitle}>Use seu e-mail e senha cadastrados</Text>

            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onSubmitEditing={handleLogin}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Sua senha"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!mostrarSenha}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setMostrarSenha((v) => !v)} hitSlop={8}>
                  <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {erroLogin ? <Text style={styles.erro}>{erroLogin}</Text> : null}

            <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={carregando} activeOpacity={0.9}>
              {carregando ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnPrimaryText}>Entrar no sistema</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPainel('esqueci')} style={styles.linkBtn}>
              <Text style={styles.linkText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/')} style={styles.linkBtn}>
              <Ionicons name="arrow-back-outline" size={14} color={colors.textMuted} />
              <Text style={styles.linkText}>Voltar ao início</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Painel Redefinir senha obrigatória ─── */}
        {painel === 'redefinir' && (
          <View style={styles.card}>
            <View style={styles.alertaBanner}>
              <Ionicons name="key" size={18} color={colors.warning} />
              <Text style={styles.alertaText}>
                {pendingSessao ? `Olá, ${pendingSessao.nome.split(' ')[0]}! ` : ''}
                Por segurança, crie uma nova senha antes de continuar.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nova senha *</Text>
              <TextInput
                style={styles.inputSimple}
                value={novaSenha}
                onChangeText={setNovaSenha}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
              {novaSenha.length > 0 ? (
                <View style={styles.scoreWrap}>
                  <View style={styles.scoreBar}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View key={i} style={[styles.scoreSeg, i <= score && { backgroundColor: SCORE_COLOR[score] }]} />
                    ))}
                  </View>
                  <Text style={[styles.scoreLabel, { color: SCORE_COLOR[score] }]}>{SCORE_LABEL[score]}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar nova senha *</Text>
              <TextInput
                style={styles.inputSimple}
                value={confirmaSenha}
                onChangeText={setConfirmaSenha}
                placeholder="Repita a nova senha"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            {erroRedef ? <Text style={styles.erro}>{erroRedef}</Text> : null}

            <TouchableOpacity style={styles.btnPrimary} onPress={handleRedefinir} disabled={salvandoSenha} activeOpacity={0.9}>
              {salvandoSenha ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnPrimaryText}>Salvar nova senha</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Painel Esqueci minha senha ─── */}
        {painel === 'esqueci' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recuperar acesso</Text>
            <Text style={styles.cardSubtitle}>
              Informe seu e-mail cadastrado. O administrador será notificado e redefinirá sua senha.
            </Text>

            {enviadoOk ? (
              <View style={styles.okBanner}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.okText}>{enviadoOk}</Text>
              </View>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>E-mail cadastrado *</Text>
                  <TextInput
                    style={styles.inputSimple}
                    value={esqueciEmail}
                    onChangeText={setEsqueciEmail}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {erroEsqueci ? <Text style={styles.erro}>{erroEsqueci}</Text> : null}

                <TouchableOpacity style={styles.btnPrimary} onPress={handleEsqueci} disabled={enviandoEsqueci} activeOpacity={0.9}>
                  {enviandoEsqueci ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnPrimaryText}>Enviar solicitação</Text>}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={() => { setPainel('login'); setEnviadoOk(''); setErroEsqueci(''); }} style={styles.linkBtn}>
              <Ionicons name="arrow-back-outline" size={14} color={colors.textMuted} />
              <Text style={styles.linkText}>Voltar ao login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.azulDeep },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  logoImage: { width: 76, height: 76, borderRadius: 38, marginBottom: 10 },
  logoText: { color: colors.white, fontWeight: '800', fontSize: 22, letterSpacing: 0.4 },
  logoSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12.5, marginTop: 2 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.lg,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  cardSubtitle: { fontSize: 12.5, color: colors.textMuted, marginBottom: 4 },
  field: { gap: 5 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 13.5, color: colors.textPrimary, padding: 0 },
  inputSimple: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 13.5, color: colors.textPrimary,
  },
  erro: { color: colors.danger, fontSize: 12.5 },
  btnPrimary: {
    backgroundColor: colors.azulDeep, borderRadius: radius.pill,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  btnPrimaryText: { color: colors.white, fontWeight: '800', fontSize: 14.5 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  linkText: { color: colors.textMuted, fontSize: 13 },
  alertaBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#fef3c7', borderRadius: radius.sm, padding: 12,
  },
  alertaText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },
  scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  scoreBar: { flexDirection: 'row', gap: 3, flex: 1 },
  scoreSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surface },
  scoreLabel: { fontSize: 11, fontWeight: '700', width: 40 },
  okBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#dcfce7', borderRadius: radius.sm, padding: 12,
  },
  okText: { flex: 1, fontSize: 13, color: '#15803d', lineHeight: 18 },
});
