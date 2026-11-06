package com.br.amas.demo.service;

import com.br.amas.demo.config.JwtService;
import com.br.amas.demo.model.Associado;
import com.br.amas.demo.model.Usuario;
import com.br.amas.demo.repository.AssociadoRepository;
import com.br.amas.demo.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final AssociadoRepository associadoRepository;
    private final LogService logService;
    private final EmpresarioPayloadMapper empresarioPayloadMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Valida senha considerando hash BCrypt ou suporte a migração progressiva de senha legada.
     */
    private boolean verificarSenha(String senhaInformada, String hashOuPlano) {
        if (senhaInformada == null || hashOuPlano == null) {
            return false;
        }
        if (hashOuPlano.startsWith("$2a$") || hashOuPlano.startsWith("$2b$") || hashOuPlano.startsWith("$2y$")) {
            return passwordEncoder.matches(senhaInformada, hashOuPlano);
        }
        return hashOuPlano.equals(senhaInformada);
    }

    /**
     * Autentica admin, empresário ou associado e emite token JWT JJWT 0.12.6.
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

            if (verificarSenha(senha, u.getSenha())) {

                // Migração progressiva: se ainda em texto puro, criptografa com BCrypt
                if (u.getSenha() != null && !u.getSenha().startsWith("$2")) {
                    u.setSenha(passwordEncoder.encode(senha));
                    usuarioRepository.save(u);
                }

                logService.registrar(
                        "Login realizado",
                        u.getNome(),
                        u.getPerfil(),
                        "Acesso ao painel de " + u.getPerfil()
                );

                Map<String, Object> resp = usuarioParaMap(u);
                String token = jwtService.gerarToken(u.getId(), u.getEmail(), u.getNome(), u.getPerfil());
                resp.put("token", token);
                return resp;
            }
        }

        // =========================================================
        // ASSOCIADO
        // =========================================================

        Optional<Associado> assocOpt = associadoRepository.findByEmail(emailNorm);

        if (assocOpt.isPresent()) {

            Associado a = assocOpt.get();

            if (verificarSenha(senha, a.getSenha())) {

                // Migração progressiva: se ainda em texto puro, criptografa com BCrypt
                if (a.getSenha() != null && !a.getSenha().startsWith("$2")) {
                    a.setSenha(passwordEncoder.encode(senha));
                    associadoRepository.save(a);
                }

                logService.registrar(
                        "Login realizado",
                        a.getNome(),
                        "associado",
                        "Acesso ao painel do associado"
                );

                Map<String, Object> resp = associadoParaMap(a);
                String token = jwtService.gerarToken(a.getId(), a.getEmail(), a.getNome(), "associado");
                resp.put("token", token);
                return resp;
            }
        }

        throw new RuntimeException("Credenciais inválidas.");
    }

    /**
     * Altera a senha do associado de forma segura com validação rigorosa.
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

        boolean trocaObrigatoria = Boolean.TRUE.equals(a.getPrimeiroLogin())
                || Boolean.TRUE.equals(a.getSenhaExpirada())
                || Boolean.TRUE.equals(a.getResetSolicitado());

        if (!trocaObrigatoria) {
            if (senhaAtual == null || senhaAtual.isBlank()) {
                throw new RuntimeException("A senha atual é obrigatória para alteração de senha.");
            }
            if (!verificarSenha(senhaAtual, a.getSenha())) {
                throw new RuntimeException("Senha atual incorreta.");
            }
        } else if (senhaAtual != null && !senhaAtual.isBlank()) {
            if (!verificarSenha(senhaAtual, a.getSenha())) {
                throw new RuntimeException("Senha atual incorreta.");
            }
        }

        a.setSenha(passwordEncoder.encode(novaSenha));
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

    // =============================================================
    // REDEFINIÇÃO DE SENHA
    // =============================================================

    /**
     * Pedido público de redefinição ("Esqueci minha senha"). Marca a conta para o administrador.
     * A resposta é sempre a mesma, exista ou não o e-mail, para não revelar quem tem cadastro.
     */
    public void solicitarRedefinicao(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Informe o e-mail cadastrado.");
        }
        String emailNorm = email.trim().toLowerCase();
        java.time.LocalDateTime agora = java.time.LocalDateTime.now();

        Optional<Associado> assoc = associadoRepository.findByEmail(emailNorm);
        if (assoc.isPresent()) {
            Associado a = assoc.get();
            a.setResetSolicitado(true);
            a.setDataResetSolicit(agora);
            associadoRepository.save(a);
            logService.registrar("Reset de senha solicitado", a.getNome(), "associado", "Solicitação enviada via tela de login");
            return;
        }
        usuarioRepository.findByEmail(emailNorm)
                .filter(u -> !"admin".equalsIgnoreCase(u.getPerfil()))
                .ifPresent(u -> {
                    u.setResetSolicitado(true);
                    u.setDataResetSolicit(agora);
                    usuarioRepository.save(u);
                    logService.registrar("Reset de senha solicitado", u.getNome(), u.getPerfil(), "Solicitação enviada via tela de login");
                });
    }

    /**
     * Redefinição feita pelo administrador: gera uma senha temporária aleatória,
     * obriga a troca no próximo acesso e devolve a senha uma única vez.
     */
    public Map<String, Object> redefinirPeloAdmin(String colecao, Long id) {
        String temporaria = SenhaTemporaria.gerar();
        String nome;
        if ("associados".equalsIgnoreCase(colecao) || "associado".equalsIgnoreCase(colecao)) {
            Associado a = associadoRepository.findById(id).orElseThrow(() -> new RuntimeException("Associado não encontrado."));
            a.setSenha(passwordEncoder.encode(temporaria));
            a.setSenhaExpirada(true);
            a.setResetSolicitado(false);
            a.setDataResetSolicit(null);
            associadoRepository.save(a);
            nome = a.getNome();
        } else {
            Usuario u = usuarioRepository.findById(id).orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
            if ("admin".equalsIgnoreCase(u.getPerfil())) {
                throw new RuntimeException("A senha do administrador não pode ser redefinida por esta tela.");
            }
            u.setSenha(passwordEncoder.encode(temporaria));
            u.setSenhaExpirada(true);
            u.setResetSolicitado(false);
            u.setDataResetSolicit(null);
            usuarioRepository.save(u);
            nome = u.getNome();
        }
        logService.registrar("Senha redefinida pelo Admin", "Admin", "admin", nome + " — senha temporária gerada");
        Map<String, Object> r = new HashMap<>();
        r.put("nome", nome);
        r.put("senhaTemporaria", temporaria);
        return r;
    }
}
