package com.br.amas.demo.service;

import com.br.amas.demo.model.Usuario;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class EmpresarioPayloadMapper {

    private static final TypeReference<List<Map<String, Object>>> LIST_TYPE = new TypeReference<>() {};
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final ObjectMapper objectMapper;

    public Map<String, Object> toResponse(Usuario usuario) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", usuario.getId());
        resp.put("nome", usuario.getNome());
        resp.put("email", usuario.getEmail());
        resp.put("perfil", usuario.getPerfil());
        resp.put("cnpj", usuario.getCnpj());
        resp.put("telefone", usuario.getTelefone());
        resp.put("primeiroLogin", usuario.getPrimeiroLogin());
        resp.put("resetSolicitado", usuario.getResetSolicitado());
        resp.put("senhaExpirada", usuario.getSenhaExpirada());
        resp.put("dataResetSolicit", usuario.getDataResetSolicit());
        resp.put("unidades", parseUnidades(usuario.getUnidades()));
        resp.put("contrato", parseContrato(usuario.getContrato()));
        return resp;
    }

    public Usuario fromPayload(Map<String, Object> payload) {
        return Usuario.builder()
                .nome(textValue(payload.get("nome")))
                .email(normalizedEmail(payload.get("email")))
                .senha(defaultIfBlank(textValue(payload.get("senha")), "123456"))
                .perfil(defaultIfBlank(textValue(payload.get("perfil")), "empresario"))
                .cnpj(blankToNull(textValue(payload.get("cnpj"))))
                .telefone(blankToNull(textValue(payload.get("telefone"))))
                .primeiroLogin(boolValue(payload.get("primeiroLogin"), true))
                .resetSolicitado(boolValue(payload.get("resetSolicitado"), false))
                .senhaExpirada(boolValue(payload.get("senhaExpirada"), false))
                .unidades(toUnidadesJson(payload.get("unidades")))
                .contrato(toContratoJson(payload.get("contrato")))
                .build();
    }

    public List<Map<String, Object>> parseUnidades(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, LIST_TYPE);
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    public Map<String, Object> parseContrato(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, MAP_TYPE);
        } catch (JsonProcessingException e) {
            return Collections.emptyMap();
        }
    }

    public String toUnidadesJson(Object value) {
        return toJson(value, "[]");
    }

    public String toContratoJson(Object value) {
        return toJson(value, "{}");
    }

    private String toJson(Object value, String emptyJson) {
        if (value == null) {
            return emptyJson;
        }
        if (value instanceof String text) {
            String normalized = text.trim();
            return normalized.isEmpty() ? emptyJson : normalized;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Erro ao serializar dados do empresario.", e);
        }
    }

    private String textValue(Object value) {
        return value == null ? null : value.toString().trim();
    }

    private String normalizedEmail(Object value) {
        String email = textValue(value);
        return email == null ? null : email.toLowerCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private Boolean boolValue(Object value, boolean fallback) {
        if (value == null) {
            return fallback;
        }
        return Boolean.parseBoolean(value.toString());
    }
}
