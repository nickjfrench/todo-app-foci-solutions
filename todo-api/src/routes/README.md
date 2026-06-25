# Routes

Routes folder acts as a module or feature level grouping of code. 
Similar to Hexagonal Architecture use-cases.

A route module encapsulates all the code that a given feature would need, with very deliberate cross dependency when needed.

For example, adding Users to this project would require a new model, repository interface (and implementation), and business logic. Todos would need Users as a FK, so a cross dependency is allowed but it's very intentation in it's direction.

Modules should be easy enough to separate from the monolith if required.

## Patterns for a Module

Also refer to `src/plugins/README.md` to understand how infrastructure dependencies (db pools, etc) are loaded into our app.

```
src/routes/todos/
    - index.ts 
      - acts as the Fastify plugin definition for this module
      - repo, service, and routes are registered and instantiated here
      - infra plugins are provided in constructors for DI
    - todo.routes.ts
      - route mappings to service
      - we don't define separate controllers for such a simplistic app
    - todo.repository.ts
      - each feature own's their schema
      - this file implements the repository pattern to abstract driver logic from business logic
      - this file only contains the interface definition
    - todo.sqlite.repository.ts
      - implements the repository interface to provide driver logic
    - todo.service.ts
      - business logic and rules
      - for scope of project, routes import this file as if it were a controller.
```
