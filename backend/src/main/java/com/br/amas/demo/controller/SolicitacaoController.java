package com.br.amas.demo.controller;

import com.br.amas.demo.model.Solicitacao;

import com.br.amas.demo.service.SolicitacaoService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController

@RequestMapping("/api/solicitacoes")

@RequiredArgsConstructor

public class SolicitacaoController {

    private final SolicitacaoService solicitacaoService;

    @GetMapping

    public ResponseEntity<?> listar() {

        return ResponseEntity.ok(solicitacaoService.listarTodas());

    }

    @PostMapping

    public ResponseEntity<?> criar(@RequestBody Solicitacao s) {

        try {

            return ResponseEntity.ok(solicitacaoService.criar(s));

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));

        }

    }

}
