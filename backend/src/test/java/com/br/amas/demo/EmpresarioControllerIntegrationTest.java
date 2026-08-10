package com.br.amas.demo;

import com.br.amas.demo.model.Usuario;
import com.br.amas.demo.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class EmpresarioControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void cadastrarEmpresarioAceitaContratoComoObjetoJson() throws Exception {
        Map<String, Object> payload = Map.of(
                "nome", "Nova Empresa LTDA",
                "email", "nova.empresa@amas.com",
                "senha", "123456",
                "telefone", "(61) 99999-0000",
                "cnpj", "12.345.678/0001-98",
                "contrato", Map.of(
                        "tipoAcordo", "Parceiro de Beneficio (Padrao)",
                        "beneficiosValidados", false
                )
        );

        mockMvc.perform(post("/api/empresarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Nova Empresa LTDA"))
                .andExpect(jsonPath("$.email").value("nova.empresa@amas.com"))
                .andExpect(jsonPath("$.cnpj").value("12.345.678/0001-98"))
                .andExpect(jsonPath("$.contrato.tipoAcordo").value("Parceiro de Beneficio (Padrao)"))
                .andExpect(jsonPath("$.contrato.beneficiosValidados").value(false));
    }

    @Test
    void buscarEmpresarioRetornaContratoEUnidadesComoEstruturasJson() throws Exception {
        Usuario empresario = usuarioRepository.findByPerfil("empresario").stream()
                .findFirst()
                .orElseThrow();

        mockMvc.perform(get("/api/empresarios/{id}", empresario.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value(empresario.getNome()))
                .andExpect(jsonPath("$.contrato.beneficioOfertado").value("10% de desconto em todos os produtos"))
                .andExpect(jsonPath("$.unidades", hasSize(2)))
                .andExpect(jsonPath("$.unidades[0].nome").value("Unidade Central"));
    }

    @Test
    void atualizarEmpresarioAceitaPayloadParcialComContratoEUnidades() throws Exception {
        Usuario empresario = usuarioRepository.findByPerfil("empresario").stream()
                .findFirst()
                .orElseThrow();

        Map<String, Object> payload = Map.of(
                "contrato", Map.of(
                        "beneficioOfertado", "15% de desconto",
                        "regrasUtilizacao", "Somente para associados ativos",
                        "beneficiosValidados", false
                ),
                "unidades", List.of(
                        Map.of("id", 1, "nome", "Matriz", "endereco", "Rua A, 10"),
                        Map.of("id", 2, "nome", "Filial", "endereco", "Rua B, 20")
                )
        );

        mockMvc.perform(put("/api/empresarios/{id}", empresario.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value(empresario.getNome()))
                .andExpect(jsonPath("$.contrato.beneficioOfertado").value("15% de desconto"))
                .andExpect(jsonPath("$.unidades", hasSize(2)))
                .andExpect(jsonPath("$.unidades[1].nome").value("Filial"));

        mockMvc.perform(get("/api/empresarios/{id}", empresario.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value(empresario.getNome()))
                .andExpect(jsonPath("$.contrato.beneficioOfertado").value("15% de desconto"))
                .andExpect(jsonPath("$.unidades[0].nome").value("Matriz"));
    }

    @Test
    void atualizarEmpresarioPersisteFlagsDeReset() throws Exception {
        Usuario empresario = usuarioRepository.findByPerfil("empresario").stream()
                .findFirst()
                .orElseThrow();

        Map<String, Object> payload = Map.of(
                "resetSolicitado", true,
                "senhaExpirada", true,
                "primeiroLogin", true,
                "dataResetSolicit", "2026-05-04T10:15:00"
        );

        mockMvc.perform(put("/api/empresarios/{id}", empresario.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetSolicitado").value(true))
                .andExpect(jsonPath("$.senhaExpirada").value(true))
                .andExpect(jsonPath("$.primeiroLogin").value(true))
                .andExpect(jsonPath("$.dataResetSolicit").value("2026-05-04T10:15:00"));
    }
}
