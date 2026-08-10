import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';
import { apiEmpresarios } from '@/services/api';
import { cnpjJaExiste, parseContrato, salvarContratoEmpresa } from '@/services/adminHelpers';
import { maskCNPJ, maskTel, validarCNPJ } from '@/utils/validators';
import { formatDataCurta } from '@/utils/format';
import { Card, CardTitleRow, AdminButton, EmptyState, LoadingBlock, FormField, SearchInput } from '@/components/admin/AdminUI';
import { ModalSheet } from '@/components/admin/ModalSheet';
import type { ContratoEmpresa, Empresario, TipoParceria } from '@/types';

const TIPOS_PARCERIA: TipoParceria[] = [
  'Parceiro de Benefício (Padrão)',
  'Parceiro Estratégico',
  'Apoio Institucional',
];

const FORM_EMP_VAZIO = { nome: '', cnpj: '', email: '', telefone: '', endereco: '', senha: '123456' };

const FORM_CONT_VAZIO: Partial<ContratoEmpresa> = {
  tipoAcordo: 'Parceiro de Benefício (Padrão)',
  beneficioOfertado: '',
  descricaoBeneficios: '',
  regrasUtilizacao: '',
  formaValidacao: '',
  dataVigencia: '',
  observacoesAdmin: '',
  beneficiosValidados: false,
};

export function ContratosSection() {
  const [lista, setLista] = useState<Empresario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // Modal empresa
  const [empModalAberto, setEmpModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formEmp, setFormEmp] = useState(FORM_EMP_VAZIO);
  const [erroEmp, setErroEmp] = useState('');
  const [salvandoEmp, setSalvandoEmp] = useState(false);

  // Modal contrato
  const [contModalAlvo, setContModalAlvo] = useState<Empresario | null>(null);
  const [formCont, setFormCont] = useState(FORM_CONT_VAZIO);
  const [salvandoCont, setSalvandoCont] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setLista((await apiEmpresarios.listar()) as Empresario[]);
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
    return !b ? lista : lista.filter((e) => [e.nome, e.cnpj, e.email].some((v) => String(v || '').toLowerCase().includes(b)));
  }, [lista, busca]);

  // ─── Empresa CRUD ───────────────────────────────────────────────
  function abrirNovaEmpresa() {
    setEditandoId(null);
    setFormEmp(FORM_EMP_VAZIO);
    setErroEmp('');
    setEmpModalAberto(true);
  }

  function abrirEdicaoEmpresa(emp: Empresario) {
    setEditandoId(emp.id);
    setFormEmp({
      nome: emp.nome || '',
      cnpj: emp.cnpj || '',
      email: emp.email || '',
      telefone: emp.telefone || '',
      endereco: emp.endereco || '',
      senha: (emp.senha as string) || '',
    });
    setErroEmp('');
    setEmpModalAberto(true);
  }

  async function salvarEmpresa() {
    setErroEmp('');
    if (!formEmp.nome || !formEmp.cnpj || !formEmp.email) return setErroEmp('Nome, CNPJ e e-mail são obrigatórios.');
    if (!validarCNPJ(formEmp.cnpj)) return setErroEmp('CNPJ inválido.');
    setSalvandoEmp(true);
    try {
      const existe = await cnpjJaExiste(formEmp.cnpj, editandoId);
      if (existe) return setErroEmp('Este CNPJ já está cadastrado.');
      const payload = { ...formEmp, senha: formEmp.senha || '123456' };
      if (editandoId) await apiEmpresarios.atualizar(editandoId, payload);
      else await apiEmpresarios.criar({ ...payload, primeiroLogin: true });
      setEmpModalAberto(false);
      await carregar();
    } catch (e) {
      setErroEmp(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvandoEmp(false);
    }
  }

  function excluirEmpresa(emp: Empresario) {
    Alert.alert('Excluir empresa', `Excluir "${emp.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await apiEmpresarios.remover(emp.id);
            await carregar();
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível excluir.');
          }
        },
      },
    ]);
  }

  // ─── Contrato ────────────────────────────────────────────────────
  function abrirContrato(emp: Empresario) {
    const cont = parseContrato(emp) as ContratoEmpresa;
    setFormCont({
      tipoAcordo: cont.tipoAcordo || 'Parceiro de Benefício (Padrão)',
      beneficioOfertado: cont.beneficioOfertado || '',
      descricaoBeneficios: cont.descricaoBeneficios || '',
      regrasUtilizacao: cont.regrasUtilizacao || '',
      formaValidacao: cont.formaValidacao || '',
      dataVigencia: cont.dataVigencia || '',
      observacoesAdmin: cont.observacoesAdmin || '',
      beneficiosValidados: cont.beneficiosValidados || false,
    });
    setContModalAlvo(emp);
  }

  async function salvarContrato() {
    if (!contModalAlvo) return;
    setSalvandoCont(true);
    try {
      await salvarContratoEmpresa(contModalAlvo.id, formCont);
      setContModalAlvo(null);
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar contrato.');
    } finally {
      setSalvandoCont(false);
    }
  }

  if (loading) return <LoadingBlock text="Carregando parcerias..." />;

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <CardTitleRow
          title="Empresas Parceiras"
          icon="people-circle-outline"
          action={<AdminButton label="Nova" icon="add" variant="primary" small onPress={abrirNovaEmpresa} />}
        />
        <SearchInput value={busca} onChangeText={setBusca} placeholder="Buscar por nome, CNPJ ou e-mail..." />
      </Card>

      {filtrados.length === 0 ? (
        <Card><EmptyState text="Nenhuma empresa parceira cadastrada." icon="business-outline" /></Card>
      ) : (
        filtrados.map((emp) => {
          const cont = parseContrato(emp) as ContratoEmpresa;
          const temContrato = !!(cont.beneficioOfertado || cont.tipoAcordo);
          const validado = !!cont.beneficiosValidados;
          return (
            <Card key={emp.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons name="business" size={18} color={colors.azulDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.empNome} numberOfLines={1}>{emp.nome}</Text>
                  <Text style={styles.empSub}>{emp.cnpj}</Text>
                  <Text style={styles.empSub} numberOfLines={1}>{emp.email}</Text>
                </View>
              </View>

              {temContrato ? (
                <View style={styles.contInfo}>
                  <View style={[styles.badgeCont, { backgroundColor: validado ? '#dcfce7' : '#fef3c7' }]}>
                    <Ionicons name={validado ? 'checkmark-circle' : 'time'} size={12} color={validado ? '#15803d' : '#b45309'} />
                    <Text style={[styles.badgeContText, { color: validado ? '#15803d' : '#b45309' }]}>
                      {validado ? 'Validado' : 'Pendente validação'}
                    </Text>
                  </View>
                  <Text style={styles.contTipo}>{cont.tipoAcordo}</Text>
                  {cont.dataVigencia ? <Text style={styles.empSub}>Vigência: {formatDataCurta(cont.dataVigencia)}</Text> : null}
                </View>
              ) : (
                <Text style={styles.semContrato}>Sem contrato cadastrado</Text>
              )}

              <View style={styles.acoes}>
                <AdminButton label="Contrato" icon="document-text-outline" small fullWidth onPress={() => abrirContrato(emp)} />
                <AdminButton label="" icon="create-outline" small onPress={() => abrirEdicaoEmpresa(emp)} />
                <AdminButton label="" icon="trash-outline" small variant="danger" onPress={() => excluirEmpresa(emp)} />
              </View>
            </Card>
          );
        })
      )}

      {/* Modal empresa */}
      <ModalSheet
        visible={empModalAberto}
        onClose={() => setEmpModalAberto(false)}
        title={editandoId ? 'Editar Empresa' : 'Nova Empresa Parceira'}
        footer={
          <>
            <AdminButton label="Cancelar" onPress={() => setEmpModalAberto(false)} variant="outline" fullWidth />
            <AdminButton label="Salvar" onPress={salvarEmpresa} variant="primary" fullWidth loading={salvandoEmp} />
          </>
        }
      >
        <FormField label="Razão Social" required value={formEmp.nome} onChangeText={(v) => setFormEmp((f) => ({ ...f, nome: v }))} />
        <FormField
          label="CNPJ" required
          value={formEmp.cnpj}
          onChangeText={(v) => setFormEmp((f) => ({ ...f, cnpj: maskCNPJ(v) }))}
          keyboardType="number-pad" maxLength={18} placeholder="00.000.000/0000-00"
        />
        <FormField label="E-mail" required value={formEmp.email} onChangeText={(v) => setFormEmp((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
        <FormField
          label="Telefone"
          value={formEmp.telefone}
          onChangeText={(v) => setFormEmp((f) => ({ ...f, telefone: maskTel(v) }))}
          keyboardType="phone-pad"
        />
        <FormField label="Endereço" value={formEmp.endereco} onChangeText={(v) => setFormEmp((f) => ({ ...f, endereco: v }))} />
        <FormField label="Senha inicial" value={formEmp.senha} onChangeText={(v) => setFormEmp((f) => ({ ...f, senha: v }))} placeholder="123456" />
        {erroEmp ? <Text style={styles.erro}>{erroEmp}</Text> : null}
      </ModalSheet>

      {/* Modal contrato */}
      <ModalSheet
        visible={!!contModalAlvo}
        onClose={() => setContModalAlvo(null)}
        title="Contrato / Parceria"
        subtitle={contModalAlvo?.nome}
        footer={
          <>
            <AdminButton label="Cancelar" onPress={() => setContModalAlvo(null)} variant="outline" fullWidth />
            <AdminButton label="Salvar" onPress={salvarContrato} variant="primary" fullWidth loading={salvandoCont} />
          </>
        }
      >
        <Text style={styles.fieldLabel}>Tipo de acordo</Text>
        <View style={{ gap: 8, marginBottom: spacing.sm }}>
          {TIPOS_PARCERIA.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setFormCont((f) => ({ ...f, tipoAcordo: t }))}
              style={[styles.radioRow, formCont.tipoAcordo === t && styles.radioRowActive]}
            >
              <View style={[styles.radioCircle, formCont.tipoAcordo === t && styles.radioCircleActive]} />
              <Text style={[styles.radioLabel, formCont.tipoAcordo === t && styles.radioLabelActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Benefício ofertado</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={formCont.beneficioOfertado}
          onChangeText={(v) => setFormCont((f) => ({ ...f, beneficioOfertado: v }))}
          placeholder="Ex: 10% de desconto em serviços..."
          placeholderTextColor={colors.textMuted}
          multiline numberOfLines={3}
        />

        <Text style={styles.fieldLabel}>Descrição completa dos benefícios</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={formCont.descricaoBeneficios}
          onChangeText={(v) => setFormCont((f) => ({ ...f, descricaoBeneficios: v }))}
          placeholderTextColor={colors.textMuted}
          multiline numberOfLines={3}
        />

        <Text style={styles.fieldLabel}>Regras de utilização</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={formCont.regrasUtilizacao}
          onChangeText={(v) => setFormCont((f) => ({ ...f, regrasUtilizacao: v }))}
          placeholderTextColor={colors.textMuted}
          multiline numberOfLines={2}
        />

        <Text style={styles.fieldLabel}>Forma de validação</Text>
        <TextInput
          style={styles.input}
          value={formCont.formaValidacao}
          onChangeText={(v) => setFormCont((f) => ({ ...f, formaValidacao: v }))}
          placeholder="Ex: Apresentar carteirinha AMAS"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Data de vigência</Text>
        <TextInput
          style={styles.input}
          value={formCont.dataVigencia}
          onChangeText={(v) => setFormCont((f) => ({ ...f, dataVigencia: v }))}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Observações do administrador</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={formCont.observacoesAdmin}
          onChangeText={(v) => setFormCont((f) => ({ ...f, observacoesAdmin: v }))}
          placeholderTextColor={colors.textMuted}
          multiline numberOfLines={2}
        />

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setFormCont((f) => ({ ...f, beneficiosValidados: !f.beneficiosValidados }))}
        >
          <View style={[styles.checkbox, formCont.beneficiosValidados && styles.checkboxActive]} />
          <Text style={styles.checkLabel}>Benefícios validados pelo administrador</Text>
        </TouchableOpacity>
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  empNome: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  empSub: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  contInfo: { gap: 4 },
  badgeCont: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeContText: { fontSize: 10.5, fontWeight: '700' },
  contTipo: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
  semContrato: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  acoes: { flexDirection: 'row', gap: 6 },
  erro: { color: colors.danger, fontSize: 12.5, marginTop: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, color: colors.textPrimary, marginBottom: spacing.sm,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  radioRowActive: { borderColor: colors.azulDeep, backgroundColor: `${colors.azulDeep}0D` },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.border },
  radioCircleActive: { borderColor: colors.azulDeep, backgroundColor: colors.azulDeep },
  radioLabel: { fontSize: 12.5, color: colors.textSecondary, flex: 1 },
  radioLabelActive: { color: colors.azulDeep, fontWeight: '700' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  checkLabel: { fontSize: 13, color: colors.textSecondary, flex: 1 },
});
