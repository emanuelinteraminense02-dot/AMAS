# AMAS-REACT — App mobile (Expo / React Native)

Versão mobile do sistema AMAS, migrada tela por tela a partir do `frontend` web.
O `frontend` e o `backend` continuam intactos e funcionando — este app conversa
com a **mesma API Spring Boot**.

## Status da migração

| Tela        | Origem (web)                          | Status         |
|-------------|----------------------------------------|----------------|
| Início      | `frontend/index.html` + `js/index.js`  | ✅ Completo    |
| Login       | `frontend/login.html` + `js/login.js`  | ⏳ Próxima etapa (placeholder) |
| Admin       | `frontend/admin.html` + `js/admin.js`  | ⏳ Pendente    |
| Associado   | `frontend/associado.html` + `js/associado.js` | ⏳ Pendente |
| Empresário  | `frontend/empresario.html` + `js/empresario.js` | ⏳ Pendente |

## Como rodar

```bash
cd AMAS-REACT
npm install
npm start
```

Isso abre o Metro/Expo Dev Tools. A partir daí:
- Aperte **a** para abrir no emulador Android, **i** para simulador iOS, ou **w** para abrir no navegador.
- Para testar no celular físico, instale o app **Expo Go** e escaneie o QR code (celular e computador precisam estar na mesma rede Wi-Fi).

## ⚠️ Antes de rodar: configure o IP da API

Abra `src/constants/config.ts` e troque `LOCAL_NETWORK_IP` pelo IP da sua
máquina na rede local (rode `ipconfig` no Windows ou `ifconfig`/`ip a` no
Mac/Linux e procure por algo como `192.168.0.X`):

```ts
const LOCAL_NETWORK_IP = '192.168.0.10'; // <-- seu IP aqui
```

No navegador o `localhost` funciona porque o navegador roda na mesma máquina
do backend. No celular físico isso não funciona — por isso o IP da rede é
necessário. No **emulador Android**, `10.0.2.2` costuma funcionar no lugar do
IP. Certifique-se de que o backend Spring Boot está rodando (`localhost:8080`)
e aceitando conexões de outros dispositivos na rede.

## Estrutura de pastas

```
AMAS-REACT/
├── app/                    # Rotas (Expo Router — cada arquivo é uma tela)
│   ├── _layout.tsx         # Layout raiz (Stack navigator)
│   ├── index.tsx           # Tela Início (Home)
│   └── login.tsx           # Placeholder — próxima tela a migrar
├── src/
│   ├── components/         # Componentes visuais reutilizáveis
│   ├── constants/          # Tema (cores/tipografia) e config da API
│   ├── hooks/               # Hooks de dados (ex.: useHomeData)
│   ├── services/            # Camada de API (equivalente a frontend/js/api.js)
│   ├── types/                # Tipos TypeScript dos modelos do backend
│   └── utils/                 # Validadores, máscaras e formatação
```

## Observações da migração da tela Início

- Todo o conteúdo de `index.html` foi recriado como componentes React Native:
  Header, Hero (com contadores animados), Notícias, Eventos, Sobre, Benefícios,
  Formulário de associação (pessoa física/empresa) e Contato.
- As validações de CPF/CNPJ e as máscaras de campo são as mesmas do
  `frontend/js/utils.js`, só que adaptadas para `onChangeText` em vez de
  manipular `input.value` diretamente.
- A seção "Projetos" do `index.js` foi propositalmente **omitida**: o container
  `#projetosGrid` não existe em `index.html`, então essa função nunca renderiza
  nada na versão web atual (código morto). Removi para não criar algo que não
  existe na versão web hoje.
- Sessão de usuário: no navegador fica em `localStorage`; aqui fica em
  `AsyncStorage` (`src/services/api.ts`, objeto `sessaoStorage`).
