package com.br.amas.demo.controller;

import com.br.amas.demo.config.Acesso;
import com.br.amas.demo.model.Associado;
import com.br.amas.demo.model.Contribuicao;
import com.br.amas.demo.service.AssociadoService;
import com.br.amas.demo.service.MensagemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/associados")
@RequiredArgsConstructor
public class AssociadoController {

    private final AssociadoService associadoService;
    private final MensagemService  mensagemService;
    private final Acesso acesso;

    // ── CRUD Associado ─────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<?> listar() {
        acesso.exigirAdmin();
        return ResponseEntity.ok(associadoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        acesso.exigirAdminOuAssociado(id);
        try {
            return ResponseEntity.ok(associadoService.buscarPorId(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody Associado associado) {
        acesso.exigirAdmin();
        try {
            return ResponseEntity.ok(associadoService.cadastrar(associado));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Associado dados) {
        acesso.exigirAdminOuAssociado(id);
        if (!acesso.isAdmin()) {
            // O próprio associado só altera dados de contato e perfil; situação, CPF e senha ficam com a administração
            // (a senha é trocada por PATCH /api/auth/associados/{id}/senha).
            dados.setStatus(null);
            dados.setCpf(null);
            dados.setSenha(null);
            dados.setPrimeiroLogin(null);
            dados.setSenhaExpirada(null);
            dados.setResetSolicitado(null);
            dados.setDataResetSolicit(null);
        }
        try {
            return ResponseEntity.ok(associadoService.atualizar(id, dados));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        acesso.exigirAdmin();
        try {
            associadoService.atualizarStatus(id, body.get("status"));
            return ResponseEntity.ok(Map.of("mensagem", "Status atualizado."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long id) {
        acesso.exigirAdmin();
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
        acesso.exigirAdminOuAssociado(id);
        return ResponseEntity.ok(associadoService.listarContribuicoes(id));
    }

    @PostMapping("/{id}/contribuicoes")
    public ResponseEntity<?> enviarContribuicao(@PathVariable Long id,
                                                @RequestBody Contribuicao contrib) {
        acesso.exigirAdminOuAssociado(id);
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
        acesso.exigirAdmin();
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
        acesso.exigirAdminOuAssociado(id);
        return ResponseEntity.ok(associadoService.listarParcelasAtraso(id));
    }

    // ── Inadimplentes ──────────────────────────────────────────────────

    @GetMapping("/inadimplentes")
    public ResponseEntity<?> listarInadimplentes() {
        acesso.exigirAdmin();
        return ResponseEntity.ok(associadoService.listarInadimplentes());
    }

    // ── Mensagens não lidas ────────────────────────────────────────────
    // Mantido por retrocompatibilidade; use /api/mensagens/nao-lidas/associado/{id}

    @GetMapping("/{id}/mensagens/nao-lidas")
    public ResponseEntity<?> contarNaoLidas(@PathVariable Long id) {
        acesso.exigirAdminOuAssociado(id);
        return ResponseEntity.ok(Map.of("total", mensagemService.contarNaoLidasAssociado(id)));
    }

    // ── Consulta de benefício pelo CPF (empresas parceiras) ────────────
    // Devolve só o necessário para liberar o desconto, sem expor o cadastro completo.

    @GetMapping("/consulta-cpf")
    public ResponseEntity<?> consultarPorCpf(@RequestParam String cpf) {
        acesso.exigirAdminOuEmpresario();
        String digitos = cpf == null ? "" : cpf.replaceAll("\\D", "");
        if (digitos.length() != 11) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Informe um CPF com 11 dígitos."));
        }
        return associadoService.listarTodos().stream()
                .filter(a -> a.getCpf() != null && a.getCpf().replaceAll("\\D", "").equals(digitos))
                .findFirst()
                .<ResponseEntity<?>>map(a -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("id", a.getId());
                    r.put("nome", a.getNome());
                    r.put("cpf", a.getCpf());
                    r.put("matricula", a.getMatricula());
                    r.put("status", a.getStatus());
                    r.put("beneficioLiberado", "Regular".equalsIgnoreCase(a.getStatus()));
                    return ResponseEntity.ok(r);
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("erro", "Nenhum associado encontrado com este CPF.")));
    }
}
