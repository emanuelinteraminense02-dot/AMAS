package com.br.amas.demo.service;

import com.br.amas.demo.model.Projeto;
import com.br.amas.demo.repository.ProjetoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjetoService {

    private final ProjetoRepository projetoRepository;

    public List<Projeto> listarTodos() {
        return projetoRepository.findAllByOrderByDestaqueDescAtualizadoEmDescTituloAsc();
    }

    public List<Projeto> listarEmAndamento() {
        return projetoRepository.findByStatusOrderByDestaqueDescAtualizadoEmDescTituloAsc("Em andamento");
    }

    public Projeto buscarPorId(Long id) {
        return projetoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Projeto não encontrado: " + id));
    }

    public Projeto criar(Projeto projeto) {
        projeto.setAtualizadoEm(LocalDate.now());
        return projetoRepository.save(projeto);
    }

    public Projeto atualizar(Long id, Projeto dados) {
        Projeto existente = buscarPorId(id);
        existente.setTitulo(dados.getTitulo());
        existente.setResumo(dados.getResumo());
        existente.setCategoria(dados.getCategoria());
        existente.setStatus(dados.getStatus());
        existente.setDestaque(dados.getDestaque());
        existente.setParticipantes(dados.getParticipantes());
        existente.setUnidadeMetrica(dados.getUnidadeMetrica());
        existente.setIcone(dados.getIcone());
        existente.setDataInicio(dados.getDataInicio());
        existente.setAtualizadoEm(LocalDate.now());
        return projetoRepository.save(existente);
    }

    public void remover(Long id) {
        projetoRepository.deleteById(id);
    }
}
