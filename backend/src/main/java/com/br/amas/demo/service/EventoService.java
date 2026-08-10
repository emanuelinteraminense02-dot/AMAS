package com.br.amas.demo.service;

import com.br.amas.demo.model.Associado;
import com.br.amas.demo.model.Evento;
import com.br.amas.demo.model.InscricaoEvento;
import com.br.amas.demo.repository.AssociadoRepository;
import com.br.amas.demo.repository.EventoRepository;
import com.br.amas.demo.repository.InscricaoEventoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final InscricaoEventoRepository inscricaoRepository;
    private final AssociadoRepository associadoRepository;

    public List<Evento> listarTodos() {
        return eventoRepository.findAllByOrderByDataAsc();
    }

    public Evento buscarPorId(Long id) {
        return eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento não encontrado: " + id));
    }

    public Evento criar(Evento evento) {
        evento.setInscricoes(0);
        if (evento.getVagasTotais() == null || evento.getVagasTotais() == 0) {
            evento.setVagasTotais(evento.getVagas() != null ? evento.getVagas() : 0);
        }
        return eventoRepository.save(evento);
    }

    public Evento atualizar(Long id, Evento dados) {
        Evento existente = buscarPorId(id);
        existente.setTitulo(dados.getTitulo());
        existente.setDescricao(dados.getDescricao());
        existente.setTipo(dados.getTipo());
        existente.setData(dados.getData());
        existente.setHorario(dados.getHorario());
        existente.setLocal(dados.getLocal());
        existente.setVagas(dados.getVagas());
        existente.setVagasTotais(dados.getVagasTotais() != null ? dados.getVagasTotais() : dados.getVagas());
        existente.setStatus(dados.getStatus());
        existente.setDestaque(dados.getDestaque());
        return eventoRepository.save(existente);
    }

    public void remover(Long id) {
        eventoRepository.deleteById(id);
    }

    @Transactional
    public InscricaoEvento inscrever(Long eventoId, Long associadoId) {
        if (inscricaoRepository.existsByEventoIdAndAssociadoId(eventoId, associadoId)) {
            throw new RuntimeException("Associado já inscrito neste evento.");
        }

        Evento evento = buscarPorId(eventoId);
        Associado associado = associadoRepository.findById(associadoId)
                .orElseThrow(() -> new RuntimeException("Associado não encontrado."));

        long confirmados = inscricaoRepository.countByEventoIdAndSituacao(eventoId, "confirmado");
        String situacao = confirmados < evento.getVagas() ? "confirmado" : "lista_espera";

        InscricaoEvento inscricao = InscricaoEvento.builder()
                .evento(evento)
                .associado(associado)
                .situacao(situacao)
                .dataInscricao(LocalDateTime.now())
                .build();

        if ("confirmado".equals(situacao)) {
            evento.setInscricoes(evento.getInscricoes() + 1);
            eventoRepository.save(evento);
        }

        return inscricaoRepository.save(inscricao);
    }

    @Transactional
    public void cancelarInscricao(Long eventoId, Long associadoId) {
        InscricaoEvento inscricao = inscricaoRepository
                .findByEventoIdAndAssociadoId(eventoId, associadoId)
                .orElseThrow(() -> new RuntimeException("Inscrição não encontrada."));

        boolean eraConfirmado = "confirmado".equals(inscricao.getSituacao());
        inscricaoRepository.delete(inscricao);

        if (eraConfirmado) {
            Evento evento = buscarPorId(eventoId);
            // Promove o primeiro da fila de espera, se houver
            List<InscricaoEvento> fila = inscricaoRepository.findByEventoId(eventoId)
                    .stream()
                    .filter(i -> "lista_espera".equals(i.getSituacao()))
                    .toList();
            if (!fila.isEmpty()) {
                InscricaoEvento promovido = fila.get(0);
                promovido.setSituacao("confirmado");
                inscricaoRepository.save(promovido);
            } else {
                evento.setInscricoes(Math.max(0, evento.getInscricoes() - 1));
                eventoRepository.save(evento);
            }
        }
    }

    public List<InscricaoEvento> listarInscritos(Long eventoId) {
        return inscricaoRepository.findByEventoId(eventoId);
    }

    public List<InscricaoEvento> listarInscricoesPorAssociado(Long associadoId) {
        return inscricaoRepository.findByAssociadoId(associadoId);
    }
}