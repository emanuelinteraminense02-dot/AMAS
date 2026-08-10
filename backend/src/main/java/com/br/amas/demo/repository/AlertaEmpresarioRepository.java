package com.br.amas.demo.repository;

import com.br.amas.demo.model.AlertaEmpresario;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertaEmpresarioRepository extends JpaRepository<AlertaEmpresario, Long> {

    List<AlertaEmpresario> findByEmpresarioIdOrderByDataDesc(Long empresarioId);

    List<AlertaEmpresario> findAllByOrderByDataDesc();

    long countByLidoFalse();

    void deleteByEmpresarioId(Long empresarioId);

}
