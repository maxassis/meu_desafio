# Arquitetura do Projeto

Este projeto usa Bun + Elysia com uma arquitetura modular por dominio.
O padrao atual combina `routes`, `factory`, `service`, `repository`, `domain` e `schema`.

O modulo `task` deve ser usado como referencia para novos modulos e migracoes futuras.

## Objetivo

Manter uma base facil de entender, testar e evoluir, evitando abstracoes prematuras.

## Principios

- Preferir mudancas pequenas e diretas
- Organizar por modulo ou dominio
- Manter handlers finos
- Colocar regra de negocio em `service`
- Usar `factory` para compor dependencias do modulo
- Usar `decorate` do Elysia para disponibilizar services nas rotas
- Usar `repository` para acesso a banco ou integracoes externas relevantes
- Usar `domain` para regras puras e reutilizaveis
- Evitar containers formais de DI sem necessidade, como Inversify ou tsyringe
- Evitar estruturas globais por tipo para o projeto inteiro

## Estrutura Base

```txt
src/
  app.ts
  server.ts
  modules/
    <modulo>/
      <modulo>.routes.ts
      <modulo>.factory.ts
      <modulo>.service.ts
      repositories/
        <modulo>.repository.ts
      domain/
      schema/
  shared/
    config/
    db/
    errors/
    utils/
```

Nem todo modulo precisa ter `repositories/` ou `domain/` desde o inicio.
Crie essas pastas quando houver necessidade real.

## Fluxo Padrao

```txt
routes -> service -> repository -> prisma
             |
             -> domain
```

## Responsabilidades

### `app.ts`

- Compor a aplicacao
- Registrar plugins e rotas

### `server.ts`

- Subir o servidor
- Definir porta e bootstrap

### `modules/<modulo>/<modulo>.routes.ts`

- Definir endpoints
- Receber `params`, `query` e `body`
- Obter sessao/autenticacao quando necessario
- Chamar o `service` injetado via `decorate`
- Nao conter regra de negocio complexa
- Nao acessar banco diretamente
- Nao instanciar dependencias

Exemplo:

```ts
export function makeTaskRoutes(taskService: TaskService) {
  return new Elysia({ prefix: '/tasks' })
    .decorate('taskService', taskService)
    .post('/create', async ({ body, request, taskService }) => {
      const session = await getRequiredSession(request)

      return taskService.create(body, session.user.id)
    })
}
```

### `modules/<modulo>/<modulo>.factory.ts`

- Compor dependencias especificas do modulo
- Instanciar repositories e services do modulo
- Receber ou importar dependencias compartilhadas, como `prisma` e `cacheService`
- Retornar as rotas do modulo
- Ser o ponto de injecao manual de dependencias

Exemplo:

```ts
export function makeTaskModule() {
  const taskRepository = new TaskRepository(prisma)
  const taskService = new TaskService(taskRepository, cacheService)

  return makeTaskRoutes(taskService)
}
```

### `modules/<modulo>/<modulo>.service.ts`

- Conter regra de negocio
- Orquestrar chamadas a repository, domain, cache e integracoes
- Lancar erros de dominio/aplicacao
- Permanecer independente da camada HTTP sempre que possivel
- Nao receber `request`, `params`, `query` ou objetos do Elysia
- Nao importar `Elysia`

Exemplo:

```ts
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly cache: CacheService,
  ) {}

  async create(input: CreateTaskInput, userId: string) {
    // regra e orquestracao do caso de uso
  }
}
```

### `modules/<modulo>/repositories/<modulo>.repository.ts`

- Encapsular acesso ao banco
- Encapsular queries Prisma do modulo
- Expor metodos com nomes de negocio
- Nao conter regra de negocio complexa
- Nao acessar HTTP, cache ou contexto do Elysia
- Receber `prisma` por construtor

Exemplo:

```ts
export class TaskRepository {
  constructor(private readonly db: PrismaClient) {}

  findUserTask(taskId: number, userId: string) {
    return this.db.task.findFirst({
      where: { id: taskId, userId },
    })
  }
}
```

### `modules/<modulo>/domain/*.ts`

- Conter regras puras do dominio
- Nao acessar banco, cache, HTTP, env ou integracoes externas
- Ser facil de testar sem mocks
- Criar somente quando houver regra reutilizavel ou suficientemente importante

Exemplo:

```ts
export function calculateChallengeProgress(totalDistance: number, challengeDistance: number) {
  const completed = totalDistance >= challengeDistance
  const progress = completed ? challengeDistance : totalDistance

  return { completed, progress }
}
```

### `modules/<modulo>/schema/*.schema.ts`

Criar quando houver validacao de entrada e saida.
Usar para:

- `body`
- `params`
- `query`
- `response`

Preferir validacao com Zod em schemas separados.
Evitar criar novas validacoes inline na rota com `t.Object`, `t.Union` ou similares do Elysia.
Em codigo legado que ja usa validacao inline, migrar para Zod somente quando a rota for alterada por necessidade real.
As rotas devem fazer parse com schema e delegar a regra de negocio para o `service`.

### `modules/<modulo>/services/*.service.ts`

Padrao legado. Evitar em codigo novo.

Ao alterar um modulo legado, preferir migrar gradualmente para:

```txt
<modulo>.factory.ts
<modulo>.service.ts
repositories/
domain/
```

Services em pasta `services/` podem continuar existindo enquanto o modulo nao for migrado.

### `modules/<modulo>/services/*repository*.ts`

Padrao legado. Evitar em codigo novo.
Repositories novos devem ficar em `repositories/<modulo>.repository.ts`.

## Injecao de Dependencia

Usar injecao manual por factory e `decorate` do Elysia.

Padrao:

```txt
factory cria dependencias -> routes registra via decorate -> handlers usam pelo contexto
```

Preferir:

```ts
new Elysia().decorate('taskService', taskService)
```

Evitar:

- instanciar service dentro do handler
- importar repository direto na rota
- usar containers formais de DI sem necessidade
- decorar varias dependencias quando um service de modulo resolve

Dependencias compartilhadas como `prisma` e `cacheService` devem continuar como singletons nos seus modulos de infraestrutura.
Dependencias especificas do dominio, como `TaskRepository` e `TaskService`, devem ser instanciadas na factory do modulo.

## `shared/`

Codigo transversal reutilizavel:

- `config/`: variaveis de ambiente e configuracao
- `db/`: conexao com banco, Prisma, helpers de persistencia
- `errors/`: erros padronizados
- `utils/`: helpers genericos

## Convencoes

- Cada modulo deve ficar isolado na propria pasta
- Nomes de arquivos devem seguir o padrao `<modulo>.<papel>.ts` ou o padrao ja estabelecido no modulo
- Nao colocar regra de negocio direto em rotas
- Nao acessar banco diretamente da rota
- Nao acessar banco diretamente no service se existir repository para o modulo
- Preferir Zod para validacao de entrada e saida
- Manter schemas em arquivos separados e reutilizaveis
- Nao criar abstracoes genericas sem necessidade real
- Preferir imports diretos entre arquivos enquanto o projeto for pequeno ou medio

## Escalabilidade

Quando o projeto crescer, evoluir nesta ordem:

1. Adicionar ou consolidar schemas em `schema/` por modulo
2. Criar `<modulo>.factory.ts` e `<modulo>.service.ts`
3. Adicionar `repository` onde houver persistencia relevante
4. Extrair regras puras para `domain/`
5. Criar `shared/config`
6. Criar tratamento global de erros
7. Adicionar testes por modulo

## Banco de Dados

Se usar Prisma:

- manter client compartilhado em `src/shared/db/prisma.ts`
- usar Prisma via `repository` em modulos novos ou migrados
- permitir Prisma direto no `service` apenas em codigo legado ou casos muito simples
- evitar espalhar acesso ao banco em multiplas camadas

## O Que Evitar

- Arquitetura complexa demais cedo demais
- Injecao de dependencia formal sem necessidade
- Pastas globais por tipo para o projeto inteiro
- Rotas gigantes
- Services que conhecem detalhes HTTP
- Repositories sem necessidade real
- Use cases separados por endpoint sem necessidade clara
- Decorar varias dependencias quando um service de modulo resolve

## Exemplo de Modulo

```txt
modules/task/
  task.routes.ts
  task.factory.ts
  task.service.ts
  repositories/
    task.repository.ts
  domain/
    challenge-progress.ts
  schema/
```

## Regra de Decisao

Se houver duvida entre duas abordagens corretas:

- escolher a mais simples
- escolher a que adiciona menos arquivos
- escolher a que preserva a clareza do modulo
