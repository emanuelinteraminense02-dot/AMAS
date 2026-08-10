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

     * Autentica qualquer perfil (admin, empresario, associado).

     * Retorna um mapa com os dados do usuário + campo "perfil".

     */

    public Map<String, Object> autenticar(String email, String senha) {

        String emailNorm = email.trim().toLowerCase();

        // Verifica admin / empresario primeiro

        Optional<Usuario> usuOpt = usuarioRepository.findByEmail(emailNorm);

        if (usuOpt.isPresent() && usuOpt.get().getSenha().equals(senha)) {

            Usuario u = usuOpt.get();

            logService.registrar("Login realizado", u.getNome(), u.getPerfil(),

                    "Acesso ao painel de " + u.getPerfil());

            return usuarioParaMap(u);

        }

        // Verifica associado

        Optional<Associado> assocOpt = associadoRepository.findByEmail(emailNorm);

        if (assocOpt.isPresent() && assocOpt.get().getSenha().equals(senha)) {

            Associado a = assocOpt.get();

            logService.registrar("Login realizado", a.getNome(), "associado",

                    "Acesso ao painel do associado");

            return associadoParaMap(a);

        }

        throw new RuntimeException("Credenciais inválidas.");

    }

    /**
     * Altera a senha do associado.
     * Quando senhaAtual é null (redefinição obrigatória no primeiro login),
     * a verificação da senha atual é ignorada.
     */
    public void alterarSenha(Long associadoId, String senhaAtual, String novaSenha) {

        Associado a = associadoRepository.findById(associadoId)

                .orElseThrow(() -> new RuntimeException("Associado não encontrado."));

        if (senhaAtual != null && !a.getSenha().equals(senhaAtual)) {

            throw new RuntimeException("Senha atual incorreta.");

        }

        a.setSenha(novaSenha);

        a.setPrimeiroLogin(false);

        a.setSenhaExpirada(false);

        a.setResetSolicitado(false);

        a.setDataResetSolicit(null);

        associadoRepository.save(a);

    }

    // ── helpers ──────────────────────────────────────────────

    private Map<String, Object> usuarioParaMap(Usuario u) {
        return new HashMap<>(empresarioPayloadMapper.toResponse(u));

    }

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
