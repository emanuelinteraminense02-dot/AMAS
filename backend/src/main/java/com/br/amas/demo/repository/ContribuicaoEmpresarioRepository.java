package com.br.amas.demo.repository;

import com.br.amas.demo.model.ContribuicaoEmpresario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContribuicaoEmpresarioRepository extends JpaRepository<ContribuicaoEmpresario, Long> {
    List<ContribuicaoEmpresario> findByEmpresarioId(Long empresarioId);
    List<ContribuicaoEmpresario> findByEmpresarioIdOrderByMesDesc(Long empresarioId);
    List<ContribuicaoEmpresario> findByStatus(String status);
    boolean existsByEmpresarioIdAndMes(Long empresarioId, String mes);
    void deleteByEmpresarioId(Long empresarioId);
}
