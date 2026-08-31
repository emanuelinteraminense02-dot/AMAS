/* ─── EMPRESARIO.JS v5 (async/await) ──────────────────────────── */

document.addEventListener("DOMContentLoaded", async () => {

  const sessao = getSessao();
  if (!sessao || sessao.perfil !== "empresario") { window.location.href = "login.html"; return; }

  async function getEmpAtual() {
    try { return await getEmpresarioPorId(sessao.id); } catch (_) { return sessao; }
  }
  let emp = await getEmpAtual();

  function getSidebarAvatar() {
    return document.getElementById("empSidebarAvatar") ||
           document.querySelector(".sidebar-avatar-wrap .sidebar-avatar") ||
           document.querySelector(".sidebar .sidebar-avatar") ||
           document.querySelector(".sidebar-avatar");
  }

  let inputLogoGlobal = null;
  function getInputLogo() {
    if (inputLogoGlobal && document.body.contains(inputLogoGlobal)) {
      return inputLogoGlobal;
    }
    let inp = document.getElementById("inputLogoEmpresa");
    if (!inp) {
      inp = document.createElement("input");
      inp.type = "file";
      inp.id = "inputLogoEmpresa";
      inp.accept = "image/*";
      inp.style.display = "none";
      document.body.appendChild(inp);
    }
    inp.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) processarArquivoLogo(file);
    };
    inputLogoGlobal = inp;
    return inp;
  }

  function abrirSeletorLogo() {
    const inp = getInputLogo();
    if (inp) {
      inp.value = "";
      inp.click();
    }
  }

  // ── Atualização da sidebar e da logo da empresa
  async function updateSidebarInfo() {
    emp = await getEmpAtual();
    const nomeEl = document.getElementById("empNome");
    const cnpjEl = document.getElementById("empCnpj");
    const avatarEl = getSidebarAvatar();

    if (nomeEl) nomeEl.textContent = emp.nome || "Empresário";
    if (cnpjEl) cnpjEl.textContent = emp.cnpj || "—";

    const sess = getSessao() || {};
    const logo = emp.logo || emp.foto || sess.logo || sess.foto;
    if (avatarEl) {
      avatarEl.classList.add("emp-avatar-clickable");
      avatarEl.style.cursor = "pointer";
      avatarEl.title = "Clique para alterar a logo da empresa";
      if (!avatarEl.id) avatarEl.id = "empSidebarAvatar";

      if (logo) {
        avatarEl.innerHTML = '<img src="' + logo + '" alt="' + (emp.nome || 'Logo da Empresa') + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">' +
                             '<span class="avatar-hover-overlay" title="Clique para alterar a logo"><i class="bi bi-camera-fill"></i></span>';
      } else {
        avatarEl.innerHTML = '<i class="bi bi-building" style="font-size:1.6rem;color:#fff;"></i>' +
                             '<span class="avatar-hover-overlay" title="Clique para adicionar a logo da empresa"><i class="bi bi-camera-fill"></i></span>';
      }
    }
    renderLogoPreview();
    setupAvatarListeners();
  }

  function renderLogoPreview() {
    const sess = getSessao() || {};
    const logo = emp.logo || emp.foto || sess.logo || sess.foto;
    const preview = document.getElementById("empLogoImgPreview");
    const placeholder = document.getElementById("empLogoPlaceholder");
    const btnRemover = document.getElementById("btnRemoverLogo");

    if (preview && placeholder) {
      if (logo) {
        preview.src = logo;
        preview.style.display = "block";
        placeholder.style.display = "none";
        if (btnRemover) btnRemover.style.display = "inline-flex";
      } else {
        preview.src = "";
        preview.style.display = "none";
        placeholder.style.display = "block";
        if (btnRemover) btnRemover.style.display = "none";
      }
    }
  }

  function setupAvatarListeners() {
    const avatarEl = getSidebarAvatar();
    if (avatarEl && !avatarEl.dataset.avatarListenerAttached) {
      avatarEl.dataset.avatarListenerAttached = "true";
      avatarEl.classList.add("emp-avatar-clickable");
      avatarEl.style.cursor = "pointer";
      avatarEl.setAttribute("tabindex", "0");
      avatarEl.setAttribute("role", "button");
      avatarEl.setAttribute("aria-label", "Alterar logo da empresa");

      avatarEl.addEventListener("click", (e) => {
        e.preventDefault();
        abrirSeletorLogo();
      });
      avatarEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirSeletorLogo();
        }
      });

      // Suporte a Drag and Drop no avatar da sidebar
      avatarEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        avatarEl.classList.add("avatar-dragover");
      });
      avatarEl.addEventListener("dragleave", (e) => {
        e.preventDefault();
        avatarEl.classList.remove("avatar-dragover");
      });
      avatarEl.addEventListener("drop", (e) => {
        e.preventDefault();
        avatarEl.classList.remove("avatar-dragover");
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          processarArquivoLogo(e.dataTransfer.files[0]);
        }
      });
    }

    const avatarHint = document.getElementById("empAvatarHint");
    if (avatarHint && !avatarHint.dataset.hintListenerAttached) {
      avatarHint.dataset.hintListenerAttached = "true";
      avatarHint.addEventListener("click", (e) => {
        e.stopPropagation();
        abrirSeletorLogo();
      });
    }

    const logoPreviewEl = document.getElementById("empLogoPreview");
    if (logoPreviewEl && !logoPreviewEl.dataset.previewListenerAttached) {
      logoPreviewEl.dataset.previewListenerAttached = "true";
      logoPreviewEl.addEventListener("click", abrirSeletorLogo);
      logoPreviewEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        logoPreviewEl.classList.add("dragover");
      });
      logoPreviewEl.addEventListener("dragleave", (e) => {
        e.preventDefault();
        logoPreviewEl.classList.remove("dragover");
      });
      logoPreviewEl.addEventListener("drop", (e) => {
        e.preventDefault();
        logoPreviewEl.classList.remove("dragover");
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          processarArquivoLogo(e.dataTransfer.files[0]);
        }
      });
    }
  }

  // Inicializar input hidden e sidebar
  getInputLogo();
  await updateSidebarInfo();

  async function processarArquivoLogo(file) {
    if (!file) return;

    if (!file.type || !file.type.startsWith("image/")) {
      showToast("Selecione um arquivo de imagem válido (PNG, JPG, SVG ou WebP).", "error");
      const inp = getInputLogo();
      if (inp) inp.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("A imagem deve ter no máximo 5MB.", "error");
      const inp = getInputLogo();
      if (inp) inp.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const rawBase64 = ev.target.result;

        // Otimizar imagem redimensionando em canvas caso seja muito grande
        const b64 = await otimizarLogo(rawBase64);

        try {
          await atualizarEmpresario(emp.id, { logo: b64, foto: b64 });
        } catch (apiErr) {
          console.warn("Aviso ao sincronizar com backend, mantendo local:", apiErr);
        }

        const sessaoAtual = getSessao() || {};
        sessaoAtual.logo = b64;
        sessaoAtual.foto = b64;
        setSessao(sessaoAtual);
        emp.logo = b64;
        emp.foto = b64;

        await updateSidebarInfo();
        showToast("Foto/Logo da empresa atualizada com sucesso!", "success");
        try { registrarLog("Logo da empresa atualizada", emp.nome, "empresario", "Nova imagem de logo carregada"); } catch (_) {}
      } catch (ex) {
        showToast("Erro ao salvar logo: " + (ex.message || ex), "error");
      } finally {
        const inp = getInputLogo();
        if (inp) inp.value = "";
      }
    };
    reader.onerror = () => {
      showToast("Erro ao processar arquivo selecionado.", "error");
      const inp = getInputLogo();
      if (inp) inp.value = "";
    };
    reader.readAsDataURL(file);
  }

  function otimizarLogo(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png", 0.9));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  const btnRemoverLogo = document.getElementById("btnRemoverLogo");
  if (btnRemoverLogo) {
    btnRemoverLogo.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Deseja realmente remover a logo da empresa?")) return;
      try {
        await atualizarEmpresario(emp.id, { logo: null, foto: null });
        const s = getSessao();
        if (s) {
          delete s.logo;
          delete s.foto;
          setSessao(s);
        }
        delete emp.logo;
        delete emp.foto;
        await updateSidebarInfo();
        showToast("Logo removida com sucesso.", "info");
        try { registrarLog("Logo removida", emp.nome, "empresario", "Logo da empresa removida"); } catch (_) {}
      } catch (ex) {
        showToast("Erro ao remover a logo: " + (ex.message || ex), "error");
      }
    });
  }

  const historicoSessao = [];

  // ── Chip de contrato
  async function renderContratoChip() {
    emp = await getEmpAtual();
    const c = emp.contrato;
    const chip = document.getElementById("contratoChip");
    if (!c || !c.beneficioOfertado) { chip.innerHTML = ""; return; }
    const tipo = c.tipoAcordo || "Parceiro de Benefício (Padrão)";
    const icon = tipo === "Parceiro Estratégico" ? '<i class="bi bi-star-fill"></i>' : tipo === "Apoio Institucional" ? '<i class="bi bi-building-check"></i>' : '<i class="bi bi-tag-fill"></i>';
    const cls  = c.beneficiosValidados ? "badge-regular" : "badge-analise";
    chip.innerHTML = '<span class="badge ' + cls + '" style="font-size:0.78rem;padding:5px 12px;">' + icon + " " + tipo + (c.beneficiosValidados?'<i class="bi bi-check-circle-fill"></i>':'<i class="bi bi-hourglass-split"></i>') + '</span>';
  }
  renderContratoChip();

  // ── Navegação
  const navItems  = document.querySelectorAll(".nav-item");
  const sections  = document.querySelectorAll(".painel-section");
  const pageTitle = document.getElementById("pageTitle");
  const pageSub   = document.getElementById("pageSub");
  const titulos   = {
    consulta:  ["Consultar Associado",    "Verificar situação de um membro"],
    dashboard: ["Dashboard Financeiro",   "Performance e projeções do seu negócio"],
    parceria:  ["Minha Parceria",         "Contrato, contribuições e benefícios AMAS"],
    unidades:  ["Minhas Unidades",        "Gerencie seus estabelecimentos"],
    alerta:    ["Enviar Alerta",          "Comunicação direta com o administrador"],
    historico: ["Histórico de Consultas", "Consultas realizadas nesta sessão"]
  };

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const sec = item.dataset.section;
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      sections.forEach(s => s.classList.add("hidden"));
      document.getElementById("sec-" + sec).classList.remove("hidden");
      const [t, s] = titulos[sec] || ["",""];
      pageTitle.textContent = t; pageSub.textContent = s;
      if (sec === "parceria")  renderParceria();
      if (sec === "unidades")  renderUnidades();
      if (sec === "historico") renderHistorico();
      document.getElementById("sidebar").classList.remove("sidebar-open");
    });
  });

  document.getElementById("hamburgerBtn").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("sidebar-open"));
  document.getElementById("sidebarClose").addEventListener("click", () => document.getElementById("sidebar").classList.remove("sidebar-open"));
  document.getElementById("btnLogout").addEventListener("click", () => {
    registrarLog("Logout", emp.nome, "empresario", "Sessão encerrada");
    clearSessao(); window.location.href = "login.html";
  });

  // ══════════════════════════════════════════════
  // CONSULTA
  // ══════════════════════════════════════════════
  const cpfInput = document.getElementById("cpfConsulta");
  cpfInput.addEventListener("input", () => maskCPF(cpfInput));

  async function consultar() {
    const cpf    = cpfInput.value.trim();
    const erroEl = document.getElementById("consultaErro");
    const result = document.getElementById("resultadoConsulta");
    erroEl.style.display = "none"; result.classList.add("hidden");
    if (!cpf) { erroEl.textContent = "Digite um CPF para consultar."; erroEl.style.display = "block"; return; }
    try {
      const assoc = await buscarAssociadoCPF(cpf);
      const hora  = new Date().toLocaleString("pt-BR");
      if (!assoc) {
        result.innerHTML =
            '<div class="res-header indefinido"><div class="res-big-icon"><i class="bi bi-question-circle" style="font-size:2rem;color:var(--text-muted);"></i></div>' +
            '<div><div class="res-titulo" style="color:var(--text-secondary);">Não encontrado</div>' +
            '<div class="res-sub">CPF não cadastrado no sistema AMAS</div></div></div>' +
            '<div class="res-body"><div class="res-rows">' +
            '<div class="res-row"><span class="res-row-label">CPF</span><span class="res-row-value" style="font-family:monospace;">' + cpf + '</span></div>' +
            '<div class="res-row"><span class="res-row-label">Benefício liberado</span><span class="beneficio-tag nao"><i class="bi bi-x-circle"></i> Não</span></div>' +
            '</div></div>';
        result.classList.remove("hidden"); return;
      }
      const liberado = assoc.status === "Regular";
      result.innerHTML =
          '<div class="res-header ' + (liberado?"liberado":"bloqueado") + '">' +
          '<div class="res-big-icon">' + (liberado?'<i class="bi bi-check-circle-fill" style="font-size:2rem;color:#16a34a;"></i>':'<i class="bi bi-x-circle-fill" style="font-size:2rem;color:#dc2626;"></i>') + '</div>' +
          '<div><div class="res-titulo" style="color:' + (liberado?"#16a34a":"#dc2626") + ';">' + (liberado?"Benefício LIBERADO":"Benefício BLOQUEADO") + '</div>' +
          '<div class="res-sub">' + (liberado?"Associado regular – apto a receber desconto":"Associado irregular") + '</div></div>' +
          '</div>' +
          '<div class="res-body"><div class="res-rows">' +
          [["Nome",assoc.nome],["CPF",assoc.cpf],["Matrícula",assoc.matricula||"—"],
            ["Situação",'<span class="badge '+(liberado?"badge-regular":"badge-inadim")+'">'+assoc.status+'</span>'],
            ["Consulta em",hora],
            ["Benefício",'<span class="beneficio-tag '+(liberado?"sim":"nao")+'">'+(liberado?'<i class="bi bi-check-circle-fill" style="color:#16a34a;"></i> Sim':'<i class="bi bi-x-circle" style="color:#dc2626;"></i> Não')+'</span>']
          ].map(([l,v])=>'<div class="res-row"><span class="res-row-label">'+l+'</span><span class="res-row-value">'+v+'</span></div>').join("") +
          '</div></div>';
      result.classList.remove("hidden");
      historicoSessao.push({ nome: assoc.nome, cpf: assoc.cpf, status: assoc.status, liberado, hora });
      registrarLog("Consulta de associado", emp.nome, "empresario", "CPF: " + assoc.cpf);
    } catch (e) { erroEl.textContent = "Erro ao consultar: " + e.message; erroEl.style.display = "block"; }
  }

  document.getElementById("btnConsultar").addEventListener("click", consultar);
  cpfInput.addEventListener("keydown", e => { if (e.key === "Enter") consultar(); });

  // ══════════════════════════════════════════════
  // PARCERIA / BENEFÍCIOS
  // ══════════════════════════════════════════════
  async function renderParceria() {
    try {
      emp = await getEmpAtual();
      const c = emp.contrato || {};
      renderContratoBanner();
      await renderImpacto();

      const bInput = document.getElementById("benefOfertadoInput");
      const rInput = document.getElementById("regrasInput");
      const vInput = document.getElementById("formaValidacaoInput");
      const dInput = document.getElementById("descBeneficios");
      if (bInput) bInput.value = c.beneficioOfertado   || "";
      if (rInput) rInput.value = c.regrasUtilizacao     || "";
      if (vInput) vInput.value = c.formaValidacao       || "";
      if (dInput) dInput.value = c.descricaoBeneficios  || "";

      const el = document.getElementById("benefValidado");
      if (el) {
        if (c.beneficiosValidados) {
          el.innerHTML = '<span style="color:var(--status-regular);"><i class="bi bi-check-circle-fill" style="color:var(--status-regular);"></i> Validado pelo administrador — exibido no catálogo</span>';
        } else if (c.beneficioOfertado) {
          el.innerHTML = '<span style="color:var(--status-analise);"><i class="bi bi-hourglass-split" style="color:var(--status-analise);"></i> Aguardando validação do administrador</span>';
        } else {
          el.textContent = "";
        }
      }

      document.getElementById("btnSalvarBeneficios")?.addEventListener("click", async () => {
        const bVal = document.getElementById("benefOfertadoInput")?.value.trim();
        const rVal = document.getElementById("regrasInput")?.value.trim();
        const vVal = document.getElementById("formaValidacaoInput")?.value.trim();
        const dVal = document.getElementById("descBeneficios")?.value.trim();
        if (!bVal) { showToast("Informe o benefício principal.", "error"); return; }
        try {
          const empAtual = await getEmpresarioPorId(sessao.id);
          const contratoAtual = empAtual.contrato || {};
          await atualizarEmpresario(sessao.id, {
            contrato: {
              ...contratoAtual,
              beneficioOfertado:   bVal,
              regrasUtilizacao:    rVal,
              formaValidacao:      vVal,
              descricaoBeneficios: dVal,
              beneficiosValidados: false
            }
          });
          showToast("Benefícios salvos! Aguardando validação.", "success");
          renderParceria();
        } catch (ex) { showToast("Erro ao salvar: " + ex.message, "error"); }
      }, { once: true });
    } catch (e) { showToast("Erro ao carregar parceria.", "error"); }
  }

  function renderContratoBanner() {
    const el = document.getElementById("contratoBanner");
    if (!el) return;
    const c = emp.contrato || {};
    const benef   = c.beneficioOfertado || "";
    const validado = c.beneficiosValidados === true;
    const tipo    = c.tipoAcordo || "Parceria por Benefício Mútuo";
    const vig     = c.dataVigencia ? " · Vigência: " + formatDate(c.dataVigencia) : "";
    el.innerHTML = benef
        ? '<div class="cb-row"><div class="cb-icon"><i class="bi bi-handshake"></i></div><div class="cb-info"><div class="cb-tipo">' + tipo + vig + '</div><div class="cb-benef">' + benef + '</div></div><div class="cb-status ' + (validado?"cb-ok":"cb-pend") + '">' + (validado?'<i class="bi bi-check-circle-fill"></i> Validado':'<i class="bi bi-hourglass-split"></i> Aguarda validação') + '</div></div>'
        : '<div class="cb-empty"><i class="bi bi-exclamation-triangle"></i> Nenhum benefício cadastrado ainda.</div>';
  }

  async function renderImpacto() {
    const el = document.getElementById("impactoBody");
    if (!el) return;
    try {
      const assocs    = await getAssociados();
      const regulares = assocs.filter(a => a.status === "Regular").length;
      const total     = assocs.length;
      el.innerHTML =
          '<div class="impacto-kpis">' +
          impactoKpi('<i class="bi bi-people"></i>',"Total de associados",total,"var(--azul-mid)") +
          impactoKpi('<i class="bi bi-check-circle-fill" style="font-size:2rem;color:#16a34a;"></i>',"Associados regulares",regulares,"var(--status-regular)") +
          impactoKpi('<i class="bi bi-bullseye"></i>',"Clientes potenciais",regulares,"var(--azul-mid)") +
          '</div>' +
          '<div class="impacto-texto"><p>Ao ser listada como <strong>Empresa Parceira AMAS</strong>, sua empresa ganha visibilidade para <strong>' + regulares + ' associados ativos</strong> em São Sebastião/DF.</p></div>';
    } catch (_) {}
  }

  function impactoKpi(icon,label,val,color){return'<div class="imp-kpi"><div class="imp-icon">'+icon+'</div><div class="imp-val" style="color:'+color+';">'+val+'</div><div class="imp-label">'+label+'</div></div>';}

  function formatDate(d){if(!d)return"—";const[y,m,dd]=d.split("-");return dd+"/"+m+"/"+y;}

  // ══════════════════════════════════════════════
  // UNIDADES
  // ══════════════════════════════════════════════
  async function renderUnidades() {
    try {
      emp = await getEmpAtual();
      const listaEl = document.getElementById("listaUnidades");
      const unidades = emp.unidades || [];
      if (unidades.length === 0) {
        listaEl.innerHTML = '<div class="empty-state"><div class="es-icon"><i class="bi bi-geo-alt" style="font-size:1.6rem;"></i></div>Nenhuma unidade cadastrada.</div>'; return;
      }
      listaEl.innerHTML = unidades.map(u => {
        const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(u.endereco);
        return '<div class="unidade-item"><div class="uni-info"><div class="uni-nome"><i class="bi bi-geo-alt"></i> '+u.nome+'</div><div class="uni-end">'+u.endereco+'</div></div>' +
            '<div class="uni-acoes"><a href="'+mapsUrl+'" target="_blank" class="btn btn-outline btn-sm"><i class="bi bi-map"></i> Ver no Mapa</a>' +
            '<button class="btn btn-danger btn-sm" onclick="removerUnidade('+u.id+')"><i class="bi bi-trash"></i></button></div></div>';
      }).join("");
    } catch (e) { showToast("Erro ao carregar unidades.", "error"); }
  }

  document.getElementById("btnAddUnidade").addEventListener("click", () => {
    document.getElementById("uniNome").value = "";
    document.getElementById("uniEnd").value  = "";
    document.getElementById("modalUnidade").classList.remove("hidden");
  });

  document.getElementById("formUnidade").addEventListener("submit", async e => {
    e.preventDefault();
    const nome = document.getElementById("uniNome").value.trim();
    const end  = document.getElementById("uniEnd").value.trim();
    if (!nome || !end) { showToast("Preencha nome e endereço.", "error"); return; }
    try {
      emp = await getEmpAtual();
      const uns = emp.unidades || [];
      uns.push({ id: (uns.length ? Math.max(...uns.map(u=>u.id))+1 : 1), nome, endereco: end });
      await atualizarEmpresario(emp.id, { unidades: uns });
      document.getElementById("modalUnidade").classList.add("hidden");
      renderUnidades();
      showToast("Unidade adicionada!", "success");
      registrarLog("Unidade cadastrada", emp.nome, "empresario", nome);
    } catch (ex) { showToast("Erro: " + ex.message, "error"); }
  });

  window.removerUnidade = async function(id) {
    if (!confirm("Deseja realmente excluir esta unidade?")) return;
    try {
      emp = await getEmpAtual();
      await atualizarEmpresario(emp.id, { unidades: (emp.unidades||[]).filter(u => u.id !== id) });
      renderUnidades(); showToast("Unidade removida.", "info");
    } catch (e) { showToast("Erro: " + e.message, "error"); }
  };

  // ══════════════════════════════════════════════
  // ALERTA
  // ══════════════════════════════════════════════
  document.getElementById("formAlerta").addEventListener("submit", async e => {
    e.preventDefault();
    const titulo   = document.getElementById("alertaTitulo").value.trim();
    const mensagem = document.getElementById("alertaMensagem").value.trim();
    const urgente  = document.getElementById("alertaUrgente").checked;
    if (!titulo || !mensagem) { showToast("Preencha título e descrição.", "error"); return; }
    try {
      emp = await getEmpAtual();
      await enviarAlertaEmpresario(emp.id, emp.nome, titulo, mensagem, urgente);
      document.getElementById("formAlerta").reset();
      showToast(urgente ? "Alerta URGENTE enviado!" : "Alerta enviado!", "success");
    } catch (ex) { showToast("Erro ao enviar: " + ex.message, "error"); }
  });

  // ══════════════════════════════════════════════
  // HISTÓRICO
  // ══════════════════════════════════════════════
  function renderHistorico() {
    const container = document.getElementById("historicoConsultas");
    if (!historicoSessao.length) {
      container.innerHTML = '<p class="hist-empty">Nenhuma consulta realizada ainda.</p>'; return;
    }
    container.innerHTML = historicoSessao.slice().reverse().map(h =>
        '<div class="hist-item">' +
        '<div><div class="hist-item-nome">'+h.nome+'</div><div class="hist-item-cpf">'+h.cpf+'</div></div>' +
        '<span class="badge '+(h.liberado?"badge-regular":"badge-inadim")+'">'+h.status+'</span>' +
        '<span class="hist-item-hora">'+h.hora+'</span>' +
        '</div>'
    ).join("");
  }

  registrarLog("Login realizado", emp.nome, "empresario", "Acesso ao portal do empresário");
});