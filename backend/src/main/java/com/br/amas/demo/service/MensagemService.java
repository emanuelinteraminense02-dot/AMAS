package com.br.amas.demo.service;

import com.br.amas.demo.model.Mensagem;
import com.br.amas.demo.repository.MensagemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MensagemService {

    private final MensagemRepository mensagemRepository;
    private final LogService logService;

    // ── Consultas ─────────────────────────────────────────────────────────

    /** Todas as mensagens (painel admin), ordenadas da mais recente. */
    public List<Map<String, Object>> listarTodas() {
        return mensagemRepository.findAllByOrderByDataDesc()
                .stream().map(this::toView).collect(Collectors.toList());
    }

    /** Mensagens visíveis para ASSOCIADOS (destinatários: "todos" ou "associados"). */
    public List<Map<String, Object>> listarParaAssociado() {
        return mensagemRepository
                .findByDestinatariosInOrderByDataDesc(List.of("todos", "associados"))
                .stream().map(this::toView).collect(Collectors.toList());
    }

    /** Mensagens visíveis para EMPRESÁRIOS (destinatários: "todos" ou "empresarios"). */
    public List<Map<String, Object>> listarParaEmpresario() {
        return mensagemRepository
                .findByDestinatariosInOrderByDataDesc(List.of("todos", "empresarios"))
                .stream().map(this::toView).collect(Collectors.toList());
    }

    // ── Envio ─────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> enviar(String titulo, String corpo,
                                      String destinatarios, String remetente) {
        if (titulo == null || titulo.isBlank())
            throw new RuntimeException("O título da mensagem não pode ser vazio.");
        if (corpo == null || corpo.isBlank())
            throw new RuntimeException("O corpo da mensagem não pode ser vazio.");

        String dest = (destinatarios != null && !destinatarios.isBlank())
                ? destinatarios : "todos";

        Mensagem m = Mensagem.builder()
                .titulo(titulo.trim())
                .corpo(corpo.trim())
                .data(LocalDateTime.now())
                .tipo("broadcast")
                .destinatarios(dest)
                .remetente(remetente != null && !remetente.isBlank()
                        ? remetente : "Administrador AMAS")
                .lidasIds("")
                .build();

        logService.registrar("Broadcast enviado",
                m.getRemetente(), "admin",
                "\"" + titulo + "\" → " + dest);

        return toView(mensagemRepository.save(m));
    }

    // ── Marcar como lida ─────────────────────────────────────────────────

    @Transactional
    public void marcarLida(Long mensagemId, Long usuarioId) {
        Mensagem m = mensagemRepository.findById(mensagemId)
                .orElseThrow(() -> new RuntimeException("Mensagem não encontrada: " + mensagemId));
        m.adicionarLida(usuarioId);
        mensagemRepository.save(m);
    }

    // ── Contagem de não lidas ─────────────────────────────────────────────

    public long contarNaoLidasAssociado(Long associadoId) {
        return mensagemRepository
                .findByDestinatariosInOrderByDataDesc(List.of("todos", "associados"))
                .stream()
                .filter(m -> !m.foiLidaPor(associadoId))
                .count();
    }

    public long contarNaoLidasEmpresario(Long empresarioId) {
        return mensagemRepository
                .findByDestinatariosInOrderByDataDesc(List.of("todos", "empresarios"))
                .stream()
                .filter(m -> !m.foiLidaPor(empresarioId))
                .count();
    }

    // ── Remoção ───────────────────────────────────────────────────────────

    @Transactional
    public void remover(Long id) {
        if (!mensagemRepository.existsById(id))
            throw new RuntimeException("Mensagem não encontrada: " + id);
        mensagemRepository.deleteById(id);
        logService.registrar("Mensagem removida", "Admin", "admin",
                "Mensagem ID " + id + " removida");
    }

    // ── Mapeamento de resposta ────────────────────────────────────────────

    /**
     * Converte Mensagem para Map de resposta.
     * Expõe "lidas" como List<Long> para compatibilidade com o front-end,
     * além de "lidasIds" (CSV) para uso interno.
     */
    private Map<String, Object> toView(Mensagem m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",            m.getId());
        map.put("titulo",        m.getTitulo());
        map.put("corpo",         m.getCorpo());
        map.put("data",          m.getData());
        map.put("tipo",          m.getTipo());
        map.put("destinatarios", m.getDestinatarios());
        map.put("remetente",     m.getRemetente());
        // ← campo esperado pelo front-end (array de IDs numéricos)
        map.put("lidas",         m.getLidasComoLista());
        // ← campo interno CSV (útil para debug/migração futura)
        map.put("lidasIds",      m.getLidasIds() != null ? m.getLidasIds() : "");
        return map;
    }
}
