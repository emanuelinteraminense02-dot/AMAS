package com.br.amas.demo.controller;

import com.br.amas.demo.config.Acesso;
import com.br.amas.demo.model.Usuario;
import com.br.amas.demo.service.EmpresarioPayloadMapper;
import com.br.amas.demo.service.EmpresarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/empresarios")
@RequiredArgsConstructor
public class EmpresarioController {

    private final EmpresarioService empresarioService;
    private final EmpresarioPayloadMapper empresarioPayloadMapper;
    private final Acesso acesso;

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(
                empresarioService.listarTodos().stream()
                        .map(empresarioPayloadMapper::toResponse)
                        .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        acesso.exigirAdminOuEmpresario(id);
        try {
            return ResponseEntity.ok(empresarioPayloadMapper.toResponse(empresarioService.buscarPorId(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody Map<String, Object> payload) {
        acesso.exigirAdmin();
        try {
            Usuario usuario = empresarioPayloadMapper.fromPayload(payload);
            return ResponseEntity.ok(empresarioPayloadMapper.toResponse(empresarioService.cadastrar(usuario)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Map<String, Object> dados) {
        acesso.exigirAdminOuEmpresario(id);
        try {
            if (!acesso.isAdmin()) {
                dados = restringirAutoAtualizacao(id, dados);
            }
            return ResponseEntity.ok(empresarioService.atualizar(id, dados));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long id) {
        acesso.exigirAdmin();
        empresarioService.remover(id);
        return ResponseEntity.ok(Map.of("mensagem", "Empresario removido."));
    }

    @GetMapping("/{id}/contribuicoes")
    public ResponseEntity<?> listarContribuicoes(@PathVariable Long id) {
        acesso.exigirAdminOuEmpresario(id);
        return ResponseEntity.ok(empresarioService.listarContribuicoes(id));
    }

    @PostMapping("/{id}/contribuicoes")
    public ResponseEntity<?> registrarContribuicao(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        acesso.exigirAdminOuEmpresario(id);
        try {
            if (!acesso.isAdmin()) {
                // A própria empresa não escolhe a alíquota nem declara o clube de benefícios:
                // os dois vêm do contrato mantido pela administração.
                Map<String, Object> contrato = empresarioPayloadMapper.parseContrato(empresarioService.buscarPorId(id).getContrato());
                body = new HashMap<>(body);
                body.remove("aliquotaContrato");
                Object aliq = contrato.get("aliquotaContratual");
                if (aliq != null && !aliq.toString().isBlank()) body.put("aliquotaContrato", aliq.toString());
                body.put("clubeDeBeneficios", "true".equalsIgnoreCase(String.valueOf(contrato.get("beneficiosValidados"))));
            }
            if (body.get("rendaBruta") == null || body.get("rendaLiquida") == null || body.get("mes") == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Informe o mês, a renda bruta e a renda líquida."));
            }
            BigDecimal rendaBruta = new BigDecimal(body.get("rendaBruta").toString());
            BigDecimal rendaLiquida = new BigDecimal(body.get("rendaLiquida").toString());
            String mes = body.get("mes").toString();
            BigDecimal aliquota = body.get("aliquotaContrato") != null
                    ? new BigDecimal(body.get("aliquotaContrato").toString()) : null;
            boolean clube = Boolean.parseBoolean(body.getOrDefault("clubeDeBeneficios", "false").toString());
            // Campos opcionais podem chegar como null no JSON
            String comprovante = body.get("comprovante") != null ? body.get("comprovante").toString() : null;
            String obs = body.get("observacoes") != null ? body.get("observacoes").toString() : null;

            return ResponseEntity.ok(empresarioService.registrarContribuicao(
                    id, rendaBruta, rendaLiquida, mes, aliquota, clube, comprovante, obs));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PatchMapping("/contribuicoes/{contribuicaoId}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long contribuicaoId, @RequestBody Map<String, String> body) {
        acesso.exigirAdmin();
        try {
            return ResponseEntity.ok(empresarioService.atualizarStatusContribuicao(
                    contribuicaoId, body.get("status"), body.get("obsAdmin")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PostMapping("/{id}/alertas")
    public ResponseEntity<?> enviarAlerta(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        acesso.exigirAdminOuEmpresario(id);
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
        acesso.exigirAdminOuEmpresario(id);
        return ResponseEntity.ok(empresarioService.listarAlertas(id));
    }

    /**
     * A própria empresa pode alterar dados de contato, unidades, benefício e senha, mas não pode
     * validar a parceria nem mexer nos sinalizadores de redefinição de senha.
     */
    private Map<String, Object> restringirAutoAtualizacao(Long id, Map<String, Object> dados) {
        Map<String, Object> d = new HashMap<>(dados);
        d.remove("resetSolicitado");
        d.remove("dataResetSolicit");
        for (String flag : new String[]{"primeiroLogin", "senhaExpirada"}) {
            if (d.containsKey(flag) && Boolean.parseBoolean(String.valueOf(d.get(flag)))) {
                d.remove(flag);
            }
        }
        if (d.containsKey("contrato")) {
            Map<String, Object> antigo = empresarioPayloadMapper.parseContrato(empresarioService.buscarPorId(id).getContrato());
            Map<String, Object> novo = new HashMap<>(empresarioPayloadMapper.parseContrato(empresarioPayloadMapper.toContratoJson(d.get("contrato"))));
            boolean validadoAntes = "true".equalsIgnoreCase(String.valueOf(antigo.get("beneficiosValidados")));
            boolean pedido = !novo.containsKey("beneficiosValidados")
                    || "true".equalsIgnoreCase(String.valueOf(novo.get("beneficiosValidados")));
            // A empresa pode voltar a parceria para "aguardando validação", mas não pode validá-la sozinha.
            novo.put("beneficiosValidados", pedido && validadoAntes);
            if (antigo.containsKey("tipoAcordo")) novo.put("tipoAcordo", antigo.get("tipoAcordo"));
            else novo.remove("tipoAcordo");
            d.put("contrato", novo);
        }
        return d;
    }
}
