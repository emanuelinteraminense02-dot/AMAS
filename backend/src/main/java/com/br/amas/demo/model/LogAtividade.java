package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "log_atividades")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogAtividade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String acao;

    private String usuario;

    private String perfil;

    private LocalDateTime data;

    @Column(columnDefinition = "TEXT")
    private String detalhes;
}