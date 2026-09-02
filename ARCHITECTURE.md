# Arquitetura do FiscalGuard

## Objetivos

- Manter regras fiscais independentes da interface e do parser XML.
- Tornar integrações substituíveis por contratos explícitos.
- Processar dados fiscais no dispositivo durante o MVP.
- Validar entradas antes que alcancem regras de negócio.

## Camadas

```text
Presentation (React + Vite)
          |
          v
Application (processInvoiceFiles + ports)
       /     \
      v       v
Domain      Infrastructure
(policies)  (XML parser + security policy)
```

### Domain

`src/domain/fiscal.ts` contém as entidades `Invoice`, `FiscalProduct` e `Finding`. `src/domain/policies.ts` contém regras determinísticas: CNPJ, duplicidade, totalização, NCM, CFOP e consistência cadastral.

Não depende de React, DOMParser, rede ou armazenamento.

### Application

`src/application/process-invoices.ts` coordena o fluxo de leitura. `ports.ts` define os contratos `InvoiceParser` e `FileSecurityPolicy`, seguindo inversão de dependência.

### Infrastructure

`BrowserNfeParser` traduz o XML para entidades do domínio. `SecureXmlFilePolicy` rejeita lotes e conteúdos fora dos limites de segurança. Uma futura API poderá implementar as mesmas portas sem alterar o domínio.

### Presentation

`app/page.tsx` mantém apenas estado de tela, upload, feedback e exportação. Textos provenientes do XML são renderizados pelo React, que faz escape por padrão; não é utilizado `dangerouslySetInnerHTML`.

## Fluxo principal

1. Usuário seleciona arquivos.
2. A política de segurança valida quantidade, extensão e volume.
3. Cada conteúdo é inspecionado antes do parsing.
4. O parser cria entidades normalizadas.
5. O domínio executa regras fiscais.
6. A interface apresenta achados e pode gerar CSV protegido.

## Decisões

- **Processamento local:** reduz exposição de documentos fiscais na fase inicial.
- **Sem persistência:** recarregar a página elimina os dados analisados.
- **Regras explicáveis:** cada achado contém causa e próximo passo.
- **Dependências direcionadas para dentro:** infraestrutura depende dos contratos e entidades; o domínio não conhece infraestrutura.

## Evolução planejada

Uma versão multiusuário exigirá backend separado, autenticação forte, autorização por empresa, armazenamento criptografado, trilha de auditoria, retenção configurável e processamento assíncrono isolado.

## Backend operacional

O servidor Node.js em `server/` entrega o build do frontend e expõe uma API mínima. O SQLite registra somente metadados de auditoria; o conteúdo dos XMLs permanece no navegador. A autenticação Entra ID está preparada no frontend, mas deve ser ativada em conjunto com validação JWT no backend antes de proteger rotas reais.
