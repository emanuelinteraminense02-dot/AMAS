/**
 * Interface do Usuário do Chat AMAS (chat-ui.js)
 * Orquestra as telas de Atendimento Privado para Admin, Associado e Empresário.
 * Suporta separação em abas, busca instantânea em todo o catálogo (novos chats e existentes),
 * histórico persistente, envio de anexos com prévia e sincronização em tempo real.
 */
(function (window) {
  'use strict';

  const ChatUI = {
    sessao: null,
    modo: null, // 'admin' | 'associado' | 'empresario'
    adminState: {
      abaAtiva: 'associados', // 'associados' | 'empresarios'
      canais: { associados: [], empresarios: [] },
      canalSelecionado: null,
      filtro: '',
      anexoStaged: null,
      typingTimeout: null
    },
    clientState: {
      channelId: null,
      anexoStaged: null,
      typingTimeout: null
    },

    init: function () {
      this.atualizarSessao();
      if (!this.sessao) return;

      const perfil = this.sessao.perfil;
      if (perfil === 'admin') {
        this.modo = 'admin';
        this.setupListenersGlobais();
      } else if (perfil === 'empresario') {
        this.modo = 'empresario';
        const rawId = String(this.sessao.id || '').replace(/^(emp_|assoc_)/, '');
        this.clientState.channelId = `emp_${rawId}`;
        this.setupListenersGlobais();
      } else {
        this.modo = 'associado';
        const rawId = String(this.sessao.id || '').replace(/^(emp_|assoc_)/, '');
        this.clientState.channelId = `assoc_${rawId}`;
        this.setupListenersGlobais();
      }
    },

    atualizarSessao: function () {
      try {
        if (typeof getSessao === 'function') {
          this.sessao = getSessao();
        } else {
          const raw = localStorage.getItem('amas_sessao');
          this.sessao = raw ? JSON.parse(raw) : null;
        }
      } catch (e) {
        this.sessao = null;
      }
      return this.sessao;
    },

    setupListenersGlobais: function () {
      if (!window.ChatClient) return;

      window.ChatClient.on('nova_mensagem', (msg) => {
        this.aoReceberNovaMensagem(msg);
      });

      window.ChatClient.on('digitando', (data) => {
        this.aoReceberDigitando(data);
      });

      window.ChatClient.on('status_online', (data) => {
        this.aoAtualizarStatusOnline(data);
      });

      setTimeout(() => {
        this.atualizarBadgesGlobais();
      }, 500);
    },

    // ══════════════════════════════════════════════════════════════════
    // PAINEL DO ADMINISTRADOR
    // ══════════════════════════════════════════════════════════════════
    iniciarAdmin: async function () {
      this.modo = 'admin';
      await this.carregarCanaisAdmin();
    },

    carregarCanaisAdmin: async function () {
      const listEl = document.getElementById('chatContactsList');
      if (listEl && (!listEl.children || listEl.children.length === 0)) {
        listEl.innerHTML = `
          <div style="padding:28px 16px;text-align:center;color:#94a3b8;font-size:0.85rem;">
            <i class="bi bi-arrow-repeat spin" style="font-size:1.6rem;color:#cf941d;display:block;margin-bottom:8px;"></i>
            Carregando catálogo de conversas...
          </div>
        `;
      }

      // 1. Carrega canais existentes do ChatClient
      let res = await window.ChatClient.carregarCanais();
      if (!res) res = { ok: true, associados: [], empresarios: [], totalNaoLidas: 0 };

      // 2. Sincroniza complementarmente com todo o diretório de Associados e Empresários
      try {
        let assocDb = [];
        let empDb = [];

        if (typeof apiAssociados !== 'undefined' && typeof apiAssociados.listar === 'function') {
          try { assocDb = await apiAssociados.listar(); } catch (_) {}
        } else if (typeof getAssociados === 'function') {
          try { assocDb = await getAssociados(); } catch (_) {}
        }

        if (typeof apiEmpresarios !== 'undefined' && typeof apiEmpresarios.listar === 'function') {
          try { empDb = await apiEmpresarios.listar(); } catch (_) {}
        } else if (typeof getEmpresarios === 'function') {
          try { empDb = await getEmpresarios(); } catch (_) {}
        }

        // Garante que TODOS os associados cadastrados existam na lista
        if (Array.isArray(assocDb) && assocDb.length > 0) {
          const mapAssoc = new Map();
          (res.associados || []).forEach(a => mapAssoc.set(a.channelId, a));

          assocDb.forEach(a => {
            const chId = 'assoc_' + a.id;
            if (!mapAssoc.has(chId)) {
              mapAssoc.set(chId, {
                id: a.id,
                channelId: chId,
                tipo: 'associado',
                nome: a.nome || 'Associado AMAS',
                subtitulo: `Matrícula: ${a.matricula || 'AMAS-00' + a.id} · CPF: ${a.cpf || '—'}`,
                email: a.email || '',
                telefone: a.telefone || '',
                status: a.status || 'Regular',
                foto: a.foto || '',
                ultimaMensagem: null,
                naoLidas: 0,
                online: true
              });
            }
          });
          res.associados = Array.from(mapAssoc.values());
        }

        // Garante que TODOS os empresários cadastrados existam na lista
        if (Array.isArray(empDb) && empDb.length > 0) {
          const mapEmp = new Map();
          (res.empresarios || []).forEach(e => mapEmp.set(e.channelId, e));

          empDb.forEach(e => {
            const chId = 'emp_' + e.id;
            if (!mapEmp.has(chId)) {
              const logoImg = e.logo || e.foto || (e.contrato && (e.contrato.logo || e.contrato.foto)) || '';
              mapEmp.set(chId, {
                id: e.id,
                channelId: chId,
                tipo: 'empresario',
                nome: e.nome || 'Empresa Parceira',
                subtitulo: `CNPJ: ${e.cnpj || '—'} · ${e.contrato?.tipoAcordo || 'Parceiro AMAS'}`,
                email: e.email || '',
                telefone: e.telefone || '',
                logo: logoImg,
                foto: logoImg,
                ultimaMensagem: null,
                naoLidas: 0,
                online: true
              });
            }
          });
          res.empresarios = Array.from(mapEmp.values());
        }
      } catch (syncErr) {
        console.warn('Sincronização de canais:', syncErr);
      }

      this.adminState.canais.associados = res.associados || [];
      this.adminState.canais.empresarios = res.empresarios || [];
      this.atualizarContadoresAbasAdmin(res);
      this.renderizarListaContatosAdmin();
    },

    atualizarContadoresAbasAdmin: function (res) {
      const unreadAssoc = (res.associados || []).reduce((acc, c) => acc + (c.naoLidas || 0), 0);
      const unreadEmp = (res.empresarios || []).reduce((acc, c) => acc + (c.naoLidas || 0), 0);
      const total = unreadAssoc + unreadEmp;

      const badgeAssoc = document.getElementById('chatTabAssocBadge');
      if (badgeAssoc) {
        badgeAssoc.textContent = unreadAssoc;
        badgeAssoc.classList.toggle('hidden', unreadAssoc === 0);
      }

      const badgeEmp = document.getElementById('chatTabEmpBadge');
      if (badgeEmp) {
        badgeEmp.textContent = unreadEmp;
        badgeEmp.classList.toggle('hidden', unreadEmp === 0);
      }

      const badgeSidebar = document.getElementById('badgeChatAdmin');
      if (badgeSidebar) {
        badgeSidebar.textContent = total;
        badgeSidebar.classList.toggle('hidden', total === 0);
      }

      const badgeHeader = document.getElementById('chatTotalUnreadBadge');
      if (badgeHeader) {
        badgeHeader.textContent = `${total} nova${total > 1 ? 's' : ''}`;
        badgeHeader.classList.toggle('hidden', total === 0);
      }
    },

    trocarAbaAdmin: function (aba) {
      this.adminState.abaAtiva = aba;
      const btnAssoc = document.getElementById('chatTabAssoc');
      const btnEmp = document.getElementById('chatTabEmp');

      if (btnAssoc) btnAssoc.classList.toggle('active', aba === 'associados');
      if (btnEmp) btnEmp.classList.toggle('active', aba === 'empresarios');

      this.renderizarListaContatosAdmin();
    },

    filtrarContatos: function (termo) {
      this.adminState.filtro = (termo || '').toLowerCase().trim();
      this.renderizarListaContatosAdmin();
    },

    renderizarCardContato: function (c) {
      const isActive = this.adminState.canalSelecionado?.channelId === c.channelId;
      const hora = c.ultimaMensagem?.criadoEm ? window.ChatClient.formatarHora(c.ultimaMensagem.criadoEm) : '';
      const ultimaTxt = c.ultimaMensagem?.texto
        ? (c.ultimaMensagem.senderPerfil === 'admin' ? `Você: ${c.ultimaMensagem.texto}` : c.ultimaMensagem.texto)
        : '<span style="color:#cf941d;font-style:italic;"><i class="bi bi-chat-plus"></i> Iniciar nova conversa</span>';

      const avatarImg = c.foto || c.logo;
      const avatarHtml = avatarImg
        ? `<img src="${avatarImg}" alt="${window.ChatClient.escapeHtml(c.nome)}">`
        : (c.tipo === 'empresario' ? '<i class="bi bi-building"></i>' : '<i class="bi bi-person"></i>');

      const roleBadge = c.tipo === 'empresario'
        ? '<span class="chat-role-pill chat-role-emp" style="font-size:0.65rem;margin-left:4px;">Empresa</span>'
        : '<span class="chat-role-pill chat-role-assoc" style="font-size:0.65rem;margin-left:4px;">Associado</span>';

      return `
        <div class="chat-contact-item ${isActive ? 'active' : ''}" onclick="window.chatUI.selecionarCanalAdmin('${c.channelId}')">
          <div class="chat-contact-avatar">
            ${avatarHtml}
            ${c.online ? '<span class="chat-online-dot" title="Online agora"></span>' : ''}
          </div>
          <div class="chat-contact-info">
            <div class="chat-contact-top">
              <div class="chat-contact-name">
                ${window.ChatClient.escapeHtml(c.nome)}
                ${roleBadge}
              </div>
              <div class="chat-contact-time">${hora}</div>
            </div>
            <div class="chat-contact-sub">${window.ChatClient.escapeHtml(c.subtitulo)}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
              <div class="chat-contact-last-msg">${ultimaTxt}</div>
              ${c.naoLidas > 0 ? `<span class="chat-contact-badge">${c.naoLidas}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    },

    renderizarListaContatosAdmin: function () {
      const listEl = document.getElementById('chatContactsList');
      if (!listEl) return;

      const filtro = this.adminState.filtro;

      // ── MODO BUSCA (procura em Associados E Empresários para permitir abrir qualquer chat) ──
      if (filtro) {
        const matchesAssoc = (this.adminState.canais.associados || []).filter((c) => {
          const nome = (c.nome || '').toLowerCase();
          const sub = (c.subtitulo || '').toLowerCase();
          const email = (c.email || '').toLowerCase();
          const tel = (c.telefone || '').toLowerCase();
          return nome.includes(filtro) || sub.includes(filtro) || email.includes(filtro) || tel.includes(filtro);
        });

        const matchesEmp = (this.adminState.canais.empresarios || []).filter((c) => {
          const nome = (c.nome || '').toLowerCase();
          const sub = (c.subtitulo || '').toLowerCase();
          const email = (c.email || '').toLowerCase();
          const tel = (c.telefone || '').toLowerCase();
          return nome.includes(filtro) || sub.includes(filtro) || email.includes(filtro) || tel.includes(filtro);
        });

        const totalEncontrados = matchesAssoc.length + matchesEmp.length;

        if (totalEncontrados === 0) {
          listEl.innerHTML = `
            <div style="padding:32px 16px;text-align:center;color:#94a3b8;font-size:0.85rem;">
              <i class="bi bi-search" style="font-size:1.8rem;opacity:0.35;display:block;margin-bottom:8px;"></i>
              Nenhum associado ou empresário encontrado para "<strong>${window.ChatClient.escapeHtml(filtro)}</strong>".
              <p style="font-size:0.75rem;margin-top:6px;opacity:0.75;">Verifique a grafia do nome, CPF, CNPJ ou matrícula.</p>
            </div>
          `;
          return;
        }

        let html = '';

        if (matchesAssoc.length > 0) {
          html += `
            <div class="chat-search-category-header">
              <i class="bi bi-people-fill"></i> Associados (${matchesAssoc.length})
            </div>
          `;
          html += matchesAssoc.map(c => this.renderizarCardContato(c)).join('');
        }

        if (matchesEmp.length > 0) {
          html += `
            <div class="chat-search-category-header">
              <i class="bi bi-building"></i> Empresas Parceiras (${matchesEmp.length})
            </div>
          `;
          html += matchesEmp.map(c => this.renderizarCardContato(c)).join('');
        }

        listEl.innerHTML = html;
        return;
      }

      // ── MODO NORMAL (lista da aba ativa) ──
      const lista = this.adminState.abaAtiva === 'associados'
        ? this.adminState.canais.associados
        : this.adminState.canais.empresarios;

      if (!lista || lista.length === 0) {
        listEl.innerHTML = `
          <div style="padding:32px 16px;text-align:center;color:#94a3b8;font-size:0.85rem;">
            <i class="bi bi-inbox" style="font-size:1.8rem;opacity:0.4;display:block;margin-bottom:8px;"></i>
            Nenhum contato cadastrado em ${this.adminState.abaAtiva === 'associados' ? 'Associados' : 'Empresários'}.
          </div>
        `;
        return;
      }

      listEl.innerHTML = lista.map(c => this.renderizarCardContato(c)).join('');
    },

    selecionarCanalAdmin: async function (channelId) {
      const todos = [...(this.adminState.canais.associados || []), ...(this.adminState.canais.empresarios || [])];
      const contato = todos.find((c) => c.channelId === channelId);
      if (!contato) return;

      this.adminState.canalSelecionado = contato;
      contato.naoLidas = 0;

      // Sincroniza aba ativa se o contato selecionado for de outra categoria
      if (contato.tipo === 'empresario' && this.adminState.abaAtiva !== 'empresarios') {
        this.adminState.abaAtiva = 'empresarios';
        document.getElementById('chatTabEmp')?.classList.add('active');
        document.getElementById('chatTabAssoc')?.classList.remove('active');
      } else if (contato.tipo === 'associado' && this.adminState.abaAtiva !== 'associados') {
        this.adminState.abaAtiva = 'associados';
        document.getElementById('chatTabAssoc')?.classList.add('active');
        document.getElementById('chatTabEmp')?.classList.remove('active');
      }

      // Zera contador daquele contato e sincroniza com backend
      window.ChatClient.marcarLidas(channelId);
      this.atualizarContadoresAbasAdmin(this.adminState.canais);
      this.renderizarListaContatosAdmin();

      // Mobile: alterna para conversa
      const container = document.querySelector('.chat-container');
      if (container) container.classList.add('chat-active-mobile');

      // Exibe painel ativo e oculta empty state
      const emptyEl = document.getElementById('chatEmptyState');
      const activeEl = document.getElementById('chatActivePanel');
      if (emptyEl) emptyEl.style.display = 'none';
      if (activeEl) activeEl.style.display = 'flex';

      // Atualiza cabeçalho do chat
      const nomeEl = document.getElementById('chatActiveNome');
      const subEl = document.getElementById('chatActiveSub');
      const avatarEl = document.getElementById('chatActiveAvatar');
      const roleEl = document.getElementById('chatActiveRolePill');
      const statusEl = document.getElementById('chatActiveStatus');
      const btnBack = document.getElementById('chatBtnMobileBack');

      if (btnBack) btnBack.style.display = window.innerWidth <= 768 ? 'inline-flex' : 'none';
      if (nomeEl) nomeEl.textContent = contato.nome;
      if (subEl) subEl.textContent = contato.subtitulo;

      const avatarImg = contato.foto || contato.logo;
      if (avatarEl) {
        avatarEl.innerHTML = avatarImg
          ? `<img src="${avatarImg}" alt="${window.ChatClient.escapeHtml(contato.nome)}">`
          : (contato.tipo === 'empresario' ? '<i class="bi bi-building"></i>' : '<i class="bi bi-person"></i>');
      }

      if (roleEl) {
        if (contato.tipo === 'empresario') {
          roleEl.className = 'chat-role-pill chat-role-emp';
          roleEl.textContent = 'Empresa Parceira';
        } else {
          roleEl.className = 'chat-role-pill chat-role-assoc';
          roleEl.textContent = 'Associado AMAS';
        }
      }

      if (statusEl) {
        statusEl.innerHTML = '<i class="bi bi-circle-fill" style="font-size:0.55rem;color:#22c55e;"></i> Online agora';
      }

      // Carrega e renderiza mensagens
      await this.carregarMensagensDoCanal(channelId, 'chatMessagesArea');

      const inputEl = document.getElementById('chatInputText');
      if (inputEl) inputEl.focus();
    },

    fecharMobile: function () {
      const container = document.querySelector('.chat-container');
      if (container) container.classList.remove('chat-active-mobile');
    },

    // ══════════════════════════════════════════════════════════════════
    // PAINEL DO ASSOCIADO & EMPRESÁRIO (CANAL 1-A-1 COM ADMIN)
    // ══════════════════════════════════════════════════════════════════
    iniciarCliente: async function (tipo) {
      this.modo = tipo; // 'associado' ou 'empresario'
      this.atualizarSessao();
      const rawId = String(this.sessao?.id || '').replace(/^(assoc_|emp_)/, '');
      this.clientState.channelId = tipo === 'empresario' ? `emp_${rawId}` : `assoc_${rawId}`;

      const targetAreaId = tipo === 'empresario' ? 'empChatMessagesArea' : 'userChatMessagesArea';
      await this.carregarMensagensDoCanal(this.clientState.channelId, targetAreaId);
      window.ChatClient.marcarLidas(this.clientState.channelId);

      const badgeId = tipo === 'empresario' ? 'badgeChatEmpresario' : 'badgeChatAssociado';
      const badgeEl = document.getElementById(badgeId);
      if (badgeEl) badgeEl.classList.add('hidden');
    },

    // ══════════════════════════════════════════════════════════════════
    // RENDERIZAÇÃO DE MENSAGENS E HISTÓRICO
    // ══════════════════════════════════════════════════════════════════
    carregarMensagensDoCanal: async function (channelId, containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = `
        <div style="padding:32px;text-align:center;color:#94a3b8;font-size:0.85rem;">
          <i class="bi bi-arrow-repeat spin" style="font-size:1.6rem;color:#cf941d;display:block;margin-bottom:8px;"></i>
          Carregando mensagens do atendimento...
        </div>
      `;

      const msgs = await window.ChatClient.carregarMensagens(channelId);
      this.renderizarMensagens(container, msgs);
    },

    renderizarMensagens: function (container, msgs) {
      if (!container) return;

      if (!msgs || msgs.length === 0) {
        const contato = this.adminState.canalSelecionado;
        const nomeDestino = contato ? contato.nome : 'Administração AMAS';

        container.innerHTML = `
          <div class="chat-empty-state">
            <div class="chat-empty-icon"><i class="bi bi-shield-check"></i></div>
            <h4 style="color:#fff;margin-bottom:6px;font-weight:700;">Atendimento Privado AMAS</h4>
            <p style="font-size:0.85rem;color:#94a3b8;max-width:400px;line-height:1.5;">
              Este canal é estritamente confidencial com <strong>${window.ChatClient.escapeHtml(nomeDestino)}</strong>.
              Envie uma mensagem abaixo para iniciar a conversa em tempo real.
            </p>
          </div>
        `;
        return;
      }

      let html = '';
      let ultimaData = '';
      this.atualizarSessao();
      const meuPerfil = this.sessao?.perfil;

      msgs.forEach((m) => {
        const dataCabecalho = window.ChatClient.formatarDataCabecalho(m.criadoEm);
        if (dataCabecalho && dataCabecalho !== ultimaData) {
          html += `
            <div class="chat-date-separator">
              <span>${dataCabecalho}</span>
            </div>
          `;
          ultimaData = dataCabecalho;
        }

        const isSent = (meuPerfil === 'admin' && m.senderPerfil === 'admin') ||
                       (meuPerfil !== 'admin' && m.senderPerfil !== 'admin');

        const hora = window.ChatClient.formatarHora(m.criadoEm);
        const anexoHtml = m.anexo ? window.ChatClient.renderAnexoHTML(m.anexo) : '';
        const checkIcon = isSent
          ? `<i class="bi bi-check2-all chat-msg-status ${m.lida ? 'read' : ''}" title="${m.lida ? 'Lida' : 'Enviada'}"></i>`
          : '';

        html += `
          <div class="chat-msg-row ${isSent ? 'sent' : 'received'}" id="msgRow_${m.id}">
            <div class="chat-msg-author">${window.ChatClient.escapeHtml(m.senderNome)}</div>
            <div class="chat-msg-bubble">
              ${m.texto ? `<div class="chat-msg-text">${window.ChatClient.escapeHtml(m.texto)}</div>` : ''}
              ${anexoHtml}
              <div class="chat-msg-meta">
                <span>${hora}</span>
                ${checkIcon}
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      this.rolarAteOFim(container);
    },

    adicionarMensagemAoDOM: function (containerId, msg) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const emptyEl = container.querySelector('.chat-empty-state');
      if (emptyEl) {
        container.innerHTML = '';
      }

      if (document.getElementById(`msgRow_${msg.id}`)) return;

      this.atualizarSessao();
      const meuPerfil = this.sessao?.perfil;
      const isSent = (meuPerfil === 'admin' && msg.senderPerfil === 'admin') ||
                     (meuPerfil !== 'admin' && msg.senderPerfil !== 'admin');

      const hora = window.ChatClient.formatarHora(msg.criadoEm);
      const anexoHtml = msg.anexo ? window.ChatClient.renderAnexoHTML(msg.anexo) : '';
      const checkIcon = isSent
        ? `<i class="bi bi-check2-all chat-msg-status ${msg.lida ? 'read' : ''}"></i>`
        : '';

      const div = document.createElement('div');
      div.className = `chat-msg-row ${isSent ? 'sent' : 'received'}`;
      div.id = `msgRow_${msg.id}`;
      div.innerHTML = `
        <div class="chat-msg-author">${window.ChatClient.escapeHtml(msg.senderNome)}</div>
        <div class="chat-msg-bubble">
          ${msg.texto ? `<div class="chat-msg-text">${window.ChatClient.escapeHtml(msg.texto)}</div>` : ''}
          ${anexoHtml}
          <div class="chat-msg-meta">
            <span>${hora}</span>
            ${checkIcon}
          </div>
        </div>
      `;

      container.appendChild(div);
      this.rolarAteOFim(container);
    },

    atualizarUltimaMensagemNaLista: function (channelId, msg) {
      if (!channelId || !msg) return;
      const todos = [...(this.adminState.canais.associados || []), ...(this.adminState.canais.empresarios || [])];
      const contato = todos.find(c => c.channelId === channelId);
      if (contato) {
        contato.ultimaMensagem = {
          texto: msg.texto || (msg.anexo ? `[Anexo: ${msg.anexo.nome}]` : ''),
          criadoEm: msg.criadoEm,
          senderPerfil: msg.senderPerfil,
          senderNome: msg.senderNome
        };
        this.renderizarListaContatosAdmin();
      }
    },

    rolarAteOFim: function (container) {
      if (!container) return;
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    },

    // ══════════════════════════════════════════════════════════════════
    // GESTÃO DE ENVIO DE MENSAGENS E ANEXOS
    // ══════════════════════════════════════════════════════════════════
    aoSelecionarArquivo: function (e, tipo) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const prefixo = tipo === 'emp' ? 'empChat' : (tipo === 'user' ? 'userChat' : 'chat');
      const stagedContainer = document.getElementById(`${prefixo}StagedAttachment`);

      if (file.size > 20 * 1024 * 1024) {
        if (typeof showToast === 'function') {
          showToast('O arquivo excede o limite máximo permitido de 20MB.', 'error');
        } else {
          alert('O arquivo excede o limite máximo de 20MB.');
        }
        e.target.value = '';
        return;
      }

      if (tipo === 'emp' || tipo === 'user') {
        this.clientState.anexoStaged = file;
      } else {
        this.adminState.anexoStaged = file;
      }

      if (stagedContainer) {
        stagedContainer.style.display = 'flex';
        stagedContainer.innerHTML = `
          <i class="bi bi-paperclip"></i>
          <span style="font-weight:600;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${window.ChatClient.escapeHtml(file.name)}</span>
          <span style="opacity:0.8;">(${window.ChatClient.formatarBytes(file.size)})</span>
          <button type="button" class="btn-remove" onclick="window.chatUI.removerAnexoStaged('${tipo || 'admin'}')" title="Remover anexo">✕</button>
        `;
      }
    },

    removerAnexoStaged: function (tipo) {
      const prefixo = tipo === 'emp' ? 'empChat' : (tipo === 'user' ? 'userChat' : 'chat');
      const stagedContainer = document.getElementById(`${prefixo}StagedAttachment`);
      const fileInput = document.getElementById(`${prefixo}FileInput`);

      if (tipo === 'emp' || tipo === 'user') {
        this.clientState.anexoStaged = null;
      } else {
        this.adminState.anexoStaged = null;
      }

      if (fileInput) fileInput.value = '';
      if (stagedContainer) {
        stagedContainer.style.display = 'none';
        stagedContainer.innerHTML = '';
      }
    },

    aoDigitarTexto: function (e, tipo) {
      const channelId = this.modo === 'admin'
        ? this.adminState.canalSelecionado?.channelId
        : this.clientState.channelId;

      if (!channelId) return;

      window.ChatClient.notificarDigitando(channelId, true);
      const stateObj = this.modo === 'admin' ? this.adminState : this.clientState;
      if (stateObj.typingTimeout) clearTimeout(stateObj.typingTimeout);
      stateObj.typingTimeout = setTimeout(() => {
        window.ChatClient.notificarDigitando(channelId, false);
      }, 2500);

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.enviarMensagemAtual(tipo);
      }
    },

    enviarMensagemAtual: async function (tipo) {
      const prefixo = tipo === 'emp' ? 'empChat' : (tipo === 'user' ? 'userChat' : 'chat');
      const inputEl = document.getElementById(`${prefixo}InputText`);
      const btnSend = document.getElementById(`${prefixo}BtnSend`);
      const fileInput = document.getElementById(`${prefixo}FileInput`);

      const channelId = this.modo === 'admin'
        ? this.adminState.canalSelecionado?.channelId
        : this.clientState.channelId;

      if (!channelId) {
        if (typeof showToast === 'function') showToast('Selecione uma conversa para enviar a mensagem.', 'warning');
        return;
      }

      const texto = (inputEl ? inputEl.value : '').trim();
      const file = (tipo === 'emp' || tipo === 'user')
        ? this.clientState.anexoStaged
        : this.adminState.anexoStaged;

      if (!texto && !file) return;

      if (btnSend) {
        btnSend.disabled = true;
        btnSend.innerHTML = '<i class="bi bi-arrow-repeat spin"></i>';
      }

      try {
        let anexoObj = null;
        if (file) {
          anexoObj = await window.ChatClient.uploadAnexo(file);
        }

        const res = await window.ChatClient.enviarMensagem(channelId, texto, anexoObj);

        if (inputEl) {
          inputEl.value = '';
          inputEl.style.height = 'auto';
        }
        if (fileInput) fileInput.value = '';
        this.removerAnexoStaged(tipo);

        if (res && res.mensagem) {
          const containerId = this.modo === 'admin'
            ? 'chatMessagesArea'
            : (this.modo === 'empresario' ? 'empChatMessagesArea' : 'userChatMessagesArea');
          this.adicionarMensagemAoDOM(containerId, res.mensagem);

          if (this.modo === 'admin') {
            this.atualizarUltimaMensagemNaLista(channelId, res.mensagem);
          }
        }
      } catch (err) {
        console.error('Erro ao enviar mensagem no chat:', err);
        const errMsg = err?.message || 'Falha ao enviar mensagem.';
        if (typeof showToast === 'function') {
          showToast(errMsg, 'error');
        } else {
          alert(errMsg);
        }
      } finally {
        if (btnSend) {
          btnSend.disabled = false;
          btnSend.innerHTML = '<i class="bi bi-send-fill"></i>';
        }
      }
    },

    // ══════════════════════════════════════════════════════════════════
    // SINCRONIZAÇÃO EM TEMPO REAL (EVENTOS WEBSOCKET)
    // ══════════════════════════════════════════════════════════════════
    aoReceberNovaMensagem: function (msg) {
      if (!msg) return;

      const isMinha = window.ChatClient && typeof window.ChatClient.isMinhaMensagem === 'function'
        ? window.ChatClient.isMinhaMensagem(msg)
        : false;

      if (this.modo === 'admin') {
        const canalAtual = this.adminState.canalSelecionado?.channelId;

        if (canalAtual === msg.channelId) {
          this.adicionarMensagemAoDOM('chatMessagesArea', msg);
          if (!isMinha) {
            window.ChatClient.marcarLidas(canalAtual);
          }
        }

        this.atualizarUltimaMensagemNaLista(msg.channelId, msg);

        // Se a mensagem veio de outra pessoa, atualiza a lista e contadores
        if (!isMinha) {
          this.carregarCanaisAdmin();
        }
        return;
      }

      if (msg.channelId === this.clientState.channelId) {
        const containerId = this.modo === 'empresario' ? 'empChatMessagesArea' : 'userChatMessagesArea';
        this.adicionarMensagemAoDOM(containerId, msg);

        // Mensagem enviada por mim mesmo nunca deve disparar notificação nem incrementar badge
        if (isMinha) return;

        const secChat = document.getElementById('sec-chat');
        if (secChat && !secChat.classList.contains('hidden')) {
          window.ChatClient.marcarLidas(this.clientState.channelId);
        } else {
          this.incrementarBadgeCliente();
        }
      }
    },

    aoReceberDigitando: function (data) {
      if (!data) return;

      if (this.modo === 'admin') {
        if (this.adminState.canalSelecionado?.channelId === data.channelId) {
          const typingEl = document.getElementById('chatTypingIndicator');
          if (typingEl) {
            typingEl.innerHTML = data.isTyping
              ? `<i class="bi bi-pencil-fill"></i> ${window.ChatClient.escapeHtml(data.senderNome || 'Usuário')} está digitando...`
              : '';
            typingEl.classList.toggle('hidden', !data.isTyping);
          }
        }
      } else {
        if (data.channelId === this.clientState.channelId && data.senderPerfil === 'admin') {
          const prefixo = this.modo === 'empresario' ? 'empChat' : 'userChat';
          const typingEl = document.getElementById(`${prefixo}TypingIndicator`);
          if (typingEl) {
            typingEl.innerHTML = data.isTyping
              ? '<i class="bi bi-pencil-fill"></i> Administração AMAS está digitando...'
              : '';
            typingEl.classList.toggle('hidden', !data.isTyping);
          }
        }
      }
    },

    aoAtualizarStatusOnline: function (data) {
      if (!data || !data.channelId) return;

      if (this.modo === 'admin') {
        const todos = [...(this.adminState.canais.associados || []), ...(this.adminState.canais.empresarios || [])];
        const contato = todos.find((c) => c.channelId === data.channelId);
        if (contato) {
          contato.online = !!data.online;
          this.renderizarListaContatosAdmin();
        }
        if (this.adminState.canalSelecionado?.channelId === data.channelId) {
          const statusEl = document.getElementById('chatActiveStatus');
          if (statusEl) {
            statusEl.innerHTML = data.online
              ? '<i class="bi bi-circle-fill" style="font-size:0.55rem;color:#22c55e;"></i> Online agora'
              : '<i class="bi bi-circle" style="font-size:0.55rem;color:#94a3b8;"></i> Offline';
          }
        }
      }
    },

    incrementarBadgeCliente: function () {
      const badgeId = this.modo === 'empresario' ? 'badgeChatEmpresario' : 'badgeChatAssociado';
      const badgeEl = document.getElementById(badgeId);
      if (badgeEl) {
        let count = parseInt(badgeEl.textContent || '0', 10);
        count = isNaN(count) ? 1 : count + 1;
        badgeEl.textContent = count;
        badgeEl.classList.remove('hidden');
      }
    },

    atualizarBadgesGlobais: async function () {
      if (this.modo === 'admin') {
        const res = await window.ChatClient.carregarCanais();
        if (res && res.ok) {
          this.atualizarContadoresAbasAdmin(res);
        }
      } else if (this.clientState.channelId) {
        const msgs = await window.ChatClient.carregarMensagens(this.clientState.channelId);
        const naoLidas = msgs.filter((m) => m.senderPerfil === 'admin' && !m.lida).length;
        const badgeId = this.modo === 'empresario' ? 'badgeChatEmpresario' : 'badgeChatAssociado';
        const badgeEl = document.getElementById(badgeId);
        if (badgeEl) {
          badgeEl.textContent = naoLidas;
          badgeEl.classList.toggle('hidden', naoLidas === 0);
        }
      }
    },

    atualizarMensagens: function () {
      if (this.modo === 'admin') {
        const cId = this.adminState.canalSelecionado?.channelId;
        if (cId) this.carregarMensagensDoCanal(cId, 'chatMessagesArea');
      } else if (this.clientState.channelId) {
        const targetId = this.modo === 'empresario' ? 'empChatMessagesArea' : 'userChatMessagesArea';
        this.carregarMensagensDoCanal(this.clientState.channelId, targetId);
      }
    }
  };

  window.chatUI = ChatUI;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChatUI.init());
  } else {
    ChatUI.init();
  }
})(window);
