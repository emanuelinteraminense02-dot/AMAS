package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inscricoes_evento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InscricaoEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "evento_id")
    private Evento evento;

    @ManyToOne(optional = false)
    @JoinColumn(name = "associado_id")
    private Associado associado;

    /**
     * Situação: confirmado | lista_espera
     */
    @Builder.Default
    private String situacao = "confirmado";

    private LocalDateTime dataInscricao;
}