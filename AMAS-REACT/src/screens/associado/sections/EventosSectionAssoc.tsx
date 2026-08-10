import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import { apiEventos } from '@/services/api';
import { diasRestantes, mesAbrev } from '@/utils/format';
import { Card, EmptyState, LoadingBlock, SearchInput, Badge } from '@/components/admin/AdminUI';
import { ModalSheet } from '@/components/admin/ModalSheet';
import type { Evento, InscricaoEvento, InscritoResumo, StatusEvento, TipoEvento } from '@/types';

type TabEvento = 'disponiveis' | 'inscritos';
type EstadoInscricao = 'inscrito' | 'espera' | 'vaga_disponivel' | 'livre' | 'lotado' | 'em_breve' | 'encerrado';

const TIPO_LABEL: Record<TipoEvento, string> = {
  social: 'Ação Social', capacitacao: 'Capacitação',
  parceria: 'Parceria', cultural: 'Cultural', reuniao: 'Assembleia',
};
const TIPO_ICON: Record<TipoEvento, keyof typeof Ionicons.glyphMap> = {
  social: 'heart-outline', capacitacao: 'book-outline',
  parceria: 'people-outline', cultural: 'sparkles-outline', reuniao: 'people-outline',
};

interface EventoComEstado extends Evento {
  inscritos: InscritoResumo[];
  listaEspera: InscritoResumo[];
  _estado?: EstadoInscricao;
}

function calcEstado(ev: EventoComEstado, assocId: number): EstadoInscricao {
  const status = ev.status || 'Aberto';
  if (status === 'Encerrado' || status === 'Cancelado') return 'encerrado';
  if (status === 'Em Breve') return 'em_breve';
  const inscritos = ev.inscritos || [];
  const espera = ev.listaEspera || [];
  const estaInscrito = inscritos.some((i) => i.id === assocId);
  if (estaInscrito) return 'inscrito';
  const estaEspera = espera.some((i) => i.id === assocId);
  if (estaEspera) return 'espera';
  const vagas = ev.vagasTotais || ev.vagas || 0;
  if (vagas > 0 && inscritos.length >= vagas) return 'lotado';
  return 'livre';
}

interface EventosSectionAssocProps {
  assocId: number;
}

export function EventosSectionAssoc({ assocId }: EventosSectionAssocProps) {
  const [eventos, setEventos] = useState<EventoComEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabEvento>('disponiveis');
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoEvento | ''>('');
  const [detalhe, setDetalhe] = useState<EventoComEstado | null>(null);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const lista = (await apiEventos.listar()) as Evento[];
      const comInscritos = await Promise.all(
        lista.map(async (ev) => {
          try {
            const raw = (await apiEventos.listarInscritos(ev.id)) as InscricaoEvento[];
            const inscritos = raw.filter((i) => i.situacao === 'confirmado').map((i) => ({
              id: i.associado?.id, nome: i.associado?.nome,
              matricula: i.associado?.matricula, email: i.associado?.email,
            }));
            const listaEspera = raw.filter((i) => i.situacao === 'lista_espera').map((i) => ({
              id: i.associado?.id, nome: i.associado?.nome,
            }));
            return { ...ev, inscritos, listaEspera } as EventoComEstado;
          } catch {
            return { ...ev, inscritos: [], listaEspera: [] } as EventoComEstado;
          }
        })
      );
      setEventos(comInscritos);
    } catch {
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function inscrever(ev: EventoComEstado) {
    setProcessandoId(ev.id);
    try {
      await apiEventos.inscrever(ev.id, assocId);
      await carregar();
      Alert.alert('Sucesso', 'Inscrição realizada!');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível realizar a inscrição.');
    } finally {
      setProcessandoId(null);
    }
  }

  async function cancelar(ev: EventoComEstado) {
    Alert.alert('Cancelar inscrição', 'Deseja cancelar sua inscrição neste evento?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          setProcessandoId(ev.id);
          try {
            await apiEventos.cancelarInscricao(ev.id, assocId);
            await carregar();
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível cancelar.');
          } finally {
            setProcessandoId(null);
          }
        },
      },
    ]);
  }

  const disponiveis = useMemo(() => {
    const b = busca.toLowerCase();
    return eventos
      .filter((ev) => (ev.status || 'Aberto') !== 'Encerrado' && (ev.status || 'Aberto') !== 'Cancelado')
      .filter((ev) => !filtroTipo || ev.tipo === filtroTipo)
      .filter((ev) => !b || ev.titulo.toLowerCase().includes(b) || (ev.local || '').toLowerCase().includes(b))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [eventos, busca, filtroTipo]);

  const inscritos = useMemo(
    () => eventos.filter((ev) => {
      const e = calcEstado(ev, assocId);
      return e === 'inscrito' || e === 'espera' || e === 'vaga_disponivel';
    }),
    [eventos, assocId]
  );

  if (loading) return <LoadingBlock text="Carregando eventos..." />;

  return (
    <View style={{ gap: spacing.md }}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'disponiveis' && styles.tabAtivo]} onPress={() => setTab('disponiveis')}>
          <Text style={[styles.tabText, tab === 'disponiveis' && styles.tabTextAtivo]}>Disponíveis</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'inscritos' && styles.tabAtivo]} onPress={() => setTab('inscritos')}>
          <Text style={[styles.tabText, tab === 'inscritos' && styles.tabTextAtivo]}>
            Minhas inscrições {inscritos.length > 0 ? `(${inscritos.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'disponiveis' ? (
        <>
          <SearchInput value={busca} onChangeText={setBusca} placeholder="Buscar por título ou local..." />
          <View style={styles.filtroTipos}>
            {(['', 'social', 'capacitacao', 'parceria', 'cultural', 'reuniao'] as (TipoEvento | '')[]).map((t) => (
              <TouchableOpacity
                key={t || 'todos'}
                onPress={() => setFiltroTipo(t)}
                style={[styles.filtroChip, filtroTipo === t && styles.filtroChipAtivo]}
              >
                <Text style={[styles.filtroText, filtroTipo === t && styles.filtroTextAtivo]}>
                  {t ? TIPO_LABEL[t as TipoEvento] : 'Todos'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {disponiveis.length === 0 ? (
            <Card><EmptyState text="Nenhum evento disponível." icon="calendar-outline" /></Card>
          ) : (
            disponiveis.map((ev) => (
              <EventoCard
                key={ev.id}
                ev={ev}
                assocId={assocId}
                processando={processandoId === ev.id}
                onVer={() => setDetalhe(ev)}
                onInscrever={() => inscrever(ev)}
                onCancelar={() => cancelar(ev)}
              />
            ))
          )}
        </>
      ) : (
        <>
          {inscritos.length === 0 ? (
            <Card>
              <EmptyState text="Você ainda não tem inscrições." icon="calendar-outline" />
              <TouchableOpacity onPress={() => setTab('disponiveis')} style={styles.verBtn}>
                <Text style={styles.verBtnText}>Ver eventos disponíveis</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            inscritos.map((ev) => (
              <EventoCard
                key={ev.id}
                ev={ev}
                assocId={assocId}
                processando={processandoId === ev.id}
                onVer={() => setDetalhe(ev)}
                onInscrever={() => inscrever(ev)}
                onCancelar={() => cancelar(ev)}
              />
            ))
          )}
        </>
      )}

      {/* Modal detalhe */}
      <ModalSheet
        visible={!!detalhe}
        onClose={() => setDetalhe(null)}
        title={detalhe?.titulo || ''}
        subtitle={`${detalhe?.data || ''} · ${detalhe?.horario || ''} · ${detalhe?.local || ''}`}
      >
        {detalhe ? <EventoDetalheBody ev={detalhe} assocId={assocId} onInscrever={() => { setDetalhe(null); inscrever(detalhe); }} onCancelar={() => { setDetalhe(null); cancelar(detalhe); }} /> : null}
      </ModalSheet>
    </View>
  );
}

/* ── Event card ─────────────────────────────────────────────────── */
function EventoCard({ ev, assocId, processando, onVer, onInscrever, onCancelar }: {
  ev: EventoComEstado;
  assocId: number;
  processando: boolean;
  onVer: () => void;
  onInscrever: () => void;
  onCancelar: () => void;
}) {
  const estado = calcEstado(ev, assocId);
  const [, month, day] = (ev.data || '').split('-');
  const vagas = ev.vagasTotais || ev.vagas || 0;
  const inscritosCnt = (ev.inscritos || []).length;
  const esperaCnt = (ev.listaEspera || []).length;
  const pct = vagas > 0 ? Math.min(100, Math.round((inscritosCnt / vagas) * 100)) : 0;
  const countdown = diasRestantes(ev.data, (ev.status || 'Aberto') as StatusEvento);
  const tipo = (ev.tipo || 'social') as TipoEvento;

  return (
    <View style={styles.card}>
      {/* Top */}
      <View style={styles.cardTop}>
        <View style={styles.dateBlock}>
          <Text style={styles.day}>{day || '--'}</Text>
          <Text style={styles.month}>{mesAbrev(month)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.tipoBadges}>
            <View style={styles.tipoPill}>
              <Ionicons name={TIPO_ICON[tipo]} size={11} color={colors.azulDeep} />
              <Text style={styles.tipoText}>{TIPO_LABEL[tipo]}</Text>
            </View>
            {estado === 'inscrito' && <Badge status="Regular" small />}
            {estado === 'espera' && <View style={styles.esperaBadge}><Text style={styles.esperaText}>⏳ Na fila</Text></View>}
            {estado === 'vaga_disponivel' && <View style={styles.vagaBadge}><Text style={styles.vagaText}>⭐ Vaga!</Text></View>}
          </View>
          <Text style={styles.titulo} numberOfLines={2}>{ev.titulo}</Text>
          <Text style={styles.meta}>{ev.horario} · {ev.local}</Text>
          <Text style={[styles.countdown, { color: colors.textMuted }]}>{countdown.txt}</Text>
        </View>
      </View>

      {/* Barra de vagas */}
      {vagas > 0 && (
        <View style={styles.vagasRow}>
          <View style={styles.vagasTrack}>
            <View style={[styles.vagasFill, { width: `${pct}%`, backgroundColor: pct >= 90 ? colors.danger : pct >= 70 ? colors.warning : colors.success }]} />
          </View>
          <Text style={styles.vagasText}>{inscritosCnt}/{vagas}{esperaCnt > 0 ? ` · ${esperaCnt} na fila` : ''}</Text>
        </View>
      )}

      {/* Ações */}
      <View style={styles.acoes}>
        <TouchableOpacity onPress={onVer} style={styles.detalhesBtn}>
          <Text style={styles.detalhesBtnText}>ℹ️ Detalhes</Text>
        </TouchableOpacity>
        {estado === 'livre' && (
          <TouchableOpacity onPress={onInscrever} disabled={processando} style={[styles.actionBtn, styles.actionBtnPrimary]}>
            <Text style={styles.actionBtnTextWhite}>{processando ? '...' : 'Inscrever-se'}</Text>
          </TouchableOpacity>
        )}
        {estado === 'lotado' && (
          <TouchableOpacity onPress={onInscrever} disabled={processando} style={[styles.actionBtn, styles.actionBtnWarning]}>
            <Text style={styles.actionBtnTextWhite}>{processando ? '...' : 'Lista de espera'}</Text>
          </TouchableOpacity>
        )}
        {(estado === 'inscrito' || estado === 'espera') && (
          <TouchableOpacity onPress={onCancelar} style={[styles.actionBtn, styles.actionBtnOutline]}>
            <Text style={styles.actionBtnTextDanger}>{estado === 'espera' ? 'Sair da fila' : 'Cancelar'}</Text>
          </TouchableOpacity>
        )}
        {estado === 'em_breve' && (
          <View style={[styles.actionBtn, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Em breve</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function EventoDetalheBody({ ev, assocId, onInscrever, onCancelar }: {
  ev: EventoComEstado; assocId: number;
  onInscrever: () => void; onCancelar: () => void;
}) {
  const estado = calcEstado(ev, assocId);
  const vagas = ev.vagasTotais || ev.vagas || 0;
  const inscritosCnt = (ev.inscritos || []).length;
  const esperaCnt = (ev.listaEspera || []).length;
  const posEspera = (ev.listaEspera || []).findIndex((i) => i.id === assocId) + 1;

  return (
    <View style={{ gap: spacing.md }}>
      {ev.descricao ? <Text style={styles.detalheDesc}>{ev.descricao}</Text> : null}
      {[['Data', ev.data], ['Horário', ev.horario || '—'], ['Local', ev.local || '—']].map(([l, v]) => (
        <View key={l} style={styles.detalheRow}><Text style={styles.detalheLabel}>{l}</Text><Text style={styles.detalheVal}>{v}</Text></View>
      ))}
      {vagas > 0 && (
        <View style={styles.detalheRow}>
          <Text style={styles.detalheLabel}>Vagas</Text>
          <Text style={styles.detalheVal}>{inscritosCnt}/{vagas}{esperaCnt > 0 ? ` · ${esperaCnt} na fila` : ''}</Text>
        </View>
      )}
      {estado === 'inscrito' && (
        <View style={styles.inscritoConfirm}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.inscritoText}>Você está inscrito neste evento!</Text>
        </View>
      )}
      {estado === 'espera' && (
        <View style={styles.esperaConfirm}>
          <Text style={styles.esperaConfirmText}>⏳ Você está na fila de espera — posição #{posEspera}</Text>
        </View>
      )}
      {estado === 'livre' && (
        <TouchableOpacity style={styles.actionBtnFull} onPress={onInscrever}>
          <Text style={styles.actionBtnTextWhite}>Garantir minha vaga</Text>
        </TouchableOpacity>
      )}
      {estado === 'lotado' && (
        <TouchableOpacity style={[styles.actionBtnFull, { backgroundColor: colors.warning }]} onPress={onInscrever}>
          <Text style={styles.actionBtnTextWhite}>Entrar na lista de espera</Text>
        </TouchableOpacity>
      )}
      {(estado === 'inscrito' || estado === 'espera') && (
        <TouchableOpacity onPress={onCancelar} style={styles.cancelarLink}>
          <Text style={styles.cancelarLinkText}>{estado === 'espera' ? 'Sair da fila de espera' : 'Cancelar minha inscrição'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.bgCard },
  tabAtivo: { backgroundColor: colors.azulDeep },
  tabText: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  tabTextAtivo: { color: colors.white, fontWeight: '800' },
  filtroTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filtroChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  filtroChipAtivo: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  filtroText: { fontSize: 11.5, color: colors.textMuted, fontWeight: '600' },
  filtroTextAtivo: { color: colors.white },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, ...shadow.sm, gap: 10 },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  dateBlock: {
    width: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: radius.sm, paddingVertical: 8,
  },
  day: { fontSize: 19, fontWeight: '800', color: colors.azulDeep },
  month: { fontSize: 11, color: colors.douradoEscuro, fontWeight: '700', textTransform: 'uppercase' },
  tipoBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  tipoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
  },
  tipoText: { fontSize: 10.5, fontWeight: '700', color: colors.azulDeep },
  titulo: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  meta: { fontSize: 11.5, color: colors.textMuted },
  countdown: { fontSize: 11, marginTop: 2 },
  esperaBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill },
  esperaText: { fontSize: 10.5, color: '#b45309', fontWeight: '700' },
  vagaBadge: { backgroundColor: '#fef9c3', paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill },
  vagaText: { fontSize: 10.5, color: '#854d0e', fontWeight: '700' },
  vagasRow: { gap: 4 },
  vagasTrack: { height: 5, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden' },
  vagasFill: { height: '100%', borderRadius: 3 },
  vagasText: { fontSize: 10.5, color: colors.textMuted },
  acoes: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  detalhesBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  detalhesBtnText: { fontSize: 12, color: colors.textMuted },
  actionBtn: { flex: 1, borderRadius: radius.sm, paddingVertical: 9, alignItems: 'center' },
  actionBtnPrimary: { backgroundColor: colors.azulDeep },
  actionBtnWarning: { backgroundColor: colors.warning },
  actionBtnOutline: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  actionBtnTextWhite: { fontSize: 12.5, fontWeight: '700', color: colors.white },
  actionBtnTextDanger: { fontSize: 12.5, fontWeight: '700', color: colors.danger },
  verBtn: { marginTop: spacing.md, alignItems: 'center' },
  verBtnText: { fontSize: 13, color: colors.azulMid, fontWeight: '700' },
  // Detalhe modal
  detalheDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  detalheRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  detalheLabel: { fontSize: 12, color: colors.textMuted },
  detalheVal: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  inscritoConfirm: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#dcfce7', borderRadius: radius.sm, padding: spacing.sm },
  inscritoText: { fontSize: 13, color: '#15803d', fontWeight: '700' },
  esperaConfirm: { backgroundColor: '#fef3c7', borderRadius: radius.sm, padding: spacing.sm },
  esperaConfirmText: { fontSize: 13, color: '#92400e', fontWeight: '600' },
  actionBtnFull: { backgroundColor: colors.azulDeep, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center' },
  cancelarLink: { alignItems: 'center', paddingVertical: 8 },
  cancelarLinkText: { fontSize: 12.5, color: colors.danger },
});
