package com.br.amas.demo.service;

import com.br.amas.demo.model.Noticia;

import com.br.amas.demo.repository.NoticiaRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.time.LocalDate;

import java.util.List;

@Service

@RequiredArgsConstructor

public class NoticiaService {

    private final NoticiaRepository noticiaRepository;

    public List<Noticia> listarTodas() {

        return noticiaRepository.findAllByOrderByPublicadaEmDesc();

    }

    public List<Noticia> listarDestaques() {

        return noticiaRepository.findByDestaque(true);

    }

    public Noticia buscarPorId(Long id) {

        return noticiaRepository.findById(id)

                .orElseThrow(() -> new RuntimeException("Notícia não encontrada: " + id));

    }

    public Noticia criar(Noticia noticia, String autorNome) {

        noticia.setPublicadaEm(LocalDate.now());

        noticia.setAutor(autorNome != null ? autorNome : "Administrador AMAS");

        return noticiaRepository.save(noticia);

    }

    public Noticia atualizar(Long id, Noticia dados) {

        Noticia existente = buscarPorId(id);

        existente.setTitulo(dados.getTitulo());

        existente.setResumo(dados.getResumo());

        existente.setConteudo(dados.getConteudo());

        existente.setCategoria(dados.getCategoria());

        existente.setDestaque(dados.getDestaque());

        return noticiaRepository.save(existente);

    }

    public void remover(Long id) {

        noticiaRepository.deleteById(id);

    }

}
