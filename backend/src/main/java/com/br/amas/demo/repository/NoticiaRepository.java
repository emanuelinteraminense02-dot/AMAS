package com.br.amas.demo.repository;

import com.br.amas.demo.model.Noticia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoticiaRepository extends JpaRepository<Noticia, Long> {
    List<Noticia> findByDestaque(Boolean destaque);
    List<Noticia> findByCategoria(String categoria);
    List<Noticia> findAllByOrderByPublicadaEmDesc();
}