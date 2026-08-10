package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "parcelas_atraso")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParcelaAtraso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "associado_id")
    private Associado associado;

    @Column(nullable = false)
    private String mes;

    private BigDecimal valor;

    private LocalDate vencimento;
}