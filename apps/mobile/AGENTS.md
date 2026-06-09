# AGENTS

## Escopo

Regras operacionais para mudanças em `apps/mobile`.

## Regras

- Use `services/api-client.ts` e services por domínio; evite URLs hardcoded.
- Use tipos de `@types/*.d.ts` em queries e mutations.
- Padronize mensagens de erro com `getErrorMessage` quando aplicável.
- Evite logs sensíveis em produção.
- Não recrie `utils/api-service.ts`.

## Autenticação

- Use o client oficial do Better Auth (`authClient`) para login, sessão e logout.
- Use `authClient.getSession()` como fonte primária de autenticação.
- Não implemente endpoints custom de auth quando houver método oficial no client.
