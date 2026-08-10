package com.br.amas.demo.repository;

import com.br.amas.demo.model.InscricaoEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InscricaoEventoRepository extends JpaRepository<InscricaoEvento, Long> {
    List<InscricaoEvento> findByEventoId(Long eventoId);
    List<InscricaoEvento> findByAssociadoId(Long associadoId);
    Optional<InscricaoEvento> findByEventoIdAndAssociadoId(Long eventoId, Long associadoId);
    boolean existsByEventoIdAndAssociadoId(Long eventoId, Long associadoId);
    long countByEventoIdAndSituacao(Long eventoId, String situacao);
    void deleteByAssociadoId(Long associadoId);
}
