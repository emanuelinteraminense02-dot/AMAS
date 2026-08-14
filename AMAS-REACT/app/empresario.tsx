import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '@/constants/theme';
import { apiAssociados, apiEmpresarios, sessaoStorage } from '@/services/api';
import { registrarLog } from '@/services/adminHelpers';
import { maskCPF } from '@/utils/validators';
import { AdminButton, Card, CardTitleRow, EmptyState, FormField, LoadingBlock } from '@/components/admin/AdminUI';
import { ModalSheet } from '@/components/admin/ModalSheet';
import { Topbar } from '@/screens/admin/components/Topbar';
import type { Associado, ContratoEmpresa, Empresario, Sessao } from '@/types';

type Secao = 'consulta' | 'parceria' | 'unidades' | 'alerta' | 'historico';
type Unidade = { id: number; nome: string; endereco: string };
type Consulta = { nome: string; cpf: string; status: string; liberado: boolean; hora: string };

const NAV: { key: Secao; label: string; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  { key: 'consulta', label: 'Consultar Associado', icon: 'person-outline', title: 'Consultar Associado', subtitle: 'Verifique a situação de um membro' },
  { key: 'parceria', label: 'Minha Parceria', icon: 'people-outline', title: 'Minha Parceria', subtitle: 'Contrato, benefícios e alcance da parceria' },
  { key: 'unidades', label: 'Minhas Unidades', icon: 'location-outline', title: 'Minhas Unidades', subtitle: 'Gerencie seus estabelecimentos' },
  { key: 'alerta', label: 'Enviar Alerta', icon: 'notifications-outline', title: 'Enviar Alerta', subtitle: 'Comunicação direta com o administrador' },
  { key: 'historico', label: 'Histórico', icon: 'time-outline', title: 'Histórico de Consultas', subtitle: 'Consultas realizadas nesta sessão' },
];

export default function EmpresarioScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [empresa, setEmpresa] = useState<Empresario | null>(null);
  const [checando, setChecando] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);
  const [secao, setSecao] = useState<Secao>('consulta');
  const [historico, setHistorico] = useState<Consulta[]>([]);

  const carregarEmpresa = useCallback(async (s?: Sessao) => {
    const atual = s || sessao;
    if (!atual) return;
    const dados = await apiEmpresarios.buscarPorId(atual.id) as Empresario;
    setEmpresa(dados);
  }, [sessao]);

  useEffect(() => {
    (async () => {
      const s = await sessaoStorage.get();
      if (!s || s.perfil !== 'empresario') { router.replace('/login'); return; }
      setSessao(s);
      try {
        // Não use `carregarEmpresa` aqui: ela depende da sessão e sua identidade
        // muda após `setSessao`, o que faria este effect rodar continuamente.
        const dados = await apiEmpresarios.buscarPorId(s.id) as Empresario;
        setEmpresa(dados);
        void registrarLog('Login realizado', s.nome, 'empresario', 'Acesso ao portal do empresário');
      } catch {
        // A proteção de sessão continua funcionando mesmo com API temporariamente indisponível.
      } finally { setChecando(false); }
    })();
  }, [router]);

  function navegar(destino: Secao) {
    setSecao(destino); setMenuAberto(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }
  async function logout() {
    if (sessao) void registrarLog('Logout', sessao.nome, 'empresario', 'Sessão encerrada');
    await sessaoStorage.clear(); router.replace('/login');
  }

  if (checando || !empresa) return <LoadingBlock text="Carregando seu painel..." />;
  const nav = NAV.find((item) => item.key === secao) || NAV[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar title={nav.title} subtitle={nav.subtitle} onOpenMenu={() => setMenuAberto(true)} />
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {secao === 'consulta' && <ConsultaSection empresa={empresa} onConsulta={(item) => setHistorico((atual) => [...atual, item])} />}
        {secao === 'parceria' && <ParceriaSection empresa={empresa} onUpdated={carregarEmpresa} />}
        {secao === 'unidades' && <UnidadesSection empresa={empresa} onUpdated={carregarEmpresa} />}
        {secao === 'alerta' && <AlertaSection empresa={empresa} />}
        {secao === 'historico' && <HistoricoSection items={historico} />}
      </ScrollView>
      <EmpresarioSidebar visible={menuAberto} active={secao} empresa={empresa} onClose={() => setMenuAberto(false)} onSelect={navegar} onLogout={logout} />
    </SafeAreaView>
  );
}

function ConsultaSection({ empresa, onConsulta }: { empresa: Empresario; onConsulta: (c: Consulta) => void }) {
  const [cpf, setCpf] = useState(''); const [resultado, setResultado] = useState<Associado | null | undefined>();
  const [erro, setErro] = useState(''); const [buscando, setBuscando] = useState(false);
  async function consultar() {
    if (!cpf.trim()) { setErro('Digite um CPF para consultar.'); return; }
    setBuscando(true); setErro(''); setResultado(undefined);
    try {
      const associados = await apiAssociados.listar() as Associado[];
      const encontrado = associados.find((a) => a.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '')) || null;
      setResultado(encontrado);
      if (encontrado) {
        const liberado = encontrado.status === 'Regular';
        onConsulta({ nome: encontrado.nome, cpf: encontrado.cpf, status: encontrado.status || 'Pendente', liberado, hora: new Date().toLocaleString('pt-BR') });
        void registrarLog('Consulta de associado', empresa.nome, 'empresario', `CPF: ${encontrado.cpf}`);
      }
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível realizar a consulta.'); }
    finally { setBuscando(false); }
  }
  const liberado = resultado?.status === 'Regular';
  return <View style={{ gap: spacing.md }}>
    <Card style={styles.searchCard}>
      <View style={styles.roundIcon}><Ionicons name="person-outline" size={30} color={colors.azulDeep} /></View>
      <Text style={styles.sectionTitle}>Consultar situação de associado</Text>
      <Text style={styles.description}>Digite o CPF para verificar se o associado está apto a receber os benefícios parceiros.</Text>
      <TextInput style={styles.searchInput} placeholder="000.000.000-00" placeholderTextColor={colors.textMuted} value={cpf} onChangeText={(v) => setCpf(maskCPF(v))} keyboardType="number-pad" maxLength={14} onSubmitEditing={consultar} />
      {erro ? <Text style={styles.error}>{erro}</Text> : null}
      <AdminButton label="Consultar" icon="search-outline" variant="primary" fullWidth onPress={consultar} loading={buscando} />
    </Card>
    {resultado === null && <ResultadoNaoEncontrado cpf={cpf} />}
    {resultado && <Card style={[styles.resultCard, { borderColor: liberado ? '#86efac' : '#fecaca' }]}>
      <View style={styles.resultHead}>
        <Ionicons name={liberado ? 'checkmark-circle' : 'close-circle'} size={36} color={liberado ? colors.success : colors.danger} />
        <View><Text style={[styles.resultTitle, { color: liberado ? colors.success : colors.danger }]}>{liberado ? 'Benefício LIBERADO' : 'Benefício BLOQUEADO'}</Text><Text style={styles.muted}>{liberado ? 'Associado regular — apto a receber desconto' : 'Associado irregular'}</Text></View>
      </View>
      <Dados rows={[["Nome", resultado.nome], ["CPF", resultado.cpf], ["Matrícula", resultado.matricula || '—'], ["Situação", resultado.status || 'Pendente'], ["Benefício", liberado ? 'Sim' : 'Não']]} />
    </Card>}
  </View>;
}

function ResultadoNaoEncontrado({ cpf }: { cpf: string }) { return <Card><View style={styles.resultHead}><Ionicons name="help-circle-outline" size={36} color={colors.textMuted} /><View><Text style={styles.resultTitle}>Não encontrado</Text><Text style={styles.muted}>CPF não cadastrado no sistema AMAS</Text></View></View><Dados rows={[["CPF", cpf], ["Benefício liberado", 'Não']]} /></Card>; }

function ParceriaSection({ empresa, onUpdated }: { empresa: Empresario; onUpdated: () => Promise<void> }) {
  const contrato = (typeof empresa.contrato === 'object' ? empresa.contrato : {}) as ContratoEmpresa;
  const [beneficio, setBeneficio] = useState(contrato.beneficioOfertado || ''); const [regras, setRegras] = useState(contrato.regrasUtilizacao || '');
  const [validacao, setValidacao] = useState(contrato.formaValidacao || ''); const [descricao, setDescricao] = useState(contrato.descricaoBeneficios || ''); const [salvando, setSalvando] = useState(false); const [erro, setErro] = useState('');
  async function salvar() {
    if (!beneficio.trim()) { setErro('Informe o benefício principal.'); return; }
    setSalvando(true); setErro('');
    try { await apiEmpresarios.atualizar(empresa.id, { contrato: { ...contrato, beneficioOfertado: beneficio.trim(), regrasUtilizacao: regras.trim(), formaValidacao: validacao.trim(), descricaoBeneficios: descricao.trim(), beneficiosValidados: false } }); await onUpdated(); Alert.alert('Benefícios salvos', 'Aguardando validação do administrador.'); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao salvar benefícios.'); } finally { setSalvando(false); }
  }
  return <View style={{ gap: spacing.md }}>
    <Card style={styles.contractCard}><Ionicons name="heart-outline" size={28} color={colors.douradoEscuro} /><View style={{ flex: 1 }}><Text style={styles.contractType}>{contrato.tipoAcordo || 'Parceria por Benefício Mútuo'}</Text><Text style={styles.contractBenefit}>{contrato.beneficioOfertado || 'Nenhum benefício cadastrado ainda.'}</Text></View><Ionicons name={contrato.beneficiosValidados ? 'checkmark-circle' : 'hourglass-outline'} size={22} color={contrato.beneficiosValidados ? colors.success : colors.warning} /></Card>
    <Card><CardTitleRow title="Benefícios oferecidos" icon="pricetag-outline" /><Text style={[styles.description, { marginBottom: spacing.sm }]}>Mantenha estas informações atualizadas para que os associados conheçam sua parceria.</Text><FormField label="Benefício principal" required value={beneficio} onChangeText={setBeneficio} placeholder="Ex: 10% de desconto" /><FormField label="Regras de utilização" value={regras} onChangeText={setRegras} placeholder="Ex: Válido para pagamentos à vista" /><FormField label="Forma de validação" value={validacao} onChangeText={setValidacao} placeholder="Ex: Apresentação da carteirinha" /><FormField label="Descrição dos benefícios" value={descricao} onChangeText={setDescricao} multiline style={styles.textarea} /><Text style={contrato.beneficiosValidados ? styles.validated : styles.pending}>{contrato.beneficiosValidados ? '✓ Validado pelo administrador — exibido no catálogo' : beneficio ? '◷ Aguardando validação do administrador' : ''}</Text>{erro ? <Text style={styles.error}>{erro}</Text> : null}<AdminButton label="Salvar benefícios" icon="save-outline" variant="primary" onPress={salvar} loading={salvando} /></Card>
    <ImpactoSection />
  </View>;
}

function ImpactoSection() {
  const [numeros, setNumeros] = useState({ total: 0, regulares: 0 });
  useEffect(() => { apiAssociados.listar().then((lista) => { const items = lista as Associado[]; setNumeros({ total: items.length, regulares: items.filter((a) => a.status === 'Regular').length }); }).catch(() => {}); }, []);
  return <Card><CardTitleRow title="Alcance da parceria" icon="stats-chart-outline" /><View style={styles.kpis}>{[["people-outline", numeros.total, 'Total de associados'], ["checkmark-circle-outline", numeros.regulares, 'Associados regulares'], ["bullseye-outline", numeros.regulares, 'Clientes potenciais']].map(([icon, valor, texto]) => <View key={String(texto)} style={styles.kpi}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.azulMid} /><Text style={styles.kpiValue}>{valor}</Text><Text style={styles.kpiLabel}>{texto}</Text></View>)}</View><Text style={styles.description}>Sua empresa ganha visibilidade para os associados ativos da AMAS em São Sebastião/DF.</Text></Card>;
}

function UnidadesSection({ empresa, onUpdated }: { empresa: Empresario; onUpdated: () => Promise<void> }) {
  const unidades = ((empresa.unidades as Unidade[] | undefined) || []); const [modal, setModal] = useState(false); const [nome, setNome] = useState(''); const [endereco, setEndereco] = useState(''); const [erro, setErro] = useState(''); const [salvando, setSalvando] = useState(false);
  async function salvar() { if (!nome.trim() || !endereco.trim()) { setErro('Preencha nome e endereço.'); return; } setSalvando(true); try { await apiEmpresarios.atualizar(empresa.id, { unidades: [...unidades, { id: Math.max(0, ...unidades.map((u) => u.id)) + 1, nome: nome.trim(), endereco: endereco.trim() }] }); await onUpdated(); setModal(false); void registrarLog('Unidade cadastrada', empresa.nome, 'empresario', nome.trim()); } catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao salvar unidade.'); } finally { setSalvando(false); } }
  function remover(unidade: Unidade) { Alert.alert('Remover unidade', `Deseja excluir ${unidade.nome}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: async () => { await apiEmpresarios.atualizar(empresa.id, { unidades: unidades.filter((u) => u.id !== unidade.id) }); await onUpdated(); } }]); }
  return <View style={{ gap: spacing.md }}><Card><CardTitleRow title="Estabelecimentos" icon="location-outline" action={<AdminButton label="Nova unidade" icon="add-circle-outline" small onPress={() => { setNome(''); setEndereco(''); setErro(''); setModal(true); }} />} />{unidades.length === 0 ? <EmptyState icon="location-outline" text="Nenhuma unidade cadastrada." /> : unidades.map((u) => <View key={u.id} style={styles.unit}><Ionicons name="location" size={22} color={colors.azulMid} /><View style={{ flex: 1 }}><Text style={styles.unitName}>{u.nome}</Text><Text style={styles.muted}>{u.endereco}</Text></View><TouchableOpacity onPress={() => remover(u)} hitSlop={8}><Ionicons name="trash-outline" size={19} color={colors.danger} /></TouchableOpacity></View>)}</Card><ModalSheet visible={modal} onClose={() => setModal(false)} title="Nova Unidade" footer={<><AdminButton label="Cancelar" variant="outline" fullWidth onPress={() => setModal(false)} /><AdminButton label="Salvar" variant="primary" fullWidth onPress={salvar} loading={salvando} /></>}><FormField label="Nome da unidade" required value={nome} onChangeText={setNome} placeholder="Ex: Filial Centro" /><FormField label="Endereço" required value={endereco} onChangeText={setEndereco} placeholder="Av. Principal, 123" />{erro ? <Text style={styles.error}>{erro}</Text> : null}</ModalSheet></View>;
}

function AlertaSection({ empresa }: { empresa: Empresario }) { const [titulo, setTitulo] = useState(''); const [mensagem, setMensagem] = useState(''); const [urgente, setUrgente] = useState(false); const [erro, setErro] = useState(''); const [enviando, setEnviando] = useState(false); async function enviar() { if (!titulo.trim() || !mensagem.trim()) { setErro('Preencha título e descrição.'); return; } setEnviando(true); setErro(''); try { await apiEmpresarios.enviarAlerta(empresa.id, { empresarioNome: empresa.nome, titulo: titulo.trim(), mensagem: mensagem.trim(), urgente }); setTitulo(''); setMensagem(''); setUrgente(false); Alert.alert('Alerta enviado', urgente ? 'O alerta urgente foi enviado ao administrador.' : 'O alerta foi enviado ao administrador.'); } catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao enviar alerta.'); } finally { setEnviando(false); } } return <Card><CardTitleRow title="Novo alerta" icon="notifications-outline" /><Text style={[styles.description, { marginBottom: spacing.md }]}>Use este canal para comunicar situações que precisam da atenção da administração.</Text><FormField label="Título" required value={titulo} onChangeText={setTitulo} placeholder="Ex: Sistema de consulta fora do ar" /><FormField label="Descrição" required value={mensagem} onChangeText={setMensagem} multiline style={styles.alertTextarea} placeholder="Descreva a situação..." /><TouchableOpacity style={styles.checkRow} onPress={() => setUrgente(!urgente)}><Ionicons name={urgente ? 'checkbox' : 'square-outline'} size={22} color={urgente ? colors.danger : colors.textMuted} /><Text style={styles.checkText}>Marcar como urgente</Text></TouchableOpacity>{erro ? <Text style={styles.error}>{erro}</Text> : null}<AdminButton label={urgente ? 'Enviar alerta urgente' : 'Enviar alerta'} icon="send-outline" variant="primary" fullWidth onPress={enviar} loading={enviando} /></Card>; }

function HistoricoSection({ items }: { items: Consulta[] }) { return <Card><CardTitleRow title="Consultas desta sessão" icon="time-outline" />{items.length === 0 ? <EmptyState icon="time-outline" text="Nenhuma consulta realizada ainda." /> : items.slice().reverse().map((item, index) => <View key={`${item.cpf}-${index}`} style={styles.history}><View style={{ flex: 1 }}><Text style={styles.unitName}>{item.nome}</Text><Text style={styles.muted}>{item.cpf} · {item.hora}</Text></View><View style={[styles.statusPill, { backgroundColor: item.liberado ? '#dcfce7' : '#fee2e2' }]}><Text style={{ color: item.liberado ? '#15803d' : '#b91c1c', fontSize: 10.5, fontWeight: '700' }}>{item.status}</Text></View></View>)}</Card>; }

function Dados({ rows }: { rows: [string, string][] }) { return <View style={styles.data}>{rows.map(([label, value]) => <View key={label} style={styles.dataRow}><Text style={styles.dataLabel}>{label}</Text><Text style={styles.dataValue}>{value}</Text></View>)}</View>; }

function EmpresarioSidebar({ visible, active, empresa, onClose, onSelect, onLogout }: { visible: boolean; active: Secao; empresa: Empresario; onClose: () => void; onSelect: (s: Secao) => void; onLogout: () => void }) { const width = Math.min(290, Dimensions.get('window').width * .8); const x = useRef(new Animated.Value(-width)).current; useEffect(() => { Animated.timing(x, { toValue: visible ? 0 : -width, duration: 220, useNativeDriver: true }).start(); }, [visible, x, width]); return <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}><Pressable style={[StyleSheet.absoluteFill, { backgroundColor: visible ? 'rgba(15,17,32,.5)' : 'transparent' }]} onPress={onClose} /><Animated.View style={[styles.sidebar, { width, transform: [{ translateX: x }] }]}><SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}><View style={styles.sideHeader}><View style={styles.companyAvatar}><Ionicons name="business" size={25} color={colors.azulMid} /></View><Text style={styles.companyName} numberOfLines={2}>{empresa.nome}</Text><Text style={styles.cnpj}>{empresa.cnpj || '—'}</Text><TouchableOpacity style={styles.close} onPress={onClose}><Ionicons name="close" size={20} color={colors.white} /></TouchableOpacity></View><ScrollView style={{ flex: 1, padding: spacing.sm }}>{NAV.map((item) => <TouchableOpacity key={item.key} style={[styles.navItem, active === item.key && styles.navActive]} onPress={() => onSelect(item.key)}><Ionicons name={item.icon} size={18} color={active === item.key ? colors.azulDeep : 'rgba(255,255,255,.85)'} /><Text style={[styles.navText, active === item.key && { color: colors.azulDeep }]}>{item.label}</Text></TouchableOpacity>)}</ScrollView><TouchableOpacity style={styles.logout} onPress={onLogout}><Ionicons name="log-out-outline" size={17} color={colors.white} /><Text style={styles.logoutText}>Sair</Text></TouchableOpacity></SafeAreaView></Animated.View></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, scroll: { flex: 1 }, content: { padding: spacing.md, paddingBottom: spacing.xxl },
  searchCard: { alignItems: 'center' }, roundIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm }, sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', textAlign: 'center' }, description: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 5 }, searchInput: { alignSelf: 'stretch', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.textPrimary, marginVertical: spacing.md }, error: { color: colors.danger, fontSize: 12.5, marginBottom: spacing.sm }, resultCard: { borderWidth: 1 }, resultHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md }, resultTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary }, muted: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 }, data: { borderTopWidth: 1, borderColor: colors.border }, dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: 9, borderBottomWidth: 1, borderColor: colors.border }, dataLabel: { fontSize: 12, color: colors.textMuted }, dataValue: { fontSize: 12, color: colors.textPrimary, fontWeight: '700', textAlign: 'right', flexShrink: 1 }, contractCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' }, contractType: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' }, contractBenefit: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 3 }, textarea: { minHeight: 75, textAlignVertical: 'top' }, alertTextarea: { minHeight: 110, textAlignVertical: 'top' }, validated: { color: colors.success, fontSize: 11.5, marginBottom: spacing.sm }, pending: { color: colors.warning, fontSize: 11.5, marginBottom: spacing.sm }, kpis: { flexDirection: 'row', gap: 6, marginBottom: spacing.md }, kpi: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, paddingVertical: 12, borderRadius: radius.sm }, kpiValue: { color: colors.azulDeep, fontSize: 19, fontWeight: '800', marginTop: 4 }, kpiLabel: { color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 }, unit: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }, unitName: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '700' }, checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }, checkText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' }, history: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 11, borderBottomWidth: 1, borderColor: colors.border }, statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill }, sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.azulDeep }, sideHeader: { padding: spacing.lg, paddingTop: spacing.md, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,.1)' }, companyAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.12)', marginBottom: spacing.sm }, companyName: { color: colors.white, fontSize: 14.5, fontWeight: '800' }, cnpj: { color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 2 }, close: { position: 'absolute', right: spacing.md, top: spacing.md, padding: 4 }, navItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderRadius: radius.sm, marginBottom: 3 }, navActive: { backgroundColor: colors.white }, navText: { color: 'rgba(255,255,255,.85)', fontSize: 13.5, fontWeight: '700' }, logout: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, margin: spacing.md, paddingVertical: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }, logoutText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
