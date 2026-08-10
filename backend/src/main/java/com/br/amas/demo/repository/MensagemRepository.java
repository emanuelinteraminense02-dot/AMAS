package com.br.amas.demo.repository;

import com.br.amas.demo.model.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    /** Mensagens por lista de segmentos, ordenadas da mais recente para a mais antiga. */
    List<Mensagem> findByDestinatariosInOrderByDataDesc(List<String> destinatarios);

    /** Todas as mensagens, mais recentes primeiro. */
    List<Mensagem> findAllByOrderByDataDesc();
}
