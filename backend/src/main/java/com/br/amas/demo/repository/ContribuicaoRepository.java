package com.br.amas.demo.repository;

import com.br.amas.demo.model.Contribuicao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContribuicaoRepository extends JpaRepository<Contribuicao, Long> {
    List<Contribuicao> findByAssociadoId(Long associadoId);
    List<Contribuicao> findByStatus(String status);
    List<Contribuicao> findByAssociadoIdAndStatus(Long associadoId, String status);
    void deleteByAssociadoId(Long associadoId);
}
