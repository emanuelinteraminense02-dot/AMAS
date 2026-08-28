package com.br.amas.demo.config;

import com.br.amas.demo.model.Associado;
import com.br.amas.demo.model.Contribuicao;
import com.br.amas.demo.model.Evento;
import com.br.amas.demo.model.LogAtividade;
import com.br.amas.demo.model.Mensagem;
import com.br.amas.demo.model.Noticia;
import com.br.amas.demo.model.ParcelaAtraso;
import com.br.amas.demo.model.Solicitacao;
import com.br.amas.demo.model.Usuario;
import com.br.amas.demo.repository.AssociadoRepository;
import com.br.amas.demo.repository.ContribuicaoRepository;
import com.br.amas.demo.repository.EventoRepository;
import com.br.amas.demo.repository.LogAtividadeRepository;
import com.br.amas.demo.repository.MensagemRepository;
import com.br.amas.demo.repository.NoticiaRepository;
import com.br.amas.demo.repository.ParcelaAtrasoRepository;
import com.br.amas.demo.repository.SolicitacaoRepository;
import com.br.amas.demo.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final AssociadoRepository associadoRepository;
    private final ContribuicaoRepository contribuicaoRepository;
    private final ParcelaAtrasoRepository parcelaAtrasoRepository;
    private final NoticiaRepository noticiaRepository;
    private final EventoRepository eventoRepository;
    private final MensagemRepository mensagemRepository;
    private final SolicitacaoRepository solicitacaoRepository;
    private final LogAtividadeRepository logRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("DataLoader: carga de dados de demonstração desativada.");
    }

    private void repararDadosExistentes() {
        usuarioRepository.findAll().forEach(usuario -> {
            boolean altered = false;

            if (usuario.getEmail() != null) {
                String normalizado = usuario.getEmail().trim().toLowerCase();
                if (!normalizado.equals(usuario.getEmail())) {
                    usuario.setEmail(normalizado);
                    altered = true;
                }
            }
            if (usuario.getNome() != null) {
                String nome = usuario.getNome().trim();
                if (!nome.equals(usuario.getNome())) {
                    usuario.setNome(nome);
                    altered = true;
                }
            }
            if (usuario.getPerfil() == null || usuario.getPerfil().isBlank()) {
                usuario.setPerfil("empresario");
                altered = true;
            }
            if (usuario.getPrimeiroLogin() == null) {
                usuario.setPrimeiroLogin(false);
                altered = true;
            }
            if (usuario.getResetSolicitado() == null) {
                usuario.setResetSolicitado(false);
                altered = true;
            }
            if (usuario.getSenhaExpirada() == null) {
                usuario.setSenhaExpirada(false);
                altered = true;
            }
            if (usuario.getUnidades() == null || usuario.getUnidades().isBlank()) {
                usuario.setUnidades("[]");
                altered = true;
            }
            if (usuario.getContrato() == null || usuario.getContrato().isBlank()) {
                usuario.setContrato("{}");
                altered = true;
            }

            if (altered) {
                usuarioRepository.save(usuario);
            }
        });

        associadoRepository.findAll().forEach(associado -> {
            boolean altered = false;

            if (associado.getEmail() != null) {
                String normalizado = associado.getEmail().trim().toLowerCase();
                if (!normalizado.equals(associado.getEmail())) {
                    associado.setEmail(normalizado);
                    altered = true;
                }
            }
            if (associado.getNome() != null) {
                String nome = associado.getNome().trim();
                if (!nome.equals(associado.getNome())) {
                    associado.setNome(nome);
                    altered = true;
                }
            }
            if (associado.getPrimeiroLogin() == null) {
                associado.setPrimeiroLogin(false);
                altered = true;
            }
            if (associado.getResetSolicitado() == null) {
                associado.setResetSolicitado(false);
                altered = true;
            }
            if (associado.getSenhaExpirada() == null) {
                associado.setSenhaExpirada(false);
                altered = true;
            }
            if (associado.getStatus() == null || associado.getStatus().isBlank()) {
                associado.setStatus("Em análise");
                altered = true;
            }
            if (associado.getDataEntrada() == null) {
                associado.setDataEntrada(LocalDate.now());
                altered = true;
            }

            if (altered) {
                associadoRepository.save(associado);
            }
        });
    }

    private void seedUsuarios() {
        upsertUsuario(
                "admin@amas.com",
                Usuario.builder()
                        .nome("Administrador AMAS")
                        .email("admin@amas.com")
                        .senha("admin123")
                        .perfil("admin")
                        .primeiroLogin(false)
                        .build()
        );

        upsertUsuario(
                "empresa@amas.com",
                Usuario.builder()
                        .nome("Empresa Parceira LTDA")
                        .email("empresa@amas.com")
                        .senha("empresa123")
                        .perfil("empresario")
                        .cnpj("12.345.678/0001-99")
                        .telefone("(61) 3333-4444")
                        .unidades("""
                                [
                                  {"id":1,"nome":"Unidade Central","endereco":"Av. Principal, 100 - São Sebastião/DF"},
                                  {"id":2,"nome":"Filial Norte","endereco":"Rua das Rosas, 55 - São Sebastião/DF"}
                                ]
                                """)
                        .contrato("""
                                {
                                  "beneficioOfertado": "10% de desconto em todos os produtos",
                                  "regrasUtilizacao": "Não acumulativo com outras promoções; válido apenas para pagamento à vista.",
                                  "formaValidacao": "Apresentar Carteirinha Digital AMAS no caixa ou informar o CPF cadastrado.",
                                  "tipoAcordo": "Parceiro de Benefício",
                                  "descricaoBeneficios": "10% de desconto em todos os produtos e frete grátis acima de R$ 50.",
                                  "beneficiosValidados": true,
                                  "observacoesAdmin": "Parceria ativa desde 2025.",
                                  "dataVigencia": "2026-12-31"
                                }
                                """)
                        .primeiroLogin(false)
                        .build()
        );

        upsertUsuario(
                "mercadovilanova@amas.com",
                Usuario.builder()
                        .nome("Supermercado Vila Nova")
                        .email("mercadovilanova@amas.com")
                        .senha("empresa123")
                        .perfil("empresario")
                        .cnpj("22.334.556/0001-10")
                        .telefone("(61) 3345-1000")
                        .unidades("""
                                [
                                  {"id":1,"nome":"Loja Centro","endereco":"Av. São Bartolomeu, 210 - São Sebastião/DF"},
                                  {"id":2,"nome":"Loja Residencial Oeste","endereco":"Rua 17, Lote 9 - São Sebastião/DF"}
                                ]
                                """)
                        .contrato("""
                                {
                                  "beneficioOfertado": "8% de desconto em compras presenciais",
                                  "regrasUtilizacao": "Válido para associados regulares, exceto bebidas e tabaco.",
                                  "formaValidacao": "CPF do associado ou carteirinha digital.",
                                  "tipoAcordo": "Clube de Benefícios",
                                  "descricaoBeneficios": "Desconto imediato no caixa para compras da cesta básica e hortifruti.",
                                  "beneficiosValidados": true,
                                  "observacoesAdmin": "Maior volume de uso entre os parceiros.",
                                  "dataVigencia": "2027-03-31"
                                }
                                """)
                        .primeiroLogin(false)
                        .build()
        );

        upsertUsuario(
                "dombosco@amas.com",
                Usuario.builder()
                        .nome("Restaurante Dom Bosco")
                        .email("dombosco@amas.com")
                        .senha("empresa123")
                        .perfil("empresario")
                        .cnpj("08.741.963/0001-55")
                        .telefone("(61) 3456-8899")
                        .unidades("""
                                [
                                  {"id":1,"nome":"Salão Principal","endereco":"Av. Central, 88 - São Sebastião/DF"}
                                ]
                                """)
                        .contrato("""
                                {
                                  "beneficioOfertado": "12% de desconto no almoço executivo",
                                  "regrasUtilizacao": "Benefício de segunda a sexta, exceto feriados.",
                                  "formaValidacao": "Carteirinha digital e documento com foto.",
                                  "tipoAcordo": "Parceiro Gastronômico",
                                  "descricaoBeneficios": "Desconto no almoço executivo e cortesia de sobremesa em datas especiais.",
                                  "beneficiosValidados": true,
                                  "observacoesAdmin": "Bom parceiro para eventos presenciais.",
                                  "dataVigencia": "2026-11-30"
                                }
                                """)
                        .primeiroLogin(false)
                        .build()
        );

        upsertUsuario(
                "farmaciavida@amas.com",
                Usuario.builder()
                        .nome("Farmácia Vida Plena")
                        .email("farmaciavida@amas.com")
                        .senha("empresa123")
                        .perfil("empresario")
                        .cnpj("45.102.778/0001-03")
                        .telefone("(61) 3210-4040")
                        .unidades("""
                                [
                                  {"id":1,"nome":"Matriz","endereco":"Quadra 101, Conjunto C - São Sebastião/DF"},
                                  {"id":2,"nome":"Loja Sul","endereco":"Rua 22, Lote 14 - São Sebastião/DF"}
                                ]
                                """)
                        .contrato("""
                                {
                                  "beneficioOfertado": "Até 15% de desconto em genéricos",
                                  "regrasUtilizacao": "Percentual varia por laboratório e não se aplica a medicamentos controlados.",
                                  "formaValidacao": "CPF cadastrado e confirmação no balcão.",
                                  "tipoAcordo": "Saúde e Bem-estar",
                                  "descricaoBeneficios": "Descontos progressivos em medicamentos genéricos, vitaminas e itens de higiene.",
                                  "beneficiosValidados": true,
                                  "observacoesAdmin": "Contrato revisado em janeiro de 2026.",
                                  "dataVigencia": "2027-01-31"
                                }
                                """)
                        .primeiroLogin(false)
                        .build()
        );
    }

    private void seedAssociados() {
        Associado joao = upsertAssociado(
                "123.456.789-00",
                Associado.builder()
                        .nome("João da Silva")
                        .cpf("123.456.789-00")
                        .nascimento(LocalDate.of(1990, 5, 15))
                        .telefone("(61) 99999-1111")
                        .email("joao@email.com")
                        .endereco("Rua das Flores, 123 - São Sebastião/DF")
                        .profissao("Comerciante")
                        .senha("123456")
                        .primeiroLogin(false)
                        .status("Regular")
                        .matricula("AMAS-001")
                        .dataEntrada(LocalDate.of(2024, 1, 10))
                        .build()
        );

        Associado maria = upsertAssociado(
                "987.654.321-00",
                Associado.builder()
                        .nome("Maria Oliveira")
                        .cpf("987.654.321-00")
                        .nascimento(LocalDate.of(1985, 11, 20))
                        .telefone("(61) 99888-2222")
                        .email("maria@email.com")
                        .endereco("Av. Principal, 456 - São Sebastião/DF")
                        .profissao("Professora")
                        .senha("123456")
                        .primeiroLogin(false)
                        .status("Inadimplente")
                        .matricula("AMAS-002")
                        .dataEntrada(LocalDate.of(2024, 2, 15))
                        .build()
        );

        Associado carlos = upsertAssociado(
                "456.123.789-00",
                Associado.builder()
                        .nome("Carlos Mendes")
                        .cpf("456.123.789-00")
                        .nascimento(LocalDate.of(1978, 3, 8))
                        .telefone("(61) 97777-3333")
                        .email("carlos@email.com")
                        .endereco("Quadra 12, Lote 5 - São Sebastião/DF")
                        .profissao("Engenheiro")
                        .senha("123456")
                        .primeiroLogin(false)
                        .status("Em análise")
                        .matricula("AMAS-003")
                        .dataEntrada(LocalDate.of(2024, 3, 20))
                        .build()
        );

        Associado ana = upsertAssociado(
                "741.852.963-00",
                Associado.builder()
                        .nome("Ana Paula Ferreira")
                        .cpf("741.852.963-00")
                        .nascimento(LocalDate.of(1994, 8, 2))
                        .telefone("(61) 99123-4001")
                        .email("ana.ferreira@email.com")
                        .endereco("Residencial Oeste, Bloco B, Apt 204 - São Sebastião/DF")
                        .profissao("Designer")
                        .senha("123456")
                        .primeiroLogin(false)
                        .status("Regular")
                        .matricula("AMAS-004")
                        .dataEntrada(LocalDate.of(2024, 5, 5))
                        .build()
        );

        Associado roberto = upsertAssociado(
                "159.357.486-20",
                Associado.builder()
                        .nome("Roberto Nascimento")
                        .cpf("159.357.486-20")
                        .nascimento(LocalDate.of(1981, 1, 28))
                        .telefone("(61) 99222-5500")
                        .email("roberto.nascimento@email.com")
                        .endereco("Rua do Comércio, 41 - São Sebastião/DF")
                        .profissao("Motorista")
                        .senha("123456")
                        .primeiroLogin(true)
                        .status("Em análise")
                        .matricula("AMAS-005")
                        .dataEntrada(LocalDate.of(2024, 8, 18))
                        .build()
        );

        Associado juliana = upsertAssociado(
                "753.951.842-11",
                Associado.builder()
                        .nome("Juliana Costa")
                        .cpf("753.951.842-11")
                        .nascimento(LocalDate.of(1997, 12, 12))
                        .telefone("(61) 99333-6789")
                        .email("juliana.costa@email.com")
                        .endereco("Morada do Sol, Casa 9 - São Sebastião/DF")
                        .profissao("Assistente administrativa")
                        .senha("123456")
                        .primeiroLogin(false)
                        .status("Regular")
                        .matricula("AMAS-006")
                        .dataEntrada(LocalDate.of(2025, 1, 9))
                        .build()
        );

        seedContribuicao(joao, "Janeiro 2025", new BigDecimal("50.00"), "comprovante_jan.pdf", LocalDate.of(2025, 1, 10), "Aprovado", null, null);
        seedContribuicao(joao, "Fevereiro 2025", new BigDecimal("50.00"), "comprovante_fev.pdf", LocalDate.of(2025, 2, 8), "Aprovado", null, null);
        seedContribuicao(joao, "Março 2025", new BigDecimal("50.00"), "comprovante_mar.pdf", LocalDate.of(2025, 3, 5), "Em análise", "Pagamento referente a adiantamento de abril", null);

        seedContribuicao(maria, "Janeiro 2025", new BigDecimal("50.00"), "comprovante_jan_m.pdf", LocalDate.of(2025, 1, 12), "Aprovado", null, null);
        seedParcelaAtraso(maria, "Fevereiro 2025", new BigDecimal("50.00"), LocalDate.of(2025, 2, 10));
        seedParcelaAtraso(maria, "Março 2025", new BigDecimal("50.00"), LocalDate.of(2025, 3, 10));

        seedContribuicao(carlos, "Março 2025", new BigDecimal("50.00"), "comprovante_mar_c.jpg", LocalDate.of(2025, 3, 2), "Em análise", "Quitando atraso de fevereiro", null);
        seedParcelaAtraso(carlos, "Fevereiro 2025", new BigDecimal("50.00"), LocalDate.of(2025, 2, 10));

        seedContribuicao(ana, "Abril 2025", new BigDecimal("60.00"), "comp_ana_abr.pdf", LocalDate.of(2025, 4, 9), "Aprovado", null, null);
        seedContribuicao(juliana, "Abril 2025", new BigDecimal("50.00"), "comp_juliana_abr.png", LocalDate.of(2025, 4, 10), "Aprovado", null, null);
        seedContribuicao(roberto, "Abril 2025", new BigDecimal("50.00"), "comp_roberto_abr.pdf", LocalDate.of(2025, 4, 14), "Em análise", "Primeira contribuição após aprovação preliminar", null);
    }

    private void seedConteudoInstitucional() {
        seedNoticia(
                "AMAS fecha parceria com Supermercado Vila Nova",
                "Associados da AMAS passam a ter 8% de desconto em todas as compras no Supermercado Vila Nova.",
                "A parceria amplia o clube de benefícios e fortalece o comércio local de São Sebastião.",
                "parceria",
                true,
                LocalDate.of(2025, 3, 10)
        );

        seedNoticia(
                "Assembleia geral ordinária - Março 2025",
                "Todos os associados estão convocados para a assembleia do primeiro trimestre.",
                "A reunião tratará do calendário anual, do balanço financeiro e das próximas ações comunitárias.",
                "comunicado",
                false,
                LocalDate.of(2025, 3, 5)
        );

        seedNoticia(
                "Campanha de alimentos supera expectativas",
                "Mais de 800 kg de alimentos foram arrecadados e distribuídos.",
                "A ação social mobilizou moradores, parceiros e associados voluntários em fevereiro de 2025.",
                "social",
                true,
                LocalDate.of(2025, 2, 28)
        );

        seedEvento(
                "Mutirão de Limpeza - Parque do Bairro",
                "Ação de limpeza e revitalização do parque central do bairro.",
                "social",
                LocalDate.of(2026, 4, 25),
                "08:00",
                "Parque Central de São Sebastião",
                50,
                true
        );

        seedEvento(
                "Workshop: Como formalizar seu negócio",
                "Capacitação gratuita para empreendedores locais sobre MEI, abertura de empresa e acesso a crédito.",
                "capacitacao",
                LocalDate.of(2026, 5, 12),
                "14:00",
                "Sede da AMAS - Sala de reuniões",
                30,
                false
        );

        seedEvento(
                "Rodada de Benefícios com Novos Parceiros",
                "Encontro com empresas interessadas em ampliar benefícios para os associados.",
                "parceria",
                LocalDate.of(2026, 5, 18),
                "19:00",
                "Restaurante Dom Bosco - Salão privativo",
                40,
                false
        );

        seedEvento(
                "Festa Junina Comunitária AMAS 2026",
                "Celebração aberta à comunidade com barracas, música ao vivo e sorteios.",
                "cultural",
                LocalDate.of(2026, 6, 20),
                "16:00",
                "Quadra poliesportiva - São Sebastião",
                300,
                true
        );

        seedMensagem(
                "Bem-vindo ao sistema AMAS!",
                "Olá! Aqui você acompanha sua situação financeira, envia comprovantes e acessa novidades da associação.",
                LocalDateTime.of(2026, 1, 10, 9, 0),
                "todos"
        );

        seedMensagem(
                "Lembrete: contribuições em aberto",
                "Mantenha suas contribuições em dia para usufruir de todos os benefícios da AMAS.",
                LocalDateTime.of(2026, 3, 5, 8, 0),
                "associados"
        );
    }

    private void seedSolicitacoes() {
        boolean exists = solicitacaoRepository.findAll().stream()
                .anyMatch(s -> "fernanda@email.com".equalsIgnoreCase(s.getEmail()));
        if (!exists) {
            solicitacaoRepository.save(Solicitacao.builder()
                    .nome("Fernanda Lima")
                    .cpf("321.654.987-00")
                    .email("fernanda@email.com")
                    .telefone("(61) 98765-4321")
                    .profissao("Artesã")
                    .endereco("QR 110, Conjunto A - São Sebastião/DF")
                    .dataSolicitacao(LocalDate.of(2025, 3, 12))
                    .status("Pendente")
                    .observacoes("Indicada por João da Silva (AMAS-001)")
                    .build());
        }
    }

    private void seedLogInicial() {
        if (logRepository.count() > 0) {
            return;
        }

        logRepository.save(LogAtividade.builder()
                .acao("Sistema iniciado")
                .usuario("Sistema")
                .perfil("sistema")
                .data(LocalDateTime.now())
                .detalhes("Carga inicial e reparos automáticos executados com sucesso")
                .build());

        logRepository.save(LogAtividade.builder()
                .acao("Login realizado")
                .usuario("Administrador AMAS")
                .perfil("admin")
                .data(LocalDateTime.now().minusMinutes(5))
                .detalhes("Acesso ao painel administrativo")
                .build());
    }

    private Usuario upsertUsuario(String email, Usuario base) {
        Usuario usuario = usuarioRepository.findByEmail(email.toLowerCase()).orElse(base);

        usuario.setNome(base.getNome());
        usuario.setEmail(base.getEmail().toLowerCase());
        usuario.setSenha(base.getSenha());
        usuario.setPerfil(base.getPerfil());
        usuario.setCnpj(base.getCnpj());
        usuario.setTelefone(base.getTelefone());
        usuario.setUnidades(base.getUnidades() == null ? "[]" : base.getUnidades().trim());
        usuario.setContrato(base.getContrato() == null ? "{}" : base.getContrato().trim());
        usuario.setPrimeiroLogin(base.getPrimeiroLogin() != null && base.getPrimeiroLogin());
        if (usuario.getResetSolicitado() == null) {
            usuario.setResetSolicitado(false);
        }
        if (usuario.getSenhaExpirada() == null) {
            usuario.setSenhaExpirada(false);
        }

        return usuarioRepository.save(usuario);
    }

    private Associado upsertAssociado(String cpf, Associado base) {
        Associado associado = associadoRepository.findByCpf(cpf).orElse(base);

        associado.setNome(base.getNome());
        associado.setCpf(base.getCpf());
        associado.setNascimento(base.getNascimento());
        associado.setTelefone(base.getTelefone());
        associado.setEmail(base.getEmail().toLowerCase());
        associado.setEndereco(base.getEndereco());
        associado.setProfissao(base.getProfissao());
        associado.setSenha(base.getSenha());
        associado.setPrimeiroLogin(base.getPrimeiroLogin() != null && base.getPrimeiroLogin());
        associado.setStatus(base.getStatus());
        associado.setMatricula(base.getMatricula());
        associado.setDataEntrada(base.getDataEntrada());
        if (associado.getResetSolicitado() == null) {
            associado.setResetSolicitado(false);
        }
        if (associado.getSenhaExpirada() == null) {
            associado.setSenhaExpirada(false);
        }

        return associadoRepository.save(associado);
    }

    private void seedContribuicao(Associado associado,
                                  String mes,
                                  BigDecimal valor,
                                  String arquivo,
                                  LocalDate data,
                                  String status,
                                  String observacoes,
                                  String msgAdmin) {
        boolean exists = contribuicaoRepository.findByAssociadoId(associado.getId()).stream()
                .anyMatch(c -> mes.equalsIgnoreCase(c.getMes()));
        if (exists) {
            return;
        }

        contribuicaoRepository.save(Contribuicao.builder()
                .associado(associado)
                .mes(mes)
                .valor(valor)
                .arquivo(arquivo)
                .data(data)
                .status(status)
                .observacoes(observacoes)
                .msgAdmin(msgAdmin)
                .build());
    }

    private void seedParcelaAtraso(Associado associado, String mes, BigDecimal valor, LocalDate vencimento) {
        boolean exists = parcelaAtrasoRepository.findByAssociadoId(associado.getId()).stream()
                .anyMatch(p -> mes.equalsIgnoreCase(p.getMes()));
        if (exists) {
            return;
        }

        parcelaAtrasoRepository.save(ParcelaAtraso.builder()
                .associado(associado)
                .mes(mes)
                .valor(valor)
                .vencimento(vencimento)
                .build());
    }

    private void seedNoticia(String titulo,
                             String resumo,
                             String conteudo,
                             String categoria,
                             boolean destaque,
                             LocalDate publicadaEm) {
        boolean exists = noticiaRepository.findAll().stream()
                .anyMatch(n -> titulo.equalsIgnoreCase(n.getTitulo()));
        if (!exists) {
            noticiaRepository.save(Noticia.builder()
                    .titulo(titulo)
                    .resumo(resumo)
                    .conteudo(conteudo)
                    .categoria(categoria)
                    .destaque(destaque)
                    .publicadaEm(publicadaEm)
                    .autor("Administrador AMAS")
                    .build());
        }
    }

    private void seedEvento(String titulo,
                            String descricao,
                            String tipo,
                            LocalDate data,
                            String horario,
                            String local,
                            int vagas,
                            boolean destaque) {
        boolean exists = eventoRepository.findAll().stream()
                .anyMatch(e -> titulo.equalsIgnoreCase(e.getTitulo()));
        if (!exists) {
            eventoRepository.save(Evento.builder()
                    .titulo(titulo)
                    .descricao(descricao)
                    .tipo(tipo)
                    .data(data)
                    .horario(horario)
                    .local(local)
                    .vagas(vagas)
                    .vagasTotais(vagas)
                    .inscricoes(0)
                    .status("Aberto")
                    .destaque(destaque)
                    .build());
        }
    }

    private void seedMensagem(String titulo, String corpo, LocalDateTime data, String destinatarios) {
        boolean exists = mensagemRepository.findAll().stream()
                .anyMatch(m -> titulo.equalsIgnoreCase(m.getTitulo()));
        if (!exists) {
            mensagemRepository.save(Mensagem.builder()
                    .titulo(titulo)
                    .corpo(corpo)
                    .data(data)
                    .tipo("broadcast")
                    .destinatarios(destinatarios)
                    .remetente("Administrador AMAS")
                    .lidasIds("")
                    .build());
        }
    }
}
