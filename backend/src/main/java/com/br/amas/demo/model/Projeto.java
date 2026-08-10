package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "projetos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Projeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String resumo;

    private String categoria;

    /**
     * Status: Em andamento | Planejado | Concluído
     */
    @Builder.Default
    private String status = "Em andamento";

    @Builder.Default
    private Boolean destaque = false;

    private Integer participantes;

    private String unidadeMetrica;

    private String icone;

    private LocalDate dataInicio;

    private LocalDate atualizadoEm;
}
