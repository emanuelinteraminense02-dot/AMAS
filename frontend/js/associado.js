/* ─── ASSOCIADO.JS v5 (async/await) ─────────────────────────────── */

document.addEventListener("DOMContentLoaded", async () => {

  const sessao = getSessao();
  if (!sessao || sessao.perfil !== "associado") { window.location.href = "login.html"; return; }

  // Loading helper
  function setLoading(id, msg) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);"><i class="bi bi-hourglass-split"></i> ' + (msg || "Carregando...") + '</div>';
  }

  async function getAssocAtual() {
    try {
      const a = await getAssociadoPorId(sessao.id);
      if (a && a.id) {
        try {
          const contribs = await getContribuicoesAssociado(a.id);
          a.historico = contribs || [];
        } catch (_) {}
      }
      return a;
    } catch (_) {
      return sessao;
    }
  }
  let assoc = await getAssocAtual();

  // ── Sidebar info
  async function updateSidebarInfo() {
    assoc = await getAssocAtual();
    document.getElementById("sidebarNome").textContent      = assoc.nome;
    document.getElementById("sidebarMatricula").textContent = assoc.matricula || "—";
    const av = document.getElementById("sidebarAvatar");
    if (assoc.foto) { av.innerHTML = '<img src="' + assoc.foto + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover;">'; }
    else            { av.innerHTML = '<i class="bi bi-person" style="font-size:1.6rem;"></i>'; }
    atualizarBadgeMensagens();
  }
  updateSidebarInfo();

  // ── Badge mensagens
  async function atualizarBadgeMensagens() {
    try {
      const n = await contarNaoLidas(assoc.id);
      const badge = document.getElementById("badgeMensagens");
      if (n > 0) { badge.textContent = n; badge.classList.remove("hidden"); }
      else        { badge.classList.add("hidden"); }
    } catch (_) {}
  }

  // ── Status chip
  async function renderStatusChip() {
    assoc = await getAssocAtual();
    const chip = document.getElementById("statusChip");
    const map = { "Regular":"badge-regular","Inadimplente":"badge-inadim","Em análise":"badge-analise","Revisão solicitada":"badge-revisao","Pendente":"badge-pendente" };
    chip.innerHTML = '<span class="badge ' + (map[assoc.status]||"badge-pendente") + '" style="font-size:0.85rem;padding:6px 16px;">' + assoc.status + '</span>';
  }
  renderStatusChip();

  // ── Primeiro login
  if (assoc.primeiroLogin !== false) {
    document.getElementById("avisoSenha").classList.remove("hidden");
    document.getElementById("modalSenha").classList.remove("hidden");
  }
  document.getElementById("btnIrTrocarSenha")?.addEventListener("click", () => {
    document.getElementById("modalSenha").classList.remove("hidden");
  });

  document.getElementById("formTrocarSenha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nova = document.getElementById("novaSenha").value.trim();
    const conf = document.getElementById("confirmarSenha").value.trim();
    const err  = document.getElementById("senhaErro");
    err.textContent = "";
    if (nova.length < 6) { err.textContent = "A senha deve ter pelo menos 6 caracteres."; return; }
    if (nova !== conf)   { err.textContent = "As senhas não coincidem."; return; }
    try {
      await atualizarAssociado(assoc.id, { senha: nova, primeiroLogin: false });
      setSessao({ ...assoc, senha: nova, primeiroLogin: false });
      assoc = await getAssocAtual();
      document.getElementById("modalSenha").classList.add("hidden");
      document.getElementById("avisoSenha").classList.add("hidden");
      registrarLog("Senha alterada", assoc.nome, "associado", "Senha redefinida com sucesso");
      showToast("Senha alterada com sucesso!", "success");
    } catch (ex) { err.textContent = ex.message || "Erro ao salvar senha."; }
  });

  // ── Navegação
  const navItems  = document.querySelectorAll(".nav-item");
  const sections  = document.querySelectorAll(".painel-section");
  const pageTitle = document.getElementById("pageTitle");
  const pageSub   = document.getElementById("pageSub");
  const titulos   = {
    perfil:      ["Meu Perfil",            "Seus dados cadastrais"],
    mensagens:   ["Central de Mensagens",  "Avisos e comunicados da AMAS"],
    financeiro:  ["Situação Financeira",   "Acompanhe sua contribuição"],
    enviar:      ["Enviar Comprovante",    "Registre sua contribuição mensal"],
    historico:   ["Histórico",             "Todas as suas contribuições"],
    carteirinha: ["Carteirinha Digital",   "Sua identificação de associado"],
    parceiros:   ["Empresas Parceiras",    "Descontos e benefícios exclusivos para você"],
    eventos:     ["Meus Eventos",          "Inscrições e eventos da AMAS"],
    chat:        ["Chat com a Administração", "Canal exclusivo de atendimento individual e envio de documentos"]
  };

  navItems.forEach(item => {
    item.addEventListener("click", async () => {
      const sec = item.dataset.section;
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      sections.forEach(s => s.classList.add("hidden"));
      document.getElementById("sec-" + sec).classList.remove("hidden");
      const [t, s] = titulos[sec] || ["",""];
      pageTitle.textContent = t; pageSub.textContent = s;
      assoc = await getAssocAtual();
      if (sec === "perfil")      renderPerfil();
      if (sec === "mensagens")   renderMensagens();
      if (sec === "chat")        window.chatUI?.iniciarCliente('associado');
      if (sec === "financeiro")  renderFinanceiro();
      if (sec === "historico")   renderHistorico();
      if (sec === "carteirinha") renderCarteirinha();
      if (sec === "parceiros")   window.renderCatalogoParceiros?.();
      if (sec === "eventos")     renderEventosAssoc();
      renderStatusChip();
      if (window.amasSidebar) {
        window.amasSidebar.close();
      } else {
        document.getElementById("sidebar")?.classList.remove("sidebar-open");
      }
    });
  });

  if (!window.amasSidebar) {
    document.getElementById("hamburgerBtn")?.addEventListener("click", () => { document.getElementById("sidebar")?.classList.toggle("sidebar-open"); });
    document.getElementById("sidebarClose")?.addEventListener("click", () => { document.getElementById("sidebar")?.classList.remove("sidebar-open"); });
  }
  document.getElementById("btnLogout").addEventListener("click", () => {
    registrarLog("Logout", assoc.nome, "associado", "Sessão encerrada");
    clearSessao(); window.location.href = "login.html";
  });

  // ══════════════════════════════════════════════
  // PERFIL
  // ══════════════════════════════════════════════
  async function renderPerfil() {
    assoc = await getAssocAtual();

    // Top Hero Card
    const heroNome = document.getElementById("perfilHeroNome");
    if (heroNome) heroNome.textContent = assoc.nome || "Associado";
    const heroMat = document.getElementById("perfilHeroMatricula");
    if (heroMat) heroMat.innerHTML = '<i class="bi bi-hash"></i> ' + (assoc.matricula || "S/N");
    const heroStatus = document.getElementById("perfilHeroStatus");
    if (heroStatus) {
      const isReg = assoc.status === "Regular";
      heroStatus.className = "perfil-badge status " + (isReg ? "adimplente" : "atencao");
      heroStatus.innerHTML = isReg ? '<i class="bi bi-patch-check-fill"></i> Regular' : '<i class="bi bi-exclamation-circle-fill"></i> ' + (assoc.status || "Pendente");
    }
    const heroData = document.getElementById("perfilHeroData");
    if (heroData) heroData.innerHTML = '<i class="bi bi-calendar-check"></i> Membro desde ' + (formatDate(assoc.dataEntrada) || "—");

    // Identificação e Contato
    const idFields = [
      { icon: "bi-person-badge", label: "Nome Completo", val: assoc.nome },
      { icon: "bi-card-text", label: "CPF", val: assoc.cpf },
      { icon: "bi-calendar3", label: "Data de Nascimento", val: formatDate(assoc.nascimento) },
      { icon: "bi-telephone", label: "Telefone / WhatsApp", val: assoc.telefone },
      { icon: "bi-envelope-at", label: "E-mail de Contato", val: assoc.email },
    ];
    const idCont = document.getElementById("dadosIdentificacao");
    if (idCont) {
      idCont.innerHTML = idFields.map(f =>
        '<div class="perfil-tile">' +
          '<div class="perfil-tile-icon"><i class="bi ' + f.icon + '"></i></div>' +
          '<div class="perfil-tile-content">' +
            '<span class="perfil-tile-label">' + f.label + '</span>' +
            '<span class="perfil-tile-val">' + (f.val || "Não informado") + '</span>' +
          '</div>' +
        '</div>'
      ).join("");
    }

    // Ocupação e Localização
    const ocupFields = [
      { icon: "bi-briefcase", label: "Profissão / Ocupação", val: assoc.profissao },
      { icon: "bi-geo-alt", label: "Endereço Residencial", val: assoc.endereco },
      { icon: "bi-shield-check", label: "Número de Matrícula", val: assoc.matricula },
      { icon: "bi-clock-history", label: "Data de Associação", val: formatDate(assoc.dataEntrada) }
    ];
    const ocupCont = document.getElementById("dadosOcupacao");
    if (ocupCont) {
      ocupCont.innerHTML = ocupFields.map(f =>
        '<div class="perfil-tile">' +
          '<div class="perfil-tile-icon"><i class="bi ' + f.icon + '"></i></div>' +
          '<div class="perfil-tile-content">' +
            '<span class="perfil-tile-label">' + f.label + '</span>' +
            '<span class="perfil-tile-val">' + (f.val || "Não informado") + '</span>' +
          '</div>' +
        '</div>'
      ).join("");
    }

    const preview = document.getElementById("fotoImgPreview");
    const placeholder = document.getElementById("fotoPlaceholder");
    if (assoc.foto) { preview.src = assoc.foto; preview.style.display = "block"; placeholder.style.display = "none"; }
    else             { preview.style.display = "none"; placeholder.style.display = "block"; }
  }

  document.getElementById("inputFoto").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Imagem muito grande. Máximo 2MB.", "error"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const b64 = ev.target.result;
        await atualizarAssociado(assoc.id, { foto: b64 });
        setSessao({ ...getSessao(), foto: b64 });
        assoc = await getAssocAtual();
        renderPerfil(); updateSidebarInfo();
        showToast("Foto atualizada com sucesso!", "success");
        registrarLog("Foto atualizada", assoc.nome, "associado", "Foto de perfil alterada");
      } catch (ex) { showToast("Erro ao salvar foto.", "error"); }
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("btnEditarPerfil").addEventListener("click", async () => {
    assoc = await getAssocAtual();
    document.getElementById("editNome").value     = assoc.nome || "";
    document.getElementById("editTelefone").value = assoc.telefone || "";
    document.getElementById("editEmail").value    = assoc.email || "";
    document.getElementById("editProfissao").value= assoc.profissao || "";
    document.getElementById("editEndereco").value = assoc.endereco || "";
    document.getElementById("modalEditarPerfil").classList.remove("hidden");
  });

  document.getElementById("editTelefone").addEventListener("input", function() { maskTel(this); });

  document.getElementById("formEditarPerfil").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome     = document.getElementById("editNome").value.trim();
    const telefone = document.getElementById("editTelefone").value.trim();
    const email    = document.getElementById("editEmail").value.trim();
    const profissao= document.getElementById("editProfissao").value.trim();
    const endereco = document.getElementById("editEndereco").value.trim();
    const err      = document.getElementById("editErro");
    err.textContent = "";
    if (!nome) { err.textContent = "Nome é obrigatório."; return; }
    if (!email){ err.textContent = "E-mail é obrigatório."; return; }
    try {
      await atualizarAssociado(assoc.id, { nome, telefone, email, profissao, endereco });
      setSessao({ ...getSessao(), nome, telefone, email, profissao, endereco });
      assoc = await getAssocAtual();
      document.getElementById("modalEditarPerfil").classList.add("hidden");
      renderPerfil(); updateSidebarInfo();
      registrarLog("Perfil editado", assoc.nome, "associado", "Dados de perfil atualizados");
      showToast("Perfil atualizado com sucesso!", "success");
    } catch (ex) { err.textContent = ex.message || "Erro ao salvar."; }
  });

  // ══════════════════════════════════════════════
  // MENSAGENS
  // ══════════════════════════════════════════════
  async function renderMensagens() {
    setLoading("listaMensagens", "Carregando mensagens...");
    try {
      assoc = await getAssocAtual();
      const msgs = await getMensagensParaAssociado(assoc.id);
      const cont = document.getElementById("listaMensagens");
      if (msgs.length === 0) {
        cont.innerHTML = '<div class="empty-state"><div class="es-icon"><i class="bi bi-envelope" style="font-size:1.6rem;"></i></div>Nenhuma mensagem recebida ainda.</div>'; return;
      }
      cont.innerHTML = msgs.map(m => {
        const lida = (m.lidas||[]).includes(assoc.id);
        const dataFmt = new Date(m.data).toLocaleString("pt-BR");
        return '<div class="msg-item ' + (lida?"msg-lida":"msg-nao-lida") + '">' +
            '<div class="msg-item-header"><div>' +
            '<span class="msg-titulo">' + (lida?"":"<span class=\"msg-dot\"></span>") + m.titulo + '</span>' +
            '<span class="msg-meta">De: ' + m.remetente + ' · ' + dataFmt + '</span>' +
            '</div>' +
            (!lida?'<button class="btn btn-outline btn-sm" onclick="marcarLidaUI('+m.id+')">Marcar como lida</button>':'<span class="badge badge-regular" style="font-size:0.75rem;">Lida</span>') +
            '</div><div class="msg-corpo">' + m.corpo + '</div></div>';
      }).join("");
      atualizarBadgeMensagens();
    } catch (e) { showToast("Erro ao carregar mensagens.", "error"); }
  }

  window.marcarLidaUI = async function(idMsg) {
    try {
      await marcarMensagemLida(idMsg, assoc.id);
      renderMensagens(); atualizarBadgeMensagens();
      showToast("Mensagem marcada como lida.", "success");
    } catch (e) { showToast("Erro.", "error"); }
  };

  // ══════════════════════════════════════════════
  // FINANCEIRO
  // ══════════════════════════════════════════════
  let parcelaPagarMes = null;

  async function renderFinanceiro() {
    try {
      assoc = await getAssocAtual();
      const icones = {
        "Regular":            ['<i class="bi bi-check-circle-fill" style="color:#16a34a;"></i>',"#16a34a","Você está em dia com suas contribuições. Continue assim!"],
        "Inadimplente":       ['<i class="bi bi-x-circle-fill" style="color:#dc2626;"></i>',"#dc2626","Você possui contribuições em atraso. Regularize para manter seus benefícios."],
        "Em análise":         ['<i class="bi bi-hourglass-split" style="color:#d97706;"></i>',"#d97706","Seu comprovante está sendo analisado. Aguarde a confirmação."],
        "Revisão solicitada": ['<i class="bi bi-arrow-clockwise" style="color:#ea580c;"></i>',"#ea580c","O administrador solicitou revisão do seu comprovante."],
        "Pendente":           ['<i class="bi bi-circle" style="color:#6C6E84;"></i>',"#6C6E84","Você ainda não enviou sua contribuição deste mês."]
      };
      const [icone, cor, desc] = icones[assoc.status]||['<i class="bi bi-circle" style="color:#6C6E84;"></i>',"#6C6E84","—"];
      document.getElementById("situacaoFinanceira").innerHTML =
          '<div class="situacao-big"><div class="situacao-icone">'+icone+'</div><div class="situacao-status" style="color:'+cor+';">'+assoc.status+'</div><div class="situacao-desc">'+desc+'</div></div>';

      const parcelas = assoc.parcelasAtraso || [];
      const pCont = document.getElementById("parcelasAtrasoCont");
      if (parcelas.length === 0) {
        pCont.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;padding:12px 0;"><i class=\"bi bi-check-circle-fill\" style=\"color:#16a34a;\"></i> Nenhuma parcela em atraso.</p>';
      } else {
        pCont.innerHTML = parcelas.map((p,i) =>
            '<div class="parcela-atraso-item">' +
            '<div><div class="pa-mes">'+p.mes+'</div><div class="pa-venc">Vencimento: '+formatDate(p.vencimento)+'</div></div>' +
            '<div class="pa-valor">'+formatMoney(p.valor)+'</div>' +
            '<button class="btn btn-primary btn-sm" onclick="abrirModalPagamento('+i+')"><i class=\"bi bi-credit-card\"></i> Pagar</button>' +
            '</div>'
        ).join("");
      }

      const msgs = (assoc.historico||[]).filter(c => c.msgAdmin).map(c =>
          '<div class="msg-admin-item"><div class="ma-header"><i class=\"bi bi-envelope-paper\"></i> Re: '+(c.mes||c.data)+' — '+c.status+'</div><div class="ma-texto">'+c.msgAdmin+'</div></div>');
      document.getElementById("mensagensAdmin").innerHTML = msgs.length
          ? msgs.join("")
          : '<p style="color:var(--text-muted);font-size:0.88rem;">Nenhuma mensagem do administrador.</p>';
    } catch (e) { showToast("Erro ao carregar financeiro.", "error"); }
  }

  window.abrirModalPagamento = async function(idx) {
    assoc = await getAssocAtual();
    parcelaPagarMes = assoc.parcelasAtraso[idx];
    document.getElementById("parcelaMesLabel").textContent = parcelaPagarMes.mes + " — " + formatMoney(parcelaPagarMes.valor);
    document.getElementById("obsPagamento").value = "";
    document.getElementById("arquivoParcela").value = "";
    document.getElementById("modalPagamento").classList.remove("hidden");
  };

  // Helper para converter arquivo em Base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Validador estrito de PDF (extensão e MIME type)
  function validarArquivoPdf(file) {
    if (!file) return { valido: false, erro: "Selecione o arquivo de comprovante." };
    const nome = file.name || "";
    const ext = nome.substring(nome.lastIndexOf(".")).toLowerCase();
    if (ext !== ".pdf") {
      return { valido: false, erro: "Apenas arquivos em formato PDF (.pdf) são permitidos como comprovante." };
    }
    if (file.type && file.type !== "application/pdf" && file.type !== "") {
      return { valido: false, erro: "Formato inválido. O arquivo selecionado deve ser um documento PDF." };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { valido: false, erro: "Arquivo muito grande. O limite máximo é de 10MB." };
    }
    return { valido: true };
  }

  document.getElementById("btnConfirmarPagamento").addEventListener("click", async () => {
    if (!parcelaPagarMes) return;
    const obs     = document.getElementById("obsPagamento").value.trim();
    const arquivo = document.getElementById("arquivoParcela").files[0];
    
    let base64Pdf = null;
    let nomeArquivo = "comprovante_parcela.pdf";

    if (arquivo) {
      const valid = validarArquivoPdf(arquivo);
      if (!valid.valido) {
        showToast(valid.erro, "error");
        return;
      }
      try {
        base64Pdf = await fileToBase64(arquivo);
        nomeArquivo = arquivo.name;
      } catch (_) {
        showToast("Erro ao processar o arquivo PDF.", "error");
        return;
      }
    }

    try {
      await adicionarContribuicao(assoc.id, {
        valor: parcelaPagarMes.valor,
        arquivo: nomeArquivo,
        arquivoBase64: base64Pdf,
        nomeArquivoOriginal: nomeArquivo,
        mes: parcelaPagarMes.mes,
        status: "Em análise",
        observacoes: obs || "Pagamento de parcela em atraso"
      });
      const updated = await getAssociatual();
      const novasParcelas = (updated.parcelasAtraso||[]).filter(p => p.mes !== parcelaPagarMes.mes);
      await atualizarAssociado(assoc.id, { parcelasAtraso: novasParcelas });
      assoc = await getAssocAtual();
      document.getElementById("modalPagamento").classList.add("hidden");
      renderFinanceiro(); renderStatusChip(); renderHistorico();
      showToast("Pagamento registrado com comprovante! Em análise pelo administrador.", "success");
      parcelaPagarMes = null;
    } catch (ex) { showToast("Erro ao registrar pagamento: " + ex.message, "error"); }
  });

  // helper typo fix
  async function getAssociatual() { return getAssocAtual(); }

  // ══════════════════════════════════════════════
  // ENVIO COMPROVANTE
  // ══════════════════════════════════════════════
  const fileDropZone = document.getElementById("fileDropZone");
  const arquivoComp  = document.getElementById("arquivoComp");
  const fdzSelected  = document.getElementById("fdz-selected");
  const btnRemoverArquivo = document.getElementById("btnRemoverArquivo");

  function clearSelectedFile() {
    arquivoComp.value = "";
    fdzSelected.classList.add("hidden");
    fdzSelected.textContent = "";
    btnRemoverArquivo?.classList.add("hidden");
  }

  fileDropZone.addEventListener("click", () => arquivoComp.click());
  fileDropZone.addEventListener("dragover", (e) => { e.preventDefault(); fileDropZone.classList.add("drag-over"); });
  fileDropZone.addEventListener("dragleave", () => fileDropZone.classList.remove("drag-over"));
  fileDropZone.addEventListener("drop", (e) => {
    e.preventDefault(); fileDropZone.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const valid = validarArquivoPdf(file);
      if (!valid.valido) {
        document.getElementById("envioErro").textContent = valid.erro;
        showToast(valid.erro, "error");
        clearSelectedFile();
        return;
      }
      arquivoComp.files = e.dataTransfer.files;
      showFileSelected(file.name);
    }
  });
  arquivoComp.addEventListener("change", () => {
    if (arquivoComp.files[0]) {
      const file = arquivoComp.files[0];
      const valid = validarArquivoPdf(file);
      if (!valid.valido) {
        document.getElementById("envioErro").textContent = valid.erro;
        showToast(valid.erro, "error");
        clearSelectedFile();
        return;
      }
      document.getElementById("envioErro").textContent = "";
      showFileSelected(file.name);
    } else {
      clearSelectedFile();
    }
  });
  btnRemoverArquivo?.addEventListener("click", clearSelectedFile);
  function showFileSelected(nome) {
    fdzSelected.innerHTML = '<i class="bi bi-file-earmark-pdf-fill" style="color:#ef4444;font-size:1.1rem;"></i> ' + escapeHtml(nome);
    fdzSelected.classList.remove("hidden");
    btnRemoverArquivo?.classList.remove("hidden");
  }

  document.getElementById("valorContrib").addEventListener("input", function() { maskMoeda(this); });

  document.getElementById("formComprovante").addEventListener("submit", async (e) => {
    e.preventDefault();
    const mes     = document.getElementById("mesRef").value;
    const valorRaw = document.getElementById("valorContrib").value.replace(/\D/g,"");
    const valor   = (parseInt(valorRaw||"0") / 100).toFixed(2);
    const arquivo = arquivoComp.files[0];
    const obs     = document.getElementById("obsContrib").value.trim();
    const erroEl  = document.getElementById("envioErro");
    erroEl.textContent = "";

    if (!mes || !valorRaw || !arquivo) {
      erroEl.textContent = "Preencha todos os campos obrigatórios e anexe o comprovante em PDF.";
      return;
    }

    const validacao = validarArquivoPdf(arquivo);
    if (!validacao.valido) {
      erroEl.textContent = validacao.erro;
      showToast(validacao.erro, "error");
      return;
    }

    if (parseFloat(valor) <= 0) {
      erroEl.textContent = "O valor deve ser maior que zero.";
      return;
    }

    const [ano, mesNum] = mes.split("-");
    const nomeMes = new Date(parseInt(ano), parseInt(mesNum)-1).toLocaleString("pt-BR", { month:"long", year:"numeric" });
    
    // Feedback de carregamento no botão
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const txtOriginal = btnSubmit ? btnSubmit.innerHTML : "";
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Enviando PDF com segurança...';
    }

    try {
      const base64Pdf = await fileToBase64(arquivo);

      await adicionarContribuicao(assoc.id, {
        valor,
        arquivo: arquivo.name,
        arquivoBase64: base64Pdf,
        nomeArquivoOriginal: arquivo.name,
        mes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
        status: "Em análise",
        observacoes: obs
      });

      assoc = await getAssocAtual();
      setSessao({ ...assoc, perfil: "associado" });
      document.getElementById("formComprovante").classList.add("hidden");
      document.getElementById("enviofeedback").classList.remove("hidden");
      renderStatusChip();
      renderHistorico();
      showToast("Comprovante em PDF enviado com sucesso!", "success");
    } catch (ex) {
      erroEl.textContent = ex.message || "Erro ao enviar comprovante.";
      showToast(ex.message || "Erro ao enviar comprovante.", "error");
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = txtOriginal;
      }
    }
  });

  document.getElementById("btnEnviarOutro")?.addEventListener("click", () => {
    document.getElementById("formComprovante").reset();
    clearSelectedFile();
    document.getElementById("formComprovante").classList.remove("hidden");
    document.getElementById("enviofeedback").classList.add("hidden");
  });

  // ══════════════════════════════════════════════
  // HISTÓRICO
  // ══════════════════════════════════════════════
  async function renderHistorico() {
    try {
      assoc = await getAssocAtual();
      const tbody = document.getElementById("tbodyHistorico");
      const hist  = (assoc.historico||[]).slice().reverse();
      if (hist.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="es-icon"><i class="bi bi-clock-history" style="font-size:1.6rem;"></i></div>Nenhuma contribuição registrada ainda.</div></td></tr>'; return;
      }
      const map = { "Regular":"badge-regular","Inadimplente":"badge-inadim","Em análise":"badge-analise","Revisão solicitada":"badge-revisao","Pendente":"badge-pendente","Aprovado":"badge-aprovado","Recusado":"badge-recusado" };
      tbody.innerHTML = hist.map(c => {
        const fileUrl = c.comprovanteUrl || (`/api/comprovantes/${encodeURIComponent(c.arquivo || c.id)}?associado=${encodeURIComponent(assoc.nome || '')}&mes=${encodeURIComponent(c.mes || '')}&valor=${encodeURIComponent(c.valor || '')}`);
        const displayFile = c.nomeArquivoOriginal || c.arquivo || "comprovante.pdf";
        const btnPdf = '<button type="button" class="btn-ver-comprovante" onclick="abrirModalPdf(\'' + encodeURIComponent(fileUrl) + '\', \'' + encodeURIComponent(displayFile) + '\', \'' + encodeURIComponent(c.mes) + '\')">' +
          '<i class="bi bi-file-earmark-pdf-fill"></i> Ver PDF' +
          '</button>';
        return '<tr>' +
          '<td><strong>'+(c.mes||c.data)+'</strong><br><small style="color:var(--text-muted);">'+(c.data||'—')+'</small></td>' +
          '<td><strong>'+formatMoney(c.valor)+'</strong></td>' +
          '<td>'+btnPdf+'</td>' +
          '<td style="font-size:0.82rem;color:var(--text-muted);">'+(c.observacoes||'—')+'</td>' +
          '<td><span class="badge '+(map[c.status]||"badge-pendente")+'">'+c.status+'</span></td>' +
          '<td style="font-size:0.85rem;color:var(--text-secondary);">'+(c.msgAdmin||"—")+'</td>' +
          '</tr>';
      }).join("");
    } catch (e) { showToast("Erro ao carregar histórico.", "error"); }
  }

  // Visualizador de PDF do Associado
  window.abrirModalPdf = function(encodedUrl, encodedNome, encodedMes) {
    const url = decodeURIComponent(encodedUrl || '');
    const nome = decodeURIComponent(encodedNome || 'comprovante.pdf');
    const mes = decodeURIComponent(encodedMes || '');

    const modal = document.getElementById("modalVerPdf");
    const lblNome = document.getElementById("pdfModalNome");
    const lblSub = document.getElementById("pdfModalSubtitulo");
    const btnBaixar = document.getElementById("btnBaixarPdfModal");
    const btnAba = document.getElementById("btnAbrirNovaAbaModal");

    if (lblNome) lblNome.textContent = nome;
    if (lblSub) lblSub.textContent = mes ? `Referência: ${mes}` : "";
    if (btnBaixar) {
      btnBaixar.href = url;
      btnBaixar.setAttribute('download', nome.endsWith('.pdf') ? nome : nome + '.pdf');
    }
    if (btnAba) {
      btnAba.href = url;
    }

    if (modal) modal.classList.remove("hidden");

    if (window.initComprovanteViewers) window.initComprovanteViewers();
    if (window.comprovanteViewerUser) {
      window.comprovanteViewerUser.carregar(url, nome);
    }
  };

  window.fecharModalPdf = function() {
    const modal = document.getElementById("modalVerPdf");
    if (window.comprovanteViewerUser) {
      window.comprovanteViewerUser.limpar();
    }
    if (modal) modal.classList.add("hidden");
  };

  // ══════════════════════════════════════════════
  // CARTEIRINHA DIGITAL
  // ══════════════════════════════════════════════
  async function renderCarteirinha() {
    assoc = await getAssocAtual();
    const nomeEl = document.getElementById("cartNome");
    if (nomeEl) nomeEl.textContent = (assoc.nome || "Associado AMAS").toUpperCase();
    const matEl = document.getElementById("cartMatricula");
    if (matEl) matEl.textContent = assoc.matricula || "S/N";
    const profEl = document.getElementById("cartProfissao");
    if (profEl) profEl.textContent = assoc.profissao || "Não informada";
    const entEl = document.getElementById("cartEntrada");
    if (entEl) entEl.textContent = formatDate(assoc.dataEntrada) || "—";
    const cpfEl = document.getElementById("cartCpf");
    if (cpfEl) {
      if (assoc.cpf) {
        const c = String(assoc.cpf).replace(/\D/g, "");
        cpfEl.textContent = c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4") : assoc.cpf;
      } else {
        cpfEl.textContent = "—";
      }
    }
    const cartFoto = document.getElementById("cartFoto");
    if (cartFoto) {
      if (assoc.foto) {
        cartFoto.innerHTML = '<img src="'+assoc.foto+'" alt="Foto Associado" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">';
      } else {
        cartFoto.innerHTML = '<span><i class="bi bi-person-fill" style="font-size:2.8rem;color:rgba(207,148,29,0.75);"></i></span>';
      }
    }
    const statusBadge = document.getElementById("cartStatusBadge");
    if (statusBadge) {
      const isReg = assoc.status === "Regular";
      statusBadge.innerHTML = isReg ? '<i class="bi bi-shield-fill-check"></i> ADIMPLENTE' : '<i class="bi bi-exclamation-triangle-fill"></i> ' + (assoc.status || "PENDENTE").toUpperCase();
      statusBadge.style.background = isReg ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)";
      statusBadge.style.color      = isReg ? "#4ade80" : "#f87171";
      statusBadge.style.border     = isReg ? "1px solid rgba(34,197,94,0.45)" : "1px solid rgba(239,68,68,0.45)";
    }
  }

  // ── Render inicial
  await renderPerfil();
  registrarLog("Login realizado", assoc.nome, "associado", "Acesso ao painel do associado");
});

/* ── MÓDULO EVENTOS — v5 async ─────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {

  const EV_TIPO_ICON  = { social:'<i class="bi bi-heart"></i>', capacitacao:'<i class="bi bi-book"></i>', parceria:'<i class="bi bi-handshake"></i>', cultural:'<i class="bi bi-stars"></i>', reuniao:'<i class="bi bi-people"></i>' };
  const EV_TIPO_LABEL = { social:"Ação Social", capacitacao:"Capacitação", parceria:"Parceria", cultural:"Cultural", reuniao:"Assembleia" };

  let filtroTipoAtivo = "";
  let filtroBusca     = "";
  let evTabAtiva      = "disponiveis";
  let _eventosCache   = [];

  function initEvTabs() {
    document.querySelectorAll(".ev-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        evTabAtiva = btn.dataset.evTab;
        document.querySelectorAll(".ev-tab").forEach(b => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        document.getElementById("evPainelDisponiveis").classList.toggle("hidden", evTabAtiva !== "disponiveis");
        document.getElementById("evPainelInscritos").classList.toggle("hidden", evTabAtiva !== "inscritos");
        if (evTabAtiva === "inscritos") renderMinhasInscricoes();
        else renderEventosAssoc();
      });
    });
  }

  function initFiltros() {
    document.querySelectorAll(".ev-filtro-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        filtroTipoAtivo = btn.dataset.tipo;
        document.querySelectorAll(".ev-filtro-btn").forEach(b => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        renderEventosAssoc();
      });
    });
    const busca = document.getElementById("evBusca");
    let debounce;
    busca?.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { filtroBusca = busca.value.trim().toLowerCase(); renderEventosAssoc(); }, 220);
    });
  }

  async function atualizarCountInscritos() {
    const sessao = getSessao();
    if (!sessao) return;
    try {
      const meus = await getEventosDoAssociado(sessao.id);
      const el  = document.getElementById("countInscritos");
      if (!el) return;
      if (meus.length > 0) { el.textContent = meus.length; el.classList.remove("hidden"); }
      else el.classList.add("hidden");
    } catch (_) {}
  }

  async function renderEventosAssoc() {
    const sessao = getSessao();
    if (!sessao) return;
    const el = document.getElementById("listaEventosAssoc");
    if (el) el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);"><i class="bi bi-hourglass-split"></i> Carregando eventos...</div>';
    try {
      _eventosCache = await getEventos();
      let lista = _eventosCache.filter(ev => (ev.status||"Aberto") !== "Encerrado")
          .sort((a,b) => new Date(a.data) - new Date(b.data));
      if (filtroTipoAtivo) lista = lista.filter(ev => ev.tipo === filtroTipoAtivo);
      if (filtroBusca) lista = lista.filter(ev =>
          ev.titulo.toLowerCase().includes(filtroBusca) ||
          (ev.descricao||"").toLowerCase().includes(filtroBusca) ||
          (ev.local||"").toLowerCase().includes(filtroBusca)
      );
      if (!el) return;
      if (!lista.length) {
        el.innerHTML = '<div class="ev-empty"><div class="ev-empty-icon"><i class="bi bi-calendar-event" style="font-size:1.6rem;"></i></div><div class="ev-empty-txt">'+(filtroBusca||filtroTipoAtivo?"Nenhum evento encontrado.":"Nenhum evento disponível.")+'</div></div>';
        atualizarCountInscritos(); return;
      }
      el.innerHTML = lista.map(ev => buildEventoCard(ev, sessao.id)).join("");
      atualizarCountInscritos();
    } catch (e) { if (el) el.innerHTML = '<div class="ev-empty">Erro ao carregar eventos.</div>'; }
  }

  function buildEventoCard(ev, assocId) {
    const estado    = statusInscricao(ev, assocId);
    const vagas     = ev.vagasTotais || ev.vagas || 0;
    const inscritos = (ev.inscritos  || []).length;
    const espera    = (ev.listaEspera|| []).length;
    const vagasDisp = vagas > 0 ? Math.max(0, vagas - inscritos) : null;
    const pct       = vagas > 0 ? Math.min(100, Math.round((inscritos/vagas)*100)) : 0;
    const barColor  = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e";
    const [y,m,d]   = (ev.data||"").split("-");
    const meses     = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
    const mesNome   = meses[parseInt(m||1)-1]||"";
    const evStatus  = ev.status||"Aberto";
    const stBadge   = evStatus==="Aberto"?'<span class="badge-ev-status aberto">Aberto</span>':evStatus==="Em Breve"?'<span class="badge-ev-status embreve">Em Breve</span>':'<span class="badge-ev-status encerrado">Encerrado</span>';
    let inscBadge = "";
    if (estado==="inscrito") inscBadge='<span class="ev-inscricao-badge inscrito"><i class=\"bi bi-check-circle-fill\"></i> Inscrito</span>';
    else if (estado==="espera") inscBadge='<span class="ev-inscricao-badge espera">⏳ Na fila</span>';
    else if (estado==="vaga_disponivel") inscBadge='<span class="ev-inscricao-badge vaga-disp"><i class=\"bi bi-stars\"></i> Vaga!</span>';
    let btnHtml = "";
    if (estado==="inscrito") btnHtml='<button class="ev-card-btn btn-cancelar" onclick="assocCancelarInscricao('+ev.id+')">Cancelar inscrição</button>';
    else if (estado==="vaga_disponivel") btnHtml='<button class="ev-card-btn btn-vaga-disp" onclick="assocConfirmarVaga('+ev.id+')"><i class=\"bi bi-stars\"></i> Confirmar vaga!</button>';
    else if (estado==="espera") { const pos=(ev.listaEspera||[]).findIndex(i=>i.id===assocId)+1; btnHtml='<button class="ev-card-btn btn-espera" onclick="assocCancelarInscricao('+ev.id+')">⏳ Fila #'+pos+' · Sair</button>'; }
    else if (estado==="livre") btnHtml='<button class="ev-card-btn btn-inscrever" onclick="assocInscrever('+ev.id+')"><i class=\"bi bi-check-circle-fill\"></i> Inscrever-se</button>';
    else if (estado==="lotado") btnHtml='<button class="ev-card-btn btn-espera-entrar" onclick="assocInscrever('+ev.id+')">Lista de espera</button>';
    else btnHtml='<button class="ev-card-btn btn-desabilitado" disabled>Em breve</button>';
    let bannerHtml = "";
    if (ev.banner) {
      bannerHtml = '<div class="ev-card-banner"><img src="' + ev.banner + '" alt="' + (ev.titulo || 'Banner') + '" loading="lazy" onerror="this.parentElement.style.display=\'none\';"></div>';
    }
    return (
        '<div class="ev-card ev-card-estado-'+estado+'" id="evCard-'+ev.id+'">' +
        bannerHtml +
        '<div class="ev-card-top">' +
        '<div class="ev-card-data"><div class="evd-dia">'+(d||"—")+'</div><div class="evd-mes">'+mesNome+'</div><div class="evd-ano">'+(y||"")+'</div></div>' +
        '<div class="ev-card-main">' +
        '<div class="ev-card-badges"><span class="ev-tipo-pill '+ev.tipo+'">'+(EV_TIPO_ICON[ev.tipo]||'<i class="bi bi-calendar-event"></i>')+' '+(EV_TIPO_LABEL[ev.tipo]||ev.tipo)+'</span>'+stBadge+inscBadge+'</div>' +
        '<div class="ev-card-titulo">'+ev.titulo+'</div>' +
        '<div class="ev-card-local"><i class=\"bi bi-geo-alt\"></i> '+(ev.local||"—")+' · <i class=\"bi bi-clock\"></i> '+(ev.horario||"—")+'</div>' +
        '</div>' +
        '</div>' +
        '<div class="ev-card-desc">'+(ev.descricao||"")+'</div>' +
        '<div class="ev-card-footer">' +
        (vagas>0?'<div class="ev-card-vagas"><div class="ev-vagas-track"><div class="ev-vagas-fill" style="width:'+pct+'%;background:'+barColor+';"></div></div><span class="ev-vagas-txt">'+inscritos+'/'+vagas+(vagasDisp!==null&&vagasDisp>0?' · <strong style="color:'+barColor+';">'+vagasDisp+' restante'+(vagasDisp!==1?'s':'')+'</strong>':'')+(vagasDisp===0?' · <strong style="color:#ef4444;">Lotado</strong>':'')+(espera>0?' · <em>'+espera+' na espera</em>':'')+'</span></div>':'') +
        '<div class="ev-card-acoes"><button class="ev-card-btn-detalhes" onclick="verDetalheEvento('+ev.id+')">ℹ️ Ver detalhes</button>'+btnHtml+'</div>' +
        '</div></div>'
    );
  }

  window.verDetalheEvento = function(eventoId) {
    const ev     = _eventosCache.find(e => e.id === eventoId);
    const sessao = getSessao();
    if (!ev || !sessao) return;
    const estado = statusInscricao(ev, sessao.id);
    const vagas  = ev.vagasTotais||ev.vagas||0;
    const inscritos = (ev.inscritos||[]).length;
    const espera = (ev.listaEspera||[]).length;
    const vagasDisp = vagas>0?Math.max(0,vagas-inscritos):null;
    const pct = vagas>0?Math.min(100,Math.round((inscritos/vagas)*100)):0;
    const barColor = pct>=90?"#ef4444":pct>=70?"#f59e0b":"#22c55e";
    const evStatus = ev.status||"Aberto";
    document.getElementById("medTipoRow").innerHTML =
        '<span class="ev-tipo-pill '+ev.tipo+'">'+(EV_TIPO_ICON[ev.tipo]||'<i class="bi bi-calendar-event"></i>')+" "+(EV_TIPO_LABEL[ev.tipo]||ev.tipo)+'</span>' +
        (evStatus==="Aberto"?'<span class="badge-ev-status aberto" style="margin-left:8px;">Inscrições abertas</span>':"") +
        (evStatus==="Em Breve"?'<span class="badge-ev-status embreve" style="margin-left:8px;">Em Breve</span>':"") +
        (evStatus==="Encerrado"?'<span class="badge-ev-status encerrado" style="margin-left:8px;">Encerrado</span>':"");
    document.getElementById("medTitulo").textContent = ev.titulo;
    const medBanner = document.getElementById("medBanner");
    const medBannerImg = document.getElementById("medBannerImg");
    if (medBanner && medBannerImg) {
      if (ev.banner) {
        medBannerImg.src = ev.banner;
        medBanner.style.display = "block";
      } else {
        medBannerImg.src = "";
        medBanner.style.display = "none";
      }
    }
    const [y,m,d]=(ev.data||"").split("-");
    const mesesFull=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    document.getElementById("medInfoGrid").innerHTML =
        medInfoRow('<i class="bi bi-calendar3"></i>',"Data",d+" de "+(mesesFull[parseInt(m||1)-1]||"")+" de "+y) +
        medInfoRow('<i class="bi bi-clock"></i>',"Horário",ev.horario||"A confirmar") +
        medInfoRow('<i class="bi bi-geo-alt"></i>',"Local",ev.local||"A definir") +
        (vagas>0?medInfoRow('<i class="bi bi-ticket-perforated"></i>',"Vagas",vagas+" no total"):"") +
        (ev.destaque?medInfoRow("⭐","Destaque","Evento em destaque AMAS"):"");
    document.getElementById("medDescricao").innerHTML = '<h4 class="med-section-title">Sobre o evento</h4><p class="med-descricao-txt">'+(ev.descricao||"Sem descrição disponível.")+'</p>';
    if (vagas>0) {
      document.getElementById("medVagasBlock").innerHTML='<h4 class="med-section-title">Ocupação de vagas</h4><div class="med-vagas-bar-wrap"><div class="med-vagas-bar"><div class="med-vagas-fill" style="width:'+pct+'%;background:'+barColor+';"></div></div><div class="med-vagas-info"><span>'+inscritos+' confirmados</span>'+(espera>0?'<span style="color:#f59e0b;">'+espera+' na fila de espera</span>':'')+'<span style="color:'+barColor+';font-weight:700;">'+(vagasDisp===0?' Lotado':vagasDisp+' vaga'+(vagasDisp!==1?'s':'')+' disponível')+'</span></div></div>';
    } else { document.getElementById("medVagasBlock").innerHTML=""; }
    let acaoHtml="";
    if (evStatus==="Encerrado") acaoHtml='<div class="med-acao-block encerrado">As inscrições estão encerradas.</div>';
    else if (evStatus==="Em Breve") acaoHtml='<div class="med-acao-block embreve">As inscrições ainda não estão abertas.</div>';
    else if (estado==="inscrito") acaoHtml='<div class="med-acao-confirmado"><div class="mac-icon"></div><div><strong>Você está inscrito!</strong><br><span>Sua vaga está confirmada.</span></div></div><button class="btn btn-outline btn-sm" style="margin-top:12px;width:100%;justify-content:center;color:#dc2626;border-color:rgba(239,68,68,0.3);" onclick="assocCancelarInscricaoModal('+ev.id+')">Cancelar minha inscrição</button>';
    else if (estado==="vaga_disponivel") acaoHtml='<div class="med-acao-vaga"><div class="mav-icon"></div><div><strong>Vaga disponível!</strong></div></div><button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:12px;" onclick="assocConfirmarVagaModal('+ev.id+')">Confirmar minha vaga</button>';
    else if (estado==="espera") { const pos=(ev.listaEspera||[]).findIndex(i=>i.id===sessao.id)+1; acaoHtml='<div class="med-acao-espera">⏳ <strong>Fila de espera — posição #'+pos+'</strong></div><button class="btn btn-outline btn-sm" style="margin-top:12px;width:100%;justify-content:center;" onclick="assocCancelarInscricaoModal('+ev.id+')">Sair da fila</button>'; }
    else if (estado==="livre") acaoHtml='<button class="btn btn-primary" style="width:100%;justify-content:center;padding:14px;font-size:1rem;" onclick="assocInscreverModal('+ev.id+')">Garantir minha vaga</button>';
    else if (estado==="lotado") acaoHtml='<div class="med-acao-espera">Todas as vagas estão preenchidas.</div><button class="btn" style="width:100%;justify-content:center;padding:14px;background:#f59e0b;color:#fff;margin-top:8px;" onclick="assocInscreverModal('+ev.id+')">Entrar na lista de espera</button>';
    document.getElementById("medAcao").innerHTML=acaoHtml;
    document.getElementById("modalDetalheEvento").classList.remove("hidden");
  };

  function medInfoRow(icon,label,value){return'<div class="med-info-row"><span class="mir-icon">'+icon+'</span><div><div class="mir-label">'+label+'</div><div class="mir-value">'+value+'</div></div></div>';}

  window.assocInscreverModal     = function(id){document.getElementById("modalDetalheEvento").classList.add("hidden");assocInscrever(id);};
  window.assocCancelarInscricaoModal = function(id){document.getElementById("modalDetalheEvento").classList.add("hidden");assocCancelarInscricao(id);};
  window.assocConfirmarVagaModal = function(id){document.getElementById("modalDetalheEvento").classList.add("hidden");assocConfirmarVaga(id);};
  document.getElementById("modalDetalheEvento")?.addEventListener("click",function(e){if(e.target===this)this.classList.add("hidden");});

  async function renderMinhasInscricoes() {
    const sessao=getSessao(); if(!sessao)return;
    const el=document.getElementById("minhasInscricoes"); if(!el)return;
    el.innerHTML='<div style="padding:24px;text-align:center;color:var(--text-muted);"><i class="bi bi-hourglass-split"></i> Carregando...</div>';
    try {
      const meus=await getEventosDoAssociado(sessao.id);
      if(!meus.length){el.innerHTML='<div class="ev-empty"><div class="ev-empty-icon"></div><div class="ev-empty-txt">Você ainda não tem inscrições.</div><button class="btn btn-outline btn-sm" style="margin-top:14px;" onclick="irParaDisponiveis()">Ver eventos disponíveis</button></div>';return;}
      const ordem={vaga_disponivel:0,inscrito:1,espera:2};
      meus.sort((a,b)=>(ordem[a._estadoInscricao]||9)-(ordem[b._estadoInscricao]||9));
      el.innerHTML=meus.map(ev=>buildMineCard(ev,sessao.id)).join("");
    } catch(_){el.innerHTML='<div class="ev-empty">Erro ao carregar inscrições.</div>';}
  }

  function buildMineCard(ev,assocId){
    const estado=ev._estadoInscricao;
    const [y,m,d]=(ev.data||"").split("-");
    const mesesA=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
    const stCfg={inscrito:{cls:"mine-ok",icon:"",txt:"Inscrição Confirmada"},vaga_disponivel:{cls:"mine-vaga",icon:"",txt:"Vaga Disponível!"},espera:{cls:"mine-espera",icon:"⏳",txt:"Na fila de espera"}}[estado]||{cls:"",icon:"",txt:"—"};
    const pos=estado==="espera"?(ev.listaEspera||[]).findIndex(i=>i.id===assocId)+1:null;
    let acaoBtns="";
    if(estado==="vaga_disponivel")acaoBtns='<button class="btn btn-primary btn-sm" onclick="assocConfirmarVagaModal('+ev.id+')">Confirmar vaga</button>';
    else if(estado==="inscrito")acaoBtns='<button class="btn btn-outline btn-sm" style="color:#dc2626;border-color:rgba(239,68,68,0.3);" onclick="assocCancelarInscricaoModal('+ev.id+')">Cancelar</button>';
    else acaoBtns='<button class="btn btn-outline btn-sm" onclick="assocCancelarInscricaoModal('+ev.id+')">Sair da fila</button>';
    return'<div class="mine-card-v2 '+stCfg.cls+'"><div class="mc2-status-bar"><span class="mc2-status-icon">'+stCfg.icon+'</span><span class="mc2-status-txt">'+stCfg.txt+(pos?" — posição #"+pos:"")+'</span>'+(estado==="vaga_disponivel"?'<span class="mc2-urgente">Aja agora!</span>':"")+'</div><div class="mc2-body"><div class="mc2-data"><div class="mc2-dia">'+(d||"—")+'</div><div class="mc2-mes">'+(mesesA[parseInt(m||1)-1]||"")+'</div></div><div class="mc2-info"><div class="mc2-tipo">'+(EV_TIPO_ICON[ev.tipo]||'<i class="bi bi-calendar-event"></i>')+' '+(EV_TIPO_LABEL[ev.tipo]||ev.tipo)+'</div><div class="mc2-titulo">'+ev.titulo+'</div><div class="mc2-meta">'+( ev.horario||"—")+' · '+(ev.local||"—")+'</div></div></div><div class="mc2-footer"><button class="btn btn-outline btn-sm" onclick="verDetalheEvento('+ev.id+')">ℹ️ Detalhes</button>'+acaoBtns+'</div></div>';
  }

  window.irParaDisponiveis=function(){const t=document.querySelector('.ev-tab[data-ev-tab="disponiveis"]');if(t)t.click();};

  window.assocInscrever = async function(eventoId) {
    const sessao=getSessao(); if(!sessao)return;
    try {
      const res=await inscreverNoEvento(eventoId,sessao);
      if(!res.ok){const msgs={encerrado:"Este evento está com inscrições encerradas.",em_breve:"As inscrições ainda não estão abertas.",ja_inscrito:"Você já está inscrito ou na fila deste evento."};showToast(msgs[res.acao]||"Não foi possível realizar a inscrição.","error");return;}
      showToast(res.acao==="inscrito"?'<i class=\"bi bi-stars\"></i> Inscrição confirmada! Até lá!':"⏳ Você entrou na lista de espera — posição "+res.posicao+".","success");
      _eventosCache = await getEventos();
      renderEventosAssoc();
      if(evTabAtiva==="inscritos")renderMinhasInscricoes();
      atualizarCountInscritos();
    } catch(e){showToast("Erro: "+e.message,"error");}
  };

  window.assocCancelarInscricao = async function(eventoId) {
    if(!confirm("Deseja cancelar sua inscrição neste evento?"))return;
    const sessao=getSessao(); if(!sessao)return;
    try {
      const res=await cancelarInscricao(eventoId,sessao.id);
      if(!res.ok){showToast("Não foi possível cancelar.","error");return;}
      showToast(res.promovido?"Inscrição cancelada. A próxima pessoa da fila foi notificada.":"Inscrição cancelada com sucesso.","info");
      _eventosCache = await getEventos();
      renderEventosAssoc();
      if(evTabAtiva==="inscritos")renderMinhasInscricoes();
      atualizarCountInscritos();
    } catch(e){showToast("Erro: "+e.message,"error");}
  };

  window.assocConfirmarVaga = async function(eventoId) {
    const sessao=getSessao(); if(!sessao)return;
    try {
      const ok=await confirmarVagaDisponivel(eventoId,sessao.id);
      showToast(ok?'<i class=\"bi bi-stars\"></i> Vaga confirmada! Você está inscrito.':"A vaga já não está disponível.","success");
      _eventosCache = await getEventos();
      renderEventosAssoc();
      if(evTabAtiva==="inscritos")renderMinhasInscricoes();
      atualizarCountInscritos();
    } catch(e){showToast("Erro: "+e.message,"error");}
  };

  initEvTabs();
  initFiltros();
});

/* ── CATÁLOGO DE EMPRESAS PARCEIRAS ─────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  function normalizeEmpresario(emp) {
    const contrato = typeof emp.contrato === "string"
      ? (() => { try { return JSON.parse(emp.contrato); } catch (_) { return {}; } })()
      : (emp.contrato || {});
    const unidades = typeof emp.unidades === "string"
      ? (() => { try { return JSON.parse(emp.unidades); } catch (_) { return []; } })()
      : (Array.isArray(emp.unidades) ? emp.unidades : []);
    return { ...emp, contrato, unidades };
  }

  function contratoValidado(contrato) {
    return contrato?.beneficiosValidados === true || contrato?.beneficiosValidados === "true";
  }

  async function renderCatalogoParceiros() {
    const el=document.getElementById("catalogoParceiros"); if(!el)return;
    el.innerHTML='<div style="padding:24px;text-align:center;color:var(--text-muted);"><i class="bi bi-hourglass-split"></i> Carregando parceiros...</div>';
    try {
      const todas=(await getEmpresarios())
        .map(normalizeEmpresario)
        .filter(emp=>{const c=emp.contrato||{};return c.beneficioOfertado&&contratoValidado(c);});
      const busca=document.getElementById("buscaParceiros")?.value?.trim().toLowerCase()||"";
      const lista=busca?todas.filter(emp=>emp.nome.toLowerCase().includes(busca)||(emp.contrato?.beneficioOfertado||"").toLowerCase().includes(busca)):todas;
      if(!lista.length){el.innerHTML='<div style="text-align:center;padding:48px 24px;color:var(--text-muted);"><div style="font-size:2.5rem;margin-bottom:12px;"></div>'+(busca?'Nenhuma empresa encontrada para "'+busca+'".':"Nenhuma empresa parceira disponível no momento.")+'</div>';return;}
      el.innerHTML='<div class="parceiros-grid">'+lista.map(emp=>{
        const c=emp.contrato||{};
        const unids=(emp.unidades||[]).length;
        const vig=c.dataVigencia?new Date(c.dataVigencia+"T00:00:00").toLocaleDateString("pt-BR"):null;
        return'<div class="parceiro-card"><div class="pc-header"><div class="pc-icon"></div><div class="pc-info"><div class="pc-nome">'+emp.nome+'</div><div class="pc-tipo">'+(c.tipoAcordo||"Empresa Parceira")+'</div></div></div><div class="pc-beneficio"><div class="pc-benef-label">Desconto / Benefício</div><div class="pc-benef-valor">'+c.beneficioOfertado+'</div></div>'+(c.regrasUtilizacao?'<div class="pc-regras">'+c.regrasUtilizacao+'</div>':'')+(c.descricaoBeneficios?'<div class="pc-desc">'+c.descricaoBeneficios+'</div>':'')+'<div class="pc-footer">'+(unids>0?'<span class="pc-meta"><i class=\"bi bi-geo-alt\"></i> '+unids+' unidade'+(unids!==1?'s':'')+'</span>':'')+(emp.telefone?'<span class="pc-meta">'+emp.telefone+'</span>':'')+(vig?'<span class="pc-meta">⏰ Válido até '+vig+'</span>':'')+'</div>'+(unids>0?'<button class="pc-btn-mapa" onclick="verUnidadesParceiro('+emp.id+')"><i class=\"bi bi-geo-alt\"></i> Ver localização</button>':'')+'</div>';
      }).join("")+'</div><p style="font-size:0.75rem;color:var(--text-muted);margin-top:16px;text-align:center;">'+lista.length+' empresa'+(lista.length!==1?'s':'')+' parceira'+(lista.length!==1?'s':'')+' disponíve'+(lista.length!==1?'is':'l')+'</p>';
    } catch(e){el.innerHTML='<div style="padding:24px;text-align:center;color:var(--text-muted);">Erro ao carregar parceiros.</div>';}
  }

  window.renderCatalogoParceiros=renderCatalogoParceiros;
  let debounce;
  document.getElementById("buscaParceiros")?.addEventListener("input",()=>{clearTimeout(debounce);debounce=setTimeout(renderCatalogoParceiros,250);});
  window.verUnidadesParceiro=function(empId){
    getEmpresarios().then(emps=>{
      const emp=emps.map(normalizeEmpresario).find(e=>e.id===empId);
      if(!emp||(emp.unidades||[]).length===0)return;
      window.open("https://maps.google.com/maps?q="+encodeURIComponent(emp.unidades[0].endereco),"_blank");
    });
  };
});
