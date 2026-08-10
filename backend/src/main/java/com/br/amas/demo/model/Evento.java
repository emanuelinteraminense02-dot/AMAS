package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "eventos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    /**
     * Categorias: social | capacitacao | parceria | cultural
     */
    private String tipo;

    private LocalDate data;

    private String horario;

    private String local;

    private Integer vagas;

    @Builder.Default
    private Integer vagasTotais = 0;

    @Builder.Default
    private Integer inscricoes = 0;

    /**
     * Status: Aberto | Encerrado | Em Breve | Cancelado
     */
    @Builder.Default
    private String status = "Aberto";

    @Builder.Default
    private Boolean destaque = false;
}