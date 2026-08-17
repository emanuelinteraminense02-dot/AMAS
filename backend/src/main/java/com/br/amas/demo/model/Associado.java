package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "associados")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Associado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String cpf;

    private LocalDate nascimento;

    private String telefone;

    @Column(nullable = false, unique = true)
    private String email;

    private String endereco;

    private String profissao;

    @Column(nullable = false)
    private String senha;

    @Builder.Default
    private Boolean primeiroLogin = true;

    @Builder.Default
    private Boolean resetSolicitado = false;

    @Builder.Default
    private Boolean senhaExpirada = false;

    /** * Status possíveis: Regular | Inadimplente | Em análise
     */
    @Builder.Default
    private String status = "Em análise";

    @Column(unique = true)
    private String matricula;

    private LocalDate dataEntrada;

    /** * Base64 da foto de perfil
     */
    @Column(columnDefinition = "TEXT")
    private String foto;

    private LocalDateTime dataResetSolicit;
}
