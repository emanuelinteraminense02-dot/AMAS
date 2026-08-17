document.addEventListener("DOMContentLoaded", () => {
  const state = {
    estatisticas: { total: 0, regulares: 0 },
    noticias: [],
    eventos: [],
    projetos: [],
    noticiasExpandidas: false,
    eventosExpandidos: false
  };

  const CAT_ICON = {
    comunicado: '<i class="bi bi-megaphone"></i>',
    parceria: '<i class="bi bi-handshake"></i>',
    social: '<i class="bi bi-heart"></i>',
    evento: '<i class="bi bi-calendar-event"></i>',
    conquista: '<i class="bi bi-trophy"></i>',
    capacitacao: '<i class="bi bi-book"></i>'
  };
  const CAT_LABEL = {
    comunicado: "Comunicado",
    parceria: "Parceria",
    social: "Ação Social",
    evento: "Evento",
    conquista: "Conquista",
    capacitacao: "Capacitação"
  };
  const TIPO_ICON = {
    social: '<i class="bi bi-heart"></i>',
    capacitacao: '<i class="bi bi-book"></i>',
    parceria: '<i class="bi bi-handshake"></i>',
    cultural: '<i class="bi bi-stars"></i>',
    reuniao: '<i class="bi bi-people"></i>'
  };
  const TIPO_LABEL = {
    social: "Ação Social",
    capacitacao: "Capacitação",
    parceria: "Parceria",
    cultural: "Cultural",
    reuniao: "Assembleia"
  };
  const PROJETO_ICON = {
    educacao: '<i class="bi bi-book-half"></i>',
    economia: '<i class="bi bi-shop"></i>',
    social: '<i class="bi bi-heart-fill"></i>',
    cultura: '<i class="bi bi-stars"></i>',
    capacitacao: '<i class="bi bi-mortarboard"></i>',
    default: '<i class="bi bi-briefcase"></i>'
  };
  const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const MESES_EXT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const NOTICIAS_INICIAL = 3;
  const EVENTOS_INICIAL = 3;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.06 });

  function registerAnimations(scope = document) {
    scope.querySelectorAll(".beneficio-card, .projeto-card, .valor-item, .noticia-card, .evento-row").forEach((el) => {
      if (el.dataset.animRegistered === "true") return;
      el.dataset.animRegistered = "true";
      el.classList.add("anim-on-scroll");
      observer.observe(el);
    });
  }

  function formatDataPublica(iso) {
    if (!iso) return "";
    const [year, month, day] = iso.split("-");
    const monthIndex = Math.max(0, parseInt(month, 10) - 1);
    return `${day} de ${MESES_EXT[monthIndex]} de ${year}`;
  }

  function formatDataCurta(iso) {
    if (!iso) return "";
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  }

  function diasRestantes(iso, statusEvento) {
    const diff = (new Date(`${iso}T00:00:00`) - new Date()) / 86400000;
    if (statusEvento === "Encerrado") return { txt: "Encerrado", cls: "enc" };
    if (statusEvento === "Em Breve") return { txt: "Em breve", cls: "embreve" };
    if (statusEvento === "Cancelado") return { txt: "Cancelado", cls: "enc" };
    if (diff < -1) return { txt: "Realizado", cls: "realizado" };
    if (diff < 1) return { txt: "Hoje!", cls: "hoje" };
    if (diff < 2) return { txt: "Amanhã", cls: "breve" };
    return { txt: `Em ${Math.ceil(diff)} dias`, cls: diff < 8 ? "breve" : "futuro" };
  }

  function animCounter(el, target) {
    const finalValue = Number(target || 0);
    let current = 0;
    const step = Math.max(1, Math.ceil(finalValue / 30));
    const timer = setInterval(() => {
      current = Math.min(current + step, finalValue);
      el.textContent = current;
      if (current >= finalValue) clearInterval(timer);
    }, 40);
  }

  function renderEstatisticas() {
    const totalEl = document.getElementById("statTotal");
    const regularEl = document.getElementById("statRegular");
    if (totalEl) animCounter(totalEl, state.estatisticas.total);
    if (regularEl) animCounter(regularEl, state.estatisticas.regulares);
  }

  function renderNoticiasPublicas(mostrarTodas = false) {
    const container = document.getElementById("publicNoticias");
    if (!container) return;

    if (!state.noticias.length) {
      container.innerHTML = '<div class="pub-loading">Nenhuma notícia publicada ainda.</div>';
      return;
    }

    const noticias = mostrarTodas ? state.noticias : state.noticias.slice(0, NOTICIAS_INICIAL);
    const temMais = state.noticias.length > NOTICIAS_INICIAL;

    container.innerHTML = noticias.map((noticia, index) => {
      const categoria = noticia.categoria || "comunicado";
      const destaque = Boolean(noticia.destaque) && index === 0;
      return `
        <div class="noticia-card ${destaque ? "destaque" : ""} cat-${categoria}" onclick="abrirNoticia(${noticia.id})">
          <div class="nc-stripe"></div>
          <div class="nc-body">
            <div class="nc-meta-top">
              <span class="nc-cat ${categoria}">${CAT_ICON[categoria] || '<i class="bi bi-newspaper"></i>'} ${CAT_LABEL[categoria] || categoria}</span>
              ${noticia.destaque ? '<span class="nc-destaque-tag">⭐ Destaque</span>' : ""}
            </div>
            <div class="nc-title">${noticia.titulo || "Sem título"}</div>
            <div class="nc-resumo">${noticia.resumo || "Sem resumo disponível."}</div>
            <div class="nc-footer">
              <span><i class="bi bi-calendar3"></i> ${formatDataPublica(noticia.publicadaEm)}</span>
              <span class="nc-ler-mais">Ler mais →</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    let btnWrap = document.getElementById("noticiasVerMaisWrap");
    if (!btnWrap) {
      btnWrap = document.createElement("div");
      btnWrap.id = "noticiasVerMaisWrap";
      btnWrap.className = "ver-mais-wrap";
      container.parentNode.insertBefore(btnWrap, container.nextSibling);
    }

    if (temMais) {
      btnWrap.innerHTML = mostrarTodas
        ? '<button class="btn-ver-mais" onclick="toggleNoticias(false)"><span>Ver menos</span> <span class="vm-chevron vm-up">▲</span></button>'
        : `<button class="btn-ver-mais" onclick="toggleNoticias(true)"><span>Ver todas as ${state.noticias.length} notícias</span><span class="vm-chevron">▼</span></button>`;
    } else {
      btnWrap.innerHTML = "";
    }

    container.querySelectorAll(".noticia-card").forEach((el, idx) => {
      el.style.animationDelay = `${idx * 0.06}s`;
    });
    registerAnimations(container);
  }

  function renderEventosPublicos(mostrarTodos = false) {
    const container = document.getElementById("publicEventos");
    if (!container) return;

    const eventosVisiveis = state.eventos
      .filter((evento) => {
        const status = evento.status || "Aberto";
        if (status === "Cancelado") return false;
        if (status === "Encerrado") return Boolean(evento.destaque);
        return true;
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    if (!eventosVisiveis.length) {
      container.innerHTML = '<div class="pub-loading">Nenhum evento programado no momento.</div>';
      return;
    }

    const eventos = mostrarTodos ? eventosVisiveis : eventosVisiveis.slice(0, EVENTOS_INICIAL);
    const temMais = eventosVisiveis.length > EVENTOS_INICIAL;

    container.innerHTML = eventos.map((evento) => {
      const [year, month, day] = (evento.data || "").split("-");
      const status = evento.status || "Aberto";
      const countdown = diasRestantes(evento.data, status);
      const vagasTotais = Number(evento.vagasTotais ?? evento.vagas ?? 0);
      const inscritos = Number(evento.inscricoes ?? 0);
      const vagasRestantes = vagasTotais > 0 ? Math.max(0, vagasTotais - inscritos) : null;
      const percentual = vagasTotais > 0 ? Math.min(100, Math.round((inscritos / vagasTotais) * 100)) : null;
      const corBarra = percentual === null ? "#22c55e" : percentual >= 90 ? "#ef4444" : percentual >= 60 ? "#f59e0b" : "#22c55e";
      const tipo = evento.tipo || "social";
      const rowStatusCls = status === "Encerrado" ? "ev-encerrado"
        : status === "Em Breve" ? "ev-embreve"
        : countdown.cls === "realizado" ? "ev-realizado"
        : countdown.cls === "hoje" ? "ev-hoje"
        : countdown.cls === "breve" ? "ev-breve"
        : "ev-aberto";

      const statusBadge = status === "Aberto"
        ? '<span class="er-status-badge er-status-aberto">Inscrições abertas</span>'
        : status === "Em Breve"
          ? '<span class="er-status-badge er-status-embreve">Em breve</span>'
          : '<span class="er-status-badge er-status-encerrado">Encerrado</span>';

      return `
        <div class="evento-row ${evento.destaque ? "destaque " : ""}${rowStatusCls}">
          <div class="er-date-block ${rowStatusCls}">
            <div class="er-day">${day || "--"}</div>
            <div class="er-month">${month ? MESES_ABREV[Math.max(0, parseInt(month, 10) - 1)] : "--"}</div>
            <div class="er-year">${year || "--"}</div>
          </div>
          <div class="er-info">
            <div class="er-badges">
              <span class="er-tipo ${tipo}">${TIPO_ICON[tipo] || '<i class="bi bi-calendar-event"></i>'} ${TIPO_LABEL[tipo] || tipo}</span>
              ${statusBadge}
              ${evento.destaque ? '<span class="er-destaque-tag">⭐ Destaque</span>' : ""}
            </div>
            <div class="er-titulo">${evento.titulo || "Evento sem título"}</div>
            <div class="er-desc">${evento.descricao || "Descrição não informada."}</div>
            <div class="er-meta">
              <span><i class="bi bi-clock"></i> ${evento.horario || "Horário a confirmar"}</span>
              <span><i class="bi bi-geo-alt"></i> ${evento.local || "Local a confirmar"}</span>
              ${vagasTotais > 0 ? `<span><i class="bi bi-ticket-perforated"></i> ${inscritos}/${vagasTotais} vagas</span>` : ""}
            </div>
            ${percentual !== null && status !== "Encerrado"
              ? `<div class="er-progress-wrap">
                  <div class="er-progress-bar">
                    <div class="er-progress-fill" style="width:${percentual}%;background:${corBarra};"></div>
                  </div>
                  <span class="er-progress-label">${vagasRestantes === 0 ? "Esgotado" : `${vagasRestantes} vaga${vagasRestantes === 1 ? "" : "s"} restante${vagasRestantes === 1 ? "" : "s"}`}</span>
                </div>`
              : ""}
          </div>
          <div class="er-side">
            <span class="er-countdown ${countdown.cls}">${countdown.txt}</span>
          </div>
        </div>
      `;
    }).join("");

    let btnWrap = document.getElementById("eventosVerMaisWrap");
    if (!btnWrap) {
      btnWrap = document.createElement("div");
      btnWrap.id = "eventosVerMaisWrap";
      btnWrap.className = "ver-mais-wrap";
      container.parentNode.insertBefore(btnWrap, container.nextSibling);
    }

    if (temMais) {
      btnWrap.innerHTML = mostrarTodos
        ? '<button class="btn-ver-mais" onclick="toggleEventos(false)"><span>Ver menos</span> <span class="vm-chevron vm-up">▲</span></button>'
        : `<button class="btn-ver-mais" onclick="toggleEventos(true)"><span>Ver todos os ${eventosVisiveis.length} eventos</span><span class="vm-chevron">▼</span></button>`;
    } else {
      btnWrap.innerHTML = "";
    }

    container.querySelectorAll(".evento-row").forEach((el, idx) => {
      el.style.animationDelay = `${idx * 0.07}s`;
    });
    registerAnimations(container);
  }

  function renderProjetos() {
    const container = document.getElementById("projetosGrid");
    if (!container) return;

    if (!state.projetos.length) {
      container.innerHTML = `
        <div class="projeto-card placeholder">
          <div class="proj-icon"><i class="bi bi-stars"></i></div>
          <span class="proj-tag">Sem projetos ativos</span>
          <h3>Novos projetos em breve</h3>
          <p>No momento não há projetos em andamento cadastrados no banco. Assim que a equipe publicar novas iniciativas, elas aparecerão aqui automaticamente.</p>
        </div>
      `;
      registerAnimations(container);
      return;
    }

    const projetos = state.projetos.slice(0, 3);
    const cardPrincipalId = (projetos.find((projeto) => projeto.destaque) || projetos[0]).id;

    container.innerHTML = projetos.map((projeto) => {
      const categoria = (projeto.categoria || "Projeto").trim();
      const categoriaKey = categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const destaque = projeto.id === cardPrincipalId;
      const icone = projeto.icone ? `<i class="${projeto.icone}"></i>` : (PROJETO_ICON[categoriaKey] || PROJETO_ICON.default);
      const participantes = Number(projeto.participantes || 0);
      const unidade = projeto.unidadeMetrica || "participantes";
      const dataMeta = projeto.dataInicio ? `Iniciado em ${formatDataCurta(projeto.dataInicio)}` : "Em andamento";
      return `
        <div class="projeto-card ${destaque ? "grande" : ""}">
          <div class="proj-icon">${icone}</div>
          <span class="proj-tag">${categoria}</span>
          <h3>${projeto.titulo || "Projeto sem título"}</h3>
          <p>${projeto.resumo || "Resumo não informado."}</p>
          <div class="proj-meta">
            <span><i class="bi bi-people"></i> ${participantes > 0 ? `${participantes} ${unidade}` : "Projeto ativo"}</span>
            <span><i class="bi bi-calendar-check"></i> ${projeto.status || dataMeta}</span>
          </div>
        </div>
      `;
    }).join("");

    registerAnimations(container);
  }

  async function loadEstatisticas() {
    state.estatisticas = await getEstatisticas();
    renderEstatisticas();
  }

  async function loadNoticias() {
    state.noticias = await getNoticias();
    renderNoticiasPublicas(state.noticiasExpandidas);
  }

  async function loadEventos() {
    state.eventos = await getEventos();
    renderEventosPublicos(state.eventosExpandidos);
  }

  async function loadProjetos() {
    state.projetos = await getProjetos();
    renderProjetos();
  }

  async function loadHomeData() {
    const tasks = [
      loadEstatisticas(),
      loadNoticias(),
      loadEventos(),
      loadProjetos()
    ];

    const results = await Promise.allSettled(tasks);
    results.forEach((result, index) => {
      if (result.status !== "rejected") return;
      if (index === 0) showToast("Não foi possível carregar os indicadores da página inicial.", "error");
      if (index === 1) document.getElementById("publicNoticias").innerHTML = '<div class="pub-loading">Não foi possível carregar as notícias agora.</div>';
      if (index === 2) document.getElementById("publicEventos").innerHTML = '<div class="pub-loading">Não foi possível carregar os eventos agora.</div>';
      if (index === 3) renderProjetos();
    });
  }

  function getTipoSolicitante() {
    return document.querySelector('input[name="tipoSolicitante"]:checked')?.value || "pessoa_fisica";
  }

  function updateTipoSolicitanteUI() {
    const tipo = getTipoSolicitante();
    const nomeLabel = document.getElementById("f_nome_label");
    const profLabel = document.getElementById("f_prof_label");
    const motivoLabel = document.getElementById("f_motivo_label");
    const nomeInput = document.getElementById("f_nome");
    const profInput = document.getElementById("f_prof");
    const pfFields = document.querySelectorAll(".pf-only");
    const empresaFields = document.querySelectorAll(".empresa-only");
    const cpfInput = document.getElementById("f_cpf");
    const nascInput = document.getElementById("f_nasc");
    const cnpjInput = document.getElementById("f_cnpj");
    const responsavelInput = document.getElementById("f_responsavel");

    document.querySelectorAll('.tipo-chip').forEach((chip) => {
      const input = chip.querySelector('input[name="tipoSolicitante"]');
      chip.classList.toggle("active", input?.checked);
    });

    if (!nomeLabel || !profLabel || !motivoLabel || !nomeInput || !profInput) return;

    if (tipo === "empresa") {
      nomeLabel.textContent = "Razão social *";
      profLabel.textContent = "Ramo de atuação *";
      motivoLabel.textContent = "Como sua empresa deseja participar? *";
      nomeInput.placeholder = "Nome da empresa";
      profInput.placeholder = "Ex.: comércio, serviços, educação";
      pfFields.forEach((el) => el.classList.add("hidden"));
      empresaFields.forEach((el) => el.classList.remove("hidden"));
      if (cpfInput) cpfInput.required = false;
      if (nascInput) nascInput.required = false;
      if (cnpjInput) cnpjInput.required = true;
      if (responsavelInput) responsavelInput.required = true;
    } else {
      nomeLabel.textContent = "Nome completo *";
      profLabel.textContent = "Profissão *";
      motivoLabel.textContent = "Por que deseja se associar? *";
      nomeInput.placeholder = "Seu nome completo";
      profInput.placeholder = "Sua profissão ou ocupação";
      pfFields.forEach((el) => el.classList.remove("hidden"));
      empresaFields.forEach((el) => el.classList.add("hidden"));
      if (cpfInput) cpfInput.required = true;
      if (nascInput) nascInput.required = true;
      if (cnpjInput) cnpjInput.required = false;
      if (responsavelInput) responsavelInput.required = false;
    }
  }

  async function handleFormularioSubmit(event) {
    event.preventDefault();

    const formEl = event.currentTarget instanceof HTMLFormElement
      ? event.currentTarget
      : document.getElementById("formAssociar");
    const msgEl = document.getElementById("formMsg");
    const submitBtn = formEl?.querySelector('button[type="submit"]');
    const tipo = getTipoSolicitante();
    const nome = document.getElementById("f_nome").value.trim();
    const cpf = document.getElementById("f_cpf").value.trim();
    const cnpj = document.getElementById("f_cnpj").value.trim();
    const nascimento = document.getElementById("f_nasc").value;
    const responsavel = document.getElementById("f_responsavel").value.trim();
    const telefone = document.getElementById("f_tel").value.trim();
    const email = document.getElementById("f_email").value.trim();
    const endereco = document.getElementById("f_end").value.trim();
    const profissao = document.getElementById("f_prof").value.trim();
    const motivo = document.getElementById("f_motivo").value.trim();

    msgEl.textContent = "";

    if (!nome || !telefone || !email || !endereco || !profissao || !motivo) {
      msgEl.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }

    if (tipo === "empresa") {
      if (!cnpj || !responsavel) {
        msgEl.textContent = "Informe o CNPJ e o responsável pela empresa.";
        return;
      }
      if (!validarCNPJ(cnpj)) {
        msgEl.textContent = "CNPJ inválido.";
        return;
      }
    } else {
      if (!cpf || !nascimento) {
        msgEl.textContent = "Informe CPF e data de nascimento.";
        return;
      }
      if (!validarCPF(cpf)) {
        msgEl.textContent = "CPF inválido.";
        return;
      }
    }

    const payload = {
      tipoSolicitante: tipo,
      nome,
      cpf: tipo === "empresa" ? null : cpf,
      cnpj: tipo === "empresa" ? cnpj : null,
      nascimento: tipo === "empresa" ? null : nascimento,
      responsavel: tipo === "empresa" ? responsavel : null,
      telefone,
      email,
      endereco,
      profissao,
      observacoes: motivo
    };

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Enviando solicitação...";
      }
      await criarSolicitacaoPublica(payload);
      if (formEl) formEl.classList.add("hidden");
      document.getElementById("formSucesso")?.classList.remove("hidden");
    } catch (error) {
      msgEl.textContent = error.message || "Não foi possível enviar sua solicitação.";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Enviar solicitação →";
      }
    }
  }

  function bindFormulario() {
    const cpfInput = document.getElementById("f_cpf");
    const cnpjInput = document.getElementById("f_cnpj");
    const telInput = document.getElementById("f_tel");
    const form = document.getElementById("formAssociar");

    if (cpfInput) cpfInput.addEventListener("input", () => maskCPF(cpfInput));
    if (cnpjInput) cnpjInput.addEventListener("input", () => maskCNPJ(cnpjInput));
    if (telInput) telInput.addEventListener("input", () => maskTel(telInput));

    document.querySelectorAll('input[name="tipoSolicitante"]').forEach((input) => {
      input.addEventListener("change", updateTipoSolicitanteUI);
    });
    updateTipoSolicitanteUI();

    if (form) form.addEventListener("submit", handleFormularioSubmit);
  }

  function bindModal() {
    document.getElementById("mnpClose")?.addEventListener("click", () => {
      document.getElementById("modalNoticiaPublica").classList.add("hidden");
    });

    document.getElementById("modalNoticiaPublica")?.addEventListener("click", function closeOnOverlay(event) {
      if (event.target === this) this.classList.add("hidden");
    });
  }

  window.toggleNoticias = function toggleNoticias(expandir) {
    state.noticiasExpandidas = expandir;
    renderNoticiasPublicas(expandir);
    if (!expandir) document.getElementById("noticias")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  window.toggleEventos = function toggleEventos(expandir) {
    state.eventosExpandidos = expandir;
    renderEventosPublicos(expandir);
    if (!expandir) document.getElementById("eventos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  window.abrirNoticia = function abrirNoticia(id) {
    const noticia = state.noticias.find((item) => item.id === id);
    if (!noticia) return;

    const categoria = noticia.categoria || "comunicado";
    document.getElementById("mnpTitulo").textContent = noticia.titulo || "Notícia";
    document.getElementById("mnpBody").innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
        <span class="nc-cat ${categoria}">${CAT_ICON[categoria] || '<i class="bi bi-newspaper"></i>'} ${CAT_LABEL[categoria] || categoria}</span>
        ${noticia.destaque ? '<span class="nc-destaque-tag">⭐ Destaque</span>' : ""}
        <span style="color:var(--text-muted);font-size:0.8rem;"><i class="bi bi-calendar3"></i> ${formatDataPublica(noticia.publicadaEm)} · ✍️ ${noticia.autor || "AMAS"}</span>
      </div>
      <p style="font-style:italic;color:var(--text-secondary);font-size:0.9rem;line-height:1.65;padding-bottom:14px;border-bottom:1px solid var(--border);margin-bottom:14px;">${noticia.resumo || ""}</p>
      <p style="color:var(--text-primary);font-size:0.92rem;line-height:1.8;">${noticia.conteudo || ""}</p>
    `;
    document.getElementById("modalNoticiaPublica").classList.remove("hidden");
  };

  bindFormulario();
  bindModal();
  registerAnimations();
  loadHomeData();
});
