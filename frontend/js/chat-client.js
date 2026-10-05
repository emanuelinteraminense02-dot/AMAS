/**
 * Cliente de Chat Oficial da AMAS (WebSocket + HTTP)
 * Gerencia conexão em tempo real, envio de anexos, notificações sonoras sintetizadas
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
      // Ignora silenciosamente em navegadores com restrição de autoplay
    }
  }

  const ChatClient = {
    ws: null,
    sessao: null,
    reconnectTimer: null,
    listeners: {
      nova_mensagem: [],
      status_online: [],
      digitando: [],
      mensagens_lidas: [],
      conectado: [],
      desconectado: []
    },

    init: function () {
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
      this.conectar();
    },

    conectar: function () {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
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
              // Toca som se a mensagem foi enviada por outra pessoa
              const currentId = this.sessao?.perfil === 'admin' ? 'admin' : (this.sessao?.perfil === 'empresario' ? `emp_${this.sessao?.id}` : `assoc_${this.sessao?.id}`);
              if (data.mensagem && data.mensagem.senderId !== currentId) {
                tocarSinoNotificacao();
              }
              this.emit('nova_mensagem', data.mensagem);
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
        console.error('Falha ao instanciar WebSocket:', e);
        this.agendarReconexao();
      }
    },

    agendarReconexao: function () {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.conectar();
      }, 3500);
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

    // ─── Métodos HTTP com API REST ──────────────────────────────────
    carregarCanais: async function () {
      try {
        const resp = await fetch('/api/chat/canais');
        if (!resp.ok) throw new Error('Falha ao carregar canais.');
        return await resp.json();
      } catch (e) {
        console.error('Erro ao carregar canais do chat:', e);
        return { ok: false, associados: [], empresarios: [], totalNaoLidas: 0 };
      }
    },

    carregarMensagens: async function (channelId) {
      try {
        const resp = await fetch(`/api/chat/mensagens/${encodeURIComponent(channelId)}`);
        if (!resp.ok) throw new Error('Falha ao carregar mensagens.');
        const data = await resp.json();
        return data.mensagens || [];
      } catch (e) {
        console.error('Erro ao buscar histórico de mensagens:', e);
        return [];
      }
    },

    enviarMensagem: async function (channelId, texto, anexo) {
      if (!this.sessao) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const senderId = this.sessao.perfil === 'admin' ? 'admin' : (this.sessao.perfil === 'empresario' ? `emp_${this.sessao.id}` : `assoc_${this.sessao.id}`);
      const senderNome = this.sessao.perfil === 'admin' ? 'Administração AMAS' : (this.sessao.nome || 'Usuário');

      const payload = {
        channelId,
        texto,
        anexo: anexo || null,
        senderId,
        senderNome,
        senderPerfil: this.sessao.perfil || 'associado'
      };

      const resp = await fetch('/api/chat/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.erro || 'Falha ao enviar mensagem.');
      }

      return await resp.json();
    },

    uploadAnexo: async function (file) {
      return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('Nenhum arquivo selecionado.'));
        if (file.size > 20 * 1024 * 1024) {
          return reject(new Error('O arquivo excede o limite máximo de 20MB.'));
        }

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result;
            const resp = await fetch('/api/chat/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nomeArquivo: file.name,
                base64: base64,
                tamanho: file.size
              })
            });
            if (!resp.ok) throw new Error('Falha no upload do anexo.');
            const data = await resp.json();
            resolve(data.anexo);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
        reader.readAsDataURL(file);
      });
    },

    marcarLidas: async function (channelId) {
      if (!this.sessao || !channelId) return;
      try {
        await fetch(`/api/chat/mensagens/${encodeURIComponent(channelId)}/lidas`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leitorPerfil: this.sessao.perfil })
        });
      } catch (e) {
        // Ignora falha de background
      }
    },

    notificarDigitando: function (channelId, isTyping) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.sessao) {
        this.ws.send(JSON.stringify({
          tipo: 'digitando',
          channelId,
          senderPerfil: this.sessao.perfil,
          senderNome: this.sessao.perfil === 'admin' ? 'Administração' : this.sessao.nome,
          isTyping: !!isTyping
        }));
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
