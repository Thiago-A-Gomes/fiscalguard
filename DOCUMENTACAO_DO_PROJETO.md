# FiscalGuard — Auditoria preventiva de NF-e

Sistema para analisar arquivos XML de NF-e, encontrar inconsistências antes do fechamento fiscal e produzir um relatório de conferência.

**Última atualização:** 02/09/2026

---

## Estrutura do projeto

```text
├── app/
│   ├── page.tsx                 interface principal
│   ├── layout.tsx               idioma e metadados
│   └── globals.css              tema visual
├── src/
│   ├── domain/
│   │   ├── fiscal.ts            entidades fiscais
│   │   └── policies.ts          regras de análise
│   ├── application/
│   │   ├── ports.ts             contratos de infraestrutura
│   │   └── process-invoices.ts  caso de uso de processamento
│   └── infrastructure/
│       ├── xml/nfe-parser.ts     adaptação XML → domínio
│       └── security/             validação defensiva
├── components/ui/               componentes reutilizáveis
├── server/
│   ├── server.mjs               API HTTP e arquivos estáticos
│   ├── db.mjs                   SQLite e consultas preparadas
│   └── config.mjs               configuração por ambiente
├── public/                       favicon e imagem social
├── ARCHITECTURE.md               decisões arquiteturais
├── SECURITY.md                   controles e modelo de ameaças
└── README.md                     início rápido
```

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Interface | React 19 + TypeScript |
| Aplicação web | Vite 7 |
| Componentes | shadcn + Base UI |
| Estilos | Tailwind CSS |
| Parsing | DOMParser do navegador, precedido por validação defensiva |
| Backend | Node.js HTTP |
| Banco | SQLite via better-sqlite3 (WAL) |
| Deploy | Docker multi-stage |

---

## Funcionalidades implementadas

- [x] Upload múltiplo por seletor ou arrastar e soltar.
- [x] Processamento local, sem persistência de XML.
- [x] Detecção de chave duplicada.
- [x] Validação matemática do CNPJ.
- [x] Validação de formato de NCM e CFOP.
- [x] Comparação indicativa entre soma bruta dos itens e `vNF`.
- [x] Detecção de NCMs diferentes para a mesma descrição.
- [x] Sinalização da ausência de grupos CBS/IBS.
- [x] Exportação CSV compatível com Excel.
- [x] Validações contra XML malicioso e consumo excessivo de recursos.
- [x] Proteção contra CSV Injection.
- [x] Cabeçalhos de segurança do navegador.
- [x] Backend Node.js com CORS restrito e rate limiting.
- [x] SQLite em modo WAL com consultas preparadas.
- [x] Docker executado como usuário sem privilégios.
- [x] Testes automatizados de regras fiscais e segurança.

---

## Regras de segurança de upload

| Regra | Limite/ação |
|---|---|
| Quantidade por lote | até 100 arquivos |
| Tamanho por arquivo | até 5 MB |
| Volume total | até 25 MB |
| Complexidade | até 50 mil elementos |
| Formato | somente `.xml` com estrutura NF-e |
| DTD e entidades | rejeitados |

---

## Roadmap

### Fase 1 — MVP seguro

- [x] Leitura de XML e painel de inconsistências.
- [x] Arquitetura em camadas.
- [x] Documentação técnica e de segurança.
- [ ] Ampliar conjunto de XMLs sintéticos de teste.

### Fase 2 — Validação fiscal

- [ ] Validar XML contra XSD oficial por versão.
- [ ] Conferir assinatura digital e protocolo de autorização.
- [ ] Motor de regras versionado por vigência.
- [ ] Suporte a NFC-e, CT-e e NFS-e.

### Fase 3 — Produto multiusuário

- [ ] Login corporativo e MFA.
- [ ] Isolamento de dados por empresa/CNPJ.
- [ ] Armazenamento criptografado com retenção configurável.
- [ ] Trilhas de auditoria e perfis de acesso.
- [ ] Dashboard de fechamentos e responsáveis.

### Fase 4 — Integrações

- [ ] Importação automática de ERP ou caixa fiscal.
- [ ] Integração com consulta cadastral e tabelas oficiais.
- [ ] Exportação XLSX e abertura de tarefa para correção.

---

## Aviso de responsabilidade

O FiscalGuard oferece triagem automatizada. Seus resultados não representam parecer tributário e devem ser confirmados pelo profissional fiscal responsável.
