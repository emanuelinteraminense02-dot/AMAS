package com.br.amas.demo.config;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Regras de propriedade dos registros: o administrador acessa tudo; associados e
 * empresários acessam somente os próprios dados (id e perfil vêm do token JWT).
 */
@Component
public class Acesso {

    private Map<?, ?> detalhes() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Map<?, ?> m) {
            return m;
        }
        return Map.of();
    }

    public Long idUsuario() {
        Object id = detalhes().get("id");
        return id instanceof Number n ? n.longValue() : null;
    }

    public String perfil() {
        Object p = detalhes().get("perfil");
        return p != null ? p.toString().toLowerCase() : "";
    }

    public boolean isAdmin() {
        return "admin".equals(perfil());
    }

    public void exigirAdmin() {
        if (!isAdmin()) {
            throw new AccessDeniedException("Apenas o administrador pode executar esta operação.");
        }
    }

    public void exigirAdminOuAssociado(Long associadoId) {
        if (isAdmin()) return;
        if ("associado".equals(perfil()) && associadoId != null && associadoId.equals(idUsuario())) return;
        throw new AccessDeniedException("Você só pode acessar os seus próprios dados.");
    }

    public void exigirAdminOuEmpresario(Long empresarioId) {
        if (isAdmin()) return;
        if ("empresario".equals(perfil()) && empresarioId != null && empresarioId.equals(idUsuario())) return;
        throw new AccessDeniedException("Você só pode acessar os dados da sua empresa.");
    }

    public void exigirAdminOuEmpresario() {
        if (!isAdmin() && !"empresario".equals(perfil())) {
            throw new AccessDeniedException("Operação disponível apenas para empresas parceiras e administradores.");
        }
    }
}
