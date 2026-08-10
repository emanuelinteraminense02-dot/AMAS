package com.br.amas.demo.controller;

import com.br.amas.demo.model.Noticia;

import com.br.amas.demo.service.NoticiaService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController

@RequestMapping("/api/noticias")

@RequiredArgsConstructor

public class NoticiaController {

    private final NoticiaService noticiaService;

    @GetMapping

    public ResponseEntity<?> listar() {

        return ResponseEntity.ok(noticiaService.listarTodas());

    }

    @GetMapping("/destaques")

    public ResponseEntity<?> destaques() {

        return ResponseEntity.ok(noticiaService.listarDestaques());

    }

    @GetMapping("/{id}")

    public ResponseEntity<?> buscar(@PathVariable Long id) {

        try {

            return ResponseEntity.ok(noticiaService.buscarPorId(id));

        } catch (RuntimeException e) {

            return ResponseEntity.notFound().build();

        }

    }

    @PostMapping

    public ResponseEntity<?> criar(@RequestBody Noticia noticia,

                                   @RequestParam(required = false) String autor) {

        return ResponseEntity.ok(noticiaService.criar(noticia, autor));

    }

    @PutMapping("/{id}")

    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Noticia dados) {

        try {

            return ResponseEntity.ok(noticiaService.atualizar(id, dados));

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));

        }

    }

    @DeleteMapping("/{id}")

    public ResponseEntity<?> remover(@PathVariable Long id) {

        noticiaService.remover(id);

        return ResponseEntity.ok(Map.of("mensagem", "Notícia removida."));

    }

}

