package com.br.amas.demo.service;

import com.br.amas.demo.model.Associado;
import com.br.amas.demo.model.Solicitacao;
import com.br.amas.demo.model.Usuario;
import com.br.amas.demo.repository.AssociadoRepository;
import com.br.amas.demo.repository.SolicitacaoRepository;
import com.br.amas.demo.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service

@RequiredArgsConstructor

public class SolicitacaoService {

    private final SolicitacaoRepository solicitacaoRepository;

    private final AssociadoService associadoService;

    private final EmpresarioService empresarioService;

    private final AssociadoRepository associadoRepository;

    private final UsuarioRepository usuarioRepository;

    private final LogService logService;

    public List<Solicitacao> listarTodas() {

        return solicitacaoRepository.findAll();

    }

    public List<Solicitacao> listarPendentes() {

        return solicitacaoRepository.findByStatus("Pendente");

    }

    public Solicitacao buscarPorId(Long id) {

        return solicitacaoRepository.findById(id)

                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada: " + id));

    }

    @Transactional

    public Solicitacao criar(Solicitacao s) {
        normalizarCampos(s);
        boolean empresa = isEmpresaSolicitacao(s);
        s.setTipoSolicitante(empresa ? "empresa" : "pessoa_fisica");

        if (empresa) {
            if (isBlank(s.getCnpj())) {
                throw new RuntimeException("CNPJ é obrigatório para solicitações de empresa.");
            }
            if (solicitacaoRepository.existsByCnpj(s.getCnpj()) || usuarioRepository.existsByCnpj(s.getCnpj())) {
                throw new RuntimeException("CNPJ já possui solicitação ou cadastro ativo.");
            }
            s.setCpf(null);
            s.setNascimento(null);
        } else {
            if (isBlank(s.getCpf())) {
                throw new RuntimeException("CPF é obrigatório para solicitações de pessoa física.");
            }
            if (solicitacaoRepository.existsByCpf(s.getCpf()) || associadoRepository.existsByCpf(s.getCpf())) {
                throw new RuntimeException("CPF já possui solicitação ou cadastro ativo.");
            }
            s.setCnpj(null);
            s.setResponsavel(null);
        }

        if (solicitacaoRepository.existsByEmail(s.getEmail())
                || associadoRepository.existsByEmail(s.getEmail())
                || usuarioRepository.existsByEmail(s.getEmail())) {
            throw new RuntimeException("E-mail já possui solicitação ou cadastro ativo.");
        }

        s.setDataSolicitacao(LocalDate.now());

        s.setStatus("Pendente");

        String documento = empresa ? s.getCnpj() : s.getCpf();
        logService.registrar("Solicitação de associação criada", s.getNome(), "publico",
                "Solicitação de " + s.getNome() + " (" + documento + ")");

        return solicitacaoRepository.save(s);

    }

    /**

     * Aprova a solicitação e converte automaticamente em Associado.

     */

    @Transactional
    public Object aprovar(Long id) {

        Solicitacao s = buscarPorId(id);

        s.setStatus("Aprovado");

        solicitacaoRepository.save(s);

        if (isEmpresaSolicitacao(s)) {
            Usuario empresa = Usuario.builder()
                    .nome(s.getNome())
                    .email(s.getEmail())
                    .senha("123456")
                    .perfil("empresario")
                    .cnpj(s.getCnpj())
                    .telefone(s.getTelefone())
                    .build();

            Usuario salvo = empresarioService.cadastrar(empresa);
            logService.registrar("Solicitação aprovada", "Admin", "admin",
                    s.getNome() + " aprovado e convertido em empresário");
            return salvo;
        }

        Associado novo = Associado.builder()
                .nome(s.getNome())
                .cpf(s.getCpf())
                .email(s.getEmail())
                .telefone(s.getTelefone())
                .profissao(s.getProfissao())
                .endereco(s.getEndereco())
                .nascimento(s.getNascimento())
                .build();

        logService.registrar("Solicitação aprovada", "Admin", "admin",
                s.getNome() + " aprovado e convertido em associado");

        return associadoService.cadastrar(novo);

    }

    @Transactional

    public void recusar(Long id, String observacoes) {

        Solicitacao s = buscarPorId(id);

        s.setStatus("Recusado");

        s.setObservacoes(observacoes);

        solicitacaoRepository.save(s);

        logService.registrar("Solicitação recusada", "Admin", "admin",

                "Solicitação de " + s.getNome() + " recusada");

    }

    public void remover(Long id) {

        solicitacaoRepository.deleteById(id);

    }

    private boolean isEmpresaSolicitacao(Solicitacao s) {
        return "empresa".equalsIgnoreCase(s.getTipoSolicitante()) || !isBlank(s.getCnpj());
    }

    private void normalizarCampos(Solicitacao s) {
        s.setCpf(trimToNull(s.getCpf()));
        s.setCnpj(trimToNull(s.getCnpj()));
        s.setEmail(trimToNull(s.getEmail()));
        s.setTelefone(trimToNull(s.getTelefone()));
        s.setResponsavel(trimToNull(s.getResponsavel()));
        s.setProfissao(trimToNull(s.getProfissao()));
        s.setEndereco(trimToNull(s.getEndereco()));
        s.setObservacoes(trimToNull(s.getObservacoes()));
        s.setTipoSolicitante(trimToNull(s.getTipoSolicitante()));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

}
