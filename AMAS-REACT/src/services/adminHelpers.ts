// Funções compostas usadas pelo painel Admin — equivalentes às funções
// de frontend/js/database.js que combinam múltiplas chamadas de api.js
// (ex.: checar duplicidade de CPF, resets pendentes, inscrições de evento).

import {
  apiAssociados,
  apiEmpresarios,
  apiEventos,
  apiLog,
} from './api';
import type {
  Associado,
  Empresario,
  Evento,
  InscricaoEvento,
  InscritoResumo,
  ResetPendente,
} from '@/types';

/* ─── Log ─────────────────────────────────────────────────────── */
export function registrarLog(acao: string, usuario?: string, perfil?: string, detalhes?: string) {
  apiLog.registrar(acao, usuario, perfil, detalhes).catch(() => {});
}

/* ─── Duplicidade de documento ──────────────────────────────────── */
export async function cpfJaExiste(cpf: string, excluirId: number | null): Promise<boolean> {
  const lista = (await apiAssociados.listar()) as Associado[];
  const c = cpf.replace(/\D/g, '');
  return lista.some((a) => (a.cpf || '').replace(/\D/g, '') === c && a.id !== excluirId);
}

export async function cnpjJaExiste(cnpj: string, excluirId: number | null): Promise<boolean> {
  const lista = (await apiEmpresarios.listar()) as Empresario[];
  const doc = cnpj.replace(/\D/g, '');
  return lista.some((e) => String(e.cnpj || '').replace(/\D/g, '') === doc && e.id !== excluirId);
}

/* ─── Contrato de parceria (empresas) ───────────────────────────── */
export function parseContrato(emp: Empresario): NonNullable<Empresario['contrato']> & object {
  if (!emp.contrato) return {};
  return typeof emp.contrato === 'string' ? JSON.parse(emp.contrato) : emp.contrato;
}

export async function salvarContratoEmpresa(empId: number, contrato: object) {
  const emp = (await apiEmpresarios.buscarPorId(empId)) as Empresario;
  const contratoAtual = parseContrato(emp);
  return apiEmpresarios.atualizar(empId, { ...emp, contrato: { ...contratoAtual, ...contrato } });
}

/* ─── Recuperação de acesso ──────────────────────────────────────── */
export async function getResetsPendentes(): Promise<ResetPendente[]> {
  const [assocs, emps] = await Promise.all([
    apiAssociados.listar() as Promise<Associado[]>,
    apiEmpresarios.listar() as Promise<Empresario[]>,
  ]);
  const lista: ResetPendente[] = [];
  assocs
    .filter((a) => a.resetSolicitado)
    .forEach((a) =>
      lista.push({
        id: a.id,
        nome: a.nome,
        email: a.email,
        perfil: 'associado',
        tipoLabel: 'Associado',
        dataResetSolicit: a.dataResetSolicit,
        _colecao: 'associados',
      })
    );
  emps
    .filter((u) => u.resetSolicitado)
    .forEach((u) =>
      lista.push({
        id: u.id,
        nome: u.nome,
        email: u.email,
        perfil: 'associado',
        tipoLabel: 'Empresa Parceira',
        dataResetSolicit: u.dataResetSolicit,
        _colecao: 'usuarios',
      })
    );
  return lista.sort(
    (a, b) => new Date(b.dataResetSolicit || 0).getTime() - new Date(a.dataResetSolicit || 0).getTime()
  );
}

export async function processarResetAdmin(id: number, colecao: 'associados' | 'usuarios', nomeAdmin?: string) {
  const campos = { senha: '123456', senhaExpirada: true, resetSolicitado: false, dataResetSolicit: null };
  if (colecao === 'associados') {
    const a = (await apiAssociados.buscarPorId(id)) as Associado;
    await apiAssociados.atualizar(id, { ...a, ...campos });
    registrarLog('Senha resetada pelo Admin', nomeAdmin || 'Admin', 'admin', `${a?.nome || ''} — senha voltou ao padrão`);
  } else {
    const u = (await apiEmpresarios.buscarPorId(id)) as Empresario;
    await apiEmpresarios.atualizar(id, { ...u, ...campos });
    registrarLog('Senha resetada pelo Admin', nomeAdmin || 'Admin', 'admin', `${u?.nome || ''} — senha voltou ao padrão`);
  }
}

/* ─── Eventos + inscrições (visão administrativa) ───────────────── */
function separarInscricoes(inscricoes: InscricaoEvento[]) {
  const lista = Array.isArray(inscricoes) ? inscricoes : [];
  const toResumo = (i: InscricaoEvento): InscritoResumo => ({
    id: i.associado?.id,
    nome: i.associado?.nome,
    matricula: i.associado?.matricula,
    email: i.associado?.email,
    dataInscricao: i.dataInscricao,
  });
  return {
    inscritos: lista.filter((i) => i.situacao === 'confirmado').map(toResumo),
    listaEspera: lista.filter((i) => i.situacao === 'lista_espera').map(toResumo),
  };
}

export async function carregarEventosAdmin(): Promise<Evento[]> {
  const eventos = (await apiEventos.listar()) as Evento[];
  const inscricoesPorEvento = await Promise.all(
    eventos.map(async (evento) => ({
      id: evento.id,
      inscricoes: ((await apiEventos.listarInscritos(evento.id).catch(() => [])) as InscricaoEvento[]) || [],
    }))
  );
  const mapa = new Map(inscricoesPorEvento.map((item) => [item.id, item.inscricoes]));
  return eventos.map((evento) => {
    const { inscritos, listaEspera } = separarInscricoes(mapa.get(evento.id) || []);
    return { ...evento, inscricoes: inscritos.length, inscritos, listaEspera };
  });
}

export async function carregarParticipantesEvento(evento: Evento): Promise<Evento> {
  const inscricoesRaw = ((await apiEventos.listarInscritos(evento.id).catch(() => [])) as InscricaoEvento[]) || [];
  const { inscritos, listaEspera } = separarInscricoes(inscricoesRaw);
  return { ...evento, inscricoes: inscritos.length, inscritos, listaEspera };
}
