package com.br.amas.demo.service;

import com.br.amas.demo.model.Associado;
import com.br.amas.demo.model.Usuario;
import com.br.amas.demo.repository.AssociadoRepository;
import com.br.amas.demo.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final AssociadoRepository associadoRepository;
    private final LogService logService;
    private final EmpresarioPayloadMapper empresarioPayloadMapper;

    /**
     * Autentica admin, empresário ou associado.
     */
    public Map<String, Object> autenticar(String email, String senha) {

        if (email == null || senha == null) {
            throw new RuntimeException("E-mail e senha são obrigatórios.");
        }

        String emailNorm = email.trim().toLowerCase();

        // =========================================================
        // ADMIN / EMPRESÁRIO
        // =========================================================

        Optional<Usuario> usuOpt = usuarioRepository.findByEmail(emailNorm);

        if (usuOpt.isPresent()) {

            Usuario u = usuOpt.get();

            if (u.getSenha().equals(senha)) {

                logService.registrar(
                        "Login realizado",
                        u.getNome(),
                        u.getPerfil(),
                        "Acesso ao painel de " + u.getPerfil()
                );

                return usuarioParaMap(u);
            }
        }

        // =========================================================
        // ASSOCIADO
        // =========================================================

        Optional<Associado> assocOpt =
                associadoRepository.findByEmail(emailNorm);

        if (assocOpt.isPresent()) {

            Associado a = assocOpt.get();

            if (a.getSenha().equals(senha)) {

                logService.registrar(
                        "Login realizado",
                        a.getNome(),
                        "associado",
                        "Acesso ao painel do associado"
                );

                return associadoParaMap(a);
            }
        }

        throw new RuntimeException("Credenciais inválidas.");
    }

    /**
     * Altera a senha do associado.
     *
     * Se senhaAtual for null ou vazia, permite redefinição
     * obrigatória no primeiro login.
     */
    public void alterarSenha(
            Long associadoId,
            String senhaAtual,
            String novaSenha
    ) {

        if (novaSenha == null || novaSenha.isBlank()) {
            throw new RuntimeException("A nova senha é obrigatória.");
        }

        Associado a = associadoRepository.findById(associadoId)
                .orElseThrow(() ->
                        new RuntimeException("Associado não encontrado.")
                );

        /*
         * Quando senhaAtual não foi enviada, trata como redefinição
         * obrigatória.
         */
        if (senhaAtual != null
                && !senhaAtual.isBlank()
                && !a.getSenha().equals(senhaAtual)) {

            throw new RuntimeException("Senha atual incorreta.");
        }

        a.setSenha(novaSenha);
        a.setPrimeiroLogin(false);
        a.setSenhaExpirada(false);
        a.setResetSolicitado(false);
        a.setDataResetSolicit(null);

        associadoRepository.save(a);
    }

    // =============================================================
    // CONVERSÃO DE USUÁRIO
    // =============================================================

    private Map<String, Object> usuarioParaMap(Usuario u) {

        return new HashMap<>(
                empresarioPayloadMapper.toResponse(u)
        );
    }

    // =============================================================
    // CONVERSÃO DE ASSOCIADO
    // =============================================================

    private Map<String, Object> associadoParaMap(Associado a) {

        Map<String, Object> m = new HashMap<>();

        m.put("id", a.getId());
        m.put("nome", a.getNome());
        m.put("email", a.getEmail());
        m.put("cpf", a.getCpf());
        m.put("perfil", "associado");
        m.put("status", a.getStatus());
        m.put("matricula", a.getMatricula());

        m.put("primeiroLogin", a.getPrimeiroLogin());
        m.put("resetSolicitado", a.getResetSolicitado());
        m.put("senhaExpirada", a.getSenhaExpirada());
        m.put("dataResetSolicit", a.getDataResetSolicit());

        m.put("foto", a.getFoto());
        m.put("telefone", a.getTelefone());
        m.put("endereco", a.getEndereco());
        m.put("profissao", a.getProfissao());
        m.put("nascimento", a.getNascimento());
        m.put("dataEntrada", a.getDataEntrada());

        return m;
    }
}