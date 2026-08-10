package com.br.amas.demo.controller;

import com.br.amas.demo.model.Associado;
import com.br.amas.demo.model.Contribuicao;
import com.br.amas.demo.service.AssociadoService;
import com.br.amas.demo.service.MensagemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/associados")
@RequiredArgsConstructor
public class AssociadoController {

    private final AssociadoService associadoService;
    private final MensagemService  mensagemService;

    // ── CRUD Associado ─────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(associadoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(associadoService.buscarPorId(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody Associado associado) {
        try {
            return ResponseEntity.ok(associadoService.cadastrar(associado));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Associado dados) {
        try {
            return ResponseEntity.ok(associadoService.atualizar(id, dados));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        try {
            associadoService.atualizarStatus(id, body.get("status"));
            return ResponseEntity.ok(Map.of("mensagem", "Status atualizado."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long id) {
        try {
            associadoService.remover(id);
            return ResponseEntity.ok(Map.of("mensagem", "Associado removido."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    // ── Contribuições ──────────────────────────────────────────────────

    @GetMapping("/{id}/contribuicoes")
    public ResponseEntity<?> listarContribuicoes(@PathVariable Long id) {
        return ResponseEntity.ok(associadoService.listarContribuicoes(id));
    }

    @PostMapping("/{id}/contribuicoes")
    public ResponseEntity<?> enviarContribuicao(@PathVariable Long id,
                                                @RequestBody Contribuicao contrib) {
        try {
            return ResponseEntity.ok(associadoService.enviarContribuicao(id, contrib));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PatchMapping("/contribuicoes/{contribuicaoId}/status")
    public ResponseEntity<?> atualizarStatusContribuicao(
            @PathVariable Long contribuicaoId,
            @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(associadoService.atualizarStatusContribuicao(
                    contribuicaoId, body.get("status"), body.get("msgAdmin")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    // ── Parcelas em atraso ─────────────────────────────────────────────

    @GetMapping("/{id}/parcelas-atraso")
    public ResponseEntity<?> listarParcelasAtraso(@PathVariable Long id) {
        return ResponseEntity.ok(associadoService.listarParcelasAtraso(id));
    }

    // ── Inadimplentes ──────────────────────────────────────────────────

    @GetMapping("/inadimplentes")
    public ResponseEntity<?> listarInadimplentes() {
        return ResponseEntity.ok(associadoService.listarInadimplentes());
    }

    // ── Mensagens não lidas ────────────────────────────────────────────
    // Mantido por retrocompatibilidade; use /api/mensagens/nao-lidas/associado/{id}

    @GetMapping("/{id}/mensagens/nao-lidas")
    public ResponseEntity<?> contarNaoLidas(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("total", mensagemService.contarNaoLidasAssociado(id)));
    }
}
