package com.br.amas.demo.repository;

import com.br.amas.demo.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Utilizado para autenticação simples.
     */
    Optional<Usuario> findByEmailAndSenha(String email, String senha);

    /**
     * Busca usuário pelo e-mail para validação de login ou recuperação.
     */
    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByCnpj(String cnpj);

    /**
     * Filtra usuários por perfil (admin | empresario).
     */
    List<Usuario> findByPerfil(String perfil);

    /**
     * Verifica se o e-mail já está cadastrado antes de salvar um novo usuário.
     */
    boolean existsByEmail(String email);

    boolean existsByCnpj(String cnpj);
}
