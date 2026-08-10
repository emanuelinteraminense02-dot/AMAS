package com.br.amas.demo.repository;

import com.br.amas.demo.model.LogAtividade;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Pageable;

import java.util.List;

public interface LogAtividadeRepository extends JpaRepository<LogAtividade, Long> {

    List<LogAtividade> findAllByOrderByDataDesc(Pageable pageable);

}
