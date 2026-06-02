# AGENTS

## Visao geral
- Objetivo: apoiar manutencao e evolucao do app mantendo consistencia de API, tipagens e UI.
- Padrao preferido: services por dominio + api client unico.

## Estrutura de requisicoes
- Client: `services/api-client.ts` com baseURL do Expo e interceptor de sessao/cookie.
- Servicos:
  - `services/desafios-service.ts`
  - `services/users-service.ts`
  - (expandir para auth/tasks/payments/config quando necessario)
- Tipagens por endpoint em `@types/*.d.ts`.

## Regras
- Evitar URLs hardcoded; sempre usar o client ou services.
- Padronizar erros com helper (`getErrorMessage`).
- Usar tipos de `@types` em queries/mutations.
- Evitar logs sensiveis em producao.

## Autenticacao (Better Auth)
- Sempre usar o client oficial do Better Auth (`authClient`) para todo fluxo de autenticacao.
- Nao implementar login/logout/sessao com endpoints custom quando existir metodo oficial no client.
- Padrao obrigatorio:
  - Login email/senha: `authClient.signIn.email(...)`
  - Login social: `authClient.signIn.social(...)`
  - Sessao atual: `authClient.getSession()`
  - Logout: `authClient.signOut()`
- Evitar validacao manual de cookie/token como fonte primaria; usar `getSession()` como verdade de autenticacao.

## Convencoes de arquivos
- Requisicoes: `services/<dominio>-service.ts`.
- Tipos: `@types/<endpoint>.d.ts`.
- Não usar `utils/api-service.ts` (removido); importar direto dos services.
