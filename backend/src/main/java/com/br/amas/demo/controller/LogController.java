package com.br.amas.demo.controller;

import com.br.amas.demo.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * LogController — permite ao front-end registrar ações no log do servidor.
 * POST /api/log  body: { acao, usuario, perfil, detalhes }
 */
@RestController
@RequestMapping("/api/log")
@RequiredArgsConstructor
public class LogController {

    private final LogService logService;

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Map<String, String> body) {
        logService.registrar(
                body.getOrDefault("acao", "Ação do front-end"),
                body.getOrDefault("usuario", "Sistema"),
                body.getOrDefault("perfil", "sistema"),
                body.getOrDefault("detalhes", "")
        );
        return ResponseEntity.ok(Map.of("mensagem", "Log registrado."));
    }
}