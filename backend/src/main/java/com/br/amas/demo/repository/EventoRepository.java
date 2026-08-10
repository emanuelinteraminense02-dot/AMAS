package com.br.amas.demo.repository;

import com.br.amas.demo.model.Evento;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    List<Evento> findByStatus(String status);

    List<Evento> findByDestaque(Boolean destaque);

    List<Evento> findAllByOrderByDataAsc();

}
