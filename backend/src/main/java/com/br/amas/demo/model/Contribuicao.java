package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Comprovante de pagamento mensal enviado pelo associado.
 */
@Entity
@Table(name = "contribuicoes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contribuicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "associado_id")
    private Associado associado;

    @Column(nullable = false)
    private String mes; // ex: "Janeiro 2025"

    private BigDecimal valor;

    private String arquivo; // nome do arquivo comprovante ou path

    private LocalDate data;

    /**
     * Status possíveis: Em análise | Aprovado | Recusado | Revisão solicitada
     */
    @Builder.Default
    private String status = "Em análise";

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(columnDefinition = "TEXT")
    private String msgAdmin;
}