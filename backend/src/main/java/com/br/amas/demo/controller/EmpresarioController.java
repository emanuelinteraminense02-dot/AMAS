package com.br.amas.demo.controller;

import com.br.amas.demo.model.Usuario;
import com.br.amas.demo.service.EmpresarioPayloadMapper;
import com.br.amas.demo.service.EmpresarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/empresarios")
@RequiredArgsConstructor
public class EmpresarioController {

    private final EmpresarioService empresarioService;
    private final EmpresarioPayloadMapper empresarioPayloadMapper;

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(
                empresarioService.listarTodos().stream()
                        .map(empresarioPayloadMapper::toResponse)
                        .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(empresarioPayloadMapper.toResponse(empresarioService.buscarPorId(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody Map<String, Object> payload) {
        try {
            Usuario usuario = empresarioPayloadMapper.fromPayload(payload);
            return ResponseEntity.ok(empresarioPayloadMapper.toResponse(empresarioService.cadastrar(usuario)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Map<String, Object> dados) {
        try {
            return ResponseEntity.ok(empresarioService.atualizar(id, dados));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long id) {
        empresarioService.remover(id);
        return ResponseEntity.ok(Map.of("mensagem", "Empresario removido."));
    }

    @GetMapping("/{id}/contribuicoes")
    public ResponseEntity<?> listarContribuicoes(@PathVariable Long id) {
        return ResponseEntity.ok(empresarioService.listarContribuicoes(id));
    }

    @PostMapping("/{id}/contribuicoes")
    public ResponseEntity<?> registrarContribuicao(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            BigDecimal rendaBruta = new BigDecimal(body.get("rendaBruta").toString());
            BigDecimal rendaLiquida = new BigDecimal(body.get("rendaLiquida").toString());
            String mes = body.get("mes").toString();
            BigDecimal aliquota = body.containsKey("aliquotaContrato")
                    ? new BigDecimal(body.get("aliquotaContrato").toString()) : null;
            boolean clube = Boolean.parseBoolean(body.getOrDefault("clubeDeBeneficios", "false").toString());
            String comprovante = body.containsKey("comprovante")
                    ? body.get("comprovante").toString() : null;
            String obs = body.containsKey("observacoes")
                    ? body.get("observacoes").toString() : null;

            return ResponseEntity.ok(empresarioService.registrarContribuicao(
                    id, rendaBruta, rendaLiquida, mes, aliquota, clube, comprovante, obs));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PatchMapping("/contribuicoes/{contribuicaoId}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long contribuicaoId, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(empresarioService.atualizarStatusContribuicao(
                    contribuicaoId, body.get("status"), body.get("obsAdmin")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PostMapping("/{id}/alertas")
    public ResponseEntity<?> enviarAlerta(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            boolean urgente = Boolean.parseBoolean(body.getOrDefault("urgente", "false").toString());
            return ResponseEntity.ok(empresarioService.enviarAlerta(
                    id, body.get("titulo").toString(), body.get("mensagem").toString(), urgente));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @GetMapping("/{id}/alertas")
    public ResponseEntity<?> listarAlertas(@PathVariable Long id) {
        return ResponseEntity.ok(empresarioService.listarAlertas(id));
    }
}
