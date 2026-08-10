// Tipos espelhando os modelos do backend Spring Boot.
// Foram extraídos das chamadas em frontend/js/api.js e frontend/js/database.js.

export type CategoriaNoticia =
  | 'comunicado'
  | 'parceria'
  | 'social'
  | 'evento'
  | 'conquista'
  | 'capacitacao';

export interface Noticia {
  id: number;
  titulo: string;
  resumo?: string;
  conteudo?: string;
  categoria?: CategoriaNoticia;
  destaque?: boolean;
  autor?: string;
  publicadaEm?: string; // ISO date (yyyy-MM-dd)
}

export type TipoEvento = 'social' | 'capacitacao' | 'parceria' | 'cultural' | 'reuniao';
export type StatusEvento = 'Aberto' | 'Em Breve' | 'Encerrado' | 'Cancelado';

export interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  data: string; // ISO date (yyyy-MM-dd)
  horario?: string;
  local?: string;
  tipo?: TipoEvento;
  status?: StatusEvento;
  destaque?: boolean;
  vagasTotais?: number;
  vagas?: number;
  inscricoes?: number;
  _inscricoes?: InscricaoEvento[];
  inscritos?: InscritoResumo[];
  listaEspera?: InscritoResumo[];
}

export interface InscricaoEvento {
  situacao: 'confirmado' | 'lista_espera';
  associado?: { id: number; nome: string; matricula?: string; email?: string };
  dataInscricao?: string;
}

export interface InscritoResumo {
  id?: number;
  nome?: string;
  matricula?: string;
  email?: string;
  dataInscricao?: string;
}

export interface Projeto {
  id: number;
  titulo: string;
  resumo?: string;
  categoria?: string;
  icone?: string;
  participantes?: number;
  unidadeMetrica?: string;
  dataInicio?: string;
  status?: string;
  destaque?: boolean;
}

export interface Estatisticas {
  total: number;
  regulares: number;
  inadim?: number;
  emAnalise?: number;
  pendentes?: number;
  totalArrecadado?: number;
  alertasPendentes?: number;
  contribuicoesPendentes?: number;
  [key: string]: unknown;
}

export type TipoSolicitante = 'pessoa_fisica' | 'empresa';

export interface SolicitacaoPublicaPayload {
  tipoSolicitante: TipoSolicitante;
  nome: string;
  cpf: string | null;
  cnpj: string | null;
  nascimento: string | null;
  responsavel: string | null;
  telefone: string;
  email: string;
  endereco: string;
  profissao: string;
  observacoes: string;
}

export type StatusSolicitacao = 'Pendente' | 'Aprovado' | 'Recusado';

export interface Solicitacao extends SolicitacaoPublicaPayload {
  id: number;
  status?: StatusSolicitacao;
  dataSolicitacao?: string;
  _tipo?: 'associado' | 'empresa';
}

// ─── Autenticação / perfis ──────────────────────────────────────────
export type Perfil = 'admin' | 'associado' | 'empresario';

export interface Sessao {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  token: string;
}

export type StatusAssociado = 'Regular' | 'Inadimplente' | 'Em análise' | 'Pendente';
export type StatusContribuicao = 'Aprovado' | 'Recusado' | 'Em análise' | 'Revisão solicitada';

export interface Contribuicao {
  id: number;
  mes: string;
  valor: number;
  status: StatusContribuicao;
  data?: string;
  observacoes?: string;
  arquivo?: string;
  msgAdmin?: string;
}

export interface Associado {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  endereco?: string;
  profissao?: string;
  matricula?: string;
  nascimento?: string;
  dataEntrada?: string;
  foto?: string;
  senha?: string;
  status?: StatusAssociado;
  resetSolicitado?: boolean;
  dataResetSolicit?: string;
  [key: string]: unknown;
}

export type TipoParceria = 'Parceiro de Benefício (Padrão)' | 'Parceiro Estratégico' | 'Apoio Institucional';

export interface HistoricoDocumento {
  tipo: string;
  dataGeracao: string;
  versao: number;
}

export interface ContratoEmpresa {
  beneficioOfertado?: string;
  regrasUtilizacao?: string;
  formaValidacao?: string;
  descricaoBeneficios?: string;
  tipoAcordo?: TipoParceria;
  dataVigencia?: string;
  observacoesAdmin?: string;
  beneficiosValidados?: boolean;
  historicoDocumentos?: HistoricoDocumento[];
}

export interface Empresario {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
  endereco?: string;
  senha?: string;
  contrato?: ContratoEmpresa | string;
  resetSolicitado?: boolean;
  dataResetSolicit?: string;
  [key: string]: unknown;
}

export interface Mensagem {
  id: number;
  titulo: string;
  corpo: string;
  destinatarios: 'todos' | 'associados' | 'empresarios';
  remetente?: string;
  data: string;
  lidas?: number[];
}

export type PerfilLog = 'admin' | 'associado' | 'empresario' | 'sistema';

export interface LogEntry {
  id?: number;
  acao: string;
  usuario: string;
  perfil: PerfilLog;
  detalhes?: string;
  data: string;
}

export interface AlertaEmpresario {
  id: number;
  empresarioId?: number;
  empresarioNome: string;
  titulo: string;
  mensagem: string;
  urgente?: boolean;
  lido?: boolean;
  data: string;
}

export interface ResetPendente {
  id: number;
  nome: string;
  email: string;
  perfil: 'associado' | 'admin';
  tipoLabel: string;
  dataResetSolicit?: string;
  _colecao: 'associados' | 'usuarios';
}
