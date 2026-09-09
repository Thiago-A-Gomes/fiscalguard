# Autenticação do FiscalGuard

## Componentes

- `server/auth.mjs`: valida senha, cria/revoga sessões, interpreta o cookie e valida CSRF.
- `server/db.mjs`: mantém usuários, hashes de sessão e eventos de auditoria.
- `server/server.mjs`: expõe login, sessão atual, logout e exige autenticação nas rotas de auditoria.
- `app/page.tsx`: apresenta o login e mantém somente o token CSRF em memória.

## Configuração inicial

1. Gere um hash, sem gravar a senha no repositório:

   ```bash
   npm run hash-password -- "uma-senha-longa-com-12-ou-mais-caracteres"
   ```

2. Copie `.env.example` para `.env`.
3. Defina `ADMIN_EMAIL` e cole o resultado em `ADMIN_PASSWORD_HASH`.
4. Em produção, use HTTPS e mantenha `NODE_ENV=production`.

## Fluxo

1. O navegador envia e-mail e senha para `POST /api/auth/login`.
2. O servidor busca o usuário e compara a senha com o hash scrypt usando comparação resistente a timing.
3. Em caso de sucesso, é criado um token aleatório de 256 bits.
4. Somente o SHA-256 do token é persistido no SQLite.
5. O token original é devolvido em cookie `HttpOnly; SameSite=Strict`; em produção recebe também `Secure`.
6. `GET /api/auth/me` restaura a identidade e entrega o token CSRF.
7. Operações POST protegidas exigem a sessão e o cabeçalho `X-CSRF-Token`.
8. O logout revoga a sessão no banco e expira o cookie.

## Rotas

| Método | Rota | Proteção |
|---|---|---|
| GET | `/api/health` | Pública, sem dados sensíveis |
| POST | `/api/auth/login` | Origem permitida + rate limit |
| GET | `/api/auth/me` | Sessão |
| POST | `/api/auth/logout` | Sessão + CSRF |
| GET | `/api/audit` | Sessão |
| POST | `/api/audit` | Sessão + CSRF |

## Credenciais e tokens

- Senhas não são armazenadas: somente hashes `scrypt` com salt aleatório.
- O arquivo `.env` é ignorado pelo Git.
- Tokens de sessão não são gravados em texto puro.
- O cookie de sessão não pode ser lido pelo JavaScript.
- Sessões expiram entre 1 e 24 horas, configuradas por `SESSION_TTL_HOURS`.
- Eventos de auditoria registram o usuário autenticado, mas nunca senha, token ou conteúdo integral do XML.
