package com.br.amas.demo.controller;

import com.br.amas.demo.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    /**
     * Listar todos os canais de associados e empresários para o painel de atendimento.
     */
    @GetMapping("/canais")
    public ResponseEntity<?> listarCanais() {
        try {
            return ResponseEntity.ok(chatService.listarCanais());
        } catch (Exception e) {
            log.error("[CHAT API] Erro ao listar canais:", e);
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "erro", e.getMessage()));
        }
    }

    /**
     * Listar mensagens de um canal específico (ex: "assoc_1", "emp_4").
     */
    @GetMapping("/mensagens/{channelId}")
    public ResponseEntity<?> listarMensagens(@PathVariable String channelId) {
        try {
            return ResponseEntity.ok(Map.of(
                    "ok", true,
                    "channelId", channelId,
                    "mensagens", chatService.listarMensagens(channelId)
            ));
        } catch (Exception e) {
            log.error("[CHAT API] Erro ao listar mensagens do canal {}:", channelId, e);
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "erro", e.getMessage()));
        }
    }

    /**
     * Enviar e persistir nova mensagem de chat no banco de dados padrão.
     */
    @PostMapping("/mensagens")
    public ResponseEntity<?> enviarMensagem(@RequestBody Map<String, Object> body) {
        try {
            Map<String, Object> mensagemSalva = chatService.salvarMensagem(body);
            return ResponseEntity.ok(Map.of(
                    "ok", true,
                    "mensagem", mensagemSalva
            ));
        } catch (IllegalArgumentException e) {
            log.warn("[CHAT API] Requisição inválida ao enviar mensagem: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("ok", false, "erro", e.getMessage()));
        } catch (Exception e) {
            log.error("[CHAT API] Falha crítica ao persistir mensagem:", e);
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "erro", "Erro no servidor ao salvar mensagem."));
        }
    }

    /**
     * Marcar mensagens de um canal como lidas (suporta PATCH, POST e PUT para compatibilidade com proxies/firewalls).
     */
    @RequestMapping(value = "/mensagens/{channelId}/lidas", method = {RequestMethod.PATCH, RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> marcarLidas(@PathVariable String channelId,
                                         @RequestBody(required = false) Map<String, Object> body) {
        try {
            String leitorPerfil = body != null ? (String) body.get("leitorPerfil") : "admin";
            chatService.marcarLidas(channelId, leitorPerfil);
            return ResponseEntity.ok(Map.of("ok", true, "mensagem", "Mensagens marcadas como lidas."));
        } catch (Exception e) {
            log.error("[CHAT API] Erro ao marcar lidas no canal {}:", channelId, e);
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "erro", e.getMessage()));
        }
    }

    /**
     * Upload de anexo em base64 Data URL para permitir envio de imagens e documentos.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadAnexo(@RequestBody Map<String, Object> body) {
        try {
            String nome = (String) body.getOrDefault("nomeArquivo", "arquivo");
            String base64 = (String) body.get("base64");
            Object tamanho = body.getOrDefault("tamanho", 0);

            if (base64 == null || base64.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("ok", false, "erro", "Arquivo inválido ou vazio."));
            }

            String ext = "";
            int dotIdx = nome.lastIndexOf('.');
            if (dotIdx >= 0) {
                ext = nome.substring(dotIdx + 1).toLowerCase();
            }

            String tipo = "arquivo";
            if (ext.matches("jpg|jpeg|png|webp|gif|svg")) tipo = "imagem";
            else if ("pdf".equals(ext)) tipo = "pdf";
            else if (ext.matches("doc|docx|odt|txt")) tipo = "documento";

            Map<String, Object> anexo = new LinkedHashMap<>();
            anexo.put("nome", nome);
            anexo.put("url", base64);
            anexo.put("tipo", tipo);
            anexo.put("tamanho", tamanho);

            return ResponseEntity.ok(Map.of("ok", true, "anexo", anexo));
        } catch (Exception e) {
            log.error("[CHAT API] Erro no upload de anexo:", e);
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "erro", e.getMessage()));
        }
    }

    /**
     * Sincronização em lote de mensagens (resiliência para offline).
     */
    @PostMapping("/sync")
    public ResponseEntity<?> sincronizarMensagens(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("ok", true, "sincronizado", true));
    }

    /**
     * Apagar mensagem do chat (marca como apagada por segurança e remove texto e anexo).
     */
    @RequestMapping(value = "/mensagens/{id}", method = {RequestMethod.DELETE, RequestMethod.POST})
    public ResponseEntity<?> apagarMensagem(@PathVariable String id) {
        try {
            Map<String, Object> msg = chatService.apagarMensagem(id);
            return ResponseEntity.ok(Map.of("ok", true, "mensagemId", id, "mensagem", msg));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "erro", e.getMessage()));
        } catch (Exception e) {
            log.error("[CHAT API] Erro ao apagar mensagem {}:", id, e);
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "erro", e.getMessage()));
        }
    }
}
