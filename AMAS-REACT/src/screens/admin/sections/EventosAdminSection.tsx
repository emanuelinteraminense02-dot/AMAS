import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';
import { apiEventos } from '@/services/api';
import { carregarEventosAdmin, carregarParticipantesEvento } from '@/services/adminHelpers';
import { formatDataCurta } from '@/utils/format';
import { Card, CardTitleRow, AdminButton, EmptyState, LoadingBlock } from '@/components/admin/AdminUI';
import { ModalSheet } from '@/components/admin/ModalSheet';
import type { Evento, StatusEvento, TipoEvento } from '@/types';

const TIPOS: TipoEvento[] = ['social', 'capacitacao', 'parceria', 'cultural', 'reuniao'];
const STATUS_OPCOES: StatusEvento[] = ['Aberto', 'Em Breve', 'Encerrado'];

const FORM_VAZIO = {
  titulo: '', data: '', horario: '', local: '', vagas: '', status: 'Aberto' as StatusEvento,
  tipo: 'social' as TipoEvento, destaque: false, descricao: '',
};

export function EventosAdminSection() {
  const [lista, setLista] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [participantesAlvo, setParticipantesAlvo] = useState<Evento | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setLista(await carregarEventosAdmin());
    } catch {
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function abrirEdicao(ev: Evento) {
    setEditandoId(ev.id);
    setForm({
      titulo: ev.titulo,
      data: ev.data,
      horario: ev.horario || '',
      local: ev.local || '',
      vagas: String(ev.vagasTotais || ev.vagas || ''),
      status: ev.status || 'Aberto',
      tipo: ev.tipo || 'social',
      destaque: !!ev.destaque,
      descricao: ev.descricao || '',
    });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.titulo.trim() || !form.data || !form.local.trim()) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios.');
      return;
    }
    const vagas = parseInt(form.vagas || '0', 10) || 0;
    const dados = {
      titulo: form.titulo.trim(),
      data: form.data,
      horario: form.horario,
      local: form.local.trim(),
      vagas,
      vagasTotais: vagas,
      status: form.status,
      tipo: form.tipo,
      destaque: form.destaque,
      descricao: form.descricao.trim(),
    };
    setSalvando(true);
    try {
      if (editandoId) await apiEventos.atualizar(editandoId, dados);
      else await apiEventos.criar(dados);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function excluir(ev: Evento) {
    Alert.alert('Excluir evento', 'Deseja realmente excluir este evento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiEventos.remover(ev.id);
            await carregar();
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível excluir.');
          }
        },
      },
    ]);
  }

  async function mudarStatus(ev: Evento, status: StatusEvento) {
    try {
      await apiEventos.atualizar(ev.id, { ...ev, status });
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível atualizar.');
    }
  }

  async function abrirParticipantes(ev: Evento) {
    const completo = await carregarParticipantesEvento(ev);
    setParticipantesAlvo(completo);
  }

  async function removerInscrito(eventoId: number, associadoId?: number) {
    if (!associadoId) return;
    Alert.alert('Remover participante', 'Remover este participante do evento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiEventos.cancelarInscricao(eventoId, associadoId);
            await carregar();
            const atualizado = lista.find((e) => e.id === eventoId);
            if (atualizado) setParticipantesAlvo(await carregarParticipantesEvento(atualizado));
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível remover.');
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingBlock text="Carregando eventos..." />;

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <CardTitleRow title="Eventos" icon="calendar-outline" action={<AdminButton label="Novo" icon="add" variant="primary" small onPress={abrirNovo} />} />
      </Card>

      {lista.length === 0 ? (
        <Card>
          <EmptyState text="Nenhum evento cadastrado." icon="calendar-outline" />
        </Card>
      ) : (
        lista.map((ev) => {
          const vagas = ev.vagasTotais || ev.vagas || 0;
          const inscritos = (ev.inscritos || []).length;
          const espera = (ev.listaEspera || []).length;
          const pct = vagas > 0 ? Math.min(100, Math.round((inscritos / vagas) * 100)) : 0;
          const barColor = pct >= 90 ? colors.danger : pct >= 70 ? colors.warning : colors.success;

          return (
            <Card key={ev.id} style={{ gap: 8 }}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.titulo} numberOfLines={2}>{ev.titulo}</Text>
                  <Text style={styles.meta}>{formatDataCurta(ev.data)} às {ev.horario} · {ev.local}</Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                {STATUS_OPCOES.map((s) => (
                  <TouchableOpacity key={s} onPress={() => mudarStatus(ev, s)} style={[styles.statusChip, ev.status === s && styles.statusChipActive]}>
                    <Text style={[styles.statusChipText, ev.status === s && styles.statusChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.acoesRow}>
                <AdminButton label={`${inscritos}${espera ? `+${espera}⏳` : ''}`} icon="people-outline" small onPress={() => abrirParticipantes(ev)} />
                <AdminButton label="" icon="create-outline" small onPress={() => abrirEdicao(ev)} />
                <AdminButton label="" icon="trash-outline" small variant="danger" onPress={() => excluir(ev)} />
              </View>

              <View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.progressLabel}>
                  {inscritos}{vagas ? `/${vagas}` : ''} confirmados{espera ? ` · ${espera} na fila de espera` : ''}
                </Text>
              </View>
            </Card>
          );
        })
      )}

      {/* Modal Novo/Editar */}
      <ModalSheet
        visible={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editandoId ? 'Editar Evento' : 'Novo Evento'}
        footer={
          <>
            <AdminButton label="Cancelar" onPress={() => setModalAberto(false)} variant="outline" fullWidth />
            <AdminButton label="Salvar" onPress={salvar} variant="primary" fullWidth loading={salvando} />
          </>
        }
      >
        <Text style={styles.fieldLabel}>Título *</Text>
        <TextInput style={styles.input} value={form.titulo} onChangeText={(v) => setForm((f) => ({ ...f, titulo: v }))} placeholderTextColor={colors.textMuted} />

        <Text style={styles.fieldLabel}>Data * (AAAA-MM-DD)</Text>
        <TextInput style={styles.input} value={form.data} onChangeText={(v) => setForm((f) => ({ ...f, data: v }))} placeholder="2026-08-15" placeholderTextColor={colors.textMuted} />

        <Text style={styles.fieldLabel}>Horário * (HH:MM)</Text>
        <TextInput style={styles.input} value={form.horario} onChangeText={(v) => setForm((f) => ({ ...f, horario: v }))} placeholder="19:00" placeholderTextColor={colors.textMuted} />

        <Text style={styles.fieldLabel}>Local *</Text>
        <TextInput style={styles.input} value={form.local} onChangeText={(v) => setForm((f) => ({ ...f, local: v }))} placeholderTextColor={colors.textMuted} />

        <Text style={styles.fieldLabel}>Total de vagas (0 = ilimitado)</Text>
        <TextInput style={styles.input} value={form.vagas} onChangeText={(v) => setForm((f) => ({ ...f, vagas: v.replace(/\D/g, '') }))} keyboardType="number-pad" placeholderTextColor={colors.textMuted} />

        <Text style={styles.fieldLabel}>Tipo</Text>
        <View style={styles.chipsRow}>
          {TIPOS.map((t) => (
            <TouchableOpacity key={t} onPress={() => setForm((f) => ({ ...f, tipo: t }))} style={[styles.chip, form.tipo === t && styles.chipActive]}>
              <Text style={[styles.chipText, form.tipo === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.descricao}
          onChangeText={(v) => setForm((f) => ({ ...f, descricao: v }))}
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.textMuted}
        />

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setForm((f) => ({ ...f, destaque: !f.destaque }))}>
          <View style={[styles.checkbox, form.destaque && styles.checkboxActive]} />
          <Text style={styles.checkboxLabel}>Destaque</Text>
        </TouchableOpacity>
      </ModalSheet>

      {/* Modal Participantes */}
      <ModalSheet
        visible={!!participantesAlvo}
        onClose={() => setParticipantesAlvo(null)}
        title={participantesAlvo?.titulo || 'Participantes'}
        subtitle={participantesAlvo ? `${formatDataCurta(participantesAlvo.data)} às ${participantesAlvo.horario} · ${participantesAlvo.local}` : undefined}
      >
        {participantesAlvo ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.fieldLabel}>Confirmados ({(participantesAlvo.inscritos || []).length})</Text>
            {(participantesAlvo.inscritos || []).length === 0 ? (
              <Text style={styles.meta}>Nenhum inscrito ainda.</Text>
            ) : (
              (participantesAlvo.inscritos || []).map((p, i) => (
                <View key={p.id ?? i} style={styles.participanteRow}>
                  <Text style={styles.participantePos}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.participanteNome}>{p.nome || '—'}</Text>
                    <Text style={styles.meta}>{p.matricula || p.email || ''}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removerInscrito(participantesAlvo.id, p.id)} hitSlop={8}>
                    <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {(participantesAlvo.listaEspera || []).length > 0 ? (
              <>
                <Text style={[styles.fieldLabel, { marginTop: spacing.sm }]}>⏳ Fila de espera ({(participantesAlvo.listaEspera || []).length})</Text>
                {(participantesAlvo.listaEspera || []).map((p, i) => (
                  <View key={p.id ?? i} style={styles.participanteRow}>
                    <Text style={styles.participantePos}>#{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.participanteNome}>{p.nome || '—'}</Text>
                      <Text style={styles.meta}>{p.matricula || p.email || ''}</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}
          </View>
        ) : null}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  itemHeader: { flexDirection: 'row', gap: 8 },
  titulo: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: 6 },
  statusChip: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  statusChipActive: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  statusChipText: { fontSize: 11.5, fontWeight: '600', color: colors.textMuted },
  statusChipTextActive: { color: colors.white },
  acoesRow: { flexDirection: 'row', gap: 6 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13.5, color: colors.textPrimary, marginBottom: spacing.sm,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  chipText: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  chipTextActive: { color: colors.white, fontWeight: '700' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  checkboxLabel: { fontSize: 13, color: colors.textSecondary },
  participanteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
  participantePos: { fontSize: 12, color: colors.textMuted, width: 24 },
  participanteNome: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
});
