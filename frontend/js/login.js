/* ─────────────────────────────────────────────────────────────
   LOGIN.JS
   ───────────────────────────────────────────────────────────── */


/* =============================================================
   HELPERS
   ============================================================= */

function loginShowErro(elId, msg) {

  var el = document.getElementById(elId);

  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
  }
}


function loginHideErro(elId) {

  var el = document.getElementById(elId);

  if (el) {
    el.classList.add("hidden");
  }
}


/* =============================================================
   REDIRECIONAMENTO
   ============================================================= */

function loginRedirecionar(perfil) {

  if (perfil === "admin") {

    window.location.href = "admin.html";

  } else if (perfil === "associado") {

    window.location.href = "associado.html";

  } else if (perfil === "empresario") {

    window.location.href = "empresario.html";

  } else {

    console.error(
        "Perfil de usuário desconhecido:",
        perfil
    );

    clearSessao();

    window.location.href = "login.html";
  }
}


/* =============================================================
   TELA DE REDEFINIÇÃO
   ============================================================= */

function loginMostrarRedefinir(usuario) {

  var painelLogin =
      document.getElementById("panelLogin");

  var painelRedefinir =
      document.getElementById("panelRedefinir");

  var sub =
      document.getElementById("redefSub");

  if (painelLogin) {
    painelLogin.classList.add("hidden");
  }

  if (painelRedefinir) {
    painelRedefinir.classList.remove("hidden");
  }

  if (
      sub &&
      usuario &&
      usuario.nome
  ) {

    sub.textContent =
        "Olá, " +
        usuario.nome.split(" ")[0] +
        "! Por segurança, crie uma nova senha antes de continuar.";
  }
}


/* =============================================================
   ESQUECI MINHA SENHA
   ============================================================= */

function abrirRecuperacaoSenha() {

  var modal =
      document.getElementById("modalEsqueci");

  var formulario =
      document.getElementById("esqueciForm");

  var sucesso =
      document.getElementById("esqueciSucesso");

  var botao =
      document.getElementById("btnSolicitarReset");

  if (!modal) {
    return;
  }

  loginHideErro("esqueciErro");

  if (formulario) {
    formulario.classList.remove("hidden");
  }

  if (sucesso) {
    sucesso.classList.add("hidden");
  }

  if (botao) {

    botao.disabled = false;
    botao.textContent =
        "Enviar solicitação";
  }

  modal.classList.remove("hidden");

  var email =
      document.getElementById("esqueciEmail");

  if (email) {
    email.focus();
  }
}


/* =============================================================
   LOGIN PRINCIPAL
   ============================================================= */

function executarLogin() {

  loginHideErro("loginErro");

  var emailEl =
      document.getElementById("loginEmail");

  var senhaEl =
      document.getElementById("loginSenha");

  var btnEl =
      document.getElementById("btnLoginSubmit");


  var email =
      emailEl
          ? emailEl.value.trim()
          : "";

  var senha =
      senhaEl
          ? senhaEl.value.trim()
          : "";


  if (!email || !senha) {

    loginShowErro(
        "loginErro",
        "Preencha todos os campos."
    );

    return;
  }


  if (btnEl) {
    btnEl.disabled = true;
    btnEl.classList.add("btn-loading");
    btnEl.innerHTML = '<span class="btn-loading-spinner"></span><span>Entrando...</span>';
  }


  /*
   * apiAuth.login()
   *
   * chama:
   *
   * POST /api/auth/login
   *
   * e recebe o usuário.
   */
  apiAuth.login(email, senha)

      .then(function (usuario) {

        if (!usuario) {

          loginShowErro(
              "loginErro",
              "E-mail ou senha incorretos. Tente novamente."
          );

          if (btnEl) {
            btnEl.disabled = false;
            btnEl.classList.remove("btn-loading");
            btnEl.innerHTML = "Entrar no sistema";
          }

          return;
        }


        /*
         * O backend deve sempre retornar o perfil.
         */
        var perfil =
            usuario.perfil || "associado";


        /*
         * Primeiro login ou senha expirada.
         */
        if (
            usuario.primeiroLogin === true ||
            usuario.senhaExpirada === true
        ) {

          var sessaoPendente =
              Object.assign(
                  {},
                  usuario,
                  {
                    _pendingRedefinir: true
                  }
              );


          if (
              typeof setSessao === "function"
          ) {

            setSessao(
                sessaoPendente
            );
          }


          if (
              typeof registrarLog === "function"
          ) {

            registrarLog(
                "Login com senha expirada",
                usuario.nome,
                perfil,
                "Redirecionado para troca obrigatória"
            );
          }


          loginMostrarRedefinir(
              usuario
          );


          if (btnEl) {
            btnEl.disabled = false;
            btnEl.classList.remove("btn-loading");
            btnEl.innerHTML = "Entrar no sistema";
          }

          return;
        }


        /*
         * Login normal.
         */

        if (
            typeof registrarLog === "function"
        ) {

          registrarLog(
              "Login realizado",
              usuario.nome,
              perfil,
              "Acesso via tela de login"
          );
        }


        /*
         * AQUI o resultado do login
         * é efetivamente guardado.
         */
        if (
            typeof setSessao === "function"
        ) {

          setSessao(usuario);
        }


        loginRedirecionar(
            perfil
        );

      })

      .catch(function (err) {

        var msg =
            (
                err &&
                err.message
            )
                ? err.message
                : "E-mail ou senha incorretos. Tente novamente.";


        loginShowErro(
            "loginErro",
            msg
        );


        if (btnEl) {
          btnEl.disabled = false;
          btnEl.classList.remove("btn-loading");
          btnEl.innerHTML = "Entrar no sistema";
        }
      });
}


/* =============================================================
   DOM READY
   ============================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


      /* =====================================================
         TEMA
         ===================================================== */

      [
        "btnTheme",
        "btnTheme2"
      ].forEach(function (id) {

        var btn =
            document.getElementById(id);

        if (
            btn &&
            typeof toggleTheme === "function"
        ) {

          btn.addEventListener(
              "click",
              toggleTheme
          );
        }
      });


      /* =====================================================
         TOGGLE SENHA
         ===================================================== */

      document
          .querySelectorAll(".toggle-pw")
          .forEach(function (btn) {

            btn.addEventListener(
                "click",
                function () {

                  var target =
                      document.getElementById(
                          btn.dataset.target
                      );

                  if (!target) {
                    return;
                  }

                  var isPassword =
                      target.type === "password";


                  target.type =
                      isPassword
                          ? "text"
                          : "password";


                  btn.innerHTML =
                      isPassword
                          ? '<i class="bi bi-eye-slash"></i>'
                          : '<i class="bi bi-eye"></i>';
                }
            );
          });


      /* =====================================================
         BOTÃO LOGIN
         ===================================================== */

      var btnLogin =
          document.getElementById(
              "btnLoginSubmit"
          );

      if (btnLogin) {

        btnLogin.addEventListener(
            "click",
            executarLogin
        );
      }


      /* =====================================================
         ENTER NOS CAMPOS
         ===================================================== */

      [
        "loginEmail",
        "loginSenha"
      ].forEach(function (id) {

        var el =
            document.getElementById(id);

        if (el) {

          el.addEventListener(
              "keydown",
              function (e) {

                if (e.key === "Enter") {

                  e.preventDefault();

                  executarLogin();
                }
              }
          );
        }
      });


      /* =====================================================
         FORÇA DA NOVA SENHA
         ===================================================== */

      var novaSenhaEl =
          document.getElementById(
              "novaSenhaRedef"
          );

      if (novaSenhaEl) {

        novaSenhaEl.addEventListener(
            "input",
            function () {

              var val = this.value;

              var forca =
                  document.getElementById(
                      "senhaForca"
                  );

              if (!forca) {
                return;
              }

              if (!val) {

                forca.innerHTML = "";

                return;
              }


              var score = 0;


              if (val.length >= 6) {
                score++;
              }

              if (val.length >= 10) {
                score++;
              }

              if (/[A-Z]/.test(val)) {
                score++;
              }

              if (/[0-9]/.test(val)) {
                score++;
              }

              if (/[^A-Za-z0-9]/.test(val)) {
                score++;
              }


              var niveis = [

                {
                  txt: "Fraca",
                  cor: "#ef4444"
                },

                {
                  txt: "Fraca",
                  cor: "#ef4444"
                },

                {
                  txt: "Média",
                  cor: "#f59e0b"
                },

                {
                  txt: "Boa",
                  cor: "#22c55e"
                },

                {
                  txt: "Forte",
                  cor: "#16a34a"
                },

                {
                  txt: "Forte",
                  cor: "#16a34a"
                }
              ];


              var nivel =
                  niveis[
                      Math.min(
                          score,
                          5
                      )
                      ];


              forca.innerHTML =
                  '<div class="sf-bar">' +

                  [1, 2, 3, 4, 5]
                      .map(function (i) {

                        return (
                            '<div class="sf-seg' +
                            (
                                i <= score
                                    ? " sf-on"
                                    : ""
                            ) +
                            '"' +
                            (
                                i <= score
                                    ? ' style="background:' +
                                    nivel.cor +
                                    '"'
                                    : ""
                            ) +
                            '></div>'
                        );

                      })
                      .join("") +

                  '</div>' +

                  '<span style="font-size:0.75rem;color:' +
                  nivel.cor +
                  ';font-weight:600;">' +
                  nivel.txt +
                  '</span>';
            }
        );
      }


      /* =====================================================
         REDEFINIÇÃO OBRIGATÓRIA
         ===================================================== */

      var formRedefinir =
          document.getElementById(
              "formRedefinir"
          );

      if (formRedefinir) {

        var btnRedef =
            formRedefinir.querySelector(
                "button[type=submit]"
            );


        if (btnRedef) {

          btnRedef.type = "button";


          btnRedef.addEventListener(
              "click",
              function () {

                var nova =
                    (
                        document.getElementById(
                            "novaSenhaRedef"
                        ) || {}
                    ).value || "";


                var confirmacao =
                    (
                        document.getElementById(
                            "confirmaSenhaRedef"
                        ) || {}
                    ).value || "";


                loginHideErro(
                    "redefErro"
                );


                if (!nova) {

                  loginShowErro(
                      "redefErro",
                      "Informe a nova senha."
                  );

                  return;
                }


                if (nova.length < 6) {

                  loginShowErro(
                      "redefErro",
                      "A nova senha deve possuir pelo menos 6 caracteres."
                  );

                  return;
                }


                if (
                    nova !==
                    confirmacao
                ) {

                  loginShowErro(
                      "redefErro",
                      "As senhas não coincidem."
                  );

                  return;
                }


                var sessao =
                    (
                        typeof getSessao === "function"
                    )
                        ? getSessao()
                        : null;


                if (!sessao) {

                  window.location.href =
                      "login.html";

                  return;
                }


                btnRedef.disabled = true;
                btnRedef.classList.add("btn-loading");
                btnRedef.innerHTML = '<span class="btn-loading-spinner"></span><span>Salvando...</span>';


                /*
                 * Durante primeiro login/reset,
                 * suportamos tanto associados quanto empresários e admins.
                 */
                var perfil = sessao.perfil || "associado";
                var colecao = (perfil === "associado") ? "associados" : "usuarios";

                var acaoSalvar = (typeof definirNovaSenha === "function")
                    ? definirNovaSenha(sessao.id, colecao, nova)
                    : apiAuth.alterarSenha(sessao.id, null, nova, perfil);

                Promise.resolve(acaoSalvar)
                    .then(function (res) {

                      if (res && res.ok === false) {
                        throw new Error(res.erro || "Erro ao salvar senha.");
                      }

                      var novaSessao =
                          Object.assign(
                              {},
                              sessao,
                              {
                                senhaExpirada: false,
                                primeiroLogin: false,
                                _pendingRedefinir: false
                              }
                          );


                      setSessao(
                          novaSessao
                      );


                      if (
                          typeof registrarLog === "function"
                      ) {

                        registrarLog(
                            "Nova senha definida",
                            sessao.nome,
                            sessao.perfil,
                            "Senha redefinida com sucesso após reset"
                        );
                      }


                      if (
                          typeof showToast === "function"
                      ) {

                        showToast(
                            "Nova senha salva! Redirecionando...",
                            "success"
                        );
                      }


                      setTimeout(
                          function () {

                            loginRedirecionar(
                                sessao.perfil
                            );

                          },
                          1200
                      );

                    })

                    .catch(function (err) {

                      loginShowErro(
                          "redefErro",
                          (
                              err &&
                              err.message
                          )
                              ? err.message
                              : "Erro ao salvar senha."
                      );


                      btnRedef.disabled =
                          false;
                      btnRedef.classList.remove("btn-loading");
                      btnRedef.innerHTML =
                          "Salvar nova senha e entrar";
                    });
              }
          );
        }


        formRedefinir.addEventListener(
            "submit",
            function (e) {

              e.preventDefault();

              return false;
            }
        );
      }


      /* =====================================================
         ESQUECI MINHA SENHA
         ===================================================== */

      var formEsqueci =
          document.getElementById(
              "formEsqueci"
          );


      if (formEsqueci) {

        var btnEsq =
            formEsqueci.querySelector(
                "button[type=submit]"
            );


        if (btnEsq) {

          btnEsq.type = "button";


          btnEsq.addEventListener(
              "click",
              function () {

                var emailEl =
                    document.getElementById(
                        "esqueciEmail"
                    );


                var email =
                    emailEl
                        ? emailEl.value.trim()
                        : "";


                loginHideErro(
                    "esqueciErro"
                );


                if (!email) {

                  loginShowErro(
                      "esqueciErro",
                      "Informe o e-mail."
                  );

                  return;
                }


                btnEsq.disabled = true;

                btnEsq.textContent =
                    "Enviando...";


                solicitarResetSenha(email)

                    .then(function (res) {

                      if (
                          !res ||
                          !res.ok
                      ) {

                        loginShowErro(
                            "esqueciErro",
                            (
                                res &&
                                res.erro
                            )
                                ? res.erro
                                : "Erro ao enviar solicitação."
                        );

                        btnEsq.disabled =
                            false;

                        btnEsq.textContent =
                            "Enviar solicitação";

                        return;
                      }


                      var esqueciForm =
                          document.getElementById(
                              "esqueciForm"
                          );


                      var esqueciOk =
                          document.getElementById(
                              "esqueciOk"
                          );


                      if (esqueciForm) {

                        esqueciForm.classList.add(
                            "hidden"
                        );
                      }


                      if (esqueciOk) {

                        esqueciOk.innerHTML =
                            "<p>Solicitação enviada para <strong>" +
                            res.nome +
                            "</strong> (" +
                            res.tipo +
                            ").<br>Aguarde o administrador processar o reset.</p>";

                        esqueciOk.classList.remove(
                            "hidden"
                        );
                      }

                    })

                    .catch(function (err) {

                      loginShowErro(
                          "esqueciErro",
                          (
                              err &&
                              err.message
                          )
                              ? err.message
                              : "Erro ao enviar solicitação."
                      );


                      btnEsq.disabled =
                          false;

                      btnEsq.textContent =
                          "Enviar solicitação";
                    });
              }
          );
        }


        formEsqueci.addEventListener(
            "submit",
            function (e) {

              e.preventDefault();

              return false;
            }
        );
      }


      /* =====================================================
         MODAL ESQUECI SENHA
         ===================================================== */

      var modalEsqueci =
          document.getElementById(
              "modalEsqueci"
          );

      var esqueciFormModal =
          document.getElementById(
              "esqueciForm"
          );

      var esqueciSucesso =
          document.getElementById(
              "esqueciSucesso"
          );

      var btnAbrirEsqueci =
          document.getElementById(
              "btnEsqueci"
          );

      var btnFecharEsqueci =
          document.getElementById(
              "btnFecharEsqueci"
          );

      var btnFecharEsqueciSucesso =
          document.getElementById(
              "btnFecharEsqueciSucesso"
          );

      var btnSolicitarReset =
          document.getElementById(
              "btnSolicitarReset"
          );


      function fecharEsqueci() {

        if (modalEsqueci) {

          modalEsqueci.classList.add(
              "hidden"
          );
        }
      }


      function abrirEsqueci() {

        if (!modalEsqueci) {
          return;
        }


        loginHideErro(
            "esqueciErro"
        );


        if (esqueciFormModal) {

          esqueciFormModal.classList.remove(
              "hidden"
          );
        }


        if (esqueciSucesso) {

          esqueciSucesso.classList.add(
              "hidden"
          );
        }


        if (btnSolicitarReset) {

          btnSolicitarReset.disabled =
              false;

          btnSolicitarReset.textContent =
              "Enviar solicitação";
        }


        modalEsqueci.classList.remove(
            "hidden"
        );


        var emailEl =
            document.getElementById(
                "esqueciEmail"
            );


        if (emailEl) {
          emailEl.focus();
        }
      }


      if (btnAbrirEsqueci) {

        btnAbrirEsqueci.addEventListener(
            "click",
            abrirEsqueci
        );
      }


      if (btnFecharEsqueci) {

        btnFecharEsqueci.addEventListener(
            "click",
            fecharEsqueci
        );
      }


      if (btnFecharEsqueciSucesso) {

        btnFecharEsqueciSucesso.addEventListener(
            "click",
            fecharEsqueci
        );
      }


      if (modalEsqueci) {

        modalEsqueci.addEventListener(
            "click",
            function (e) {

              if (
                  e.target ===
                  modalEsqueci
              ) {

                fecharEsqueci();
              }
            }
        );
      }


      if (btnSolicitarReset) {

        btnSolicitarReset.addEventListener(
            "click",
            function () {

              var emailEl =
                  document.getElementById(
                      "esqueciEmail"
                  );


              var email =
                  emailEl
                      ? emailEl.value.trim()
                      : "";


              loginHideErro(
                  "esqueciErro"
              );


              if (!email) {

                loginShowErro(
                    "esqueciErro",
                    "Informe o e-mail."
                );

                return;
              }


              btnSolicitarReset.disabled =
                  true;
              btnSolicitarReset.classList.add("btn-loading");
              btnSolicitarReset.innerHTML =
                  '<span class="btn-loading-spinner"></span><span>Enviando...</span>';

              solicitarResetSenha(email)

                  .then(function (res) {

                    if (
                        !res ||
                        !res.ok
                    ) {

                      loginShowErro(
                          "esqueciErro",
                          (
                              res &&
                              res.erro
                          )
                              ? res.erro
                              : "Erro ao enviar solicitação."
                      );

                      btnSolicitarReset.disabled =
                          false;
                      btnSolicitarReset.classList.remove("btn-loading");
                      btnSolicitarReset.innerHTML =
                          "Enviar solicitação";

                      return;
                    }


                    var nomeSucesso =
                        document.getElementById(
                            "esqueciSucessoNome"
                        );


                    if (nomeSucesso) {

                      nomeSucesso.textContent =
                          "Solicitação enviada para " +
                          res.nome +
                          "!";
                    }


                    if (esqueciFormModal) {

                      esqueciFormModal.classList.add(
                          "hidden"
                      );
                    }


                    if (esqueciSucesso) {

                      esqueciSucesso.classList.remove(
                          "hidden"
                      );
                    }

                    btnSolicitarReset.disabled = false;
                    btnSolicitarReset.classList.remove("btn-loading");
                    btnSolicitarReset.innerHTML = "Enviar solicitação";

                  })

                  .catch(function (err) {

                    loginShowErro(
                        "esqueciErro",
                        (
                            err &&
                            err.message
                        )
                            ? err.message
                            : "Erro ao enviar solicitação."
                    );


                    btnSolicitarReset.disabled =
                        false;
                    btnSolicitarReset.classList.remove("btn-loading");
                    btnSolicitarReset.innerHTML =
                        "Enviar solicitação";
                  });
            }
        );
      }


      /* =====================================================
         VERIFICAÇÃO DE SESSÃO EXISTENTE
         ===================================================== */
      const urlParams = new URLSearchParams(window.location.search);
      const forcarNovoLogin = urlParams.has("novo") || urlParams.has("logout") || urlParams.has("sair") || urlParams.has("trocar");

      if (forcarNovoLogin && typeof clearSessao === "function") {
        clearSessao();
      }

      var sessaoAtiva = forcarNovoLogin ? null : ((typeof getSessao === "function") ? getSessao() : null);

      if (sessaoAtiva && sessaoAtiva._pendingRedefinir) {
        loginMostrarRedefinir(sessaoAtiva);
      } else if (sessaoAtiva && sessaoAtiva.perfil) {
        const wrap = document.querySelector(".login-form-wrap");
        if (wrap) {
          let banner = document.getElementById("bannerSessaoAtiva");
          if (!banner) {
            banner = document.createElement("div");
            banner.id = "bannerSessaoAtiva";
            banner.className = "sessao-ativa-card";
            const formLogin = document.getElementById("formLogin");
            if (formLogin) {
              wrap.insertBefore(banner, formLogin);
            } else {
              wrap.prepend(banner);
            }
          }

          const perfilLabel = sessaoAtiva.perfil === "admin" ? "Administrador" : sessaoAtiva.perfil === "empresario" ? "Empresário Parceiro" : "Associado";
          const nomeUsuario = sessaoAtiva.nome || "Usuário";

          banner.innerHTML = `
            <div class="sessao-ativa-header">
              <div class="sessao-ativa-icon"><i class="bi bi-person-check-fill"></i></div>
              <div class="sessao-ativa-info">
                <div class="sessao-ativa-titulo">Sessão ativa detectada</div>
                <div class="sessao-ativa-desc">Você já está conectado como <strong>${nomeUsuario}</strong> (${perfilLabel}).</div>
              </div>
            </div>
            <div class="sessao-ativa-actions">
              <button type="button" class="btn btn-primary btn-sm" id="btnContinuarPainel">
                <i class="bi bi-speedometer2"></i> Acessar meu Painel
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="btnSairSessao">
                <i class="bi bi-box-arrow-right"></i> Entrar com outra conta
              </button>
            </div>
          `;

          document.getElementById("btnContinuarPainel")?.addEventListener("click", () => {
            loginRedirecionar(sessaoAtiva.perfil);
          });

          document.getElementById("btnSairSessao")?.addEventListener("click", () => {
            if (typeof clearSessao === "function") clearSessao();
            banner.remove();
            if (typeof showToast === "function") {
              showToast("Sessão encerrada. Você pode entrar com outra conta.", "info");
            }
          });
        }
      }

    }
);