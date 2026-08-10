package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Registro financeiro mensal do empresário parceiro.
 * Armazena a renda bruta/líquida declarada e o valor calculado
 * pelo motor financeiro progressivo da AMAS.
 */
@Entity
@Table(name = "contribuicoes_empresario")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContribuicaoEmpresario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario empresario;

    /** * Formato: yyyy-MM, ex: "2025-03"
     */
    @Column(nullable = false)
    private String mes;

    private BigDecimal rendaBruta;

    private BigDecimal rendaLiquida;

    private BigDecimal valorDevido;

    /** * Faixa de contribuição: 1 | 2 | 3
     */
    private Integer faixa;

    private BigDecimal aliquotaAplicada;

    @Builder.Default
    private Boolean isento = false;

    /** * Status: Aguardando confirmação | Pago | Recusado
     */
    @Builder.Default
    private String status = "Aguardando confirmação";

    private LocalDateTime dataCriacao;

    private LocalDateTime dataComprovante;

    private LocalDateTime dataRevisao;

    private String comprovante;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(columnDefinition = "TEXT")
    private String obsAdmin;
}