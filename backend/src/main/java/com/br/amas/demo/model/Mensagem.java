package com.br.amas.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "mensagens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String corpo;

    private LocalDateTime data;

    /**
     * Tipo: "broadcast" (padrão)
     */
    private String tipo;

    /**
     * Segmentação do destinatário: todos | associados | empresarios
     */
    private String destinatarios;

    private String remetente;

    /**
     * IDs dos usuários que marcaram como lida, armazenados em CSV.
     * Exemplo: "1,5,12"
     */
    @Column(name = "lidas_ids", columnDefinition = "TEXT")
    @Builder.Default
    private String lidasIds = "";

    // ── Helpers para manipular lidasIds como lista ────────────────────────

    /**
     * Converte o CSV interno em lista de Longs.
     * Usado pela camada de serviço; NÃO é persistido (transient).
     */
    @Transient
    public List<Long> getLidasComoLista() {
        if (lidasIds == null || lidasIds.isBlank()) return Collections.emptyList();
        return Arrays.stream(lidasIds.split(","))
                .filter(s -> !s.isBlank())
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }

    public void adicionarLida(Long associadoId) {
        List<Long> lista = getLidasComoLista().stream().collect(Collectors.toList());
        if (!lista.contains(associadoId)) {
            lista.add(associadoId);
            this.lidasIds = lista.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
        }
    }

    public boolean foiLidaPor(Long associadoId) {
        return getLidasComoLista().contains(associadoId);
    }
}
