/**
 * Cliente de Chat Oficial da AMAS (WebSocket + HTTP)
 * Gerencia conexão em tempo real, persistência no backend padrão (Spring Boot / Render)
 * com fallback local, envio de anexos, notificações sonoras sintetizadas
 * e sincronização de mensagens privadas para Admin, Associado e Empresário.
 */
(function (window) {
  'use strict';

  // Som suave de notificação via Web Audio API (zero dependências externas)
  function tocarSinoNotificacao() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.0, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch (e) {
      // Ignora silenciosamente em navegadores com restrição de som
    }
  }

  const ChatClient = {
    ws: null,
    sessao: null,
    reconnectTimer: null,
    broadcastChannel: null,
    listeners: {
      nova_mensagem: [],
      status_online: [],
      digitando: [],
      mensagens_lidas: [],
      conectado: [],
      desconectado: []
    },

    init: function () {
      this.atualizarSessao();
      this.setupBroadcastChannel();
      this.conectar();
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

    isMsgEnviadaPorAdmin: function (m) {
      if (!m) return false;
      const p = String(m.senderPerfil || '').toLowerCase().trim();
      const id = String(m.senderId || '').toLowerCase().trim();
      const nome = String(m.senderNome || '').toLowerCase().trim();
      return p === 'admin' || p === 'administrador' || id === 'admin' || nome.includes('administra');
    },

    isMinhaMensagem: function (msg) {
      if (!msg) return false;
      this.atualizarSessao();

      // Detecção inteligente de perfil de quem está usando este navegador
      const ehTelaAdmin = (window.location && window.location.pathname.includes('admin')) ||
                          !!document.getElementById('adminNome') ||
                          (window.chatUI && window.chatUI.modo === 'admin');

      const meuPerfil = ehTelaAdmin ? 'admin' : String(this.sessao?.perfil || '').toLowerCase().trim();

      const senderPerfil = String(msg.senderPerfil || '').toLowerCase().trim();
      const senderId = String(msg.senderId || '').trim().toLowerCase();
      const senderNome = String(msg.senderNome || '').toLowerCase().trim();

      // Caso 1: Admin
      if (meuPerfil === 'admin' || ehTelaAdmin) {
        if (senderPerfil === 'admin' || senderPerfil === 'administrador' || senderId === 'admin' || senderNome.includes('administra')) {
          return true;
        }
      }

      // Caso 2: Associado ou Empresário
      if (this.sessao) {
        const rawMeuId = String(this.sessao.id || '').replace(/^(assoc_|emp_)/, '').trim().toLowerCase();
        const rawSenderId = senderId.replace(/^(assoc_|emp_)/, '').trim().toLowerCase();

        if (meuPerfil && senderPerfil && meuPerfil === senderPerfil) {
          if (rawMeuId && rawSenderId && rawMeuId === rawSenderId) {
            return true;
          }
        }

        const currentId = meuPerfil === 'empresario' ? `emp_${rawMeuId}` : `assoc_${rawMeuId}`;
        if (senderId && (senderId === currentId || senderId === rawMeuId || senderId === String(this.sessao.id).toLowerCase())) {
          return true;
        }
      }

      return false;
    },

    setupBroadcastChannel: function () {
      if (typeof window.BroadcastChannel === 'function' && !this.broadcastChannel) {
        try {
          this.broadcastChannel = new BroadcastChannel('amas_chat_bus');
          this.broadcastChannel.onmessage = (event) => {
            const data = event.data;
            if (data && data.tipo === 'nova_mensagem') {
              const ehMinha = this.isMinhaMensagem(data.mensagem);
              // NUNCA toca som nem dispara nova notificação se a mensagem for do próprio usuário
              if (ehMinha) return;

              tocarSinoNotificacao();
              this.emit('nova_mensagem', data.mensagem);
            } else if (data && data.tipo === 'digitando') {
              this.emit('digitando', data);
            }
          };
        } catch (_) {}
      }
    },

    conectar: function () {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      // WebSocket tenta conectar na mesma porta do servidor se estiver rodando
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.atualizarSessao();
          if (this.sessao) {
            this.ws.send(JSON.stringify({
              tipo: 'auth',
              sessao: this.sessao
            }));
          }
          this.emit('conectado', true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.tipo === 'nova_mensagem') {
              if (data.mensagem && data.mensagem.channelId) {
                const m = data.mensagem;
                const cached = this.obterCacheLocal(m.channelId);
                if (!cached.some(item => String(item.id) === String(m.id))) {
                  cached.push(m);
                  cached.sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());
                  this.salvarCacheLocal(m.channelId, cached);
                }
              }

              const ehMinha = this.isMinhaMensagem(data.mensagem);
              if (!ehMinha) {
                tocarSinoNotificacao();
                this.emit('nova_mensagem', data.mensagem);
              } else {
                this.emit('minha_mensagem_enviada', data.mensagem);
              }
            } else if (data.tipo === 'status_online') {
              this.emit('status_online', data);
            } else if (data.tipo === 'digitando') {
              this.emit('digitando', data);
            } else if (data.tipo === 'mensagens_lidas') {
              this.emit('mensagens_lidas', data);
            }
          } catch (err) {
            console.error('Erro ao ler pacote WS:', err);
          }
        };

        this.ws.onclose = () => {
          this.emit('desconectado', false);
          this.agendarReconexao();
        };

        this.ws.onerror = (err) => {
          console.warn('WebSocket chat error:', err);
        };
      } catch (e) {
        this.agendarReconexao();
      }
    },

    agendarReconexao: function () {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.conectar();
      }, 4000);
    },

    on: function (evento, callback) {
      if (this.listeners[evento]) {
        this.listeners[evento].push(callback);
      }
    },

    emit: function (evento, data) {
      if (this.listeners[evento]) {
        this.listeners[evento].forEach((fn) => {
          try {
            fn(data);
          } catch (e) {
            console.error(`Erro no listener de ${evento}:`, e);
          }
        });
      }
    },

    // ─── Resolução de URLs e Comunicação com o Backend Padrão ────────────
    salvarCacheLocal: function (channelId, msgs) {
      if (!channelId || !Array.isArray(msgs)) return;
      try {
        localStorage.setItem(`amas_chat_cache_${channelId}`, JSON.stringify(msgs));
      } catch (e) {
        console.warn('Erro ao salvar cache de mensagens:', e);
      }
    },

    obterCacheLocal: function (channelId) {
      if (!channelId) return [];
      try {
        const raw = localStorage.getItem(`amas_chat_cache_${channelId}`);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    /**
     * Resolve a URL exata do backend (Render / Spring Boot em produção ou localhost em dev).
     */
    getApiUrl: function (endpoint) {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
      let base = '';
      if (typeof API_BASE === 'string' && API_BASE) {
        base = API_BASE.replace(/\/$/, '');
      } else if (window.AMAS_CONFIG && window.AMAS_CONFIG.apiBase) {
        base = window.AMAS_CONFIG.apiBase.replace(/\/$/, '');
      } else {
        base = 'https://amas-m58z.onrender.com/api';
      }
      return `${base}${cleanEndpoint}`;
    },

    getAuthHeaders: function (extraHeaders = {}) {
      const headers = Object.assign({ 'Content-Type': 'application/json' }, extraHeaders);
      try {
        const s = this.atualizarSessao();
        if (s && s.token) {
          headers['Authorization'] = 'Bearer ' + s.token;
        }
      } catch (_) {}
      return headers;
    },

    /**
     * Carrega lista de canais de associados e empresários para o Admin.
     */
    carregarCanais: async function () {
      const headers = this.getAuthHeaders();
      const canalAberto = window.chatUI?.adminState?.canalSelecionado?.channelId;

      // 1. Tenta carregar do backend padrão (Render / Spring Boot)
      try {
        const resp = await fetch(this.getApiUrl('/chat/canais'), { headers });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.ok && Array.isArray(data.associados) && Array.isArray(data.empresarios)) {
            // Se o admin estiver com uma conversa aberta no momento, zera o contador desse canal
            if (canalAberto) {
              data.associados.forEach(c => { if (c.channelId === canalAberto) c.naoLidas = 0; });
              data.empresarios.forEach(c => { if (c.channelId === canalAberto) c.naoLidas = 0; });
              data.totalNaoLidas = data.associados.reduce((acc, c) => acc + (c.naoLidas || 0), 0) +
                                   data.empresarios.reduce((acc, c) => acc + (c.naoLidas || 0), 0);
            }
            try { localStorage.setItem('amas_chat_canais_cache', JSON.stringify(data)); } catch (_) {}
            return data;
          }
        }
      } catch (_) {}

      // 2. Tenta carregar do servidor local (/api/chat/canais) se disponível
      try {
        const localResp = await fetch('/api/chat/canais', { headers });
        if (localResp.ok) {
          const data = await localResp.json();
          if (data && data.ok && Array.isArray(data.associados) && Array.isArray(data.empresarios)) {
            if (canalAberto) {
              data.associados.forEach(c => { if (c.channelId === canalAberto) c.naoLidas = 0; });
              data.empresarios.forEach(c => { if (c.channelId === canalAberto) c.naoLidas = 0; });
              data.totalNaoLidas = data.associados.reduce((acc, c) => acc + (c.naoLidas || 0), 0) +
                                   data.empresarios.reduce((acc, c) => acc + (c.naoLidas || 0), 0);
            }
            try { localStorage.setItem('amas_chat_canais_cache', JSON.stringify(data)); } catch (_) {}
            return data;
          }
        }
      } catch (_) {}

      // 3. Fallback: carrega direto das rotas /associados e /empresarios do backend
      try {
        let associados = [];
        let empresarios = [];

        try {
          const rA = await fetch(this.getApiUrl('/associados'), { headers });
          if (rA.ok) associados = await rA.json();
        } catch (_) {}

        try {
          const rE = await fetch(this.getApiUrl('/empresarios'), { headers });
          if (rE.ok) empresarios = await rE.json();
        } catch (_) {}

        // Tenta também via funções globais do sistema se vazios
        if ((!associados || associados.length === 0) && typeof getAssociados === 'function') {
          try { associados = await getAssociados(); } catch (_) {}
        }
        if ((!empresarios || empresarios.length === 0) && typeof getEmpresarios === 'function') {
          try { empresarios = await getEmpresarios(); } catch (_) {}
        }

        const canaisAssoc = (associados || []).map((a) => {
          const channelId = `assoc_${a.id}`;
          const msgs = this.obterCacheLocal(channelId);
          const ultimaMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
          let naoLidas = msgs.filter((m) => !this.isMsgEnviadaPorAdmin(m) && !m.lida).length;
          if (canalAberto && canalAberto === channelId) naoLidas = 0;

          return {
            id: a.id,
            channelId,
            tipo: 'associado',
            nome: a.nome || 'Associado AMAS',
            subtitulo: `Matrícula: ${a.matricula || 'AMAS-00' + a.id} · CPF: ${a.cpf || '—'}`,
            email: a.email || '',
            telefone: a.telefone || '',
            status: a.status || 'Regular',
            foto: a.foto || '',
            ultimaMensagem: ultimaMsg ? {
              texto: ultimaMsg.texto || (ultimaMsg.anexo ? `[Anexo: ${ultimaMsg.anexo.nome}]` : ''),
              criadoEm: ultimaMsg.criadoEm,
              senderPerfil: ultimaMsg.senderPerfil,
              senderNome: ultimaMsg.senderNome
            } : null,
            naoLidas,
            online: true
          };
        });

        const canaisEmp = (empresarios || []).map((e) => {
          const channelId = `emp_${e.id}`;
          const msgs = this.obterCacheLocal(channelId);
          const ultimaMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
          let naoLidas = msgs.filter((m) => !this.isMsgEnviadaPorAdmin(m) && !m.lida).length;
          if (canalAberto && canalAberto === channelId) naoLidas = 0;
          const logoImg = e.logo || e.foto || (e.contrato && (e.contrato.logo || e.contrato.foto)) || '';

          return {
            id: e.id,
            channelId,
            tipo: 'empresario',
            nome: e.nome || 'Empresa Parceira',
            subtitulo: `CNPJ: ${e.cnpj || '—'} · ${e.contrato?.tipoAcordo || 'Parceiro AMAS'}`,
            email: e.email || '',
            telefone: e.telefone || '',
            logo: logoImg,
            foto: logoImg,
            ultimaMensagem: ultimaMsg ? {
              texto: ultimaMsg.texto || (ultimaMsg.anexo ? `[Anexo: ${ultimaMsg.anexo.nome}]` : ''),
              criadoEm: ultimaMsg.criadoEm,
              senderPerfil: ultimaMsg.senderPerfil,
              senderNome: ultimaMsg.senderNome
            } : null,
            naoLidas,
            online: true
          };
        });

        const totalNaoLidas = canaisAssoc.reduce((acc, c) => acc + c.naoLidas, 0) + canaisEmp.reduce((acc, c) => acc + c.naoLidas, 0);
        const resultado = { ok: true, associados: canaisAssoc, empresarios: canaisEmp, totalNaoLidas };
        try { localStorage.setItem('amas_chat_canais_cache', JSON.stringify(resultado)); } catch (_) {}
        return resultado;
      } catch (err) {
        console.warn('Erro ao carregar canais:', err);
        try {
          const raw = localStorage.getItem('amas_chat_canais_cache');
          if (raw) return JSON.parse(raw);
        } catch (_) {}
        return { ok: false, associados: [], empresarios: [], totalNaoLidas: 0 };
      }
    },

    /**
     * Carrega histórico de mensagens de um canal.
     */
    carregarMensagens: async function (channelId) {
      let localMsgs = this.obterCacheLocal(channelId);
      const headers = this.getAuthHeaders();

      // 1. Tenta carregar do backend padrão (Render / Spring Boot)
      try {
        const resp = await fetch(this.getApiUrl(`/chat/mensagens/${encodeURIComponent(channelId)}`), { headers });
        if (resp.ok) {
          const data = await resp.json();
          const serverMsgs = data.mensagens || [];

          const idMap = new Map();
          localMsgs.forEach((m) => idMap.set(String(m.id), m));
          serverMsgs.forEach((sm) => {
            const existing = idMap.get(String(sm.id));
            if (existing && existing.lida && !sm.lida) {
              sm.lida = true; // Preserva status de lida já atribuído na visualização local
            }
            idMap.set(String(sm.id), sm);
          });

          const merged = Array.from(idMap.values());
          merged.sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());
          this.salvarCacheLocal(channelId, merged);
          return merged;
        }
      } catch (_) {}

      // 2. Tenta carregar do servidor local se disponível
      try {
        const resp = await fetch(`/api/chat/mensagens/${encodeURIComponent(channelId)}`, { headers });
        if (resp.ok) {
          const data = await resp.json();
          const serverMsgs = data.mensagens || [];

          const idMap = new Map();
          localMsgs.forEach((m) => idMap.set(String(m.id), m));
          serverMsgs.forEach((sm) => {
            const existing = idMap.get(String(sm.id));
            if (existing && existing.lida && !sm.lida) {
              sm.lida = true; // Preserva status de lida já atribuído localmente
            }
            idMap.set(String(sm.id), sm);
          });

          const merged = Array.from(idMap.values());
          merged.sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());
          this.salvarCacheLocal(channelId, merged);
          return merged;
        }
      } catch (_) {}

      return localMsgs;
    },

    /**
     * Envia e persiste mensagem no backend padrão com resiliência total.
     */
    enviarMensagem: async function (channelId, texto, anexo) {
      this.atualizarSessao();
      if (!this.sessao) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      if (!channelId) {
        throw new Error('Nenhum canal de conversa selecionado.');
      }

      const ehTelaAdmin = (window.location && window.location.pathname.includes('admin')) ||
                          !!document.getElementById('adminNome') ||
                          (window.chatUI && window.chatUI.modo === 'admin');

      const perfil = ehTelaAdmin ? 'admin' : (this.sessao?.perfil || 'associado');
      const rawId = String(this.sessao?.id || '').replace(/^(assoc_|emp_)/, '');
      const senderId = perfil === 'admin'
        ? 'admin'
        : (perfil === 'empresario' ? `emp_${rawId}` : `assoc_${rawId}`);
      const senderNome = perfil === 'admin'
        ? 'Administração AMAS'
        : (this.sessao?.nome || (perfil === 'empresario' ? 'Empresa Parceira' : 'Associado AMAS'));

      const payload = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        channelId,
        texto: (texto || '').trim(),
        anexo: anexo || null,
        senderId,
        senderNome,
        senderPerfil: perfil,
        criadoEm: new Date().toISOString(),
        lida: false
      };

      const headers = this.getAuthHeaders();
      let persistiuNoBackend = false;

      // 1. Envia para o backend padrão (Render / Spring Boot)
      try {
        const primaryUrl = this.getApiUrl('/chat/mensagens');
        const resp = await fetch(primaryUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.mensagem) {
            payload.id = data.mensagem.id || payload.id;
            persistiuNoBackend = true;
          }
        }
      } catch (err) {
        console.warn('Aviso: envio primário ao backend padrão oscilou, tentando rota alternativa...', err);
      }

      // 2. Se o primário falhou e for URL remota, tenta envio na rota local
      if (!persistiuNoBackend) {
        try {
          const localResp = await fetch('/api/chat/mensagens', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          if (localResp.ok) {
            const data = await localResp.json();
            if (data && data.mensagem) {
              payload.id = data.mensagem.id || payload.id;
              persistiuNoBackend = true;
            }
          }
        } catch (_) {}
      }

      // 3. Salva no cache local (garante que a mensagem apareça instantaneamente)
      const cached = this.obterCacheLocal(channelId);
      if (!cached.some(m => String(m.id) === String(payload.id))) {
        cached.push(payload);
        cached.sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());
        this.salvarCacheLocal(channelId, cached);
      }

      // 4. Sincroniza via BroadcastChannel com outras abas
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({
            tipo: 'nova_mensagem',
            mensagem: payload
          });
        } catch (_) {}
      }

      return { ok: true, mensagem: payload, salvoNoServidor: persistiuNoBackend };
    },

    /**
     * Processa upload de anexos (imagens, PDFs e documentos).
     */
    uploadAnexo: async function (file) {
      return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('Nenhum arquivo selecionado.'));
        if (file.size > 20 * 1024 * 1024) {
          return reject(new Error('O arquivo excede o limite máximo de 20MB.'));
        }

        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result;
          const ext = file.name.split('.').pop().toLowerCase();
          let tipo = 'arquivo';
          if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) tipo = 'imagem';
          else if (ext === 'pdf') tipo = 'pdf';
          else if (['doc', 'docx', 'odt', 'txt'].includes(ext)) tipo = 'documento';

          const anexoObj = {
            nome: file.name,
            url: base64,
            tipo,
            tamanho: file.size
          };

          const headers = this.getAuthHeaders();

          // Tenta enviar para o backend
          try {
            const resp = await fetch(this.getApiUrl('/chat/upload'), {
              method: 'POST',
              headers,
              body: JSON.stringify({
                nomeArquivo: file.name,
                base64: base64,
                tamanho: file.size,
                tipo
              })
            });
            if (resp.ok) {
              const data = await resp.json();
              if (data && data.anexo) {
                return resolve(data.anexo);
              }
            }
          } catch (_) {}

          // Retorno imediato resiliente
          resolve(anexoObj);
        };
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
        reader.readAsDataURL(file);
      });
    },

    /**
     * Marca mensagens como lidas com atualização imediata e sincronização resiliente.
     */
    marcarLidas: async function (channelId) {
      if (!channelId) return;
      this.atualizarSessao();
      const ehTelaAdmin = (window.location && window.location.pathname.includes('admin')) ||
                          !!document.getElementById('adminNome') ||
                          (window.chatUI && window.chatUI.modo === 'admin');
      const perfil = ehTelaAdmin ? 'admin' : (this.sessao?.perfil || 'admin');
      const headers = this.getAuthHeaders();

      // 1. Marca no cache local de mensagens imediatamente
      const cached = this.obterCacheLocal(channelId);
      let alterou = false;
      cached.forEach(m => {
        if (!m.lida) {
          m.lida = true;
          alterou = true;
        }
      });
      if (alterou) {
        this.salvarCacheLocal(channelId, cached);
      }

      // 2. Atualiza imediatamente o cache de canais (amas_chat_canais_cache)
      try {
        const raw = localStorage.getItem('amas_chat_canais_cache');
        if (raw) {
          const cCache = JSON.parse(raw);
          let mod = false;
          (cCache.associados || []).forEach(c => {
            if (c.channelId === channelId && c.naoLidas > 0) {
              c.naoLidas = 0;
              mod = true;
            }
          });
          (cCache.empresarios || []).forEach(c => {
            if (c.channelId === channelId && c.naoLidas > 0) {
              c.naoLidas = 0;
              mod = true;
            }
          });
          if (mod) {
            cCache.totalNaoLidas = (cCache.associados || []).reduce((acc, c) => acc + (c.naoLidas || 0), 0) +
                                   (cCache.empresarios || []).reduce((acc, c) => acc + (c.naoLidas || 0), 0);
            localStorage.setItem('amas_chat_canais_cache', JSON.stringify(cCache));
          }
        }
      } catch (_) {}

      // 3. Notifica o backend padrão (PATCH e POST para compatibilidade)
      const payloadLidas = JSON.stringify({ leitorPerfil: perfil });
      try {
        await fetch(this.getApiUrl(`/chat/mensagens/${encodeURIComponent(channelId)}/lidas`), {
          method: 'PATCH',
          headers,
          body: payloadLidas
        });
      } catch (_) {
        try {
          await fetch(this.getApiUrl(`/chat/mensagens/${encodeURIComponent(channelId)}/lidas`), {
            method: 'POST',
            headers,
            body: payloadLidas
          });
        } catch (_) {}
      }

      try {
        await fetch(`/api/chat/mensagens/${encodeURIComponent(channelId)}/lidas`, {
          method: 'PATCH',
          headers,
          body: payloadLidas
        });
      } catch (_) {
        try {
          await fetch(`/api/chat/mensagens/${encodeURIComponent(channelId)}/lidas`, {
            method: 'POST',
            headers,
            body: payloadLidas
          });
        } catch (_) {}
      }
    },

    notificarDigitando: function (channelId, isTyping) {
      this.atualizarSessao();
      if (!this.sessao) return;
      const payload = {
        tipo: 'digitando',
        channelId,
        senderPerfil: this.sessao.perfil,
        senderNome: this.sessao.perfil === 'admin' ? 'Administração AMAS' : this.sessao.nome,
        isTyping: !!isTyping
      };

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try { this.ws.send(JSON.stringify(payload)); } catch (_) {}
      }
      if (this.broadcastChannel) {
        try { this.broadcastChannel.postMessage(payload); } catch (_) {}
      }
    },

    // ─── Formatadores e Helpers de UI ──────────────────────────────
    formatarHora: function (isoString) {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return '';
      }
    },

    formatarDataCabecalho: function (isoString) {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        const hoje = new Date();
        if (d.toDateString() === hoje.toDateString()) return 'Hoje';
        const ontem = new Date();
        ontem.setDate(hoje.getDate() - 1);
        if (d.toDateString() === ontem.toDateString()) return 'Ontem';
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      } catch (e) {
        return '';
      }
    },

    formatarBytes: function (bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    escapeHtml: function (text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    renderAnexoHTML: function (anexo) {
      if (!anexo || !anexo.url) return '';
      const nome = this.escapeHtml(anexo.nome || 'arquivo');
      const url = anexo.url;
      const tipo = anexo.tipo || 'arquivo';
      const tamanho = this.formatarBytes(anexo.tamanho);

      if (tipo === 'imagem') {
        return `
          <div class="chat-anexo-card">
            <a href="${url}" target="_blank" rel="noopener" title="Clique para ampliar">
              <img src="${url}" alt="${nome}" class="chat-anexo-img-thumb" loading="lazy" />
            </a>
            <div style="padding:4px 8px;font-size:0.7rem;color:#94a3b8;display:flex;justify-content:space-between;">
              <span>${nome}</span>
              <span>${tamanho}</span>
            </div>
          </div>
        `;
      }

      if (tipo === 'pdf') {
        return `
          <div class="chat-anexo-card chat-anexo-file">
            <i class="bi bi-file-earmark-pdf-fill chat-anexo-icon" style="color:#ef4444;"></i>
            <div class="chat-anexo-details">
              <div class="chat-anexo-nome" title="${nome}">${nome}</div>
              <div class="chat-anexo-size">Documento PDF · ${tamanho}</div>
            </div>
            <div class="chat-anexo-actions">
              <a href="${url}" target="_blank" rel="noopener" class="btn btn-outline btn-xs" title="Abrir">
                <i class="bi bi-box-arrow-up-right"></i> Abrir
              </a>
              <a href="${url}" download="${nome}" class="btn btn-outline btn-xs" title="Baixar">
                <i class="bi bi-download"></i>
              </a>
            </div>
          </div>
        `;
      }

      return `
        <div class="chat-anexo-card chat-anexo-file">
          <i class="bi bi-file-earmark-arrow-down chat-anexo-icon"></i>
          <div class="chat-anexo-details">
            <div class="chat-anexo-nome" title="${nome}">${nome}</div>
            <div class="chat-anexo-size">${tamanho}</div>
          </div>
          <div class="chat-anexo-actions">
            <a href="${url}" download="${nome}" class="btn btn-outline btn-xs">
              <i class="bi bi-download"></i> Baixar
            </a>
          </div>
        </div>
      `;
    }
  };

  window.ChatClient = ChatClient;

  // Inicialização automática ao carregar documento
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChatClient.init());
  } else {
    ChatClient.init();
  }
})(window);
