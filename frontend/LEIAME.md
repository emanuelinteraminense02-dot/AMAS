# AMAS v4.2 – Sistema de Gestão de Associados

## Correções v4.2 (atual)

### 🐛 Bug Fix Principal
- **empresario.html** não importava `painel.css` — causa raiz da sidebar invisível
- **empresario.css** reescrito do zero: removidas ~150 linhas de regras duplicadas/conflitantes
- **painel.css** corrigido: `.sidebar.open` → `.sidebar.sidebar-open`, breakpoint 900px→768px
- **admin.js** refatorado: removidos 2 `setInterval` de polling frágeis, substituídos por registro direto no loop principal de navegação

### ✨ Melhorias Visuais
- Topbar sticky com `backdrop-filter: blur` no dark mode
- `select` com seta customizada (sem `appearance: none` feio)
- Botão de tema com animação de rotação
- Badge count com animação de pulso
- Nav item ativo com borda esquerda colorida
- Stat cards com borda superior colorida
- Foco acessível (`focus-visible`) em botões e inputs
- Transições suaves ao trocar tema

---

## Módulos implementados

### 👤 Associado
- Foto de perfil (Base64 no LocalStorage)
- Edição de perfil via modal
- Carteirinha Digital (foto + status Adimplente/Inadimplente)
- Central de Mensagens com contador de não lidas
- Parcelas em atraso com botão Pagar
- Observações no envio de comprovantes

### 🏪 Empresário
- Sidebar lateral com navegação por seções
- Dashboard Financeiro: Bruto, Taxas, Líquido, Projeção Anual
- **Aba "Minha Parceria"**: Banner de contrato, Calculadora de Impacto, Extrato de Contribuições
- Lógica de contribuição progressiva com faixas de isenção
- Gestão de Unidades com "Ver no Mapa" (Google Maps)
- Envio de Alerta ao Admin (urgente/normal)

### ⚙️ Administrador
- Mesa de Operações: aprovar/recusar comprovantes com justificativa
- Broadcast para todos / só associados / só empresários
- **Contratos de Empresas**: alíquota individual, tipo de acordo, validação de benefícios, simulador
- **Arrecadação Parceiros**: KPIs, gráfico doughnut, tabela filtrável, exportação
- Relatório de Inadimplentes (imprimir/copiar)
- Monitor de Atividades (log em tempo real)
- Painel de Alertas dos Empresários

### 💰 Motor Financeiro
```
Faixa 1: líquida ≤ R$5.000   → Isento
Faixa 2: R$5k < líq. ≤ R$10k → R$100 fixo ou 2% (o maior)
Faixa 3: líquida > R$10.000  → % do contrato (padrão 5%)
Gamificação: empresa com "Clube de Benefícios" paga 3% em vez de 5%
```

---

## Credenciais de demonstração

| Perfil      | E-mail                | Senha      |
|-------------|----------------------|------------|
| Admin       | admin@amas.com        | admin123   |
| Empresário  | empresa@amas.com      | empresa123 |
| Associado 1 | joao@email.com        | 123456     |
| Associado 2 | maria@email.com       | 123456     |
| Associado 3 | carlos@email.com      | 123456     |

> **Primeiro acesso de associado novo:** senha padrão `123456`, sistema solicita troca imediata.

---

## Estrutura de arquivos

```
amas/
├── index.html          ← Página pública
├── login.html          ← Login (todos os perfis)
├── admin.html          ← Painel Administrativo
├── associado.html      ← Painel do Associado
├── empresario.html     ← Portal do Empresário
├── sobre.html          ← Página pública
├── css/
│   ├── style.css       ← Design system global (variáveis, botões, cards, badges)
│   ├── painel.css      ← Layout sidebar/main + componentes compartilhados
│   ├── associado.css   ← Componentes dos painéis (associado + admin)
│   ├── empresario.css  ← Componentes exclusivos do portal empresário
│   ├── login.css       ← Página de login
│   └── index.css       ← Página pública
└── js/
    ├── database.js     ← LocalStorage CRUD + motor de contribuição
    ├── utils.js        ← Tema, toasts, máscaras, formatadores
    ├── login.js        ← Autenticação + log
    ├── admin.js        ← Lógica completa do painel admin
    ├── associado.js    ← Lógica completa do painel associado
    ├── empresario.js   ← Lógica completa do portal empresário
    └── index.js        ← Página pública
```

## Importações CSS por página

| Página          | CSS importados                                          |
|-----------------|--------------------------------------------------------|
| login.html      | style.css + login.css                                  |
| admin.html      | style.css + painel.css + associado.css                 |
| associado.html  | style.css + painel.css + associado.css                 |
| empresario.html | style.css + **painel.css** + associado.css + empresario.css |
| index.html      | style.css + index.css                                  |
