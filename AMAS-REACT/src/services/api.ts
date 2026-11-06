// ─────────────────────────────────────────────────────────────────
// AMAS · api.ts
// Camada centralizada de comunicação com a API REST — equivalente
// mobile de frontend/js/api.js. Mesma lógica, mesmos endpoints;
// muda apenas onde o token fica salvo (AsyncStorage em vez de
// localStorage) e o uso de fetch nativo do React Native.
// ─────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, SESSION_STORAGE_KEY } from '@/constants/config';
import type { Sessao } from '@/types';

/* ─── Token helper ────────────────────────────────────────────── */
async function getToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const sessao: Sessao = JSON.parse(raw);
    return sessao?.token || null;
  } catch {
    return null;
  }
}

/* ─── Core fetch wrapper ──────────────────────────────────────── */
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function apiRequest<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const opts: RequestInit = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + path, opts);

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      msg = j.erro || j.message || j.error || msg;
    } catch {
      // resposta sem corpo JSON — mantém a mensagem genérica
    }
    throw new Error(msg);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const apiGet = <T,>(path: string) => apiRequest<T>('GET', path);
const apiPost = <T,>(path: string, body?: unknown) => apiRequest<T>('POST', path, body);
const apiPut = <T,>(path: string, body?: unknown) => apiRequest<T>('PUT', path, body);
const apiPatch = <T,>(path: string, body?: unknown) => apiRequest<T>('PATCH', path, body);
const apiDelete = <T,>(path: string) => apiRequest<T>('DELETE', path);

/* ─── Sessão (equivalente a getSessao/setSessao/clearSessao) ───── */
export const sessaoStorage = {
  get: async (): Promise<Sessao | null> => {
    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Sessao) : null;
  },
  set: async (sessao: Sessao) => AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessao)),
  clear: async () => AsyncStorage.removeItem(SESSION_STORAGE_KEY),
};

/* ─── Auth ────────────────────────────────────────────────────── */
export const apiAuth = {
  login: (email: string, senha: string) => apiPost<Sessao>('/auth/login', { email, senha }),
  alterarSenha: (id: number, senhaAtual: string | null, novaSenha: string) =>
    apiPatch(`/auth/associados/${id}/senha`, { senhaAtual, novaSenha }),
};

/* ─── Log ─────────────────────────────────────────────────────── */
export const apiLog = {
  registrar: (acao: string, usuario?: string, perfil?: string, detalhes?: string) =>
    apiPost('/log', { acao, usuario: usuario || 'Sistema', perfil: perfil || 'sistema', detalhes: detalhes || '' }).catch(() => {}),
  listar: () => apiGet('/admin/log'),
};

/* ─── Associados ──────────────────────────────────────────────── */
export const apiAssociados = {
  listar: () => apiGet('/associados'),
  /** Consulta mínima por CPF (empresas parceiras): nome, matrícula, situação e benefício. */
  consultarCpf: (cpf: string) => apiGet(`/associados/consulta-cpf?cpf=${encodeURIComponent(cpf)}`),
  buscarPorId: (id: number) => apiGet(`/associados/${id}`),
  criar: (dados: unknown) => apiPost('/associados', dados),
  atualizar: (id: number, dados: unknown) => apiPut(`/associados/${id}`, dados),
  remover: (id: number) => apiDelete(`/associados/${id}`),
  atualizarStatus: (id: number, status: string) => apiPatch(`/associados/${id}/status`, { status }),
  listarInadimplentes: () => apiGet('/associados/inadimplentes'),
  getContribuicoes: (id: number) => apiGet(`/associados/${id}/contribuicoes`),
  adicionarContribuicao: (id: number, contrib: unknown) => apiPost(`/associados/${id}/contribuicoes`, contrib),
  atualizarStatusContribuicao: (contribuicaoId: number, status: string, msgAdmin?: string) =>
    apiPatch(`/associados/contribuicoes/${contribuicaoId}/status`, { status, msgAdmin: msgAdmin || '' }),
  getParcelasAtraso: (id: number) => apiGet(`/associados/${id}/parcelas-atraso`),
};

/* ─── Empresários ─────────────────────────────────────────────── */
export const apiEmpresarios = {
  listar: () => apiGet('/empresarios'),
  buscarPorId: (id: number) => apiGet(`/empresarios/${id}`),
  criar: (dados: unknown) => apiPost('/empresarios', dados),
  atualizar: (id: number, dados: unknown) => apiPut(`/empresarios/${id}`, dados),
  remover: (id: number) => apiDelete(`/empresarios/${id}`),
  getContribuicoes: (id: number) => apiGet(`/empresarios/${id}/contribuicoes`),
  adicionarContribuicao: (id: number, dados: unknown) => apiPost(`/empresarios/${id}/contribuicoes`, dados),
  atualizarStatusContribuicao: (cId: number, status: string, obsAdmin?: string) =>
    apiPatch(`/empresarios/contribuicoes/${cId}/status`, { status, obsAdmin: obsAdmin || '' }),
  getAlertas: (id: number) => apiGet(`/empresarios/${id}/alertas`),
  enviarAlerta: (id: number, dados: unknown) => apiPost(`/empresarios/${id}/alertas`, dados),
};

/* ─── Admin ───────────────────────────────────────────────────── */
export const apiAdmin = {
  getDashboard: () => apiGet('/admin/dashboard'),
  /** Gera senha temporária (associados ou usuarios) e obriga a troca no próximo acesso. */
  redefinirSenha: (colecao: 'associados' | 'usuarios', id: number) =>
    apiPost<{ nome: string; senhaTemporaria: string }>(`/admin/senhas/${colecao}/${id}/redefinir`, {}),
  getLog: () => apiGet('/admin/log'),
  getAlertas: () => apiGet('/admin/alertas-empresario'),
  marcarAlertaLido: (id: number) => apiPatch(`/admin/alertas-empresario/${id}/lido`, {}),
  getSolicitacoes: () => apiGet('/admin/solicitacoes'),
  aprovarSolicitacao: (id: number) => apiPost(`/admin/solicitacoes/${id}/aprovar`, {}),
  recusarSolicitacao: (id: number, motivo?: string) =>
    apiPost(`/admin/solicitacoes/${id}/recusar`, { observacoes: motivo || '' }),
};

/* ─── Dados públicos (sem login) ────────────────────────────────── */
export const apiPublico = {
  estatisticas: () => apiGet('/publico/estatisticas'),
};

/* ─── Solicitações públicas ─────────────────────────────────────── */
export const apiSolicitacoes = {
  listar: () => apiGet('/solicitacoes'),
  criar: (dados: unknown) => apiPost('/solicitacoes', dados),
};

/* ─── Notícias ────────────────────────────────────────────────── */
export const apiNoticias = {
  listar: () => apiGet('/noticias'),
  criar: (dados: unknown) => apiPost('/noticias', dados),
  atualizar: (id: number, dados: unknown) => apiPut(`/noticias/${id}`, dados),
  remover: (id: number) => apiDelete(`/noticias/${id}`),
};

/* ─── Eventos ─────────────────────────────────────────────────── */
export const apiEventos = {
  listar: () => apiGet('/eventos'),
  buscarPorId: (id: number) => apiGet(`/eventos/${id}`),
  criar: (dados: unknown) => apiPost('/eventos', dados),
  atualizar: (id: number, dados: unknown) => apiPut(`/eventos/${id}`, dados),
  remover: (id: number) => apiDelete(`/eventos/${id}`),
  inscrever: (id: number, assocId: number) => apiPost(`/eventos/${id}/inscrever`, { associadoId: assocId }),
  cancelarInscricao: (eventoId: number, assocId: number) => apiDelete(`/eventos/${eventoId}/inscrever/${assocId}`),
  listarInscritos: (id: number) => apiGet(`/eventos/${id}/inscritos`),
  getInscritosAssociado: (assocId: number) => apiGet(`/eventos/inscritos/associado/${assocId}`),
};

/* ─── Projetos ────────────────────────────────────────────────── */
export const apiProjetos = {
  listar: () => apiGet('/projetos'),
  listarEmAndamento: () => apiGet('/projetos/em-andamento'),
  criar: (dados: unknown) => apiPost('/projetos', dados),
  atualizar: (id: number, dados: unknown) => apiPut(`/projetos/${id}`, dados),
  remover: (id: number) => apiDelete(`/projetos/${id}`),
};

/* ─── Recuperação de senha (fluxo público) ──────────────────────── */
export const apiRecuperacao = {
  // Rota pública: registra o pedido para o administrador sem exigir login nem revelar se o e-mail existe
  solicitarReset: async (email: string): Promise<{ ok: boolean; nome?: string; tipo?: string; erro?: string; mensagem?: string }> => {
    const res = await apiPost<{ ok: boolean; mensagem?: string }>('/auth/esqueci-senha', { email: email.trim() });
    return { ok: true, mensagem: res?.mensagem };
  },

  // Define nova senha (para o caso de primeiroLogin/senhaExpirada pós-login)
  definirNovaSenha: async (id: number, colecao: 'associados' | 'usuarios', novaSenha: string): Promise<{ ok: boolean; erro?: string }> => {
    if (novaSenha.length < 6) return { ok: false, erro: 'A senha deve ter pelo menos 6 caracteres.' };
    if (colecao === 'associados') {
      await apiRequest('PATCH', `/auth/associados/${id}/senha`, { senhaAtual: null, novaSenha });
    } else {
      const u = await apiRequest('GET', `/empresarios/${id}`);
      await apiRequest('PUT', `/empresarios/${id}`, { ...(u as object), senha: novaSenha, senhaExpirada: false, primeiroLogin: false });
    }
    return { ok: true };
  },
};

/* ─── Mensagens ───────────────────────────────────────────────── */
export const apiMensagens = {
  listar: () => apiGet('/mensagens'),
  listarAssociados: () => apiGet('/mensagens/associados'),
  enviar: (dados: unknown) => apiPost('/mensagens', dados),
  marcarLida: (idMsg: number, idUsuario: number) => apiPatch(`/mensagens/${idMsg}/lida/${idUsuario}`, {}),
  contarNaoLidas: (assocId: number) => apiGet(`/mensagens/nao-lidas/associado/${assocId}`),
};
