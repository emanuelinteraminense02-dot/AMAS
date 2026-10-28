package com.br.amas.demo.service;

import com.br.amas.demo.model.Associado;
import com.br.amas.demo.model.ChatMensagem;
import com.br.amas.demo.model.Usuario;
import com.br.amas.demo.repository.AssociadoRepository;
import com.br.amas.demo.repository.ChatMensagemRepository;
import com.br.amas.demo.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMensagemRepository chatMensagemRepository;
    private final AssociadoRepository associadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmpresarioPayloadMapper empresarioPayloadMapper;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

    /**
     * Lista mensagens de um canal formatadas para a interface de chat.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarMensagens(String channelId) {
        if (channelId == null || channelId.isBlank()) {
            return Collections.emptyList();
        }

        List<ChatMensagem> lista = chatMensagemRepository.findByChannelIdOrderByCriadoEmAsc(channelId);
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (ChatMensagem m : lista) {
            resultado.add(converterMensagemParaMap(m));
        }

        return resultado;
    }

    /**
     * Verifica se a mensagem foi enviada por um administrador.
     */
    public static boolean isMsgAdmin(ChatMensagem m) {
        if (m == null) return false;
        String perfil = m.getSenderPerfil() != null ? m.getSenderPerfil().trim().toLowerCase() : "";
        String id = m.getSenderId() != null ? m.getSenderId().trim().toLowerCase() : "";
        String nome = m.getSenderNome() != null ? m.getSenderNome().trim().toLowerCase() : "";
        return "admin".equals(perfil) || "administrador".equals(perfil) || "admin".equals(id) || nome.contains("administra");
    }

    /**
     * Salva nova mensagem no banco de dados.
     */
    @Transactional
    public Map<String, Object> salvarMensagem(Map<String, Object> payload) {
        if (payload == null) {
            throw new IllegalArgumentException("Payload da mensagem não pode ser nulo.");
        }

        String channelId = (String) payload.get("channelId");
        if (channelId == null || channelId.isBlank()) {
            throw new IllegalArgumentException("channelId é obrigatório para enviar mensagem.");
        }

        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        String senderId = (String) payload.getOrDefault("senderId", "anonimo");
        String senderNome = (String) payload.getOrDefault("senderNome", "Usuário");
        String senderPerfil = (String) payload.getOrDefault("senderPerfil", "associado");
        String texto = (String) payload.getOrDefault("texto", "");

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String emailAuth = auth.getName();
            Optional<Usuario> usuOpt = usuarioRepository.findByEmail(emailAuth.toLowerCase());
            if (usuOpt.isPresent()) {
                Usuario u = usuOpt.get();
                senderId = "admin".equalsIgnoreCase(u.getPerfil()) ? "admin" : "emp_" + u.getId();
                senderNome = u.getNome();
                senderPerfil = u.getPerfil();
            } else {
                Optional<Associado> assocOpt = associadoRepository.findByEmail(emailAuth.toLowerCase());
                if (assocOpt.isPresent()) {
                    Associado a = assocOpt.get();
                    senderId = "assoc_" + a.getId();
                    senderNome = a.getNome();
                    senderPerfil = "associado";
                }
            }
        } else {
            // Em chamadas sem Bearer token, proibir terminantemente forjar perfil de administrador
            if ("admin".equalsIgnoreCase(senderPerfil) || "admin".equalsIgnoreCase(senderId)) {
                log.warn("[CHAT SECURITY] Bloqueada tentativa de forjar remetente admin sem autenticação JWT.");
                senderPerfil = "associado";
                if ("admin".equalsIgnoreCase(senderId)) {
                    senderId = "anonimo";
                }
            }
        }

        String anexoNome = null;
        String anexoUrl = null;
        String anexoTipo = null;
        Long anexoTamanho = null;

        Object anexoObj = payload.get("anexo");
        if (anexoObj instanceof Map<?, ?>) {
            Map<?, ?> mapAnexo = (Map<?, ?>) anexoObj;
            anexoNome = (String) mapAnexo.get("nome");
            anexoUrl = (String) mapAnexo.get("url");
            anexoTipo = (String) mapAnexo.get("tipo");
            Object tam = mapAnexo.get("tamanho");
            if (tam instanceof Number) {
                anexoTamanho = ((Number) tam).longValue();
            }
        }

        ChatMensagem msg = ChatMensagem.builder()
                .channelId(channelId)
                .senderId(senderId)
                .senderNome(senderNome)
                .senderPerfil(senderPerfil)
                .texto(texto)
                .anexoNome(anexoNome)
                .anexoUrl(anexoUrl)
                .anexoTipo(anexoTipo)
                .anexoTamanho(anexoTamanho)
                .criadoEm(LocalDateTime.now())
                .lida(false)
                .build();

        ChatMensagem salva = chatMensagemRepository.save(msg);
        log.info("[CHAT] Mensagem ID {} salva com sucesso no canal {}", salva.getId(), channelId);
        return converterMensagemParaMap(salva);
    }

    /**
     * Marca mensagens do canal como lidas pelo leitor com persistência absoluta.
     */
    @Transactional
    public void marcarLidas(String channelId, String leitorPerfil) {
        if (channelId == null || channelId.isBlank()) return;
        String perfil = (leitorPerfil != null && !leitorPerfil.isBlank()) ? leitorPerfil.trim().toLowerCase() : "admin";

        // Executa atualização no banco via query SQL
        try {
            chatMensagemRepository.marcarComoLidas(channelId, perfil);
        } catch (Exception e) {
            log.warn("[CHAT] Aviso ao executar query direta de marcarComoLidas: {}", e.getMessage());
        }

        // Executa também varredura direta via entidades para garantir 100% de consistência
        try {
            List<ChatMensagem> msgs = chatMensagemRepository.findByChannelIdOrderByCriadoEmAsc(channelId);
            boolean alterou = false;
            boolean isAdminLeitor = "admin".equals(perfil) || "administrador".equals(perfil);

            for (ChatMensagem m : msgs) {
                boolean msgDeAdmin = isMsgAdmin(m);
                if (isAdminLeitor && !msgDeAdmin && !Boolean.TRUE.equals(m.getLida())) {
                    m.setLida(true);
                    alterou = true;
                } else if (!isAdminLeitor && msgDeAdmin && !Boolean.TRUE.equals(m.getLida())) {
                    m.setLida(true);
                    alterou = true;
                }
            }
            if (alterou) {
                chatMensagemRepository.saveAll(msgs);
                log.info("[CHAT] Mensagens marcadas como lidas no canal {} pelo leitor {}", channelId, perfil);
            }
        } catch (Exception e) {
            log.error("[CHAT] Erro ao sincronizar mensagens lidas no canal {}: {}", channelId, e.getMessage());
        }
    }

    /**
     * Lista todos os canais para o painel de administração (Associados e Empresários),
     * incluindo contatos sem mensagens prévias para que novos chats possam ser iniciados.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listarCanais() {
        List<ChatMensagem> todasMsgs = chatMensagemRepository.findAllByOrderByCriadoEmAsc();

        // Agrupa mensagens por channelId
        Map<String, List<ChatMensagem>> msgsPorCanal = new HashMap<>();
        for (ChatMensagem m : todasMsgs) {
            msgsPorCanal.computeIfAbsent(m.getChannelId(), k -> new ArrayList<>()).add(m);
        }

        // 1. Canais de Associados
        List<Associado> associados = associadoRepository.findAll();
        List<Map<String, Object>> canaisAssoc = new ArrayList<>();

        for (Associado a : associados) {
            String channelId = "assoc_" + a.getId();
            List<ChatMensagem> msgsCanal = msgsPorCanal.getOrDefault(channelId, Collections.emptyList());
            ChatMensagem ultimaMsg = msgsCanal.isEmpty() ? null : msgsCanal.get(msgsCanal.size() - 1);

            // Mensagens enviadas pelo admin NUNCA contam como não lidas para o admin
            long naoLidas = msgsCanal.stream()
                    .filter(m -> !isMsgAdmin(m) && !Boolean.TRUE.equals(m.getLida()) && !Boolean.TRUE.equals(m.getApagada()))
                    .count();

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", a.getId());
            item.put("channelId", channelId);
            item.put("tipo", "associado");
            item.put("nome", a.getNome() != null ? a.getNome() : "Associado AMAS");
            item.put("subtitulo", "Matrícula: " + (a.getMatricula() != null ? a.getMatricula() : "AMAS-00" + a.getId())
                    + " · CPF: " + (a.getCpf() != null ? a.getCpf() : "—"));
            item.put("email", a.getEmail() != null ? a.getEmail() : "");
            item.put("telefone", a.getTelefone() != null ? a.getTelefone() : "");
            item.put("status", a.getStatus() != null ? a.getStatus() : "Regular");
            item.put("foto", a.getFoto() != null ? a.getFoto() : "");
            item.put("ultimaMensagem", converterResumoUltimaMensagem(ultimaMsg));
            item.put("naoLidas", naoLidas);
            item.put("online", true);

            canaisAssoc.add(item);
        }

        // 2. Canais de Empresários
        List<Usuario> empresarios = usuarioRepository.findByPerfil("empresario");
        List<Map<String, Object>> canaisEmp = new ArrayList<>();

        for (Usuario u : empresarios) {
            String channelId = "emp_" + u.getId();
            List<ChatMensagem> msgsCanal = msgsPorCanal.getOrDefault(channelId, Collections.emptyList());
            ChatMensagem ultimaMsg = msgsCanal.isEmpty() ? null : msgsCanal.get(msgsCanal.size() - 1);

            // Mensagens enviadas pelo admin NUNCA contam como não lidas para o admin
            long naoLidas = msgsCanal.stream()
                    .filter(m -> !isMsgAdmin(m) && !Boolean.TRUE.equals(m.getLida()) && !Boolean.TRUE.equals(m.getApagada()))
                    .count();

            Map<String, Object> empResp = empresarioPayloadMapper.toResponse(u);
            Object logo = empResp.get("logo") != null ? empResp.get("logo") : empResp.get("foto");

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", u.getId());
            item.put("channelId", channelId);
            item.put("tipo", "empresario");
            item.put("nome", u.getNome() != null ? u.getNome() : "Empresa Parceira");
            item.put("subtitulo", "CNPJ: " + (u.getCnpj() != null ? u.getCnpj() : "—") + " · Empresa Parceira");
            item.put("email", u.getEmail() != null ? u.getEmail() : "");
            item.put("telefone", u.getTelefone() != null ? u.getTelefone() : "");
            item.put("logo", logo != null ? logo.toString() : "");
            item.put("foto", logo != null ? logo.toString() : "");
            item.put("ultimaMensagem", converterResumoUltimaMensagem(ultimaMsg));
            item.put("naoLidas", naoLidas);
            item.put("online", true);

            canaisEmp.add(item);
        }

        // Ordenação inteligente: conversas recentes primeiro, depois ordem alfabética
        Comparator<Map<String, Object>> comp = (c1, c2) -> {
            Map<?, ?> u1 = (Map<?, ?>) c1.get("ultimaMensagem");
            Map<?, ?> u2 = (Map<?, ?>) c2.get("ultimaMensagem");
            String dt1 = u1 != null ? (String) u1.get("criadoEm") : null;
            String dt2 = u2 != null ? (String) u2.get("criadoEm") : null;

            if (dt1 != null && dt2 != null) {
                return dt2.compareTo(dt1);
            }
            if (dt1 != null) return -1;
            if (dt2 != null) return 1;

            String n1 = (String) c1.getOrDefault("nome", "");
            String n2 = (String) c2.getOrDefault("nome", "");
            return n1.compareToIgnoreCase(n2);
        };

        canaisAssoc.sort(comp);
        canaisEmp.sort(comp);

        long totalNaoLidas = canaisAssoc.stream().mapToLong(c -> ((Number) c.get("naoLidas")).longValue()).sum()
                + canaisEmp.stream().mapToLong(c -> ((Number) c.get("naoLidas")).longValue()).sum();

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("ok", true);
        resposta.put("associados", canaisAssoc);
        resposta.put("empresarios", canaisEmp);
        resposta.put("totalNaoLidas", totalNaoLidas);

        return resposta;
    }

    private Map<String, Object> converterMensagemParaMap(ChatMensagem m) {
        if (m == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", "msg_" + m.getId());
        map.put("dbId", m.getId());
        map.put("channelId", m.getChannelId());
        map.put("texto", m.getTexto() != null ? m.getTexto() : "");
        map.put("senderId", m.getSenderId());
        map.put("senderNome", m.getSenderNome());
        map.put("senderPerfil", m.getSenderPerfil());
        map.put("criadoEm", m.getCriadoEm() != null ? m.getCriadoEm().format(ISO_FORMATTER) : LocalDateTime.now().format(ISO_FORMATTER));
        map.put("lida", Boolean.TRUE.equals(m.getLida()));

        map.put("apagada", Boolean.TRUE.equals(m.getApagada()));

        if (!Boolean.TRUE.equals(m.getApagada()) && m.getAnexoUrl() != null && !m.getAnexoUrl().isBlank()) {
            Map<String, Object> anexo = new LinkedHashMap<>();
            anexo.put("nome", m.getAnexoNome() != null ? m.getAnexoNome() : "arquivo");
            anexo.put("url", m.getAnexoUrl());
            anexo.put("tipo", m.getAnexoTipo() != null ? m.getAnexoTipo() : "arquivo");
            anexo.put("tamanho", m.getAnexoTamanho() != null ? m.getAnexoTamanho() : 0L);
            map.put("anexo", anexo);
        } else {
            map.put("anexo", null);
        }

        return map;
    }

    private Map<String, Object> converterResumoUltimaMensagem(ChatMensagem m) {
        if (m == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        String txt = Boolean.TRUE.equals(m.getApagada()) ? "Mensagem apagada" : m.getTexto();
        if (!Boolean.TRUE.equals(m.getApagada()) && (txt == null || txt.isBlank()) && m.getAnexoNome() != null) {
            txt = "[Anexo: " + m.getAnexoNome() + "]";
        }
        map.put("texto", txt != null ? txt : "");
        map.put("criadoEm", m.getCriadoEm() != null ? m.getCriadoEm().format(ISO_FORMATTER) : null);
        map.put("senderPerfil", m.getSenderPerfil());
        map.put("senderNome", m.getSenderNome());
        map.put("apagada", Boolean.TRUE.equals(m.getApagada()));
        return map;
    }

    /**
     * Apaga uma mensagem do chat marcando-a como apagada e limpando texto e anexos por segurança.
     */
    @Transactional
    public Map<String, Object> apagarMensagem(String idStr) {
        if (idStr == null || idStr.isBlank()) {
            throw new IllegalArgumentException("ID da mensagem inválido.");
        }
        Long id;
        try {
            id = Long.parseLong(idStr.replace("msg_", "").trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Formato de ID inválido: " + idStr);
        }

        ChatMensagem m = chatMensagemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada com ID " + id));

        m.setApagada(true);
        m.setTexto("");
        m.setAnexoNome(null);
        m.setAnexoUrl(null);
        m.setAnexoTipo(null);
        m.setAnexoTamanho(null);

        chatMensagemRepository.save(m);
        log.info("[CHAT] Mensagem {} do canal {} apagada com sucesso", id, m.getChannelId());
        return converterMensagemParaMap(m);
    }
}
