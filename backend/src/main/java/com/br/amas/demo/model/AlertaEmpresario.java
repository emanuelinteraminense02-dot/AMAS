package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertas_empresario")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertaEmpresario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario empresario;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String mensagem;

    @Builder.Default
    private Boolean urgente = false;

    private LocalDateTime data;

    @Builder.Default
    private Boolean lido = false;
}