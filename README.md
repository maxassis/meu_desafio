# Meu Desafio Monorepo

Monorepo com backend Elysia/Bun e app mobile Expo.

## Estrutura

```txt
apps/api     Backend Elysia/Bun
apps/mobile  App mobile Expo
```

## Comandos

```bash
bun install
bun run db:up
bun run prisma:migrate
bun run dev:api
bun run dev:mobile
```

Eden ainda nao foi adicionado. A migracao inicial apenas organiza os projetos em workspaces.
