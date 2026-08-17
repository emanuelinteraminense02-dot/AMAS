/* =====================================================================
   AMAS – API-COMPAT.JS  v1.0
   Adaptadores para tornar as funções assíncronas (database.js v5)
   compatíveis com os pontos de chamada síncrona em login.js,
   admin.js, associado.js e empresario.js.

   ESTRATÉGIA:
   Sobrescreve os event-listeners e funções críticas que chamavam
   database.js de forma síncrona, convertendo-os para async/await.
   Deve ser carregado APÓS database.js e APÓS todos os outros .js.
===================================================================== */

/* ─── Utilitário: espera o DOM estar pronto ─────────────────── */
function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
}

/* ═══════════════════════════════════════════════════════════════
   PATCH: LOGIN.JS
   autenticar() é chamada de forma síncrona dentro de setTimeout.
   Substituímos o submit do formulário por uma versão async.
═══════════════════════════════════════════════════════════════ */
onReady(() => {
    const formLogin = document.getElementById("formLogin");
    if (!formLogin) return; // não estamos na página de login

    // Remove o listener original clonando o form (técnica padrão)
    const novoForm = formLogin.cloneNode(true);
    formLogin.parentNode.replaceChild(novoForm, formLogin);

    const erroEl    = document.getElementById("loginErro");
    const btnSubmit = novoForm.querySelector("button[type=submit]");

    function showErro(msg) { erroEl.textContent = msg; erroEl.classList.remove("hidden"); }
    function hideErro()    { erroEl.classList.add("hidden"); }

    novoForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideErro();

        const email = document.getElementById("loginEmail").value.trim();
        const senha = document.getElementById("loginSenha").value.trim();

        if (!email || !senha) { showErro("Preencha todos os campos."); return; }
        if (btnSubmit) { btnSubmit.textContent = "Entrando..."; btnSubmit.disabled = true; }

        const usuario = await autenticar(email, senha);

        if (!usuario) {
            showErro("E-mail ou senha incorretos. Tente novamente.");
            if (btnSubmit) { btnSubmit.textContent = "Entrar no sistema"; btnSubmit.disabled = false; }
            return;
        }

        const perfil = usuario.perfil || "associado";

        if (usuario.senhaExpirada === true || usuario.primeiroLogin === true) {
            setSessao({ ...usuario, _pendingRedefinir: true });
            registrarLog("Login com senha expirada", usuario.nome, perfil, "Redirecionado para troca obrigatória");
            // Tenta mostrar painel de redefinição se a função existir
            if (typeof mostrarPainelRedefinir === "function") mostrarPainelRedefinir(usuario);
            if (btnSubmit) { btnSubmit.textContent = "Entrar no sistema"; btnSubmit.disabled = false; }
            return;
        }

        registrarLog("Login realizado", usuario.nome, perfil, "Acesso via tela de login");
        setSessao(usuario);
        switch (perfil) {
            case "admin":      window.location.href = "admin.html";      break;
            case "associado":  window.location.href = "associado.html";  break;
            case "empresario": window.location.href = "empresario.html"; break;
            default:
                showErro("Perfil inválido.");
                if (btnSubmit) { btnSubmit.textContent = "Entrar no sistema"; btnSubmit.disabled = false; }
        }
    });

    /* ── Patch: solicitarResetSenha (formulário "Esqueci") ─── */
    const formEsqueci = document.getElementById("esqueciForm");
    if (formEsqueci) {
        const novoEsqueci = formEsqueci.cloneNode(true);
        formEsqueci.parentNode.replaceChild(novoEsqueci, formEsqueci);
        novoEsqueci.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email  = document.getElementById("esqueciEmail")?.value.trim();
            const erroE  = document.getElementById("esqueciErro");
            const btn    = novoEsqueci.querySelector("button[type=submit]");
            if (!email) { if (erroE) { erroE.textContent = "Informe o e-mail."; erroE.classList.remove("hidden"); } return; }
            if (btn) { btn.textContent = "Enviando..."; btn.disabled = true; }
            const res = await solicitarResetSenha(email);
            if (!res.ok) {
                if (erroE) { erroE.textContent = res.erro; erroE.classList.remove("hidden"); }
                if (btn) { btn.textContent = "Enviar solicitação"; btn.disabled = false; }
                return;
            }
            document.getElementById("esqueciForm")?.classList.add("hidden");
            const ok = document.getElementById("esqueciOk");
            if (ok) {
                ok.innerHTML = `<p>Solicitação enviada para <strong>${res.nome}</strong> (${res.tipo}).<br>Aguarde o administrador processar o reset.</p>`;
                ok.classList.remove("hidden");
            }
        });
    }

    /* ── Patch: definirNovaSenha (formulário de redefinição obrigatória) ─ */
    const formRedef = document.getElementById("formRedefinir");
    if (formRedef) {
        const novoRedef = formRedef.cloneNode(true);
        formRedef.parentNode.replaceChild(novoRedef, formRedef);
        novoRedef.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nova    = document.getElementById("novaSenhaRedef")?.value;
            const confirm = document.getElementById("confirmaSenhaRedef")?.value;
            const erroR   = document.getElementById("redefErro");
            if (erroR) erroR.classList.add("hidden");
            if (nova !== confirm) {
                if (erroR) { erroR.textContent = "As senhas não coincidem."; erroR.classList.remove("hidden"); }
                return;
            }
            const sessao = getSessao();
            if (!sessao) { window.location.href = "login.html"; return; }
            const colecao = sessao.perfil === "associado" ? "associados" : "usuarios";
            const res = await definirNovaSenha(sessao.id, colecao, nova);
            if (!res.ok) {
                if (erroR) { erroR.textContent = res.erro; erroR.classList.remove("hidden"); }
                return;
            }
            setSessao({ ...sessao, senha: nova, senhaExpirada: false, primeiroLogin: false, _pendingRedefinir: false });
            registrarLog("Nova senha definida", sessao.nome, sessao.perfil, "Senha redefinida após reset");
            if (typeof showToast === "function") showToast("Nova senha salva! Redirecionando...", "success");
            setTimeout(() => {
                switch (sessao.perfil) {
                    case "admin":      window.location.href = "admin.html";      break;
                    case "associado":  window.location.href = "associado.html";  break;
                    case "empresario": window.location.href = "empresario.html"; break;
                    default:           window.location.href = "login.html";
                }
            }, 1200);
        });
    }
});

/* ═══════════════════════════════════════════════════════════════
   PATCH GLOBAL: Funções síncronas que retornam dados e são usadas
   diretamente em expressões (ex: getAssociados().find(...))
   São substituídas por versões async mas os chamadores precisam
   de await — isso é feito via wrapper que retorna Promise, e os
   pontos de chamada já existentes funcionam quando o código
   executado já está dentro de async (admin.js usa DOMContentLoaded
   que pode ser convertido).

   Para admin.js / associado.js / empresario.js, que têm muitos
   chamadores síncronos, aplicamos o padrão:
     atualizarBadges() → async atualizarBadgesAsync()
   e disparamos a versão async onde a página inicializa.
═══════════════════════════════════════════════════════════════ */

/* ── Garante que atualizarBadges (admin) rode em modo async ── */
onReady(() => {
    if (typeof atualizarBadges !== "function") return;
    const _origBadges = atualizarBadges;

    window.atualizarBadges = function () {
        // Chama versão async e descarta promise (fire-and-forget para badges)
        (async () => {
            try {
                // Busca dados do dashboard de uma vez
                const [dash, alertas, resets] = await Promise.all([
                    getEstatisticas().catch(() => ({})),
                    getAlertasEmp().catch(() => []),
                    getResetsPendentes().catch(() => [])
                ]);

                const pendentes = dash.contribuicoesPendentes ?? 0;
                const alertasNaoLidos = alertas.filter(a => !a.lido).length;
                const pendRec = resets.length;

                const bMesa  = document.getElementById("badgeMesa");
                const bAlert = document.getElementById("badgeAlertas");
                const bRec   = document.getElementById("badgeRecuperacao");

                if (bMesa)  { bMesa.textContent  = pendentes;        pendentes        > 0 ? bMesa.classList.remove("hidden")  : bMesa.classList.add("hidden"); }
                if (bAlert) { bAlert.textContent = alertasNaoLidos;  alertasNaoLidos  > 0 ? bAlert.classList.remove("hidden") : bAlert.classList.add("hidden"); }
                if (bRec)   { bRec.textContent   = pendRec;          pendRec          > 0 ? bRec.classList.remove("hidden")   : bRec.classList.add("hidden"); }
            } catch (_) {}
        })();
    };

    // Dispara na inicialização
    window.atualizarBadges();
});