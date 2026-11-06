package com.br.amas.demo.controller;

import com.br.amas.demo.config.Acesso;
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
    private final Acesso acesso;

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

        acesso.exigirAdminOuAssociado(id);

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

    /**
     * POST /api/auth/esqueci-senha (rota pública)
     * Body: { "email": "fulano@exemplo.com" }
     */
    @PostMapping("/esqueci-senha")
    public ResponseEntity<?> esqueciSenha(@RequestBody Map<String, String> body) {
        try {
            authService.solicitarRedefinicao(body.get("email"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "mensagem", "Se o e-mail estiver cadastrado, o pedido foi enviado ao administrador."
        ));
    }
}
