/* =====================================================================
   AMAS – API.JS  v1.0
   Camada centralizada de comunicação com a API REST.
   Todas as requisições HTTP passam por aqui.
   Token de autenticação recuperado do localStorage (amas_sessao).
===================================================================== */

const API_BASE = (() => {
    const configuredBase = window.AMAS_CONFIG?.apiBase;
    if (configuredBase) {
        return configuredBase.replace(/\/$/, "");
    }

    if (window.location.protocol === "file:") {
        return "http://localhost:8080/api";
    }

    return `${window.location.origin.replace(/\/$/, "")}/api`;
})();

/* ─── Token helper ────────────────────────────────────────────────── */
function _getToken() {
    try {
        const sessao = JSON.parse(localStorage.getItem("amas_sessao"));
        return sessao?.token || null;
    } catch (_) {
        return null;
    }
}

/* ─── Loading state ───────────────────────────────────────────────── */
let _loadingCount = 0;

function _showLoading() {
    _loadingCount++;
    const el = document.getElementById("globalLoading");
    if (el) { el.style.display = "flex"; el.classList.remove("hidden"); }
}

function _hideLoading() {
    _loadingCount = Math.max(0, _loadingCount - 1);
    if (_loadingCount === 0) {
        const el = document.getElementById("globalLoading");
        if (el) { el.style.display = "none"; el.classList.add("hidden"); }
    }
}

/* ─── Core fetch wrapper ──────────────────────────────────────────── */
async function apiRequest(method, path, body, showLoader = false) {
    const headers = { "Content-Type": "application/json" };

    const token = _getToken();
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const opts = { method, headers };
    if (body !== undefined) opts.body = JSON.stringify(body);

    if (showLoader) _showLoading();

    try {
        const res = await fetch(API_BASE + path, opts);

        if (!res.ok) {
            let msg = `Erro ${res.status}`;
            try {
                const j = await res.json();
                msg = j.erro || j.message || j.error || msg;
            } catch (_) {}
            throw new Error(msg);
        }

        const text = await res.text();
        return text ? JSON.parse(text) : null;
    } finally {
        if (showLoader) _hideLoading();
    }
}

/* ─── HTTP verb shortcuts ─────────────────────────────────────────── */
const apiGet    = (path)        => apiRequest("GET",    path);
const apiPost   = (path, body)  => apiRequest("POST",   path, body, true);
const apiPut    = (path, body)  => apiRequest("PUT",    path, body, true);
const apiPatch  = (path, body)  => apiRequest("PATCH",  path, body, true);
const apiDelete = (path)        => apiRequest("DELETE", path, undefined, true);

/* ─── Auth ────────────────────────────────────────────────────────── */
const apiAuth = {
    login: (email, senha) => apiPost("/auth/login", { email, senha }),
    alterarSenha: (id, senhaAtual, novaSenha) =>
        apiPatch(`/auth/associados/${id}/senha`, { senhaAtual, novaSenha })
};

/* ─── Log ─────────────────────────────────────────────────────────── */
const apiLog = {
    registrar: (acao, usuario, perfil, detalhes) =>
        apiPost("/log", { acao, usuario: usuario || "Sistema", perfil: perfil || "sistema", detalhes: detalhes || "" })
            .catch(() => {}), // fire-and-forget
    listar: () => apiGet("/admin/log")
};

/* ─── Associados ──────────────────────────────────────────────────── */
const apiAssociados = {
    listar:           ()           => apiGet("/associados"),
    buscarPorId:      (id)         => apiGet(`/associados/${id}`),
    criar:            (dados)      => apiPost("/associados", dados),
    atualizar:        (id, dados)  => apiPut(`/associados/${id}`, dados),
    remover:          (id)         => apiDelete(`/associados/${id}`),
    atualizarStatus:  (id, status) => apiPatch(`/associados/${id}/status`, { status }),
    listarInadimplentes: ()        => apiGet("/associados/inadimplentes"),
    // Contribuições
    getContribuicoes: (id)                              => apiGet(`/associados/${id}/contribuicoes`),
    adicionarContribuicao: (id, contrib)                => apiPost(`/associados/${id}/contribuicoes`, contrib),
    atualizarStatusContribuicao: (contribuicaoId, status, msgAdmin) =>
        apiPatch(`/associados/contribuicoes/${contribuicaoId}/status`, { status, msgAdmin: msgAdmin || "" }),
    // Parcelas
    getParcelasAtraso: (id) => apiGet(`/associados/${id}/parcelas-atraso`)
};

/* ─── Empresários ─────────────────────────────────────────────────── */
const apiEmpresarios = {
    listar:       ()          => apiGet("/empresarios"),
    buscarPorId:  (id)        => apiGet(`/empresarios/${id}`),
    criar:        (dados)     => apiPost("/empresarios", dados),
    atualizar:    (id, dados) => apiPut(`/empresarios/${id}`, dados),
    remover:      (id)        => apiDelete(`/empresarios/${id}`),
    // Contribuições
    getContribuicoes:                    (id)             => apiGet(`/empresarios/${id}/contribuicoes`),
    adicionarContribuicao:               (id, dados)      => apiPost(`/empresarios/${id}/contribuicoes`, dados),
    atualizarStatusContribuicao:         (cId, status, obsAdmin) =>
        apiPatch(`/empresarios/contribuicoes/${cId}/status`, { status, obsAdmin: obsAdmin || "" }),
    // Alertas
    getAlertas:   (id)        => apiGet(`/empresarios/${id}/alertas`),
    enviarAlerta: (id, dados) => apiPost(`/empresarios/${id}/alertas`, dados)
};

/* ─── Admin ───────────────────────────────────────────────────────── */
const apiAdmin = {
    getDashboard:    ()          => apiGet("/admin/dashboard"),
    getLog:          ()          => apiGet("/admin/log"),
    getAlertas:      ()          => apiGet("/admin/alertas-empresario"),
    marcarAlertaLido:(id)        => apiPatch(`/admin/alertas-empresario/${id}/lido`, {}),
    getSolicitacoes: ()          => apiGet("/admin/solicitacoes"),
    aprovarSolicitacao: (id)     => apiPost(`/admin/solicitacoes/${id}/aprovar`, {}),
    recusarSolicitacao: (id, motivo) => apiPost(`/admin/solicitacoes/${id}/recusar`, { observacoes: motivo || "" })
};

/* ——— Solicitações públicas ————————————————————————————————————————— */
const apiSolicitacoes = {
    listar: ()          => apiGet("/solicitacoes"),
    criar:  (dados)     => apiPost("/solicitacoes", dados)
};

/* ─── Notícias ────────────────────────────────────────────────────── */
const apiNoticias = {
    listar:    ()          => apiGet("/noticias"),
    criar:     (dados)     => apiPost("/noticias", dados),
    atualizar: (id, dados) => apiPut(`/noticias/${id}`, dados),
    remover:   (id)        => apiDelete(`/noticias/${id}`)
};

/* ─── Eventos ─────────────────────────────────────────────────────── */
const apiEventos = {
    listar:       ()             => apiGet("/eventos"),
    buscarPorId:  (id)           => apiGet(`/eventos/${id}`),
    criar:        (dados)        => apiPost("/eventos", dados),
    atualizar:    (id, dados)    => apiPut(`/eventos/${id}`, dados),
    remover:      (id)           => apiDelete(`/eventos/${id}`),
    inscrever:    (id, assocId)  => apiPost(`/eventos/${id}/inscrever`, { associadoId: assocId }),
    cancelarInscricao: (eventoId, assocId) => apiDelete(`/eventos/${eventoId}/inscrever/${assocId}`),
    listarInscritos: (id)        => apiGet(`/eventos/${id}/inscritos`),
    getInscritosAssociado: (assocId) => apiGet(`/eventos/inscritos/associado/${assocId}`)
};

/* ——— Projetos ———————————————————————————————————————————————————— */
const apiProjetos = {
    listar:          ()          => apiGet("/projetos"),
    listarEmAndamento: ()        => apiGet("/projetos/em-andamento"),
    criar:           (dados)     => apiPost("/projetos", dados),
    atualizar:       (id, dados) => apiPut(`/projetos/${id}`, dados),
    remover:         (id)        => apiDelete(`/projetos/${id}`)
};

/* ─── Mensagens ───────────────────────────────────────────────────── */
const apiMensagens = {
    listar:            ()                => apiGet("/mensagens"),
    listarAssociados:  ()                => apiGet("/mensagens/associados"),
    enviar:            (dados)           => apiPost("/mensagens", dados),
    marcarLida:        (idMsg, idUsuario)=> apiPatch(`/mensagens/${idMsg}/lida/${idUsuario}`, {}),
    contarNaoLidas:    (assocId)         => apiGet(`/mensagens/nao-lidas/associado/${assocId}`)
};
