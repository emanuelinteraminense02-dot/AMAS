package com.br.amas.demo.service;

import com.br.amas.demo.model.LogAtividade;
import com.br.amas.demo.repository.LogAtividadeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LogService {

    private final LogAtividadeRepository logRepository;

    public void registrar(String acao, String usuario, String perfil, String detalhes) {
        LogAtividade log = LogAtividade.builder()
                .acao(acao)
                .usuario(usuario != null ? usuario : "Sistema")
                .perfil(perfil != null ? perfil : "sistema")
                .data(LocalDateTime.now())
                .detalhes(detalhes != null ? detalhes : "")
                .build();
        logRepository.save(log);
    }

    public List<LogAtividade> listarRecentes(int limite) {
        return logRepository.findAllByOrderByDataDesc(PageRequest.of(0, limite));
    }

    public List<LogAtividade> listarTodos() {
        return logRepository.findAllByOrderByDataDesc(PageRequest.of(0, 100));
    }
}