package com.br.amas.demo.controller;

import com.br.amas.demo.service.AssociadoService;

import com.br.amas.demo.service.EmpresarioService;

import com.br.amas.demo.service.LogService;

import com.br.amas.demo.service.SolicitacaoService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**

 * Endpoints exclusivos do painel administrativo.

 * Consolida operações de visão geral que o admin precisa.

 */

@RestController

@RequestMapping("/api/admin")

@RequiredArgsConstructor

public class AdminController {

    private final AssociadoService associadoService;

    private final EmpresarioService empresarioService;

    private final SolicitacaoService solicitacaoService;

    private final LogService logService;

    /** Dashboard: KPIs rápidos */

    @GetMapping("/dashboard")

    public ResponseEntity<?> dashboard() {

        java.util.List<com.br.amas.demo.model.Associado> todos = associadoService.listarTodos();

        long total        = todos.size();
        long regulares    = todos.stream().filter(a -> "Regular".equals(a.getStatus())).count();
        long inadim       = todos.stream().filter(a -> "Inadimplente".equals(a.getStatus())).count();
        long emAnalise    = todos.stream().filter(a -> "Em análise".equals(a.getStatus())).count();
        long pendentes    = todos.stream().filter(a -> "Pendente".equals(a.getStatus())).count();

        double totalArrecadado = associadoService.calcularTotalArrecadado();

        long alertasPendentes  = empresarioService.contarAlertasNaoResolvidos();

        long totalEmpresarios  = empresarioService.listarTodos().size();

        long solicitacoesPend  = solicitacaoService.listarPendentes().size();

        long contribuicoesPendentes = todos.stream()
                .flatMap(a -> associadoService.listarContribuicoes(a.getId()).stream())
                .filter(c -> "Em análise".equals(c.getStatus()))
                .count();

        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("total",              total);
        resp.put("regulares",          regulares);
        resp.put("inadim",             inadim);
        resp.put("emAnalise",          emAnalise);
        resp.put("pendentes",          pendentes);
        resp.put("totalArrecadado",    totalArrecadado);
        resp.put("alertasPendentes",   alertasPendentes);
        resp.put("totalAssociados",    total);
        resp.put("inadimplentes",      inadim);
        resp.put("totalEmpresarios",   totalEmpresarios);
        resp.put("solicitacoesPendentes", solicitacoesPend);
        resp.put("contribuicoesPendentes", contribuicoesPendentes);

        return ResponseEntity.ok(resp);

    }

    /** Log de atividades (últimas 100 entradas) */

    @GetMapping("/log")

    public ResponseEntity<?> log() {

        return ResponseEntity.ok(logService.listarTodos());

    }

    /** Todas as contribuições pendentes de aprovação */

    @GetMapping("/contribuicoes/pendentes")

    public ResponseEntity<?> contribuicoesPendentes() {

        return ResponseEntity.ok(associadoService.listarTodos().stream()

                .flatMap(a -> associadoService.listarContribuicoes(a.getId()).stream())

                .filter(c -> "Em análise".equals(c.getStatus()))

                .toList());

    }

    /** Todos os alertas dos empresários */

    @GetMapping("/alertas-empresario")

    public ResponseEntity<?> alertasEmpresario() {

        return ResponseEntity.ok(empresarioService.listarTodosAlertas());

    }

    @PatchMapping("/alertas-empresario/{id}/lido")

    public ResponseEntity<?> marcarAlertaLido(@PathVariable Long id) {

        empresarioService.marcarAlertaLido(id);

        return ResponseEntity.ok(Map.of("mensagem", "Alerta marcado como lido."));

    }

    /** Solicitações de associação */

    @GetMapping("/solicitacoes")

    public ResponseEntity<?> solicitacoes() {

        return ResponseEntity.ok(solicitacaoService.listarTodas());

    }

    @PostMapping("/solicitacoes/{id}/aprovar")

    public ResponseEntity<?> aprovarSolicitacao(@PathVariable Long id) {

        try {

            return ResponseEntity.ok(solicitacaoService.aprovar(id));

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));

        }

    }

    @PostMapping("/solicitacoes/{id}/recusar")

    public ResponseEntity<?> recusarSolicitacao(@PathVariable Long id,

                                                @RequestBody Map<String, String> body) {

        solicitacaoService.recusar(id, body.getOrDefault("observacoes", ""));

        return ResponseEntity.ok(Map.of("mensagem", "Solicitação recusada."));

    }

}
