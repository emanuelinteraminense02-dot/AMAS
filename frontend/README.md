# Front-end AMAS

Este diretório concentra a interface estática do sistema.

## Estrutura

- `index.html`, `sobre.html`, `login.html` e painéis principais
- `css/` com estilos compartilhados e específicos por tela
- `js/` com lógica da interface e integração com a API
- `assets/` com imagens e arquivos visuais

## Configuração da API

O arquivo `js/config.js` define a base da API usada pelo front-end:

```js
window.AMAS_CONFIG = {
    apiBase: "http://localhost:8080/api"
};
```

Se o backend estiver em outra URL ou porta, ajuste esse valor.

## Execução local

Como o front-end é estático, você pode servir esta pasta com um servidor simples:

```powershell
cd frontend
python -m http.server 5500
```

Depois, acesse `http://localhost:5500`.
