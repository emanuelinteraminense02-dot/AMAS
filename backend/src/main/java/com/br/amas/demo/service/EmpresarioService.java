package com.br.amas.demo.service;

import com.br.amas.demo.model.AlertaEmpresario;
import com.br.amas.demo.model.ContribuicaoEmpresario;
import com.br.amas.demo.model.Usuario;
import com.br.amas.demo.repository.AlertaEmpresarioRepository;
import com.br.amas.demo.repository.ContribuicaoEmpresarioRepository;
import com.br.amas.demo.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmpresarioService {

    private final UsuarioRepository usuarioRepository;
    private final ContribuicaoEmpresarioRepository contribuicaoEmpRepo;
    private final AlertaEmpresarioRepository alertaRepo;
    private final MotorFinanceiroService motorFinanceiro;
    private final LogService logService;
    private final EmpresarioPayloadMapper empresarioPayloadMapper;

    public List<Usuario> listarTodos() {
        return usuarioRepository.findByPerfil("empresario");
    }

    public Usuario buscarPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empresário não encontrado: " + id));
        if (!"empresario".equalsIgnoreCase(usuario.getPerfil())) {
            throw new RuntimeException("Usuário informado não é empresário.");
        }
        return usuario;
    }

    @Transactional
    public Usuario cadastrar(Usuario usuario) {
        normalizarUsuario(usuario);

        if (usuario.getNome() == null || usuario.getNome().isBlank()) {
            throw new RuntimeException("Nome é obrigatório.");
        }

        if (usuario.getEmail() == null || usuario.getEmail().isBlank()) {
            throw new RuntimeException("E-mail é obrigatório.");
        }

        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new RuntimeException("E-mail já cadastrado.");
        }

        if (usuario.getCnpj() != null && !usuario.getCnpj().isBlank() && usuarioRepository.existsByCnpj(usuario.getCnpj())) {
            throw new RuntimeException("CNPJ já cadastrado.");
        }

        if (usuario.getSenha() == null || usuario.getSenha().isBlank()) {
            usuario.setSenha("123456");
        }

        usuario.setPerfil("empresario");
        usuario.setPrimeiroLogin(usuario.getPrimeiroLogin() == null || usuario.getPrimeiroLogin());
        usuario.setResetSolicitado(Boolean.TRUE.equals(usuario.getResetSolicitado()));
        usuario.setSenhaExpirada(Boolean.TRUE.equals(usuario.getSenhaExpirada()));
        usuario.setUnidades(usuario.getUnidades() == null || usuario.getUnidades().isBlank() ? "[]" : usuario.getUnidades());
        usuario.setContrato(usuario.getContrato() == null || usuario.getContrato().isBlank() ? "{}" : usuario.getContrato());

        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Map<String, Object> atualizar(Long id, Map<String, Object> dados) {
        Usuario existente = buscarPorId(id);

        if (dados.containsKey("nome") && dados.get("nome") != null) {
            existente.setNome(dados.get("nome").toString().trim());
        }

        if (dados.containsKey("email") && dados.get("email") != null) {
            String email = dados.get("email").toString().trim().toLowerCase();
            usuarioRepository.findByEmail(email)
                    .filter(outro -> !outro.getId().equals(id))
                    .ifPresent(outro -> {
                        throw new RuntimeException("E-mail já cadastrado.");
                    });
            existente.setEmail(email);
        }

        if (dados.containsKey("senha") && dados.get("senha") != null) {
            existente.setSenha(dados.get("senha").toString());
        }

        if (dados.containsKey("telefone")) {
            existente.setTelefone(trimToNull(dados.get("telefone")));
        }

        if (dados.containsKey("cnpj")) {
            String cnpj = trimToNull(dados.get("cnpj"));
            if (cnpj != null) {
                usuarioRepository.findByCnpj(cnpj)
                        .filter(outro -> !outro.getId().equals(id))
                        .ifPresent(outro -> {
                            throw new RuntimeException("CNPJ já cadastrado.");
                        });
            }
            existente.setCnpj(cnpj);
        }

        if (dados.containsKey("primeiroLogin")) {
            existente.setPrimeiroLogin(boolValue(dados.get("primeiroLogin")));
        }

        if (dados.containsKey("resetSolicitado")) {
            existente.setResetSolicitado(boolValue(dados.get("resetSolicitado")));
        }

        if (dados.containsKey("senhaExpirada")) {
            existente.setSenhaExpirada(boolValue(dados.get("senhaExpirada")));
        }

        if (dados.containsKey("dataResetSolicit")) {
            existente.setDataResetSolicit(parseDateTime(dados.get("dataResetSolicit")));
        }

        if (dados.containsKey("unidades")) {
            existente.setUnidades(empresarioPayloadMapper.toUnidadesJson(dados.get("unidades")));
        }

        if (dados.containsKey("contrato")) {
            existente.setContrato(empresarioPayloadMapper.toContratoJson(dados.get("contrato")));
        }

        if (dados.containsKey("foto") || dados.containsKey("logo")) {
            Object imgVal = dados.get("foto") != null ? dados.get("foto") : dados.get("logo");
            String f = imgVal != null ? imgVal.toString().trim() : null;
            existente.setFoto(f);
            existente.setLogo(f);
        }

        return empresarioPayloadMapper.toResponse(usuarioRepository.save(existente));
    }

    @Transactional
    public void remover(Long id) {
        buscarPorId(id);
        contribuicaoEmpRepo.deleteByEmpresarioId(id);
        alertaRepo.deleteByEmpresarioId(id);
        usuarioRepository.deleteById(id);
    }

    public List<ContribuicaoEmpresario> listarContribuicoes(Long empresarioId) {
        return contribuicaoEmpRepo.findByEmpresarioIdOrderByMesDesc(empresarioId);
    }

    @Transactional
    public ContribuicaoEmpresario registrarContribuicao(Long empresarioId,
                                                        BigDecimal rendaBruta,
                                                        BigDecimal rendaLiquida,
                                                        String mes,
                                                        BigDecimal aliquotaContrato,
                                                        boolean clubeDeBeneficios,
                                                        String comprovante,
                                                        String observacoes) {
        if (contribuicaoEmpRepo.existsByEmpresarioIdAndMes(empresarioId, mes)) {
            throw new RuntimeException("Contribuição para o mês " + mes + " já registrada.");
        }

        Usuario empresario = buscarPorId(empresarioId);
        MotorFinanceiroService.ResultadoCalculo resultado =
                motorFinanceiro.calcular(rendaLiquida, aliquotaContrato, clubeDeBeneficios);

        ContribuicaoEmpresario contribuicao = ContribuicaoEmpresario.builder()
                .empresario(empresario)
                .mes(mes)
                .rendaBruta(rendaBruta)
                .rendaLiquida(rendaLiquida)
                .valorDevido(resultado.valorDevido())
                .faixa(resultado.faixa())
                .aliquotaAplicada(resultado.aliquotaAplicada())
                .isento(resultado.isento())
                .status("Aguardando confirmação")
                .dataCriacao(LocalDateTime.now())
                .dataComprovante(comprovante != null ? LocalDateTime.now() : null)
                .comprovante(comprovante)
                .observacoes(observacoes)
                .build();

        logService.registrar("Contribuição registrada", empresario.getNome(), "empresario",
                "Mês " + mes + " - valor: R$" + resultado.valorDevido());

        return contribuicaoEmpRepo.save(contribuicao);
    }

    @Transactional
    public ContribuicaoEmpresario atualizarStatusContribuicao(Long id, String status, String obsAdmin) {
        ContribuicaoEmpresario contribuicao = contribuicaoEmpRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Contribuição não encontrada."));

        contribuicao.setStatus(status);
        contribuicao.setObsAdmin(obsAdmin);
        contribuicao.setDataRevisao(LocalDateTime.now());

        return contribuicaoEmpRepo.save(contribuicao);
    }

    @Transactional
    public AlertaEmpresario enviarAlerta(Long empresarioId, String titulo, String mensagem, boolean urgente) {
        Usuario empresario = buscarPorId(empresarioId);

        AlertaEmpresario alerta = AlertaEmpresario.builder()
                .empresario(empresario)
                .titulo(titulo)
                .mensagem(mensagem)
                .urgente(urgente)
                .data(LocalDateTime.now())
                .lido(false)
                .build();

        logService.registrar("Alerta enviado ao admin", empresario.getNome(), "empresario",
                "\"" + titulo + "\" " + (urgente ? "(URGENTE)" : ""));

        return alertaRepo.save(alerta);
    }

    public List<AlertaEmpresario> listarAlertas(Long empresarioId) {
        return alertaRepo.findByEmpresarioIdOrderByDataDesc(empresarioId);
    }

    public List<AlertaEmpresario> listarTodosAlertas() {
        return alertaRepo.findAllByOrderByDataDesc();
    }

    public long contarAlertasNaoResolvidos() {
        return alertaRepo.countByLidoFalse();
    }

    @Transactional
    public void marcarAlertaLido(Long alertaId) {
        AlertaEmpresario alerta = alertaRepo.findById(alertaId)
                .orElseThrow(() -> new RuntimeException("Alerta não encontrado."));

        alerta.setLido(true);
        alertaRepo.save(alerta);
    }

    private void normalizarUsuario(Usuario usuario) {
        if (usuario.getNome() != null) {
            usuario.setNome(usuario.getNome().trim());
        }
        if (usuario.getEmail() != null) {
            usuario.setEmail(usuario.getEmail().trim().toLowerCase());
        }
        if (usuario.getTelefone() != null) {
            usuario.setTelefone(trimToNull(usuario.getTelefone()));
        }
        if (usuario.getCnpj() != null) {
            usuario.setCnpj(trimToNull(usuario.getCnpj()));
        }
    }

    private String trimToNull(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    private boolean boolValue(Object value) {
        return value != null && Boolean.parseBoolean(value.toString());
    }

    private LocalDateTime parseDateTime(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : LocalDateTime.parse(text);
    }
}
