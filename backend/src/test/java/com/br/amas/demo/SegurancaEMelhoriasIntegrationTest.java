package com.br.amas.demo;

import com.br.amas.demo.config.JwtService;
import com.br.amas.demo.model.Associado;
import com.br.amas.demo.model.Evento;
import com.br.amas.demo.model.Usuario;
import com.br.amas.demo.repository.AssociadoRepository;
import com.br.amas.demo.repository.EventoRepository;
import com.br.amas.demo.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Testes das melhorias de segurança e de uso: propriedade dos registros, consulta de CPF,
 * pedido público de redefinição de senha, estatísticas públicas, senha temporária e CORS.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SegurancaEMelhoriasIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwtService;
    @Autowired private AssociadoRepository associadoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EventoRepository eventoRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private Associado maria;
    private Associado joao;
    private Usuario loja;
    private String tokenAdmin;
    private String tokenMaria;
    private String tokenLoja;

    @BeforeEach
    void preparar() {
        maria = associadoRepository.save(Associado.builder().nome("Maria Teste").cpf("111.444.777-35")
                .email("maria@teste.com").senha(passwordEncoder.encode("Senha@123")).status("Regular")
                .matricula("AMAS-901").primeiroLogin(false).build());
        joao = associadoRepository.save(Associado.builder().nome("João Teste").cpf("390.533.447-05")
                .email("joao@teste.com").senha(passwordEncoder.encode("Senha@123")).status("Inadimplente")
                .matricula("AMAS-902").primeiroLogin(false).build());
        loja = usuarioRepository.save(Usuario.builder().nome("Loja Teste").email("loja@teste.com")
                .senha(passwordEncoder.encode("Senha@123")).perfil("empresario").cnpj("11.222.333/0001-81")
                .contrato("{\"beneficioOfertado\":\"10%\",\"beneficiosValidados\":false}").unidades("[]").build());
        tokenAdmin = "Bearer " + jwtService.gerarToken(0L, "admin@teste.com", "Admin", "admin");
        tokenMaria = "Bearer " + jwtService.gerarToken(maria.getId(), maria.getEmail(), maria.getNome(), "associado");
        tokenLoja = "Bearer " + jwtService.gerarToken(loja.getId(), loja.getEmail(), loja.getNome(), "empresario");
    }

    // ── AN-10: propriedade dos registros ───────────────────────────────

    @Test
    void associadoNaoListaTodosOsAssociados() throws Exception {
        mockMvc.perform(get("/api/associados").header("Authorization", tokenMaria))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/associados").header("Authorization", tokenAdmin))
                .andExpect(status().isOk());
    }

    @Test
    void associadoVeSomenteOProprioCadastro() throws Exception {
        mockMvc.perform(get("/api/associados/{id}", maria.getId()).header("Authorization", tokenMaria))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Maria Teste"));
        mockMvc.perform(get("/api/associados/{id}", joao.getId()).header("Authorization", tokenMaria))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/associados/{id}/contribuicoes", joao.getId()).header("Authorization", tokenMaria))
                .andExpect(status().isForbidden());
    }

    @Test
    void associadoNaoAlteraAPropriaSituacao() throws Exception {
        mockMvc.perform(put("/api/associados/{id}", joao.getId()).header("Authorization", "Bearer "
                        + jwtService.gerarToken(joao.getId(), joao.getEmail(), joao.getNome(), "associado"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "Regular", "telefone", "(61) 90000-0000"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Inadimplente"))
                .andExpect(jsonPath("$.telefone").value("(61) 90000-0000"));
    }

    @Test
    void associadoNaoInscreveOutroAssociadoEmEvento() throws Exception {
        Evento ev = eventoRepository.save(Evento.builder().titulo("Assembleia").data(LocalDate.now().plusDays(5)).vagas(10).build());
        mockMvc.perform(post("/api/eventos/{id}/inscrever", ev.getId()).header("Authorization", tokenMaria)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"associadoId\":" + joao.getId() + "}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/eventos/{id}/inscrever", ev.getId()).header("Authorization", tokenMaria)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"associadoId\":" + maria.getId() + "}"))
                .andExpect(status().isOk());
    }

    @Test
    void associadoNaoTrocaSenhaDeOutro() throws Exception {
        mockMvc.perform(patch("/api/auth/associados/{id}/senha", joao.getId()).header("Authorization", tokenMaria)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"senhaAtual\":\"x\",\"novaSenha\":\"Nova@123\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void empresaNaoValidaAPropriaParceria() throws Exception {
        mockMvc.perform(put("/api/empresarios/{id}", loja.getId()).header("Authorization", tokenLoja)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"contrato\":{\"beneficioOfertado\":\"15%\",\"beneficiosValidados\":true}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contrato.beneficioOfertado").value("15%"))
                .andExpect(jsonPath("$.contrato.beneficiosValidados").value(false));
        mockMvc.perform(get("/api/empresarios/{id}/contribuicoes", loja.getId()).header("Authorization", tokenMaria))
                .andExpect(status().isForbidden());
    }

    // ── Consulta de benefício por CPF ──────────────────────────────────

    @Test
    void empresaConsultaCpfSemVerOCadastroCompleto() throws Exception {
        mockMvc.perform(get("/api/associados/consulta-cpf").param("cpf", "11144477735").header("Authorization", tokenLoja))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Maria Teste"))
                .andExpect(jsonPath("$.beneficioLiberado").value(true))
                .andExpect(jsonPath("$.email").doesNotExist());
        mockMvc.perform(get("/api/associados/consulta-cpf").param("cpf", "390.533.447-05").header("Authorization", tokenLoja))
                .andExpect(jsonPath("$.beneficioLiberado").value(false));
        mockMvc.perform(get("/api/associados/consulta-cpf").param("cpf", "11144477735").header("Authorization", tokenMaria))
                .andExpect(status().isForbidden());
    }

    // ── AN-12: pedido público de redefinição ───────────────────────────

    @Test
    void pedidoDeRedefinicaoFuncionaSemLogin() throws Exception {
        mockMvc.perform(post("/api/auth/esqueci-senha").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"MARIA@teste.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
        assertThat(associadoRepository.findById(maria.getId()).orElseThrow().getResetSolicitado()).isTrue();

        // e-mail inexistente recebe a mesma resposta (não revela quem tem cadastro)
        mockMvc.perform(post("/api/auth/esqueci-senha").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ninguem@teste.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
    }

    // ── Estatísticas públicas ──────────────────────────────────────────

    @Test
    void estatisticasPublicasSemLogin() throws Exception {
        mockMvc.perform(get("/api/publico/estatisticas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.regulares").value(1))
                .andExpect(jsonPath("$.totalEmpresarios").value(1));
    }

    // ── Senha temporária no lugar de 123456 ────────────────────────────

    @Test
    void cadastroSemSenhaGeraSenhaTemporaria() throws Exception {
        String resp = mockMvc.perform(post("/api/associados").header("Authorization", tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Ana Nova\",\"cpf\":\"529.982.247-25\",\"email\":\"ana@teste.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.senhaTemporaria").isString())
                .andReturn().getResponse().getContentAsString();
        String temporaria = objectMapper.readTree(resp).get("senhaTemporaria").asText();
        assertThat(temporaria).hasSize(10).isNotEqualTo("123456");

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "ana@teste.com", "senha", temporaria))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.primeiroLogin").value(true));
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ana@teste.com\",\"senha\":\"123456\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void redefinicaoPeloAdminGeraSenhaTemporaria() throws Exception {
        String resp = mockMvc.perform(post("/api/admin/senhas/associados/{id}/redefinir", maria.getId())
                        .header("Authorization", tokenAdmin))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(resp);
        String temporaria = json.get("senhaTemporaria").asText();
        assertThat(temporaria).hasSize(10);
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "maria@teste.com", "senha", temporaria))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.senhaExpirada").value(true));
        mockMvc.perform(post("/api/admin/senhas/associados/{id}/redefinir", maria.getId())
                        .header("Authorization", tokenMaria))
                .andExpect(status().isForbidden());
    }

    // ── CORS restrito ──────────────────────────────────────────────────

    @Test
    void corsAceitaVercelERecusaOutrasOrigens() throws Exception {
        mockMvc.perform(options("/api/noticias").header("Origin", "https://amas-flax.vercel.app")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://amas-flax.vercel.app"));
        mockMvc.perform(options("/api/noticias").header("Origin", "https://site-qualquer.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }

    // ── Tela de contribuição da empresa ────────────────────────────────

    @Test
    void empresaRegistraContribuicaoComCamposOpcionaisNulos() throws Exception {
        mockMvc.perform(post("/api/empresarios/{id}/contribuicoes", loja.getId()).header("Authorization", tokenLoja)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mes\":\"2026-10\",\"rendaBruta\":9500,\"rendaLiquida\":8000,\"observacoes\":null,\"aliquotaContrato\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valorDevido").value(160.0))
                .andExpect(jsonPath("$.faixa").value(2));
    }
}
