package com.br.amas.demo.controller;

import com.br.amas.demo.model.Evento;
import com.br.amas.demo.service.EventoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
public class EventoController {

    private final EventoService eventoService;

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(eventoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(eventoService.buscarPorId(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Evento evento) {
        return ResponseEntity.ok(eventoService.criar(evento));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Evento dados) {
        try {
            return ResponseEntity.ok(eventoService.atualizar(id, dados));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long id) {
        eventoService.remover(id);
        return ResponseEntity.ok(Map.of("mensagem", "Evento removido."));
    }

    /** Inscreve um associado no evento (vai para lista de espera se lotado). */
    @PostMapping("/{id}/inscrever")
    public ResponseEntity<?> inscrever(@PathVariable Long id,
                                       @RequestBody Map<String, Long> body) {
        try {
            return ResponseEntity.ok(eventoService.inscrever(id, body.get("associadoId")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /** Cancela a inscrição de um associado (remove de inscritos ou da fila). */
    @DeleteMapping("/{eventoId}/inscrever/{associadoId}")
    public ResponseEntity<?> cancelarInscricao(@PathVariable Long eventoId,
                                               @PathVariable Long associadoId) {
        try {
            eventoService.cancelarInscricao(eventoId, associadoId);
            return ResponseEntity.ok(Map.of("mensagem", "Inscrição cancelada."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /** Lista todos os inscritos de um evento. */
    @GetMapping("/{id}/inscritos")
    public ResponseEntity<?> listarInscritos(@PathVariable Long id) {
        return ResponseEntity.ok(eventoService.listarInscritos(id));
    }

    /** Lista todos os eventos em que um associado está inscrito ou na fila. */
    @GetMapping("/inscritos/associado/{associadoId}")
    public ResponseEntity<?> inscricoesPorAssociado(@PathVariable Long associadoId) {
        return ResponseEntity.ok(eventoService.listarInscricoesPorAssociado(associadoId));
    }
}