package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_mensagens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String channelId;

    @Column(nullable = false)
    private String senderId;

    private String senderNome;

    private String senderPerfil;

    @Column(columnDefinition = "TEXT")
    private String texto;

    private String anexoNome;

    @Column(columnDefinition = "TEXT")
    private String anexoUrl;

    private String anexoTipo;

    private Long anexoTamanho;

    @Builder.Default
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Builder.Default
    private Boolean lida = false;

    @Builder.Default
    private Boolean apagada = false;
}
