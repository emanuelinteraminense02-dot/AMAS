package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "solicitacoes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Solicitacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, nullable = true)
    private String cpf;

    @Column(unique = true)
    private String cnpj;

    @Column(nullable = false, unique = true)
    private String email;

    private String telefone;

    private String responsavel;

    private String profissao;

    private String endereco;

    private LocalDate nascimento;

    private LocalDate dataSolicitacao;

    /**
     * Tipos: pessoa_fisica | empresa
     */
    @Builder.Default
    private String tipoSolicitante = "pessoa_fisica";

    /**
     * Status: Pendente | Aprovado | Recusado
     */
    @Builder.Default
    private String status = "Pendente";

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @PrePersist
    @PreUpdate
    void normalizeCamposOpcionais() {
        cpf = trimToNull(cpf);
        cnpj = trimToNull(cnpj);
        telefone = trimToNull(telefone);
        responsavel = trimToNull(responsavel);
        profissao = trimToNull(profissao);
        endereco = trimToNull(endereco);
        observacoes = trimToNull(observacoes);
        tipoSolicitante = trimToNull(tipoSolicitante);
        status = trimToNull(status);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
