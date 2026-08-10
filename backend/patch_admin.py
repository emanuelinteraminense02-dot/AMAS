with open("/src/main/resources/static/js/", "r", encoding="utf-8") as f:
    src = f.read()

# 1. atualizarBadges — async with API calls
old_badges = '''  function atualizarBadges() {
    const pendentes = getAssociados().reduce((acc,a) => acc + (a.historico||[]).filter(c => c.status === "Em análise").length, 0);
    const alertas   = getAlertasEmp().filter(a => !a.lido).length;
    const bMesa = document.getElementById("badgeMesa");
    const bAlert = document.getElementById("badgeAlertas");
    const bRec   = document.getElementById("badgeRecuperacao");
    const pendRec = getResetsPendentes().length;
    if (bRec) {
      if (pendRec > 0) { bRec.textContent = pendRec; bRec.classList.remove("hidden"); }
      else bRec.classList.add("hidden");
    }
    if (pendentes > 0) { bMesa.textContent = pendentes; bMesa.classList.remove("hidden"); } else bMesa.classList.add("hidden");
    if (alertas > 0)   { bAlert.textContent = alertas;  bAlert.classList.remove("hidden"); } else bAlert.classList.add("hidden");
  }'''

new_badges = '''  async function atualizarBadges() {
    try {
      // MUDANÇA: antes lia localStorage — agora busca da API em paralelo
      const [dash, alertasList, resetsList] = await Promise.all([
        Api.dashboard.buscar().catch(() => ({})),
        Api.alertas.listarTodos().catch(() => []),
        Api.senha.listarPendentes().catch(() => [])
      ]);
      const pendentes = dash.contribuicoesPendentes ?? 0;
      const alertas   = alertasList.filter(a => !a.lido).length;
      const pendRec   = resetsList.length;
      const bMesa  = document.getElementById("badgeMesa");
      const bAlert = document.getElementById("badgeAlertas");
      const bRec   = document.getElementById("badgeRecuperacao");
      if (bRec) {
        if (pendRec > 0) { bRec.textContent = pendRec; bRec.classList.remove("hidden"); }
        else bRec.classList.add("hidden");
      }
      if (pendentes > 0) { bMesa.textContent = pendentes; bMesa.classList.remove("hidden"); } else bMesa.classList.add("hidden");
      if (alertas > 0)   { bAlert.textContent = alertas;  bAlert.classList.remove("hidden"); } else bAlert.classList.add("hidden");
    } catch (_) { /* silencia erros de badge */ }
  }'''

src = src.replace(old_badges, new_badges)

# 2. renderDashboard — async with await
src = src.replace(
    "  function renderDashboard() {\n    const est = getEstatisticas();",
    "  async function renderDashboard() {\n    mostrarLoading(true);\n    try {\n    // MUDANÇA: era getEstatisticas() síncrona — agora await Api.dashboard.buscar()\n    const est = await getEstatisticas();"
)
# Close the try block in renderDashboard — find a stable pattern after chartContrib
src = src.replace(
    "    }, options:{ plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ callback:v => \"R$ \"+v } } } } });\n  }",
    "    }, options:{ plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ callback:v => \"R$ \"+v } } } } });\n    } catch (e) { console.error(\"Dashboard:\", e); } finally { mostrarLoading(false); }\n  }",
    1
)
# Also need assocs inside renderDashboard to be async
src = src.replace(
    "    const assocs  = getAssociados();\n    const ctx1    = document.getElementById(\"graficoStatus\").getContext(\"2d\");",
    "    const assocs  = await getAssociados();\n    const ctx1    = document.getElementById(\"graficoStatus\").getContext(\"2d\");"
)

# 3. renderMesa — async
src = src.replace(
    "  function renderMesa() {\n    const assocs = getAssociados();",
    "  async function renderMesa() {\n    mostrarLoading(true);\n    // MUDANÇA: era getAssociados() síncrona — agora await\n    try {\n    const assocs = await getAssociados();\n    const contribsPendentes = [];\n    // Busca contribuições de cada associado em paralelo\n    const todosComContribs = await Promise.all(\n      assocs.map(async a => ({\n        assoc: a,\n        contribs: await Api.associados.listarContribuicoes(a.id).catch(() => [])\n      }))\n    );\n    const pendentes = todosComContribs.flatMap(({ assoc, contribs }) =>\n      contribs.filter(c => c.status === \"Em análise\").map(contrib => ({ assoc, contrib }))\n    );"
)
# Remove old pendentes assembly inside renderMesa
src = src.replace(
    "    const pendentes = [];\n    assocs.forEach(a => {\n      (a.historico||[]).forEach(c => {\n        if (c.status === \"Em análise\") pendentes.push({ assoc: a, contrib: c });\n      });\n    });",
    ""
)
# Close renderMesa try block
src = src.replace(
    "    document.getElementById(\"listaMesa\").innerHTML = pendentes.map(({ assoc, contrib }) =>",
    "    document.getElementById(\"listaMesa\").innerHTML = pendentes.map(({ assoc, contrib }) =>"
)

# 4. aprovarContrib / iniciarRecusa → async
src = src.replace(
    "  window.aprovarContrib = function(aId, cId) {\n    atualizarStatusContribuicao(aId, cId, \"Aprovado\", \"\");\n    renderMesa(); atualizarBadges();\n    showToast(\"Comprovante aprovado!\", \"success\");\n  };",
    "  window.aprovarContrib = async function(aId, cId) {\n    // MUDANÇA: era síncrona — agora aguarda a API confirmar\n    mostrarLoading(true);\n    try {\n      await atualizarStatusContribuicao(aId, cId, \"Aprovado\", \"\");\n      showToast(\"Comprovante aprovado!\", \"success\");\n    } catch (e) { showToast(\"Erro ao aprovar: \" + e.message, \"error\"); }\n    finally { mostrarLoading(false); }\n    renderMesa(); atualizarBadges();\n  };"
)

# 5. recusa confirm button → async
src = src.replace(
    "    atualizarStatusContribuicao(pendRecusarAssocId, pendRecusarContribId, \"Recusado\", motivo);\n    document.getElementById(\"modalRecusar\").classList.add(\"hidden\");\n    renderMesa(); atualizarBadges();\n    showToast(\"Comprovante recusado com justificativa.\", \"info\");\n    pendRecusarAssocId = null; pendRecusarContribId = null;",
    "    // MUDANÇA: era síncrona — agora async\n    mostrarLoading(true);\n    try { await atualizarStatusContribuicao(pendRecusarAssocId, pendRecusarContribId, \"Recusado\", motivo); } catch(e){}\n    finally { mostrarLoading(false); }\n    document.getElementById(\"modalRecusar\").classList.add(\"hidden\");\n    renderMesa(); atualizarBadges();\n    showToast(\"Comprovante recusado com justificativa.\", \"info\");\n    pendRecusarAssocId = null; pendRecusarContribId = null;"
)

# 6. renderAssociados — async
src = src.replace(
    "  function renderAssociados() {\n    const busca   = document.getElementById(\"buscarAssoc\").value.toLowerCase();\n    const filtSt  = document.getElementById(\"filtroStatus\").value;\n    let lista = getAssociados().filter(a => {",
    "  async function renderAssociados() {\n    // MUDANÇA: era getAssociados() síncrona — agora await\n    const busca   = document.getElementById(\"buscarAssoc\").value.toLowerCase();\n    const filtSt  = document.getElementById(\"filtroStatus\").value;\n    let todosAssoc;\n    try { todosAssoc = await getAssociados(); } catch(_) { todosAssoc = []; }\n    let lista = todosAssoc.filter(a => {"
)

# 7. formAssoc submit: cpfJaExiste and adicionarAssociado/atualizarAssociado → async
src = src.replace(
    "  document.getElementById(\"formAssoc\").addEventListener(\"submit\", (e) => {",
    "  document.getElementById(\"formAssoc\").addEventListener(\"submit\", async (e) => {"
)
src = src.replace(
    "    if (cpfJaExiste(cpf, idEdit ? parseInt(idEdit) : null)) { err.textContent = \"Este CPF já está cadastrado.\"; return; }\n    if (idEdit) {\n      atualizarAssociado(parseInt(idEdit), { nome, cpf, nascimento:nasc, telefone:tel, email, profissao:prof, endereco:end, status, senha });\n      showToast(\"Associado atualizado!\", \"success\");\n    } else {\n      adicionarAssociado({ nome, cpf, nascimento:nasc, telefone:tel, email, profissao:prof, endereco:end, status, senha, primeiroLogin:true });\n      showToast(\"Associado cadastrado!\", \"success\");\n    }",
    "    // MUDANÇA: cpfJaExiste, atualizarAssociado, adicionarAssociado são agora assíncronas\n    if (await cpfJaExiste(cpf, idEdit ? parseInt(idEdit) : null)) { err.textContent = \"Este CPF já está cadastrado.\"; return; }\n    mostrarLoading(true);\n    try {\n      if (idEdit) {\n        await atualizarAssociado(parseInt(idEdit), { nome, cpf, nascimento:nasc, telefone:tel, email, profissao:prof, endereco:end, status, senha });\n        showToast(\"Associado atualizado!\", \"success\");\n      } else {\n        await adicionarAssociado({ nome, cpf, nascimento:nasc, telefone:tel, email, profissao:prof, endereco:end, status, senha, primeiroLogin:true });\n        showToast(\"Associado cadastrado!\", \"success\");\n      }\n    } catch(e) { showToast(\"Erro: \" + e.message, \"error\"); }\n    finally { mostrarLoading(false); }"
)

# 8. editarAssoc, verAssoc, excluirAssoc → async
src = src.replace(
    "  window.editarAssoc = function(id) {\n    const a = getAssociados().find(x => x.id === id);",
    "  window.editarAssoc = async function(id) {\n    // MUDANÇA: era getAssociados() síncrona\n    const todos = await getAssociados().catch(() => []);\n    const a = todos.find(x => x.id === id);"
)
src = src.replace(
    "  window.excluirAssoc = function(id) {\n    const a = getAssociados().find(x => x.id === id);\n    if (!a) return;\n    if (!confirm('Deseja realmente excluir o associado \"' + a.nome + '\"?\\nEsta ação não pode ser desfeita.')) return;\n    removerAssociado(id);\n    renderAssociados();\n    showToast(\"Associado excluído.\", \"info\");\n  };",
    "  window.excluirAssoc = async function(id) {\n    // MUDANÇA: era removerAssociado() síncrona\n    const todos = await getAssociados().catch(() => []);\n    const a = todos.find(x => x.id === id);\n    if (!a) return;\n    if (!confirm('Deseja realmente excluir o associado \"' + a.nome + '\"?\\nEsta ação não pode ser desfeita.')) return;\n    mostrarLoading(true);\n    try { await removerAssociado(id); showToast(\"Associado excluído.\", \"info\"); }\n    catch(e) { showToast(\"Erro: \" + e.message, \"error\"); }\n    finally { mostrarLoading(false); }\n    renderAssociados();\n  };"
)
src = src.replace(
    "  window.verAssoc = function(id) {\n    const a = getAssociados().find(x => x.id === id);",
    "  window.verAssoc = async function(id) {\n    const todos = await getAssociados().catch(() => []);\n    const a = todos.find(x => x.id === id);"
)

# 9. renderBroadcast — async
src = src.replace(
    "  function renderBroadcast() {\n    const msgs = getMensagens();",
    "  async function renderBroadcast() {\n    // MUDANÇA: era getMensagens() síncrona\n    let msgs;\n    try { msgs = await getMensagens(); } catch(_) { msgs = []; }"
)
src = src.replace(
    "  document.getElementById(\"formBroadcast\").addEventListener(\"submit\", (e) => {",
    "  document.getElementById(\"formBroadcast\").addEventListener(\"submit\", async (e) => {"
)
src = src.replace(
    "    enviarMensagem(titulo, corpo, dest);\n    document.getElementById(\"formBroadcast\").reset();\n    renderBroadcast();\n    showToast(\"Mensagem enviada com sucesso!\", \"success\");",
    "    // MUDANÇA: era enviarMensagem() síncrona\n    mostrarLoading(true);\n    try { await enviarMensagem(titulo, corpo, dest); showToast(\"Mensagem enviada com sucesso!\", \"success\"); }\n    catch(e) { showToast(\"Erro: \" + e.message, \"error\"); }\n    finally { mostrarLoading(false); }\n    document.getElementById(\"formBroadcast\").reset();\n    renderBroadcast();"
)

# 10. renderAlertas — async
src = src.replace(
    "  function renderAlertas() {\n    const alertas = getAlertasEmp();",
    "  async function renderAlertas() {\n    // MUDANÇA: era getAlertasEmp() síncrona\n    let alertas;\n    try { alertas = await getAlertasEmp(); } catch(_) { alertas = []; }"
)
src = src.replace(
    "  window.marcarAlertaLidoUI = function(id) {\n    marcarAlertaLido(id);\n    renderAlertas();\n    atualizarBadges();\n    showToast(\"Alerta marcado como resolvido.\", \"success\");\n  };",
    "  window.marcarAlertaLidoUI = async function(id) {\n    // MUDANÇA: era marcarAlertaLido() síncrona\n    try { await marcarAlertaLido(id); } catch(_) {}\n    renderAlertas();\n    atualizarBadges();\n    showToast(\"Alerta marcado como resolvido.\", \"success\");\n  };"
)

# 11. renderRelatorios — async
src = src.replace(
    "  function renderRelatorios() {\n    const assocs  = getAssociados();\n    const inadims = assocs.filter(a => a.status === \"Inadimplente\");\n    const data    = new Date().toLocaleString(\"pt-BR\");\n    const est     = getEstatisticas();",
    "  async function renderRelatorios() {\n    // MUDANÇA: era getAssociados() e getEstatisticas() síncronas\n    mostrarLoading(true);\n    let assocs, est;\n    try {\n      [assocs, est] = await Promise.all([getAssociados(), getEstatisticas()]);\n    } catch(_) { assocs = []; est = {}; } finally { mostrarLoading(false); }\n    const inadims = assocs.filter(a => a.status === \"Inadimplente\");\n    const data    = new Date().toLocaleString(\"pt-BR\");"
)
src = src.replace(
    "    const inadims = getAssociados().filter(a => a.status === \"Inadimplente\");\n    const text = \"RELATÓRIO DE INADIMPLENTES – AMAS\\n\" +",
    "    const inadimsLocal = assocs ? assocs.filter(a => a.status === \"Inadimplente\") : [];\n    const text = \"RELATÓRIO DE INADIMPLENTES – AMAS\\n\" +"
)
src = src.replace(
    "      inadims.map((a,i) => (i+1) + \". \" + a.nome + \" | \" + a.cpf + \" | \" + (a.telefone||\"—\") + \" | \" + a.matricula).join(\"\\n\");",
    "      inadimsLocal.map((a,i) => (i+1) + \". \" + a.nome + \" | \" + a.cpf + \" | \" + (a.telefone||\"—\") + \" | \" + a.matricula).join(\"\\n\");"
)

# 12. renderMonitor — async
src = src.replace(
    "  function renderMonitor() {\n    const log = getLog();",
    "  async function renderMonitor() {\n    // MUDANÇA: era getLog() síncrona — agora await\n    let log;\n    try { log = await getLog(); } catch(_) { log = []; }"
)

# 13. renderNoticias — async
src = src.replace(
    "  function renderNoticias() {\n    const list = getNoticias();",
    "  async function renderNoticias() {\n    // MUDANÇA: era getNoticias() síncrona\n    let list;\n    try { list = await getNoticias(); } catch(_) { list = []; }"
)
src = src.replace(
    "  document.getElementById(\"formNoticia\").addEventListener(\"submit\", (e) => {",
    "  document.getElementById(\"formNoticia\").addEventListener(\"submit\", async (e) => {"
)
src = src.replace(
    "    if (idEdit) atualizarNoticia(parseInt(idEdit), dados); else adicionarNoticia(dados);\n    document.getElementById(\"modalNoticia\").classList.add(\"hidden\");\n    renderNoticias(); showToast(\"Notícia salva!\", \"success\");",
    "    // MUDANÇA: eram síncronas\n    mostrarLoading(true);\n    try {\n      if (idEdit) await atualizarNoticia(parseInt(idEdit), dados); else await adicionarNoticia(dados);\n      showToast(\"Notícia salva!\", \"success\");\n    } catch(e) { showToast(\"Erro: \" + e.message, \"error\"); }\n    finally { mostrarLoading(false); }\n    document.getElementById(\"modalNoticia\").classList.add(\"hidden\");\n    renderNoticias();"
)
src = src.replace(
    "  window.editarNoticia = function(id) {\n    const n = getNoticias().find(x => x.id === id);",
    "  window.editarNoticia = async function(id) {\n    const all = await getNoticias().catch(() => []);\n    const n = all.find(x => x.id === id);"
)
src = src.replace(
    "  window.excluirNoticia = function(id) {\n    if (!confirm(\"Deseja realmente excluir esta notícia?\")) return;\n    removerNoticia(id); renderNoticias(); showToast(\"Notícia excluída.\", \"info\");\n  };",
    "  window.excluirNoticia = async function(id) {\n    if (!confirm(\"Deseja realmente excluir esta notícia?\")) return;\n    // MUDANÇA: era removerNoticia() síncrona\n    try { await removerNoticia(id); showToast(\"Notícia excluída.\", \"info\"); } catch(e) { showToast(\"Erro: \" + e.message, \"error\"); }\n    renderNoticias();\n  };"
)

# 14. renderEventos — async
src = src.replace(
    "  function renderEventos() {\n    const list = getEventos();",
    "  async function renderEventos() {\n    // MUDANÇA: era getEventos() síncrona\n    let list;\n    try { list = await getEventos(); } catch(_) { list = []; }"
)
src = src.replace(
    "  window.mudarStatusEvento = function(id, novoStatus) {\n    alterarStatusEvento(id, novoStatus);\n    renderEventos();\n    showToast(\"Status atualizado: \" + novoStatus, \"success\");\n  };",
    "  window.mudarStatusEvento = async function(id, novoStatus) {\n    // MUDANÇA: era alterarStatusEvento() síncrona\n    try { await alterarStatusEvento(id, novoStatus); showToast(\"Status atualizado: \" + novoStatus, \"success\"); }\n    catch(e) { showToast(\"Erro: \" + e.message, \"error\"); }\n    renderEventos();\n  };"
)
src = src.replace(
    "  window.verParticipantes = function(id) {\n    const ev = getEventos().find(x => x.id === id);",
    "  window.verParticipantes = async function(id) {\n    // MUDANÇA: era getEventos() síncrona + agora busca inscritos da API\n    const [todos, inscritos] = await Promise.all([\n      getEventos().catch(() => []),\n      Api.eventos.listarInscritos(id).catch(() => [])\n    ]);\n    const ev = todos.find(x => x.id === id);\n    if (!ev) return;\n    // Monta arrays compatíveis com o código de exibição\n    ev.inscritos   = inscritos.filter(i => i.situacao === 'confirmado').map(i => ({ id: i.associado?.id, nome: i.associado?.nome, matricula: i.associado?.matricula, email: i.associado?.email, dataInscricao: i.dataInscricao }));\n    ev.listaEspera = inscritos.filter(i => i.situacao === 'lista_espera').map(i => ({ id: i.associado?.id, nome: i.associado?.nome, matricula: i.associado?.matricula, email: i.associado?.email, dataInscricao: i.dataInscricao }));\n    const vagas     = ev.vagasTotais || ev.vagas || 0;"
)
# Remove the old body of verParticipantes (up until the const inscritos line)
src = src.replace(
    "    if (!ev) return;\n    const vagas     = ev.vagasTotais || ev.vagas || 0;\n    const inscritos = ev.inscritos   || [];\n    const espera    = ev.listaEspera || [];",
    "    const inscritos = ev.inscritos   || [];\n    const espera    = ev.listaEspera || [];"
)

src = src.replace(
    "  window.adminRemoverInscrito = function(eventoId, associadoId) {\n    if (!confirm(\"Remover este participante do evento?\")) return;\n    const res = cancelarInscricao(eventoId, associadoId);\n    if (res.ok && res.promovido) {",
    "  window.adminRemoverInscrito = async function(eventoId, associadoId) {\n    if (!confirm(\"Remover este participante do evento?\")) return;\n    // MUDANÇA: era cancelarInscricao() síncrona\n    const res = await cancelarInscricao(eventoId, associadoId);\n    if (res.ok && res.promovido) {"
)

src = src.replace(
    "  document.getElementById(\"formEvento\").addEventListener(\"submit\", (e) => {",
    "  document.getElementById(\"formEvento\").addEventListener(\"submit\", async (e) => {"
)
src = src.replace(
    "    if (idEdit) {\n      // Preserva inscritos/listaEspera ao editar — não apaga participantes já inscritos\n      const evAtual = getEventos().find(e => e.id === parseInt(idEdit));\n      dados.inscritos    = evAtual?.inscritos   || [];\n      dados.listaEspera  = evAtual?.listaEspera || [];\n      dados.vagasTotais  = vagas;\n      dados.inscricoes   = dados.inscritos.length;\n      atualizarEvento(parseInt(idEdit), dados);\n    } else {\n      // adicionarEvento já define inscritos:[], listaEspera:[], vagasTotais, status\n      adicionarEvento(dados);\n    }",
    "    // MUDANÇA: eram atualizarEvento / adicionarEvento síncronas\n    mostrarLoading(true);\n    try {\n      if (idEdit) {\n        await atualizarEvento(parseInt(idEdit), dados);\n      } else {\n        await adicionarEvento(dados);\n      }\n      showToast(\"Evento salvo!\", \"success\");\n    } catch(e) { showToast(\"Erro: \" + e.message, \"error\"); }\n    finally { mostrarLoading(false); }"
)
src = src.replace(
    "    document.getElementById(\"modalEvento\").classList.add(\"hidden\");\n    renderEventos();\n    showToast(\"Evento salvo!\", \"success\");",
    "    document.getElementById(\"modalEvento\").classList.add(\"hidden\");\n    renderEventos();"
)
src = src.replace(
    "  window.editarEvento = function(id) {\n    const ev = getEventos().find(x => x.id === id);",
    "  window.editarEvento = async function(id) {\n    const all = await getEventos().catch(() => []);\n    const ev = all.find(x => x.id === id);"
)
src = src.replace(
    "  window.excluirEvento = function(id) {\n    if (!confirm(\"Deseja realmente excluir este evento?\")) return;\n    removerEvento(id); renderEventos(); showToast(\"Evento excluído.\", \"info\");\n  };",
    "  window.excluirEvento = async function(id) {\n    if (!confirm(\"Deseja realmente excluir este evento?\")) return;\n    // MUDANÇA: era removerEvento() síncrona\n    try { await removerEvento(id); showToast(\"Evento excluído.\", \"info\"); } catch(e) { showToast(\"Erro: \" + e.message, \"error\"); }\n    renderEventos();\n  };"
)

# 15. renderSolicitacoes — async
src = src.replace(
    "  function renderSolicitacoes() {\n    const todas = getSolicitacoes().filter(s => s.status === \"Pendente\");",
    "  async function renderSolicitacoes() {\n    // MUDANÇA: era getSolicitacoes() síncrona\n    let solics;\n    try { solics = await getSolicitacoes(); } catch(_) { solics = []; }\n    const todas = solics.filter(s => s.status === \"Pendente\");"
)
src = src.replace(
    "  window.aprovarSolicit = function(id) {\n    if (!confirm(\"Aprovar esta solicitação e cadastrar o membro?\")) return;\n    const novo = aprovarSolicitacao(id);\n    renderSolicitacoes();\n    showToast(\"Membro cadastrado! Senha inicial: 123456\", \"success\");\n    registrarLog(\"Solicitação aprovada\", sessao.nome, \"admin\", novo ? novo.nome + \" aprovado.\" : \"\");\n  };",
    "  window.aprovarSolicit = async function(id) {\n    if (!confirm(\"Aprovar esta solicitação e cadastrar o membro?\")) return;\n    // MUDANÇA: era aprovarSolicitacao() síncrona\n    mostrarLoading(true);\n    try {\n      const novo = await aprovarSolicitacao(id);\n      showToast(\"Membro cadastrado! Senha inicial: 123456\", \"success\");\n      registrarLog(\"Solicitação aprovada\", sessao.nome, \"admin\", novo ? (novo.nome + \" aprovado.\") : \"\");\n    } catch(e) { showToast(\"Erro: \" + e.message, \"error\"); }\n    finally { mostrarLoading(false); }\n    renderSolicitacoes();\n  };"
)
src = src.replace(
    "  window.recusarSolicit = function(id) {\n    const motivo = prompt(\"Motivo da recusa:\");\n    if (!motivo) return;\n    recusarSolicitacao(id, motivo);\n    renderSolicitacoes();\n    showToast(\"Solicitação recusada.\", \"info\");\n  };",
    "  window.recusarSolicit = async function(id) {\n    const motivo = prompt(\"Motivo da recusa:\");\n    if (!motivo) return;\n    // MUDANÇA: era recusarSolicitacao() síncrona\n    try { await recusarSolicitacao(id, motivo); } catch(e) {}\n    renderSolicitacoes();\n    showToast(\"Solicitação recusada.\", \"info\");\n  };"
)

# 16. renderContratos (external function) — async
src = src.replace(
    "function renderContratos() {\n  const emps = getEmpresarios();",
    "async function renderContratos() {\n  // MUDANÇA: era getEmpresarios() síncrona\n  let emps;\n  try { emps = await getEmpresarios(); } catch(_) { emps = []; }"
)
src = src.replace(
    "window.abrirModalContrato = function(empId) {\n  const emp = getEmpresarios().find(e => e.id === empId);",
    "window.abrirModalContrato = async function(empId) {\n  // MUDANÇA: era getEmpresarios() síncrona\n  const all = await getEmpresarios().catch(() => []);\n  const emp = all.find(e => e.id === empId);"
)
src = src.replace(
    "function salvarContratoModal() {\n  const empId = parseInt(document.getElementById(\"ctEmpId\").value);\n  const emp   = getEmpresarios().find(e => e.id === empId);\n  if (!emp) return;\n  const contratoAtual = emp.contrato || {};",
    "async function salvarContratoModal() {\n  // MUDANÇA: era getEmpresarios() e salvarContratoEmpresa() síncronas\n  const empId = parseInt(document.getElementById(\"ctEmpId\").value);\n  const all   = await getEmpresarios().catch(() => []);\n  const emp   = all.find(e => e.id === empId);\n  if (!emp) return;\n  const contratoAtual = emp.contrato ? (typeof emp.contrato === 'string' ? JSON.parse(emp.contrato) : emp.contrato) : {};"
)
src = src.replace(
    "  salvarContratoEmpresa(empId, contrato);\n  document.getElementById(\"modalContrato\").classList.add(\"hidden\");\n  renderContratos();",
    "  // MUDANÇA: era salvarContratoEmpresa() síncrona\n  mostrarLoading(true);\n  try { await salvarContratoEmpresa(empId, contrato); } catch(e) { showToast(\"Erro ao salvar.\", \"error\"); return; }\n  finally { mostrarLoading(false); }\n  document.getElementById(\"modalContrato\").classList.add(\"hidden\");\n  renderContratos();"
)
src = src.replace(
    "window.validarBeneficios = function(empId) {\n  const emp = getEmpresarios().find(e => e.id === empId);\n  if (!emp) return;\n  const c = emp.contrato || {};\n  c.beneficiosValidados = true;\n  atualizarEmpresario(empId, { contrato: c });\n  renderContratos();\n  showToast(\"<i class=\\'bi bi-check-circle\\'></i> Benefícios validados! Associados já podem ver a parceria.\", \"success\");\n  registrarLog(\"Benefícios validados\", getSessao()?.nome || \"Admin\", \"admin\", emp.nome + \" — validado\");\n};",
    "window.validarBeneficios = async function(empId) {\n  // MUDANÇA: era atualizarEmpresario() síncrona\n  const all = await getEmpresarios().catch(() => []);\n  const emp = all.find(e => e.id === empId);\n  if (!emp) return;\n  const c = emp.contrato ? (typeof emp.contrato === 'string' ? JSON.parse(emp.contrato) : emp.contrato) : {};\n  c.beneficiosValidados = true;\n  try { await atualizarEmpresario(empId, { ...emp, contrato: JSON.stringify(c) }); } catch(_) {}\n  renderContratos();\n  showToast(\"<i class=\\'bi bi-check-circle\\'></i> Benefícios validados! Associados já podem ver a parceria.\", \"success\");\n  registrarLog(\"Benefícios validados\", getSessao()?.nome || \"Admin\", \"admin\", emp.nome + \" — validado\");\n};"
)

# 17. imprimirContrato and similar — async
for fn_name in ["imprimirContrato", "imprimirTermoParceria", "imprimirAditivo", "imprimirSeloVitrine"]:
    src = src.replace(
        f"window.{fn_name} = function(empId) {{\n  const emp = getEmpresarios().find(e => e.id === empId);",
        f"window.{fn_name} = async function(empId) {{\n  const all = await getEmpresarios().catch(() => []);\n  const emp = all.find(e => e.id === empId);"
    )

# 18. registrarDocumentoHistorico calls inside print functions → await
src = src.replace(
    "  registrarDocumentoHistorico(empId, \"Termo de Adesão\");\n  const win = window.open(\"\", \"_blank\");\n  win.document.write(html);\n  win.document.close();\n};",
    "  await registrarDocumentoHistorico(empId, \"Termo de Adesão\");\n  const win = window.open(\"\", \"_blank\");\n  win.document.write(html);\n  win.document.close();\n};"
)
src = src.replace(
    "  registrarDocumentoHistorico(empId, \"Aditivo de Alteração\");\n  const win = window.open(\"\", \"_blank\");\n  win.document.write(html);\n  win.document.close();\n};",
    "  await registrarDocumentoHistorico(empId, \"Aditivo de Alteração\");\n  const win = window.open(\"\", \"_blank\");\n  win.document.write(html);\n  win.document.close();\n};"
)
src = src.replace(
    "  registrarDocumentoHistorico(empId, \"Selo de Vitrine\");\n  const win = window.open(\"\", \"_blank\");",
    "  await registrarDocumentoHistorico(empId, \"Selo de Vitrine\");\n  const win = window.open(\"\", \"_blank\");"
)

# 19. renderDashboard init and setInterval atualizarBadges
src = src.replace(
    "  renderDashboard();\n  atualizarBadges();\n  setInterval(atualizarBadges, 10000);",
    "  renderDashboard();\n  atualizarBadges();\n  setInterval(() => atualizarBadges(), 10000);"
)

# 20. btnResetSistema — noop (not applicable with real backend)
src = src.replace(
    "    localStorage.clear();\n    inicializarBanco();\n    inicializarDoacoes();\n    inicializarContratosDemo();",
    "    // MUDANÇA: localStorage.clear() não faz mais nada (dados no MySQL)\n    // Para resetar o sistema, reinicie o servidor com o DataLoader"
)

with open("/src/main/resources/static/js/", "w", encoding="utf-8") as f:
    f.write(src)

print("admin.js patch OK")