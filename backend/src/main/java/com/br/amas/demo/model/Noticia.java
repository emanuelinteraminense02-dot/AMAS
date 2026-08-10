package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "noticias")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Noticia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String resumo;

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    /**
     * Categorias: parceria | comunicado | social | cultural | conquista | capacitacao
     */
    private String categoria;

    @Builder.Default
    private Boolean destaque = false;

    private LocalDate publicadaEm;

    private String autor;
}