# CodeGraph da Arquitetura Atual

```mermaid
flowchart TD
  app[app.ts] --> routes[routes/index.ts]

  routes --> authFactory[makeAuthModule]
  routes --> desafioFactory[makeDesafioModule]
  routes --> stravaFactory[makeStravaModule]
  routes --> usersFactory[makeUsersModule]
  routes --> taskFactory[makeTaskModule]

  authFactory --> authPlugin[makeAuthPlugin]
  authPlugin --> betterAuth[auth.handler]

  desafioFactory --> desafioRepo[DesafioRepository]
  desafioFactory --> desafioService[DesafioService]
  desafioFactory --> desafioRoutes[makeDesafioRoutes]
  desafioRepo --> prisma[(prisma)]
  desafioService --> desafioRepo
  desafioService --> cache[cacheService]
  desafioService --> storage[r2Service]
  desafioRoutes --> desafioService

  stravaFactory --> stravaRepo[StravaRepository]
  stravaFactory --> stravaService[StravaService]
  stravaFactory --> stravaRoutes[makeStravaRoutes]
  stravaRepo --> prisma
  stravaService --> stravaRepo
  stravaRoutes --> stravaService

  usersFactory --> usersRepo[UsersRepository]
  usersFactory --> usersService[UsersService]
  usersFactory --> usersRoutes[makeUsersRoutes]
  usersRepo --> prisma
  usersService --> usersRepo
  usersService --> cache
  usersService --> storage
  usersRoutes --> usersService

  taskFactory --> taskRepo[TaskRepository]
  taskFactory --> taskService[TaskService]
  taskFactory --> taskRoutes[makeTaskRoutes]
  taskRepo --> prisma
  taskService --> taskRepo
  taskService --> cache
  taskService --> domain[domain/challenge-progress]
  taskRoutes --> taskService

  classDef entry fill:#1f2937,color:#fff,stroke:#111827;
  classDef factory fill:#dbeafe,stroke:#2563eb,color:#111827;
  classDef route fill:#dcfce7,stroke:#16a34a,color:#111827;
  classDef service fill:#fef3c7,stroke:#d97706,color:#111827;
  classDef repo fill:#fee2e2,stroke:#dc2626,color:#111827;
  classDef infra fill:#ede9fe,stroke:#7c3aed,color:#111827;
  classDef domain fill:#fce7f3,stroke:#db2777,color:#111827;

  class app,routes entry;
  class authFactory,desafioFactory,stravaFactory,usersFactory,taskFactory factory;
  class desafioRoutes,stravaRoutes,usersRoutes,taskRoutes,authPlugin route;
  class desafioService,stravaService,usersService,taskService service;
  class desafioRepo,stravaRepo,usersRepo,taskRepo repo;
  class prisma,cache,storage,betterAuth infra;
  class domain domain;
```

## Leitura

- `routes/index.ts` eh o composition root dos modulos.
- Cada `make*Module` instancia as dependencias concretas do modulo.
- As rotas recebem o service pronto e registram via `.decorate()`.
- Services concentram regra/orquestracao.
- Repositories encapsulam Prisma.
- `task` eh o unico modulo com `domain/`, porque tem regra pura reutilizavel.
