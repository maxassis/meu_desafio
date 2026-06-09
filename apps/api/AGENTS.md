# AGENTS

## Escopo

Regras operacionais para mudanças em `apps/api`. Convenções de arquitetura ficam em `architecture-guidelines.md`.

## Prioridade

1. Pedido do usuário
2. Este arquivo
3. `architecture-guidelines.md`

## Como Trabalhar

- Entenda o código antes de alterar.
- Faça mudanças pequenas e diretamente ligadas ao pedido.
- Não refatore código adjacente sem necessidade.
- Preserve endpoints, contratos e comportamento existente, salvo pedido explícito.
- Remova apenas código morto criado pela própria mudança; mencione código morto preexistente.
- Se houver ambiguidade relevante, pergunte antes de implementar.

## Verificação

- Para mudanças de código, rode verificação aplicável: `bunx tsc --noEmit`, `bun run lint` ou testes existentes.
- Se não for possível verificar, informe o motivo.
