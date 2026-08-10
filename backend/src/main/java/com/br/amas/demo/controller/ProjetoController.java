package com.br.amas.demo.controller;

import com.br.amas.demo.model.Projeto;
import com.br.amas.demo.service.ProjetoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/projetos")
@RequiredArgsConstructor
public class ProjetoController {

    private final ProjetoService projetoService;

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(projetoService.listarTodos());
    }

    @GetMapping("/em-andamento")
    public ResponseEntity<?> listarEmAndamento() {
        return ResponseEntity.ok(projetoService.listarEmAndamento());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(projetoService.buscarPorId(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Projeto projeto) {
        return ResponseEntity.ok(projetoService.criar(projeto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Projeto dados) {
        try {
            return ResponseEntity.ok(projetoService.atualizar(id, dados));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long id) {
        projetoService.remover(id);
        return ResponseEntity.ok(Map.of("mensagem", "Projeto removido."));
    }
}
