package com.br.amas.demo.controller;

import com.br.amas.demo.service.MensagemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * MensagemController – endpoints de broadcast da AMAS.
 *
 * GET  /api/mensagens                        → todas (admin)
 * GET  /api/mensagens/associados             → somente para associados + todos
 * GET  /api/mensagens/empresarios            → somente para empresários + todos
 * POST /api/mensagens                        → enviar broadcast
 * PATCH /api/mensagens/{id}/lida/{userId}    → marcar como lida
 * DELETE /api/mensagens/{id}                 → remover
 */
@RestController
@RequestMapping("/api/mensagens")
@RequiredArgsConstructor
public class MensagemController {

    private final MensagemService mensagemService;

    // ── GET ───────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<?> listarTodas() {
        return ResponseEntity.ok(mensagemService.listarTodas());
    }

    @GetMapping("/associados")
    public ResponseEntity<?> listarParaAssociados() {
        return ResponseEntity.ok(mensagemService.listarParaAssociado());
    }

    @GetMapping("/empresarios")
    public ResponseEntity<?> listarParaEmpresarios() {
        return ResponseEntity.ok(mensagemService.listarParaEmpresario());
    }

    // ── POST ──────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> enviar(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(mensagemService.enviar(
                    body.get("titulo"),
                    body.get("corpo"),
                    body.get("destinatarios"),
                    body.get("remetente")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    // ── PATCH ─────────────────────────────────────────────────────────────

    /**
     * Marca a mensagem como lida para um usuário específico.
     * Funciona para associados e empresários (userId é o ID do usuário de qualquer perfil).
     */
    @PatchMapping("/{id}/lida/{userId}")
    public ResponseEntity<?> marcarLida(@PathVariable Long id,
                                        @PathVariable Long userId) {
        try {
            mensagemService.marcarLida(id, userId);
            return ResponseEntity.ok(Map.of("mensagem", "Marcada como lida."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    // ── Contagem de não lidas ─────────────────────────────────────────────

    @GetMapping("/nao-lidas/associado/{associadoId}")
    public ResponseEntity<?> naoLidasAssociado(@PathVariable Long associadoId) {
        return ResponseEntity.ok(
                Map.of("total", mensagemService.contarNaoLidasAssociado(associadoId)));
    }

    @GetMapping("/nao-lidas/empresario/{empresarioId}")
    public ResponseEntity<?> naoLidasEmpresario(@PathVariable Long empresarioId) {
        return ResponseEntity.ok(
                Map.of("total", mensagemService.contarNaoLidasEmpresario(empresarioId)));
    }

    // ── DELETE ────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long id) {
        try {
            mensagemService.remover(id);
            return ResponseEntity.ok(Map.of("mensagem", "Mensagem removida."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}
