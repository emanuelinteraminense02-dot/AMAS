import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';
import { apiAssociados } from '@/services/api';
import { cpfJaExiste } from '@/services/adminHelpers';
import { maskCPF, maskTel, validarCPF } from '@/utils/validators';
import { formatDataCurta, formatMoney } from '@/utils/format';
import { Card, AdminButton, EmptyState, LoadingBlock, Badge, FormField, SearchInput } from '@/components/admin/AdminUI';
import { ModalSheet } from '@/components/admin/ModalSheet';
import type { Associado, Contribuicao, StatusAssociado } from '@/types';

const FILTROS_STATUS: { label: string; value: StatusAssociado | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Regular', value: 'Regular' },
  { label: 'Inadimplente', value: 'Inadimplente' },
  { label: 'Em análise', value: 'Em análise' },
  { label: 'Pendente', value: 'Pendente' },
];

const FORM_VAZIO = {
  nome: '', cpf: '', nascimento: '', telefone: '', email: '', profissao: '', endereco: '',
  status: 'Pendente' as StatusAssociado, senha: '123456',
};

export function AssociadosSection() {
  const [lista, setLista] = useState<Associado[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusAssociado | ''>('');

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [verAlvo, setVerAlvo] = useState<Associado | null>(null);
  const [historico, setHistorico] = useState<Contribuicao[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setLista((await apiAssociados.listar()) as Associado[]);
    } catch {
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const b = busca.toLowerCase();
    return lista.filter((a) => {
      const okBusca = !b || [a.nome, a.cpf, a.matricula].some((v) => String(v || '').toLowerCase().includes(b));
      const okStatus = !filtroStatus || a.status === filtroStatus;
      return okBusca && okStatus;
    });
  }, [lista, busca, filtroStatus]);

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErroForm('');
    setModalAberto(true);
  }

  function abrirEdicao(a: Associado) {
    setEditandoId(a.id);
    setForm({
      nome: a.nome || '',
      cpf: a.cpf || '',
      nascimento: a.nascimento || '',
      telefone: a.telefone || '',
      email: a.email || '',
      profissao: a.profissao || '',
      endereco: a.endereco || '',
      status: (a.status as StatusAssociado) || 'Pendente',
      senha: a.senha || '',
    });
    setErroForm('');
    setModalAberto(true);
  }

  async function salvar() {
    setErroForm('');
    if (!form.nome) return setErroForm('Nome é obrigatório.');
    if (!form.cpf) return setErroForm('CPF é obrigatório.');
    if (!form.email) return setErroForm('E-mail é obrigatório.');
    if (!validarCPF(form.cpf)) return setErroForm('CPF inválido.');

    setSalvando(true);
    try {
      const existe = await cpfJaExiste(form.cpf, editandoId);
      if (existe) {
        setErroForm('Este CPF já está cadastrado.');
        return;
      }
      const payload = { ...form, senha: form.senha || '123456' };
      if (editandoId) {
        await apiAssociados.atualizar(editandoId, payload);
      } else {
        await apiAssociados.criar({ ...payload, primeiroLogin: true });
      }
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErroForm(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function excluir(a: Associado) {
    Alert.alert('Excluir associado', `Deseja realmente excluir "${a.nome}"? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiAssociados.remover(a.id);
            await carregar();
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível excluir.');
          }
        },
      },
    ]);
  }

  async function abrirDetalhes(a: Associado) {
    setVerAlvo(a);
    try {
      const hist = ((await apiAssociados.getContribuicoes(a.id)) as Contribuicao[]) || [];
      setHistorico(hist.slice().reverse());
    } catch {
      setHistorico([]);
    }
  }

  if (loading) return <LoadingBlock text="Carregando associados..." />;

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Gerenciar Associados</Text>
          <AdminButton label="Novo" icon="person-add-outline" variant="primary" small onPress={abrirNovo} />
        </View>
        <SearchInput value={busca} onChangeText={setBusca} placeholder="Buscar por nome, CPF ou matrícula..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FILTROS_STATUS.map((f) => (
              <TouchableOpacity
                key={f.label}
                onPress={() => setFiltroStatus(f.value)}
                style={[styles.filterChip, filtroStatus === f.value && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, filtroStatus === f.value && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Card>

      {filtrados.length === 0 ? (
        <Card>
          <EmptyState text="Nenhum associado encontrado." icon="people-outline" />
        </Card>
      ) : (
        filtrados.map((a) => (
          <Card key={a.id} style={styles.assocCard}>
            <TouchableOpacity onPress={() => abrirDetalhes(a)} activeOpacity={0.7} style={styles.assocMain}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={18} color={colors.azulDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.assocNome} numberOfLines={1}>{a.nome}</Text>
                <Text style={styles.assocSub} numberOfLines={1}>{a.email}</Text>
                <Text style={styles.assocSub}>{a.cpf} · {a.matricula || '—'}</Text>
              </View>
              <Badge status={a.status || 'Pendente'} small />
            </TouchableOpacity>
            <View style={styles.assocFooter}>
              <Text style={styles.entradaText}>Entrada: {formatDataCurta(a.dataEntrada) || '—'}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <AdminButton label="Ver" icon="eye-outline" small onPress={() => abrirDetalhes(a)} />
                <AdminButton label="Editar" icon="create-outline" small onPress={() => abrirEdicao(a)} />
                <AdminButton label="" icon="trash-outline" small variant="danger" onPress={() => excluir(a)} />
              </View>
            </View>
          </Card>
        ))
      )}

      {/* Modal Novo/Editar */}
      <ModalSheet
        visible={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editandoId ? 'Editar Associado' : 'Novo Associado'}
        footer={
          <>
            <AdminButton label="Cancelar" onPress={() => setModalAberto(false)} variant="outline" fullWidth />
            <AdminButton label="Salvar" onPress={salvar} variant="primary" fullWidth loading={salvando} />
          </>
        }
      >
        <FormField label="Nome completo" required value={form.nome} onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))} />
        <FormField
          label="CPF"
          required
          value={form.cpf}
          onChangeText={(v) => setForm((f) => ({ ...f, cpf: maskCPF(v) }))}
          keyboardType="number-pad"
          maxLength={14}
          placeholder="000.000.000-00"
        />
        <FormField
          label="Data de nascimento"
          value={form.nascimento}
          onChangeText={(v) => setForm((f) => ({ ...f, nascimento: v }))}
          placeholder="AAAA-MM-DD"
        />
        <FormField
          label="Telefone"
          value={form.telefone}
          onChangeText={(v) => setForm((f) => ({ ...f, telefone: maskTel(v) }))}
          keyboardType="phone-pad"
          placeholder="(00) 00000-0000"
        />
        <FormField label="E-mail" required value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
        <FormField label="Profissão" value={form.profissao} onChangeText={(v) => setForm((f) => ({ ...f, profissao: v }))} />
        <FormField label="Endereço" value={form.endereco} onChangeText={(v) => setForm((f) => ({ ...f, endereco: v }))} />

        <Text style={styles.fieldLabel}>Status</Text>
        <View style={styles.statusChipsRow}>
          {(['Pendente', 'Regular', 'Inadimplente'] as StatusAssociado[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setForm((f) => ({ ...f, status: s }))}
              style={[styles.statusChip, form.status === s && styles.statusChipActive]}
            >
              <Text style={[styles.statusChipText, form.status === s && styles.statusChipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FormField label="Senha inicial" value={form.senha} onChangeText={(v) => setForm((f) => ({ ...f, senha: v }))} placeholder="123456" />

        {erroForm ? <Text style={styles.erro}>{erroForm}</Text> : null}
      </ModalSheet>

      {/* Modal Ver Detalhes */}
      <ModalSheet visible={!!verAlvo} onClose={() => setVerAlvo(null)} title="Detalhes do Associado" subtitle={verAlvo?.nome}>
        {verAlvo ? (
          <View style={{ gap: 8 }}>
            {[
              ['CPF', verAlvo.cpf],
              ['Nascimento', formatDataCurta(verAlvo.nascimento) || '—'],
              ['Telefone', verAlvo.telefone || '—'],
              ['E-mail', verAlvo.email],
              ['Profissão', verAlvo.profissao || '—'],
              ['Endereço', verAlvo.endereco || '—'],
              ['Matrícula', verAlvo.matricula || '—'],
              ['Entrada', formatDataCurta(verAlvo.dataEntrada) || '—'],
            ].map(([label, valor]) => (
              <View key={label} style={styles.dadoRow}>
                <Text style={styles.dadoLabel}>{label}</Text>
                <Text style={styles.dadoValor}>{valor}</Text>
              </View>
            ))}
            <View style={styles.dadoRow}>
              <Text style={styles.dadoLabel}>Status</Text>
              <Badge status={verAlvo.status || 'Pendente'} small />
            </View>

            <Text style={[styles.headerTitle, { marginTop: spacing.md }]}>Histórico de contribuições</Text>
            {historico.length === 0 ? (
              <Text style={styles.entradaText}>Nenhuma contribuição registrada.</Text>
            ) : (
              historico.map((c) => (
                <View key={c.id} style={styles.histRow}>
                  <Text style={styles.histMes}>{c.mes}</Text>
                  <Text style={styles.histValor}>{formatMoney(c.valor)}</Text>
                  <Badge status={c.status} small />
                </View>
              ))
            )}
          </View>
        ) : null}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  headerTitle: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  filterChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  filterChipTextActive: { color: colors.white },
  assocCard: { gap: 8 },
  assocMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  assocNome: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  assocSub: { fontSize: 11.5, color: colors.textMuted },
  assocFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  entradaText: { fontSize: 11, color: colors.textMuted },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  statusChipsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  statusChip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  statusChipActive: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  statusChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  statusChipTextActive: { color: colors.white },
  erro: { color: colors.danger, fontSize: 12.5, marginTop: 4 },
  dadoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.border },
  dadoLabel: { fontSize: 12, color: colors.textMuted },
  dadoValor: { fontSize: 12.5, color: colors.textPrimary, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  histMes: { fontSize: 12.5, color: colors.textPrimary, flex: 1 },
  histValor: { fontSize: 12.5, color: colors.textMuted },
});
