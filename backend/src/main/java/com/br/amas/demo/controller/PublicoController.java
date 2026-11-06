package com.br.amas.demo.controller;

import com.br.amas.demo.model.Associado;
import com.br.amas.demo.service.AssociadoService;
import com.br.amas.demo.service.EmpresarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Dados públicos e agregados, sem informação pessoal, usados pela página inicial e pelo aplicativo. */
@RestController
@RequestMapping("/api/publico")
@RequiredArgsConstructor
public class PublicoController {

    private final AssociadoService associadoService;
    private final EmpresarioService empresarioService;

    @GetMapping("/estatisticas")
    public ResponseEntity<?> estatisticas() {
        List<Associado> todos = associadoService.listarTodos();
        long regulares = todos.stream().filter(a -> "Regular".equals(a.getStatus())).count();
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("total", todos.size());
        r.put("totalAssociados", todos.size());
        r.put("regulares", regulares);
        r.put("totalEmpresarios", empresarioService.listarTodos().size());
        return ResponseEntity.ok(r);
    }
}
