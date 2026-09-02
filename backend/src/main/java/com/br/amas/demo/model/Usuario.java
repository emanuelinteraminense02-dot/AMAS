package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Column(nullable = false)
    private String perfil;

    @Builder.Default
    private Boolean primeiroLogin = true;

    @Builder.Default
    private Boolean resetSolicitado = false;

    @Builder.Default
    private Boolean senhaExpirada = false;

    private String cnpj;

    private String telefone;

    @Column(columnDefinition = "TEXT")
    private String unidades;

    @Column(columnDefinition = "TEXT")
    private String contrato;

    private LocalDateTime dataResetSolicit;
}