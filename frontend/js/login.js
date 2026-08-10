/* ─── LOGIN.JS v8.0 — Sem submit nativo, 100% onclick ─────────────── */

/* ── Helpers globais (fora do DOMContentLoaded para garantir acesso) ── */
function loginShowErro(elId, msg) {
  var el = document.getElementById(elId);
  if (el) { el.textContent = msg; el.classList.remove("hidden"); }
}
function loginHideErro(elId) {
  var el = document.getElementById(elId);
  if (el) el.classList.add("hidden");
}
function loginRedirecionar(perfil) {
  if (perfil === "admin")      window.location.href = "admin.html";
  else if (perfil === "associado")  window.location.href = "associado.html";
  else if (perfil === "empresario") window.location.href = "empresario.html";
}
function loginMostrarRedefinir(usuario) {
  var pL = document.getElementById("panelLogin");
  var pR = document.getElementById("panelRedefinir");
  var sub = document.getElementById("redefSub");
  if (pL) pL.classList.add("hidden");
  if (pR) pR.classList.remove("hidden");
  if (sub && usuario && usuario.nome)
    sub.textContent = "Olá, " + usuario.nome.split(" ")[0] +
        "! Por segurança, crie uma nova senha antes de continuar.";
}

/* ── Função principal de login — chamada pelo botão onclick ─────────── */
function executarLogin() {
  loginHideErro("loginErro");

  var emailEl = document.getElementById("loginEmail");
  var senhaEl = document.getElementById("loginSenha");
  var btnEl   = document.getElementById("btnLoginSubmit");

  var email = emailEl ? emailEl.value.trim() : "";
  var senha = senhaEl ? senhaEl.value.trim() : "";

  if (!email || !senha) {
    loginShowErro("loginErro", "Preencha todos os campos.");
    return;
  }

  if (btnEl) { btnEl.disabled = true; btnEl.textContent = "Aguarde..."; }

  autenticar(email, senha)
    .then(function (usuario) {
      if (!usuario) {
        loginShowErro("loginErro", "E-mail ou senha incorretos. Tente novamente.");
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = "Entrar no sistema"; }
        return;
      }
      var perfil = usuario.perfil || "associado";
      if (usuario.primeiroLogin === true || usuario.senhaExpirada === true) {
        if (typeof setSessao === "function") setSessao(Object.assign({}, usuario, { _pendingRedefinir: true }));
        if (typeof registrarLog === "function") registrarLog("Login com senha expirada", usuario.nome, perfil, "Redirecionado para troca obrigatória");
        loginMostrarRedefinir(usuario);
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = "Entrar no sistema"; }
        return;
      }
      if (typeof registrarLog === "function") registrarLog("Login realizado", usuario.nome, perfil, "Acesso via tela de login");
      if (typeof setSessao === "function") setSessao(usuario);
      loginRedirecionar(perfil);
    })
    .catch(function (err) {
      var msg = (err && err.message) ? err.message : "E-mail ou senha incorretos. Tente novamente.";
      loginShowErro("loginErro", msg);
      if (btnEl) { btnEl.disabled = false; btnEl.textContent = "Entrar no sistema"; }
    });
}

/* ── Init após DOM pronto ───────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {

  /* Tema */
  ["btnTheme", "btnTheme2"].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn && typeof toggleTheme === "function") btn.addEventListener("click", toggleTheme);
  });

  /* Toggle senha */
  document.querySelectorAll(".toggle-pw").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var t = document.getElementById(btn.dataset.target);
      if (!t) return;
      var isPass = t.type === "password";
      t.type = isPass ? "text" : "password";
      btn.innerHTML = isPass ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    });
  });

  /* Botão login onclick */
  var btnLogin = document.getElementById("btnLoginSubmit");
  if (btnLogin) btnLogin.addEventListener("click", executarLogin);

  /* Enter nos campos dispara login */
  ["loginEmail", "loginSenha"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); executarLogin(); }
    });
  });

  /* ── Redefinição obrigatória ──────────────────────────────────────── */
  var novaSenhaEl = document.getElementById("novaSenhaRedef");
  if (novaSenhaEl) {
    novaSenhaEl.addEventListener("input", function () {
      var val = this.value;
      var forca = document.getElementById("senhaForca");
      if (!forca) return;
      if (!val) { forca.innerHTML = ""; return; }
      var score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 10) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      var niveis = [
        { txt: "Fraca", cor: "#ef4444" }, { txt: "Fraca", cor: "#ef4444" },
        { txt: "Média", cor: "#f59e0b" }, { txt: "Boa",   cor: "#22c55e" },
        { txt: "Forte", cor: "#16a34a" }, { txt: "Forte", cor: "#16a34a" }
      ];
      var n = niveis[Math.min(score, 5)];
      forca.innerHTML = '<div class="sf-bar">' +
        [1,2,3,4,5].map(function (i) {
          return '<div class="sf-seg' + (i <= score ? " sf-on" : "") +
            '" style="' + (i <= score ? "background:" + n.cor : "") + '"></div>';
        }).join("") + '</div>' +
        '<span style="font-size:0.75rem;color:' + n.cor + ';font-weight:600;">' + n.txt + '</span>';
    });
  }

  var formRedefinir = document.getElementById("formRedefinir");
  if (formRedefinir) {
    /* Troca botão type=submit para type=button também */
    var btnRedef = formRedefinir.querySelector("button[type=submit]");
    if (btnRedef) {
      btnRedef.type = "button";
      btnRedef.addEventListener("click", function () {
        var nova    = (document.getElementById("novaSenhaRedef")    || {}).value || "";
        var confirm = (document.getElementById("confirmaSenhaRedef") || {}).value || "";
        loginHideErro("redefErro");
        if (nova !== confirm) { loginShowErro("redefErro", "As senhas não coincidem."); return; }
        var sessao = (typeof getSessao === "function") ? getSessao() : null;
        if (!sessao) { window.location.href = "login.html"; return; }
        var colecao = sessao.perfil === "associado" ? "associados" : "usuarios";
        btnRedef.disabled = true; btnRedef.textContent = "Salvando...";
        definirNovaSenha(sessao.id, colecao, nova)
          .then(function (res) {
            if (!res || !res.ok) {
              loginShowErro("redefErro", (res && res.erro) ? res.erro : "Erro ao salvar senha.");
              btnRedef.disabled = false; btnRedef.textContent = "Salvar nova senha";
              return;
            }
            if (typeof setSessao === "function")
              setSessao(Object.assign({}, sessao, { senhaExpirada: false, primeiroLogin: false, _pendingRedefinir: false }));
            if (typeof registrarLog === "function")
              registrarLog("Nova senha definida", sessao.nome, sessao.perfil, "Senha redefinida com sucesso após reset");
            if (typeof showToast === "function") showToast("Nova senha salva! Redirecionando...", "success");
            setTimeout(function () { loginRedirecionar(sessao.perfil); }, 1200);
          })
          .catch(function (err) {
            loginShowErro("redefErro", (err && err.message) ? err.message : "Erro ao salvar senha.");
            btnRedef.disabled = false; btnRedef.textContent = "Salvar nova senha";
          });
      });
    }
    formRedefinir.addEventListener("submit", function (e) { e.preventDefault(); return false; });
  }

  /* ── Esqueci minha senha ─────────────────────────────────────────── */
  var formEsqueci = document.getElementById("formEsqueci");
  if (formEsqueci) {
    var btnEsq = formEsqueci.querySelector("button[type=submit]");
    if (btnEsq) {
      btnEsq.type = "button";
      btnEsq.addEventListener("click", function () {
        var emailEl = document.getElementById("esqueciEmail");
        var email = emailEl ? emailEl.value.trim() : "";
        loginHideErro("esqueciErro");
        if (!email) { loginShowErro("esqueciErro", "Informe o e-mail."); return; }
        btnEsq.disabled = true; btnEsq.textContent = "Enviando...";
        solicitarResetSenha(email)
          .then(function (res) {
            if (!res || !res.ok) {
              loginShowErro("esqueciErro", (res && res.erro) ? res.erro : "Erro ao enviar solicitação.");
              btnEsq.disabled = false; btnEsq.textContent = "Enviar solicitação";
              return;
            }
            var esqueciForm = document.getElementById("esqueciForm");
            var esqueciOk = document.getElementById("esqueciOk");
            if (esqueciForm) esqueciForm.classList.add("hidden");
            if (esqueciOk) {
              esqueciOk.innerHTML = "<p>Solicitação enviada para <strong>" + res.nome +
                "</strong> (" + res.tipo + ").<br>Aguarde o administrador processar o reset.</p>";
              esqueciOk.classList.remove("hidden");
            }
          })
          .catch(function (err) {
            loginShowErro("esqueciErro", (err && err.message) ? err.message : "Erro ao enviar solicitação.");
            btnEsq.disabled = false; btnEsq.textContent = "Enviar solicitação";
          });
      });
    }
    formEsqueci.addEventListener("submit", function (e) { e.preventDefault(); return false; });
  }

  /* ── Redireciona se já logado ────────────────────────────────────── */
  var sessaoAtiva = (typeof getSessao === "function") ? getSessao() : null;
  if (sessaoAtiva && !sessaoAtiva._pendingRedefinir) {
    loginRedirecionar(sessaoAtiva.perfil);
  } else if (sessaoAtiva && sessaoAtiva._pendingRedefinir) {
    loginMostrarRedefinir(sessaoAtiva);
  }

}); /* DOMContentLoaded */
