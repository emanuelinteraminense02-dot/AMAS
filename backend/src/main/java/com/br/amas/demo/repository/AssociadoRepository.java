package com.br.amas.demo.repository;

import com.br.amas.demo.model.Associado;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AssociadoRepository extends JpaRepository<Associado, Long> {
    Optional<Associado> findByCpf(String cpf);
    Optional<Associado> findByEmail(String email);
    Optional<Associado> findByEmailAndSenha(String email, String senha);
    boolean existsByCpf(String cpf);
    boolean existsByEmail(String email);
    List<Associado> findByStatus(String status);
}