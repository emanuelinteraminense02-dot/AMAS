package com.br.amas.demo.repository;

import com.br.amas.demo.model.ParcelaAtraso;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ParcelaAtrasoRepository extends JpaRepository<ParcelaAtraso, Long> {
    List<ParcelaAtraso> findByAssociadoId(Long associadoId);
    void deleteByAssociadoId(Long associadoId);
}