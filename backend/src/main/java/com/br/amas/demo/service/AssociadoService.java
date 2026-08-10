package com.br.amas.demo.service;

import com.br.amas.demo.model.Associado;
import com.br.amas.demo.model.Contribuicao;
import com.br.amas.demo.model.ParcelaAtraso;
import com.br.amas.demo.repository.AssociadoRepository;
import com.br.amas.demo.repository.ContribuicaoRepository;
import com.br.amas.demo.repository.InscricaoEventoRepository;
import com.br.amas.demo.repository.ParcelaAtrasoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssociadoService {

    private final AssociadoRepository associadoRepository;
    private final ContribuicaoRepository contribuicaoRepository;
    private final ParcelaAtrasoRepository parcelaAtrasoRepository;
    private final InscricaoEventoRepository inscricaoEventoRepository;
    private final LogService logService;

    public List<Associado> listarTodos() {
        return associadoRepository.findAll();
    }

    public Associado buscarPorId(Long id) {
        return associadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Associado não encontrado: " + id));
    }

    @Transactional
    public Associado cadastrar(Associado associado) {
        normalizarAssociado(associado);
        validarCamposObrigatorios(associado);

        if (associadoRepository.existsByCpf(associado.getCpf())) {
            throw new RuntimeException("CPF já cadastrado.");
        }

        if (associadoRepository.existsByEmail(associado.getEmail())) {
            throw new RuntimeException("E-mail já cadastrado.");
        }

        associado.setDataEntrada(associado.getDataEntrada() != null ? associado.getDataEntrada() : LocalDate.now());
        associado.setSenha((associado.getSenha() == null || associado.getSenha().isBlank()) ? "123456" : associado.getSenha());
        associado.setPrimeiroLogin(associado.getPrimeiroLogin() == null || associado.getPrimeiroLogin());
        associado.setSenhaExpirada(Boolean.TRUE.equals(associado.getSenhaExpirada()));
        associado.setResetSolicitado(Boolean.TRUE.equals(associado.getResetSolicitado()));
        associado.setStatus((associado.getStatus() == null || associado.getStatus().isBlank()) ? "Em análise" : associado.getStatus().trim());

        long total = associadoRepository.count();
        associado.setMatricula((associado.getMatricula() == null || associado.getMatricula().isBlank())
                ? "AMAS-" + String.format("%03d", total + 1)
                : associado.getMatricula().trim());

        Associado salvo = associadoRepository.save(associado);

        logService.registrar("Associado cadastrado", "Admin", "admin",
                salvo.getNome() + " (" + salvo.getMatricula() + ") cadastrado");

        return salvo;
    }

    @Transactional
    public Associado atualizar(Long id, Associado dados) {
        Associado existente = buscarPorId(id);

        if (dados.getCpf() != null && !dados.getCpf().isBlank()) {
            String cpf = dados.getCpf().trim();
            associadoRepository.findByCpf(cpf)
                    .filter(outro -> !outro.getId().equals(id))
                    .ifPresent(outro -> {
                        throw new RuntimeException("CPF já cadastrado.");
                    });
            existente.setCpf(cpf);
        }

        if (dados.getNome() != null && !dados.getNome().isBlank()) {
            existente.setNome(dados.getNome().trim());
        }

        if (dados.getTelefone() != null) {
            existente.setTelefone(trimToNull(dados.getTelefone()));
        }

        if (dados.getEndereco() != null) {
            existente.setEndereco(trimToNull(dados.getEndereco()));
        }

        if (dados.getProfissao() != null) {
            existente.setProfissao(trimToNull(dados.getProfissao()));
        }

        if (dados.getNascimento() != null) {
            existente.setNascimento(dados.getNascimento());
        }

        if (dados.getEmail() != null && !dados.getEmail().isBlank()) {
            String email = dados.getEmail().trim().toLowerCase();
            associadoRepository.findByEmail(email)
                    .filter(outro -> !outro.getId().equals(id))
                    .ifPresent(outro -> {
                        throw new RuntimeException("E-mail já cadastrado.");
                    });
            existente.setEmail(email);
        }

        if (dados.getSenha() != null && !dados.getSenha().isBlank()) {
            existente.setSenha(dados.getSenha());
        }

        if (dados.getPrimeiroLogin() != null) {
            existente.setPrimeiroLogin(dados.getPrimeiroLogin());
        }

        if (dados.getResetSolicitado() != null) {
            existente.setResetSolicitado(dados.getResetSolicitado());
        }

        if (dados.getSenhaExpirada() != null) {
            existente.setSenhaExpirada(dados.getSenhaExpirada());
        }

        if (dados.getDataResetSolicit() != null || Boolean.FALSE.equals(dados.getResetSolicitado())) {
            existente.setDataResetSolicit(dados.getDataResetSolicit());
        }

        if (dados.getFoto() != null) {
            existente.setFoto(dados.getFoto());
        }

        if (dados.getStatus() != null && !dados.getStatus().isBlank()) {
            existente.setStatus(dados.getStatus().trim());
        }

        return associadoRepository.save(existente);
    }

    @Transactional
    public void atualizarStatus(Long id, String status) {
        Associado associado = buscarPorId(id);
        associado.setStatus(status);
        associadoRepository.save(associado);
    }

    @Transactional
    public void remover(Long id) {
        Associado associado = buscarPorId(id);

        inscricaoEventoRepository.deleteByAssociadoId(id);
        contribuicaoRepository.deleteByAssociadoId(id);
        parcelaAtrasoRepository.deleteByAssociadoId(id);

        logService.registrar("Associado removido", "Admin", "admin",
                associado.getNome() + " removido do sistema");

        associadoRepository.deleteById(id);
    }

    public List<Contribuicao> listarContribuicoes(Long associadoId) {
        return contribuicaoRepository.findByAssociadoId(associadoId);
    }

    public List<ParcelaAtraso> listarParcelasAtraso(Long associadoId) {
        return parcelaAtrasoRepository.findByAssociadoId(associadoId);
    }

    @Transactional
    public Contribuicao enviarContribuicao(Long associadoId, Contribuicao contrib) {
        Associado associado = buscarPorId(associadoId);

        contrib.setAssociado(associado);
        contrib.setData(LocalDate.now());
        contrib.setStatus("Em análise");

        atualizarStatus(associadoId, "Em análise");

        Contribuicao salva = contribuicaoRepository.save(contrib);

        logService.registrar("Comprovante enviado", associado.getNome(), "associado",
                "Comprovante de " + contrib.getMes() + " enviado para análise");

        return salva;
    }

    @Transactional
    public Contribuicao atualizarStatusContribuicao(Long contribuicaoId, String novoStatus, String msgAdmin) {
        Contribuicao contribuicao = contribuicaoRepository.findById(contribuicaoId)
                .orElseThrow(() -> new RuntimeException("Contribuição não encontrada."));

        contribuicao.setStatus(novoStatus);
        contribuicao.setMsgAdmin(msgAdmin);

        Associado associado = contribuicao.getAssociado();

        if ("Aprovado".equals(novoStatus)) {
            boolean temPendente = contribuicaoRepository
                    .findByAssociadoIdAndStatus(associado.getId(), "Em análise").stream()
                    .anyMatch(x -> !x.getId().equals(contribuicaoId));

            associado.setStatus(temPendente ? "Em análise" : "Regular");

            logService.registrar("Comprovante aprovado", "Admin", "admin",
                    "Contribuição de " + associado.getNome() + " (" + contribuicao.getMes() + ") aprovada");
        } else if ("Recusado".equals(novoStatus)) {
            associado.setStatus("Inadimplente");

            logService.registrar("Comprovante recusado", "Admin", "admin",
                    "Contribuição de " + associado.getNome() + " (" + contribuicao.getMes() + ") recusada");
        }

        associadoRepository.save(associado);

        return contribuicaoRepository.save(contribuicao);
    }

    public List<Associado> listarInadimplentes() {
        return associadoRepository.findByStatus("Inadimplente");
    }

    public double calcularTotalArrecadado() {
        return contribuicaoRepository.findByStatus("Aprovado")
                .stream()
                .filter(c -> c.getValor() != null)
                .mapToDouble(c -> c.getValor().doubleValue())
                .sum();
    }

    private void validarCamposObrigatorios(Associado associado) {
        if (associado.getNome() == null || associado.getNome().isBlank()) {
            throw new RuntimeException("Nome é obrigatório.");
        }
        if (associado.getCpf() == null || associado.getCpf().isBlank()) {
            throw new RuntimeException("CPF é obrigatório.");
        }
        if (associado.getEmail() == null || associado.getEmail().isBlank()) {
            throw new RuntimeException("E-mail é obrigatório.");
        }
    }

    private void normalizarAssociado(Associado associado) {
        if (associado.getNome() != null) {
            associado.setNome(associado.getNome().trim());
        }
        if (associado.getCpf() != null) {
            associado.setCpf(associado.getCpf().trim());
        }
        if (associado.getEmail() != null) {
            associado.setEmail(associado.getEmail().trim().toLowerCase());
        }
        if (associado.getTelefone() != null) {
            associado.setTelefone(trimToNull(associado.getTelefone()));
        }
        if (associado.getEndereco() != null) {
            associado.setEndereco(trimToNull(associado.getEndereco()));
        }
        if (associado.getProfissao() != null) {
            associado.setProfissao(trimToNull(associado.getProfissao()));
        }
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
