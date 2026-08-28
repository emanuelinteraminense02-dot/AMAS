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

    /**
     * POST /api/auth/login
     *
     * Body:
     * {
     *   "email": "admin@amas.com",
     *   "senha": "admin123"
     * }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> body
    ) {

        try {

            String email = body.get("email");
            String senha = body.get("senha");

            Map<String, Object> usuario =
                    authService.autenticar(email, senha);

            return ResponseEntity.ok(usuario);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(401)
                    .body(
                            Map.of(
                                    "erro",
                                    e.getMessage()
                            )
                    );
        }
    }

    /**
     * PATCH /api/auth/associados/{id}/senha
     *
     * Body:
     * {
     *   "senhaAtual": "123456",
     *   "novaSenha": "novaSenha123"
     * }
     */
    @PatchMapping("/associados/{id}/senha")
    public ResponseEntity<?> alterarSenha(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {

        try {

            String senhaAtual =
                    body.get("senhaAtual");

            String novaSenha =
                    body.get("novaSenha");

            authService.alterarSenha(
                    id,
                    senhaAtual,
                    novaSenha
            );

            return ResponseEntity.ok(
                    Map.of(
                            "mensagem",
                            "Senha alterada com sucesso."
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "erro",
                                    e.getMessage()
                            )
                    );
        }
    }
}