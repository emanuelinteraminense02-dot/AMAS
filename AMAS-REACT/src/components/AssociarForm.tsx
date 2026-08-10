import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { apiSolicitacoes } from '@/services/api';
import { maskCNPJ, maskCPF, maskTel, validarCNPJ, validarCPF } from '@/utils/validators';
import type { SolicitacaoPublicaPayload, TipoSolicitante } from '@/types';

const CHECKLIST = [
  'Processo 100% online',
  'Análise em até 48 horas',
  'Sem taxas de adesão',
  'Suporte dedicado',
];

interface FormState {
  nome: string;
  cpf: string;
  cnpj: string;
  nascimento: string;
  responsavel: string;
  telefone: string;
  email: string;
  endereco: string;
  profissao: string;
  motivo: string;
}

const ESTADO_INICIAL: FormState = {
  nome: '',
  cpf: '',
  cnpj: '',
  nascimento: '',
  responsavel: '',
  telefone: '',
  email: '',
  endereco: '',
  profissao: '',
  motivo: '',
};

export function AssociarForm() {
  const [tipo, setTipo] = useState<TipoSolicitante>('pessoa_fisica');
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const update = (campo: keyof FormState) => (valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  const isEmpresa = tipo === 'empresa';

  async function handleSubmit() {
    setErro('');

    if (!form.nome || !form.telefone || !form.email || !form.endereco || !form.profissao || !form.motivo) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    if (isEmpresa) {
      if (!form.cnpj || !form.responsavel) {
        setErro('Informe o CNPJ e o responsável pela empresa.');
        return;
      }
      if (!validarCNPJ(form.cnpj)) {
        setErro('CNPJ inválido.');
        return;
      }
    } else {
      if (!form.cpf || !form.nascimento) {
        setErro('Informe CPF e data de nascimento (AAAA-MM-DD).');
        return;
      }
      if (!validarCPF(form.cpf)) {
        setErro('CPF inválido.');
        return;
      }
    }

    const payload: SolicitacaoPublicaPayload = {
      tipoSolicitante: tipo,
      nome: form.nome,
      cpf: isEmpresa ? null : form.cpf,
      cnpj: isEmpresa ? form.cnpj : null,
      nascimento: isEmpresa ? null : form.nascimento,
      responsavel: isEmpresa ? form.responsavel : null,
      telefone: form.telefone,
      email: form.email,
      endereco: form.endereco,
      profissao: form.profissao,
      observacoes: form.motivo,
    };

    try {
      setEnviando(true);
      await apiSolicitacoes.criar(payload);
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar sua solicitação.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <View style={styles.container}>
        <View style={[styles.formCard, styles.successCard]}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.successTitle}>Solicitação enviada!</Text>
          <Text style={styles.successText}>
            Sua solicitação foi enviada com sucesso. A equipe da AMAS analisará seu cadastro e entrará em
            contato em breve.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.label}>Faça parte</Text>
        <Text style={styles.title}>Torne-se um associado da AMAS</Text>
        <Text style={styles.desc}>
          Preencha o formulário e nossa equipe analisará sua solicitação. É rápido, gratuito e o primeiro
          passo para fazer parte da transformação de São Sebastião.
        </Text>
        {CHECKLIST.map((item) => (
          <View key={item} style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={15} color={colors.success} />
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Solicitação de associação</Text>

        <View style={styles.tipoSwitch}>
          <TouchableOpacity
            style={[styles.tipoChip, !isEmpresa && styles.tipoChipActive]}
            onPress={() => setTipo('pessoa_fisica')}
            activeOpacity={0.85}
          >
            <Ionicons name="person" size={14} color={!isEmpresa ? colors.white : colors.textMuted} />
            <Text style={[styles.tipoChipText, !isEmpresa && styles.tipoChipTextActive]}>Pessoa Física</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tipoChip, isEmpresa && styles.tipoChipActive]}
            onPress={() => setTipo('empresa')}
            activeOpacity={0.85}
          >
            <Ionicons name="business" size={14} color={isEmpresa ? colors.white : colors.textMuted} />
            <Text style={[styles.tipoChipText, isEmpresa && styles.tipoChipTextActive]}>Empresa</Text>
          </TouchableOpacity>
        </View>

        <Field label={isEmpresa ? 'Razão social *' : 'Nome completo *'}>
          <TextInput
            style={styles.input}
            placeholder={isEmpresa ? 'Nome da empresa' : 'Seu nome completo'}
            placeholderTextColor={colors.textMuted}
            value={form.nome}
            onChangeText={update('nome')}
          />
        </Field>

        {isEmpresa ? (
          <>
            <Field label="CNPJ *">
              <TextInput
                style={styles.input}
                placeholder="00.000.000/0000-00"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={18}
                value={form.cnpj}
                onChangeText={(v) => update('cnpj')(maskCNPJ(v))}
              />
            </Field>
            <Field label="Responsável *">
              <TextInput
                style={styles.input}
                placeholder="Nome do responsável pela empresa"
                placeholderTextColor={colors.textMuted}
                value={form.responsavel}
                onChangeText={update('responsavel')}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="CPF *">
              <TextInput
                style={styles.input}
                placeholder="000.000.000-00"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={14}
                value={form.cpf}
                onChangeText={(v) => update('cpf')(maskCPF(v))}
              />
            </Field>
            <Field label="Data de nascimento *">
              <TextInput
                style={styles.input}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={form.nascimento}
                onChangeText={update('nascimento')}
              />
            </Field>
          </>
        )}

        <Field label="Telefone *">
          <TextInput
            style={styles.input}
            placeholder="(61) 99999-9999"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={form.telefone}
            onChangeText={(v) => update('telefone')(maskTel(v))}
          />
        </Field>

        <Field label="Email *">
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={update('email')}
          />
        </Field>

        <Field label="Endereço *">
          <TextInput
            style={styles.input}
            placeholder="Rua, número, bairro – São Sebastião/DF"
            placeholderTextColor={colors.textMuted}
            value={form.endereco}
            onChangeText={update('endereco')}
          />
        </Field>

        <Field label={isEmpresa ? 'Ramo de atuação *' : 'Profissão *'}>
          <TextInput
            style={styles.input}
            placeholder={isEmpresa ? 'Ex.: comércio, serviços, educação' : 'Sua profissão ou ocupação'}
            placeholderTextColor={colors.textMuted}
            value={form.profissao}
            onChangeText={update('profissao')}
          />
        </Field>

        <Field label={isEmpresa ? 'Como sua empresa deseja participar? *' : 'Por que deseja se associar? *'}>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Conte-nos sua motivação..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            value={form.motivo}
            onChangeText={update('motivo')}
          />
        </Field>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={enviando} activeOpacity={0.9}>
          {enviando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Enviar solicitação →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.azulDeep, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  info: { marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '700', color: '#93c5fd', textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.white, marginBottom: 12 },
  desc: { fontSize: 13.5, color: colors.textOnDarkMuted, lineHeight: 20, marginBottom: 14 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  checkText: { color: colors.textOnDarkMuted, fontSize: 13 },
  formCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, ...shadow.lg },
  successCard: { alignItems: 'center', textAlign: 'center', paddingVertical: spacing.xxl, gap: 10 },
  successTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 8 },
  successText: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  formTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  tipoSwitch: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  tipoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipoChipActive: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  tipoChipText: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  tipoChipTextActive: { color: colors.white },
  field: { marginBottom: spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  erro: { color: colors.danger, fontSize: 12.5, marginTop: 4, marginBottom: 8 },
  submitBtn: {
    backgroundColor: colors.azulDeep,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitBtnText: { color: colors.white, fontWeight: '800', fontSize: 14.5 },
});
