package com.br.amas.demo.repository;

import com.br.amas.demo.model.Projeto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjetoRepository extends JpaRepository<Projeto, Long> {
    List<Projeto> findAllByOrderByDestaqueDescAtualizadoEmDescTituloAsc();
    List<Projeto> findByStatusOrderByDestaqueDescAtualizadoEmDescTituloAsc(String status);
}
