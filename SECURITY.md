# Segurança do FiscalGuard

## Escopo atual

O MVP exige login e utiliza SQLite para usuários, sessões e metadados de auditoria. Os XMLs continuam sendo lidos somente na memória do navegador e não são enviados pelo código da aplicação. Isso reduz a exposição dos documentos, mas não elimina riscos do dispositivo ou de dependências comprometidas.

## Modelo de ameaças

| Ameaça | Consequência | Controle atual |
|---|---|---|
| XML com DTD/entidade externa (XXE) | leitura indevida ou expansão de entidades | rejeição explícita de `DOCTYPE` e `ENTITY` antes do parser |
| XML excessivamente grande/complexo | travamento e consumo de memória | 5 MB por arquivo, 25 MB por lote, 100 arquivos e 50 mil elementos |
| Arquivo disfarçado | conteúdo inesperado | extensão XML e estrutura `NFe`/`nfeProc` obrigatórias |
| Fórmula em célula CSV | execução de fórmula ao abrir no Excel | prefixo seguro para valores iniciados por `=`, `+`, `-` ou `@` |
| Conteúdo HTML/script no XML | XSS | renderização textual via React; sem HTML dinâmico |
| Site incorporado por atacante | clickjacking | política `frame-ancestors 'none'` e `X-Frame-Options: DENY` |
| Carregamento de recursos não autorizados | exfiltração/XSS | Content Security Policy restritiva |
| Vazamento por cabeçalho Referer | exposição de URL | `Referrer-Policy: no-referrer` |

## Controles implementados

- Validação antes do parsing em `src/infrastructure/security/file-security.ts`.
- Limites centralizados em `FILE_LIMITS`.
- Rejeição de DTD e declaração de entidades.
- Limite de comprimento nos campos textuais exibidos.
- Proteção contra CSV Injection.
- Cabeçalhos CSP, `nosniff`, anti-frame, política de referer e permissões do navegador.
- Cookie de sessão `HttpOnly`, `SameSite=Strict` e `Secure` em produção; somente hashes de tokens são persistidos.
- Senhas protegidas com `scrypt` e salt aleatório; CSRF obrigatório nas operações de escrita.
- Nenhum segredo, senha, token fiscal ou credencial embutido no frontend.
- API com limite de 16 KB por corpo JSON, rate limiting e CORS por allowlist.
- SQLite com consultas parametrizadas e restrições de integridade.
- Container executado sem privilégios administrativos.

## Limitações importantes

- A validação de estrutura ainda não usa o XSD oficial da NF-e.
- A assinatura digital da NF-e ainda não é verificada.
- O login atual é adequado ao acesso administrativo inicial, mas uma oferta multiempresa ainda exige MFA, recuperação de conta e autorização por tenant/CNPJ.
- O total dos itens é uma triagem simples; descontos, frete e tributos podem justificar diferenças.
- Controles do navegador não substituem antivírus nem isolamento de arquivos.

## Requisitos antes de armazenar XMLs

1. Adicionar MFA, recuperação segura de conta e política contra tentativas distribuídas.
2. Implementar autorização por tenant/CNPJ com negação por padrão.
3. Criptografia em trânsito e em repouso; chaves fora do código.
4. Antivírus e parser isolado, sem acesso à rede.
5. Rate limiting, limites no servidor e filas com timeout.
6. Logs de auditoria sem conteúdo integral de XML ou dados pessoais desnecessários.
7. Política de retenção e exclusão compatível com LGPD.
8. Backup criptografado e testes de restauração.
9. SAST, auditoria de dependências e revisão de permissões no CI.
10. Teste de invasão antes da disponibilização externa.

## Comunicação de vulnerabilidades

Não publique XMLs reais, chaves de acesso, certificados ou credenciais em issues. Registre a falha por canal privado e inclua apenas dados sintéticos para reprodução.
