package com.br.amas.demo.repository;

import com.br.amas.demo.model.ChatMensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ChatMensagemRepository extends JpaRepository<ChatMensagem, Long> {

    List<ChatMensagem> findByChannelIdOrderByCriadoEmAsc(String channelId);

    List<ChatMensagem> findAllByOrderByCriadoEmAsc();

    long countByChannelIdAndLidaFalseAndSenderPerfilNot(String channelId, String senderPerfil);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMensagem m SET m.lida = true WHERE m.channelId = :channelId AND m.senderPerfil <> :leitorPerfil AND m.lida = false")
    void marcarComoLidas(@Param("channelId") String channelId, @Param("leitorPerfil") String leitorPerfil);
}
