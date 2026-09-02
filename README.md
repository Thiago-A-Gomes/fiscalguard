# FiscalGuard

Aplicação web para triagem preventiva de arquivos XML de NF-e. O MVP processa os documentos localmente no navegador, aponta inconsistências e exporta um relatório compatível com Excel.

## Como executar

```bash
npm install
npm run dev
```

Em outro terminal, execute a API:

```bash
npm run server
```

Frontend: `http://127.0.0.1:3000`. API: `http://127.0.0.1:3333`.

## Validação

```bash
npm run build
npm run lint
npm test
```

## Documentação

- [DOCUMENTACAO_DO_PROJETO.md](./DOCUMENTACAO_DO_PROJETO.md): visão funcional, estrutura e roadmap.
- [ARCHITECTURE.md](./ARCHITECTURE.md): camadas, dependências e decisões arquiteturais.
- [SECURITY.md](./SECURITY.md): modelo de ameaças, controles existentes e próximos passos.

## Estrutura resumida

```text
app/                        composição da interface e metadados
src/domain/                 entidades e regras fiscais puras
src/application/            casos de uso e contratos
src/infrastructure/xml/     leitura de XML de NF-e
src/infrastructure/security controles de entrada e exportação
components/ui/              componentes visuais reutilizáveis
public/                     arquivos públicos
server/                     API Node.js e SQLite
```

> Os alertas são indicativos e não substituem a revisão de um profissional fiscal.
