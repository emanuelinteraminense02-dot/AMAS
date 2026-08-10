import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { apiAssociados } from '@/services/api';
import { Card, AdminButton } from '@/components/admin/AdminUI';
import type { Associado } from '@/types';

const MESES_LABEL: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

// Gera os últimos 12 meses para o seletor
function gerarMeses(): { value: string; label: string }[] {
  const agora = new Date();
  const lista: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const label = `${MESES_LABEL[mm]} de ${yyyy}`;
    lista.push({ value: `${yyyy}-${mm}`, label });
  }
  return lista;
}

interface EnviarSectionProps {
  assoc: Associado;
  onUpdated: () => Promise<void>;
}

export function EnviarSection({ assoc, onUpdated }: EnviarSectionProps) {
  const meses = gerarMeses();
  const [mesSel, setMesSel] = useState(meses[0].value);
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');
  const [arquivoNome, setArquivoNome] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function maskMoeda(raw: string) {
    const nums = raw.replace(/\D/g, '');
    if (!nums) return '';
    const cents = parseInt(nums, 10);
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function valorNumerico() {
    const nums = valor.replace(/\D/g, '');
    return nums ? (parseInt(nums, 10) / 100) : 0;
  }

  function simularSelecaoArquivo() {
    // React Native não tem acesso a arquivos reais sem expo-document-picker.
    // Simulamos inserindo um nome fictício — o backend recebe apenas o nome.
    const nomes = ['comprovante.pdf', 'recibo_banco.jpg', 'pix_comprovante.png'];
    setArquivoNome(nomes[Math.floor(Math.random() * nomes.length)]);
  }

  async function enviar() {
    setErro('');
    if (!mesSel) return setErro('Selecione o mês de referência.');
    const v = valorNumerico();
    if (v <= 0) return setErro('Informe o valor da contribuição.');
    if (!arquivoNome) return setErro('Selecione o arquivo do comprovante.');

    const [yyyy, mm] = mesSel.split('-');
    const nomeMes = `${MESES_LABEL[mm]} de ${yyyy}`;

    setEnviando(true);
    try {
      await apiAssociados.adicionarContribuicao(assoc.id, {
        valor: v.toFixed(2),
        arquivo: arquivoNome,
        mes: nomeMes,
        status: 'Em análise',
        observacoes: obs.trim(),
      });
      await onUpdated();
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar comprovante.');
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() {
    setMesSel(meses[0].value);
    setValor('');
    setObs('');
    setArquivoNome('');
    setErro('');
    setEnviado(false);
  }

  if (enviado) {
    return (
      <Card style={styles.successCard}>
        <Ionicons name="checkmark-circle" size={52} color={colors.success} />
        <Text style={styles.successTitle}>Comprovante enviado!</Text>
        <Text style={styles.successDesc}>
          Seu comprovante está em análise. O administrador irá validar e atualizar sua situação em breve.
        </Text>
        <AdminButton label="Enviar outro comprovante" icon="add-circle-outline" onPress={reiniciar} />
      </Card>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <Text style={styles.cardTitle}>Enviar Comprovante de Contribuição</Text>
        <Text style={styles.cardDesc}>
          Selecione o mês de referência, informe o valor e anexe o comprovante do pagamento.
        </Text>

        {/* Mês */}
        <Text style={styles.label}>Mês de referência *</Text>
        <View style={styles.mesesGrid}>
          {meses.slice(0, 6).map((m) => (
            <TouchableOpacity
              key={m.value}
              onPress={() => setMesSel(m.value)}
              style={[styles.mesChip, mesSel === m.value && styles.mesChipActive]}
            >
              <Text style={[styles.mesChipText, mesSel === m.value && styles.mesChipTextActive]}>
                {m.label.split(' de ')[0]}
              </Text>
              <Text style={[styles.mesAno, mesSel === m.value && styles.mesChipTextActive]}>
                {m.label.split(' de ')[1]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Valor */}
        <Text style={[styles.label, { marginTop: spacing.md }]}>Valor da contribuição *</Text>
        <TextInput
          style={styles.input}
          value={valor}
          onChangeText={(v) => setValor(maskMoeda(v))}
          placeholder="R$ 0,00"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
        />

        {/* Arquivo */}
        <Text style={[styles.label, { marginTop: 4 }]}>Comprovante (PDF ou imagem) *</Text>
        <TouchableOpacity style={styles.dropZone} onPress={simularSelecaoArquivo} activeOpacity={0.8}>
          {arquivoNome ? (
            <View style={styles.arquivoSel}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.arquivoNome} numberOfLines={1}>{arquivoNome}</Text>
              <TouchableOpacity onPress={() => setArquivoNome('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.dropContent}>
              <Ionicons name="cloud-upload-outline" size={28} color={colors.azulMid} />
              <Text style={styles.dropText}>Toque para selecionar o arquivo</Text>
              <Text style={styles.dropSub}>PDF, JPG ou PNG · Máx. 5MB</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Obs */}
        <Text style={[styles.label, { marginTop: 4 }]}>Observações (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={obs}
          onChangeText={setObs}
          placeholder="Ex: Pago via PIX, número da transação: ..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <AdminButton
          label="Enviar comprovante"
          icon="send"
          variant="primary"
          fullWidth
          loading={enviando}
          onPress={enviar}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  cardDesc: { fontSize: 12.5, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  mesesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mesChip: {
    width: '30.5%', alignItems: 'center', paddingVertical: 10,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  mesChipActive: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  mesChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  mesChipTextActive: { color: colors.white },
  mesAno: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14,
    color: colors.textPrimary, marginBottom: spacing.sm,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  dropZone: {
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: radius.md, marginBottom: spacing.sm,
    minHeight: 90, alignItems: 'center', justifyContent: 'center',
  },
  dropContent: { alignItems: 'center', gap: 6, padding: spacing.md },
  dropText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  dropSub: { fontSize: 11.5, color: colors.textMuted },
  arquivoSel: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md },
  arquivoNome: { flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  erro: { color: colors.danger, fontSize: 12.5, marginBottom: 8 },
  successCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  successTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  successDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
