/* =====================================================================
   AMAS – DATABASE.JS  v6.0  (API REST — refatorado)
   Camada de compatibilidade: mantém as assinaturas originais
   e delega para api.js (fetch + async/await + Bearer token).

   Sessão (amas_sessao) permanece em localStorage.
   Todo localStorage de dados foi removido — dados vivem no MySQL.
===================================================================== */

/* ─── Sessão (mantida em localStorage — leve, não sensível) ─────── */
function getSessao()   { return JSON.parse(localStorage.getItem("amas_sessao")) || null; }
function setSessao(u)  { localStorage.setItem("amas_sessao", JSON.stringify(u)); }
function clearSessao() { localStorage.removeItem("amas_sessao"); }

/* ─── Inicialização ─────────────────────────────────────────────── */
function inicializarBanco() { /* dados gerenciados pelo back-end */ }

/* ─── AUTENTICAÇÃO ──────────────────────────────────────────────── */
async function autenticar(email, senha) {
  const usuario = await apiAuth.login(email, senha);
  return usuario;
}

async function alterarSenhaAssociado(id, senhaAtual, novaSenha) {
  return apiAuth.alterarSenha(id, senhaAtual, novaSenha);
}

/* ─── LOG ───────────────────────────────────────────────────────── */
function registrarLog(acao, usuario, perfil, detalhes) {
  apiLog.registrar(acao, usuario, perfil, detalhes);
}

async function getLog() {
  return apiLog.listar();
}

/* ─── ASSOCIADOS ─────────────────────────────────────────────────── */
async function getAssociados() { return apiAssociados.listar(); }
async function getAssociadoPorId(id) { return apiAssociados.buscarPorId(id); }
async function adicionarAssociado(associado) { return apiAssociados.criar(associado); }
async function atualizarAssociado(id, dados) { return apiAssociados.atualizar(id, dados); }
async function removerAssociado(id) { return apiAssociados.remover(id); }
async function atualizarStatusAssociado(id, status) { return apiAssociados.atualizarStatus(id, status); }
async function listarInadimplentes() { return apiAssociados.listarInadimplentes(); }

async function cpfJaExiste(cpf, excluirId) {
  const lista = await getAssociados();
  const c = cpf.replace(/\D/g, "");
  return lista.some(a => a.cpf.replace(/\D/g, "") === c && a.id !== excluirId);
}

async function buscarAssociadoCPF(cpf) {
  const lista = await getAssociados();
  const c = cpf.replace(/\D/g, "");
  return lista.find(a => a.cpf.replace(/\D/g, "") === c) || null;
}

/* ─── CONTRIBUIÇÕES DE ASSOCIADOS ─────────────────────────────────── */
async function getContribuicoesAssociado(associadoId) { return apiAssociados.getContribuicoes(associadoId); }
async function adicionarContribuicao(associadoId, contrib) { return apiAssociados.adicionarContribuicao(associadoId, contrib); }
async function atualizarStatusContribuicao(associadoId, contribuicaoId, novoStatus, msgAdmin) {
  return apiAssociados.atualizarStatusContribuicao(contribuicaoId, novoStatus, msgAdmin);
}
async function getParcelasAtraso(associadoId) { return apiAssociados.getParcelasAtraso(associadoId); }

/* ─── EMPRESÁRIOS ─────────────────────────────────────────────────── */
async function getEmpresarios() { return apiEmpresarios.listar(); }
async function getEmpresarioPorId(id) { return apiEmpresarios.buscarPorId(id); }
async function getUsuarios() { return apiEmpresarios.listar(); }
async function adicionarEmpresario(dados) { return apiEmpresarios.criar(dados); }
async function atualizarEmpresario(id, dados) { return apiEmpresarios.atualizar(id, dados); }
async function removerEmpresario(id) { return apiEmpresarios.remover(id); }

async function cnpjJaExiste(cnpj, excluirId) {
  const lista = await getEmpresarios();
  const doc = cnpj.replace(/\D/g, "");
  return lista.some(e => String(e.cnpj || "").replace(/\D/g, "") === doc && e.id !== excluirId);
}

async function salvarContratoEmpresa(empId, contrato) {
  const emp = await getEmpresarioPorId(empId);
  const contratoAtual = emp.contrato ? (typeof emp.contrato === "string" ? JSON.parse(emp.contrato) : emp.contrato) : {};
  return apiEmpresarios.atualizar(empId, { ...emp, contrato: { ...contratoAtual, ...contrato } });
}

async function registrarDocumentoHistorico(empId, tipo) {
  const emp = await getEmpresarioPorId(empId);
  const contrato = emp.contrato ? (typeof emp.contrato === "string" ? JSON.parse(emp.contrato) : emp.contrato) : {};
  const hist = contrato.historicoDocumentos || [];
  hist.push({ tipo, dataGeracao: new Date().toISOString(), versao: hist.filter(h => h.tipo === tipo).length + 1 });
  contrato.historicoDocumentos = hist;
  return apiEmpresarios.atualizar(empId, { ...emp, contrato });
}

async function getHistoricoDocumental(empId) {
  const emp = await getEmpresarioPorId(empId);
  const contrato = emp.contrato ? (typeof emp.contrato === "string" ? JSON.parse(emp.contrato) : emp.contrato) : {};
  return contrato.historicoDocumentos || [];
}

/* ─── CONTRIBUIÇÕES DE EMPRESÁRIOS ────────────────────────────────── */
async function getDoacoes(empresarioId) { return apiEmpresarios.getContribuicoes(empresarioId); }
async function registrarContribuicaoEmpresario(empresarioId, dados) { return apiEmpresarios.adicionarContribuicao(empresarioId, dados); }
async function atualizarStatusContribuicaoEmpresario(contribuicaoId, status, obsAdmin) {
  return apiEmpresarios.atualizarStatusContribuicao(contribuicaoId, status, obsAdmin);
}

/* ─── ALERTAS DE EMPRESÁRIOS ──────────────────────────────────────── */
async function getAlertasEmp(empresarioId) {
  if (empresarioId) return apiEmpresarios.getAlertas(empresarioId);
  return apiAdmin.getAlertas();
}
async function enviarAlertaEmpresario(empresarioId, empresarioNome, titulo, mensagem, urgente) {
  return apiEmpresarios.enviarAlerta(empresarioId, { titulo, mensagem, urgente: !!urgente });
}
async function marcarAlertaLido(id) { return apiAdmin.marcarAlertaLido(id); }

/* ─── NOTÍCIAS ─────────────────────────────────────────────────────── */
async function getNoticias() { return apiNoticias.listar(); }
async function adicionarNoticia(n) { return apiNoticias.criar(n); }
async function atualizarNoticia(id, dados) { return apiNoticias.atualizar(id, dados); }
async function removerNoticia(id) { return apiNoticias.remover(id); }

/* ─── EVENTOS ─────────────────────────────────────────────────────── */
function separarInscricoesEvento(inscricoes) {
  const lista = Array.isArray(inscricoes) ? inscricoes : [];
  return {
    inscritos: lista
      .filter(i => i.situacao === "confirmado")
      .map(i => ({
        id: i.associado?.id,
        nome: i.associado?.nome,
        matricula: i.associado?.matricula,
        email: i.associado?.email,
        dataInscricao: i.dataInscricao
      })),
    listaEspera: lista
      .filter(i => i.situacao === "lista_espera")
      .map(i => ({
        id: i.associado?.id,
        nome: i.associado?.nome,
        matricula: i.associado?.matricula,
        email: i.associado?.email,
        dataInscricao: i.dataInscricao
      }))
  };
}

async function enriquecerEventoComInscricoes(evento) {
  const inscricoesRaw = await apiEventos.listarInscritos(evento.id).catch(() => []);
  const { inscritos, listaEspera } = separarInscricoesEvento(inscricoesRaw);
  return {
    ...evento,
    _inscricoes: inscricoesRaw,
    inscritos,
    listaEspera,
    inscricoes: inscritos.length
  };
}

async function getEventos() {
  const eventos = await apiEventos.listar();
  return Promise.all((eventos || []).map(enriquecerEventoComInscricoes));
}
async function getInscritosEvento(eventoId) { return apiEventos.listarInscritos(eventoId); }
async function adicionarEvento(e) { return apiEventos.criar(e); }
async function atualizarEvento(id, dados) { return apiEventos.atualizar(id, dados); }
async function removerEvento(id) { return apiEventos.remover(id); }

async function alterarStatusEvento(eventoId, novoStatus) {
  const ev = await apiEventos.buscarPorId(eventoId);
  return apiEventos.atualizar(eventoId, { ...ev, status: novoStatus });
}

/* ─── INSCRIÇÕES EM EVENTOS ────────────────────────────────────────── */
function statusInscricao(evento, associadoId) {
  if (!evento) return "encerrado";
  if (evento.status === "Encerrado") return "encerrado";
  if (evento.status === "Em Breve")  return "em_breve";
  const inscritos = (evento._inscricoes || []).filter(i => i.situacao === "confirmado");
  const fila      = (evento._inscricoes || []).filter(i => i.situacao === "lista_espera");
  const vagas     = evento.vagasTotais || evento.vagas || 0;
  const eInscrito = inscritos.some(i => i.associado?.id === associadoId);
  const eFila     = fila.some(i => i.associado?.id === associadoId);
  if (eInscrito) return "inscrito";
  if (eFila) {
    const primeiroFila = fila[0]?.associado?.id === associadoId && inscritos.length < vagas;
    return primeiroFila ? "vaga_disponivel" : "espera";
  }
  return inscritos.length < vagas ? "livre" : "lotado";
}

async function inscreverNoEvento(eventoId, associado) {
  try {
    const res = await apiEventos.inscrever(eventoId, associado.id);
    const acao = res.situacao === "lista_espera" ? "espera" : "inscrito";
    return { ok: true, acao, posicao: acao === "espera" ? 1 : undefined };
  } catch (e) {
    const msg = e.message || "";
    if (msg.includes("já inscrito")) return { ok: false, acao: "ja_inscrito" };
    if (msg.includes("Encerrado"))   return { ok: false, acao: "encerrado" };
    return { ok: false, acao: "erro", msg };
  }
}

async function cancelarInscricao(eventoId, associadoId) {
  try {
    await apiEventos.cancelarInscricao(eventoId, associadoId);
    return { ok: true, promovido: null };
  } catch (_) { return { ok: false }; }
}

async function confirmarVagaDisponivel(eventoId, associadoId) { return true; }

async function getEventosDoAssociado(associadoId) {
  const [eventos, inscricoesRaw] = await Promise.all([
    getEventos(),
    apiEventos.getInscritosAssociado(associadoId).catch(() => [])
  ]);
  const inscritos = new Map(inscricoesRaw.map(i => [i.evento?.id, i]));
  return eventos
      .filter(ev => inscritos.has(ev.id))
      .map(ev => {
        return { ...ev, _estadoInscricao: statusInscricao(ev, associadoId) };
      });
}

/* ─── MENSAGENS ────────────────────────────────────────────────────── */
async function getMensagens() { return apiMensagens.listar(); }
async function getMensagensParaAssociado(associadoId) { return apiMensagens.listarAssociados(); }
async function enviarMensagem(titulo, corpo, destinatarios) {
  const sessao = getSessao();
  return apiMensagens.enviar({ titulo, corpo, destinatarios: destinatarios || "todos", remetente: sessao?.nome || "Administrador AMAS" });
}
async function marcarMensagemLida(idMsg, idUsuario) { return apiMensagens.marcarLida(idMsg, idUsuario); }
async function contarNaoLidas(associadoId) {
  try {
    const res = await apiMensagens.contarNaoLidas(associadoId);
    return res?.total ?? 0;
  } catch (_) { return 0; }
}

/* ─── SOLICITAÇÕES ─────────────────────────────────────────────────── */
async function getSolicitacoes() { return apiAdmin.getSolicitacoes(); }
async function criarSolicitacaoPublica(dados) { return apiSolicitacoes.criar(dados); }
async function aprovarSolicitacao(id) { return apiAdmin.aprovarSolicitacao(id); }
async function recusarSolicitacao(id, motivo) { return apiAdmin.recusarSolicitacao(id, motivo); }

/* ─── ESTATÍSTICAS ─────────────────────────────────────────────────── */
async function getEstatisticas() { return apiAdmin.getDashboard(); }

/* ─── PROJETOS ─────────────────────────────────────────────────────── */
async function getProjetos() { return apiProjetos.listarEmAndamento(); }
async function adicionarProjeto(projeto) { return apiProjetos.criar(projeto); }
async function atualizarProjeto(id, dados) { return apiProjetos.atualizar(id, dados); }
async function removerProjeto(id) { return apiProjetos.remover(id); }

/* ─── RECUPERAÇÃO DE SENHA ─────────────────────────────────────────── */
async function buscarPorEmail(email) {
  const el = email.trim().toLowerCase();
  const [assocs, emps] = await Promise.all([getAssociados(), getEmpresarios()]);
  const assoc = assocs.find(a => a.email?.toLowerCase() === el);
  if (assoc) return { ...assoc, perfil: "associado", _colecao: "associados" };
  const emp = emps.find(u => u.email?.toLowerCase() === el);
  if (emp)   return { ...emp, _colecao: "usuarios" };
  return null;
}

async function solicitarResetSenha(email) {
  const usuario = await buscarPorEmail(email);
  if (!usuario) return { ok: false, erro: "E-mail não encontrado no sistema." };
  if (usuario.perfil === "admin") return { ok: false, erro: "Conta de administrador não pode solicitar reset por este canal." };
  const campos = { resetSolicitado: true, dataResetSolicit: new Date().toISOString() };
  try {
    if (usuario._colecao === "associados") {
      await atualizarAssociado(usuario.id, { ...usuario, ...campos });
    } else {
      await atualizarEmpresario(usuario.id, { ...usuario, ...campos });
    }
    registrarLog("Reset de senha solicitado", usuario.nome, usuario.perfil, "Solicitação enviada via tela de login");
    return { ok: true, nome: usuario.nome, perfil: usuario.perfil, tipo: usuario.perfil === "associado" ? "Associado" : "Empresa Parceira" };
  } catch (e) { return { ok: false, erro: e.message }; }
}

async function getResetsPendentes() {
  const [assocs, emps] = await Promise.all([getAssociados(), getEmpresarios()]);
  const lista = [];
  assocs.filter(a => a.resetSolicitado).forEach(a =>
      lista.push({ ...a, perfil: "associado", _colecao: "associados", tipoLabel: "Associado", tipoIcon: '<i class="bi bi-person"></i>' }));
  emps.filter(u => u.resetSolicitado).forEach(u =>
      lista.push({ ...u, _colecao: "usuarios", tipoLabel: "Empresa Parceira", tipoIcon: '<i class="bi bi-building"></i>' }));
  return lista.sort((a, b) => new Date(b.dataResetSolicit || 0) - new Date(a.dataResetSolicit || 0));
}

async function processarResetAdmin(id, colecao) {
  const campos = { senha: "123456", senhaExpirada: true, resetSolicitado: false, dataResetSolicit: null };
  if (colecao === "associados") {
    const a = await getAssociadoPorId(id);
    await atualizarAssociado(id, { ...a, ...campos });
    registrarLog("Senha resetada pelo Admin", getSessao()?.nome || "Admin", "admin", (a?.nome || "") + " — senha voltou ao padrão");
  } else {
    const u = await getEmpresarioPorId(id);
    await atualizarEmpresario(id, { ...u, ...campos });
    registrarLog("Senha resetada pelo Admin", getSessao()?.nome || "Admin", "admin", (u?.nome || "") + " — senha voltou ao padrão");
  }
}

async function definirNovaSenha(id, colecao, novaSenha) {
  if (novaSenha === "123456") return { ok: false, erro: "A nova senha não pode ser a senha padrão (123456)." };
  if (novaSenha.length < 6)   return { ok: false, erro: "A senha deve ter pelo menos 6 caracteres." };
  try {
    if (colecao === "associados") {
      await alterarSenhaAssociado(id, null, novaSenha);
    } else {
      const u = await getEmpresarioPorId(id);
      await atualizarEmpresario(id, { ...u, senha: novaSenha, senhaExpirada: false, primeiroLogin: false });
    }
    return { ok: true };
  } catch (e) { return { ok: false, erro: e.message }; }
}

/* ─── UTILITÁRIOS ──────────────────────────────────────────────────── */
function notifySave() {
  const ind = document.getElementById("saveIndicator");
  if (!ind) return;
  ind.textContent = "✅ Dados salvos";
  ind.className = "save-indicator saved";
  setTimeout(() => { ind.className = "save-indicator"; }, 3000);
}

/* Stubs de compatibilidade — não fazem nada, dados estão no MySQL */
function salvarAssociados()         {}
function salvarUsuarios()           {}
function salvarNoticias()           {}
function salvarEventos()            {}
function salvarMensagens()          {}
function salvarAlertasEmp()         {}
function salvarLog()                {}
function salvarSolicitacoes()       {}
function salvarDoacoes()            {}
function inicializarDoacoes()       {}
function inicializarContratosDemo() {}
function inicializarSeedExtra()     {}
function migrarEventosV44()         {}

inicializarBanco();
