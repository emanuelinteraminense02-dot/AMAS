package com.br.amas.demo;

import com.br.amas.demo.model.Solicitacao;
import com.br.amas.demo.repository.SolicitacaoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SolicitacaoControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SolicitacaoRepository solicitacaoRepository;

    @Test
    void criarSolicitacaoDeEmpresaPersisteCpfComoNulo() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("tipoSolicitante", "empresa");
        payload.put("nome", "Empresa Exemplo LTDA");
        payload.put("cpf", "");
        payload.put("cnpj", "12.345.678/0001-95");
        payload.put("responsavel", "Maria Gestora");
        payload.put("telefone", "(61) 99999-0000");
        payload.put("email", "empresa@example.com");
        payload.put("endereco", "Rua Central, 123");
        payload.put("profissao", "Comercio");
        payload.put("observacoes", "Interesse em parceria");

        mockMvc.perform(post("/api/solicitacoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoSolicitante").value("empresa"))
                .andExpect(jsonPath("$.cnpj").value("12.345.678/0001-95"));

        Solicitacao solicitacao = solicitacaoRepository.findAll().stream()
                .filter(item -> "empresa@example.com".equals(item.getEmail()))
                .findFirst()
                .orElseThrow();

        assertThat(solicitacao.getCpf()).isNull();
        assertThat(solicitacao.getNascimento()).isNull();
        assertThat(solicitacao.getCnpj()).isEqualTo("12.345.678/0001-95");
    }
}
