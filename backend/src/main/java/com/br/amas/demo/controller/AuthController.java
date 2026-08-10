package com.br.amas.demo.controller;

import com.br.amas.demo.service.AuthService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController

@RequestMapping("/api/auth")

@RequiredArgsConstructor

public class AuthController {

    private final AuthService authService;

    /** POST /api/auth/login  – body: { "email": "...", "senha": "..." } */

    @PostMapping("/login")

    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {

        try {

            Map<String, Object> usuario = authService.autenticar(

                    body.get("email"), body.get("senha"));

            return ResponseEntity.ok(usuario);

        } catch (RuntimeException e) {

            return ResponseEntity.status(401).body(Map.of("erro", e.getMessage()));

        }

    }

    /** PATCH /api/auth/associados/{id}/senha */

    @PatchMapping("/associados/{id}/senha")

    public ResponseEntity<?> alterarSenha(@PathVariable Long id,

                                          @RequestBody Map<String, String> body) {

        try {

            authService.alterarSenha(id, body.get("senhaAtual"), body.get("novaSenha"));

            return ResponseEntity.ok(Map.of("mensagem", "Senha alterada com sucesso."));

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));

        }

    }

}
