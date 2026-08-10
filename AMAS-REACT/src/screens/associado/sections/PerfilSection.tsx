import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { apiAssociados } from '@/services/api';
import { maskTel } from '@/utils/validators';
import { formatDataCurta } from '@/utils/format';
import { Card, CardTitleRow, AdminButton, Badge, FormField, LoadingBlock } from '@/components/admin/AdminUI';
import { ModalSheet } from '@/components/admin/ModalSheet';
import type { Associado } from '@/types';

interface PerfilSectionProps {
  assoc: Associado;
  onUpdated: () => Promise<void>;
}

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

export function PerfilSection({ assoc, onUpdated }: PerfilSectionProps) {
  const [editando, setEditando] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  // Edit form
  const [formNome, setFormNome] = useState('');
  const [formTel, setFormTel] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formProf, setFormProf] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [erroEdit, setErroEdit] = useState('');
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  // Senha form
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  function abrirEdicao() {
    setFormNome(assoc.nome || '');
    setFormTel(assoc.telefone || '');
    setFormEmail(assoc.email || '');
    setFormProf(assoc.profissao || '');
    setFormEnd(assoc.endereco || '');
    setErroEdit('');
    setEditando(true);
  }

  async function salvarEdicao() {
    if (!formNome.trim()) return setErroEdit('Nome é obrigatório.');
    if (!formEmail.trim()) return setErroEdit('E-mail é obrigatório.');
    setSalvandoEdit(true);
    try {
      await apiAssociados.atualizar(assoc.id, {
        nome: formNome.trim(),
        telefone: formTel,
        email: formEmail.trim(),
        profissao: formProf.trim(),
        endereco: formEnd.trim(),
      });
      await onUpdated();
      setEditando(false);
    } catch (e) {
      setErroEdit(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvandoEdit(false);
    }
  }

  async function salvarSenha() {
    setErroSenha('');
    if (novaSenha.length < 6) return setErroSenha('A senha deve ter pelo menos 6 caracteres.');
    if (novaSenha !== confirmaSenha) return setErroSenha('As senhas não coincidem.');
    if (novaSenha === '123456') return setErroSenha('Escolha uma senha diferente da padrão.');
    setSalvandoSenha(true);
    try {
      await apiAssociados.atualizar(assoc.id, {
        senha: novaSenha,
        primeiroLogin: false,
        senhaExpirada: false,
      });
      await onUpdated();
      setTrocandoSenha(false);
      setSenhaAtual(''); setNovaSenha(''); setConfirmaSenha('');
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
    } catch (e) {
      setErroSenha(e instanceof Error ? e.message : 'Erro ao salvar senha.');
    } finally {
      setSalvandoSenha(false);
    }
  }

  const score = senhaScore(novaSenha);

  const campos: [string, string][] = [
    ['Nome', assoc.nome || '—'],
    ['CPF', assoc.cpf || '—'],
    ['Nascimento', formatDataCurta(assoc.nascimento) || '—'],
    ['Telefone', assoc.telefone || '—'],
    ['E-mail', assoc.email || '—'],
    ['Endereço', assoc.endereco || '—'],
    ['Profissão', assoc.profissao || '—'],
    ['Matrícula', assoc.matricula || '—'],
    ['Membro desde', formatDataCurta(assoc.dataEntrada) || '—'],
  ];

  return (
    <View style={{ gap: spacing.md }}>
      {/* Status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Situação atual</Text>
          <Badge status={assoc.status || 'Pendente'} />
        </View>
      </Card>

      {/* Dados pessoais */}
      <Card>
        <CardTitleRow
          title="Dados Pessoais"
          icon="person-outline"
          action={<AdminButton label="Editar" icon="create-outline" small onPress={abrirEdicao} />}
        />
        {campos.map(([label, valor]) => (
          <View key={label} style={styles.dadoRow}>
            <Text style={styles.dadoLabel}>{label}</Text>
            <Text style={styles.dadoValor} numberOfLines={2}>{valor}</Text>
          </View>
        ))}
      </Card>

      {/* Segurança */}
      <Card>
        <CardTitleRow title="Segurança" icon="lock-closed-outline" />
        <AdminButton
          label="Alterar senha"
          icon="key-outline"
          onPress={() => { setErroSenha(''); setSenhaAtual(''); setNovaSenha(''); setConfirmaSenha(''); setTrocandoSenha(true); }}
        />
      </Card>

      {/* Modal editar perfil */}
      <ModalSheet
        visible={editando}
        onClose={() => setEditando(false)}
        title="Editar Perfil"
        footer={
          <>
            <AdminButton label="Cancelar" onPress={() => setEditando(false)} variant="outline" fullWidth />
            <AdminButton label="Salvar" onPress={salvarEdicao} variant="primary" fullWidth loading={salvandoEdit} />
          </>
        }
      >
        <FormField label="Nome completo" required value={formNome} onChangeText={setFormNome} />
        <FormField
          label="Telefone"
          value={formTel}
          onChangeText={(v) => setFormTel(maskTel(v))}
          keyboardType="phone-pad"
        />
        <FormField label="E-mail" required value={formEmail} onChangeText={setFormEmail} keyboardType="email-address" autoCapitalize="none" />
        <FormField label="Profissão" value={formProf} onChangeText={setFormProf} />
        <FormField label="Endereço" value={formEnd} onChangeText={setFormEnd} />
        {erroEdit ? <Text style={styles.erro}>{erroEdit}</Text> : null}
      </ModalSheet>

      {/* Modal trocar senha */}
      <ModalSheet
        visible={trocandoSenha}
        onClose={() => setTrocandoSenha(false)}
        title="Alterar Senha"
        footer={
          <>
            <AdminButton label="Cancelar" onPress={() => setTrocandoSenha(false)} variant="outline" fullWidth />
            <AdminButton label="Salvar" onPress={salvarSenha} variant="primary" fullWidth loading={salvandoSenha} />
          </>
        }
      >
        <FormField label="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual} secureTextEntry placeholder="Senha atual" />
        <FormField label="Nova senha (mín. 6 caracteres)" required value={novaSenha} onChangeText={setNovaSenha} secureTextEntry placeholder="Nova senha" />
        {novaSenha.length > 0 && (
          <View style={styles.scoreWrap}>
            <View style={styles.scoreBar}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.scoreSeg, i <= score && { backgroundColor: SCORE_COLOR[score] }]} />
              ))}
            </View>
            <Text style={[styles.scoreLabel, { color: SCORE_COLOR[score] }]}>{SCORE_LABEL[score]}</Text>
          </View>
        )}
        <FormField label="Confirmar nova senha" required value={confirmaSenha} onChangeText={setConfirmaSenha} secureTextEntry placeholder="Repita a nova senha" />
        {erroSenha ? <Text style={styles.erro}>{erroSenha}</Text> : null}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: { flexDirection: 'row', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  statusLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  dadoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dadoLabel: { fontSize: 12, color: colors.textMuted },
  dadoValor: { fontSize: 12.5, color: colors.textPrimary, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 8 },
  erro: { color: colors.danger, fontSize: 12.5, marginTop: 4 },
  scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4, marginBottom: 8 },
  scoreBar: { flexDirection: 'row', gap: 3, flex: 1 },
  scoreSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surface },
  scoreLabel: { fontSize: 11, fontWeight: '700', width: 40 },
});
