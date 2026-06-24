# SPEC for Todo App

I've chosen a RESTful HTTP server over SPA application for the following reasons:

- SPA would force me to focus too much on visuals and persistence.
- With the recommended time limit, my skills are better demonstrated in backend architecture.
- Testing is a little easier with a backend API.
- Best demonstrates my architectural skills.

## Decisions

I spent the first 2 hours reviewing the scope, researching best practices for modern JS, and really defining my needs before any code was written. I have captured my decisions below, a final spec will be included in the README on submission.

### Architecture

- Fastify for backend API - modern, TS native, integrated schema validation, easy testing, but most importantly an **industry proven framework with an excellent ecosystem.**
  - Alternatives could have been:
    - Express: Not the modern approach. TS integration is not native. Too much time spent recreating simple HTTP patterns.
    - Hono: Good choice but not as well known. Also built for runtime-agosticism (easily run outside of Node), which is not a requirement for this challenge. NodeJS is also explicitly mentioned in challenge.
    - NestJS: Better for enterprise apps, but too overkill for the scope and timeframe of this project.
- DDD-lite Architecture with Fastify's plugin system — clear separation between infrastructure wiring and business logic.
  - `src/plugins/` — thin wiring layer only. Each plugin imports a service from a module and decorates it onto the Fastify instance. Uses `fastify-plugin` with `dependencies` to declare ordering (e.g. `todos.plugin.ts` depends on `db.ts`). Zero business logic here.
  - `src/routes/{feature}/` — all business logic lives here. Each module owns its service, routes, repository interface, and repository implementations. E.g. `src/routes/todos/` contains `todos.service.ts`, `todos.routes.ts`, `todos.repository.ts`, `todos.sqlite.repository.ts`, and `index.ts`.
  - Each module's `index.ts` is a Fastify plugin that registers its routes and pulls its service from the Fastify instance (decorated by the plugin layer). `@fastify/autoload` loads only `index.ts` files via `ignorePattern`.
  - Repository pattern with explicit interfaces (ports) and pluggable implementations (adapters) — swap SQLite for any DB later without touching business logic.
  - Fastify's `dependencies` option on `fastify-plugin` provides a lightweight DAG for plugin ordering — no manual DI container needed.
- Deployable by a simple `Dockerfile` and `docker-compose.yml` so the testers can easily spin up the architecture.
  - Data volume to preserve DB state.
- Typescript first approach, which aligns with Fastify over Express.

### Testing Strategy

- DI via Repository Pattern allows for mocked data store.
- Vitest for modern testing and speed.
- Core integration tests to be written early for a red-green TDD approach.
- Integration testing the API routes, instead of 100s of unit tests.
  - However, still unit testing for any high risk functions.
  - Allows for quicker tests and iteration.

### Repository Layer

- Interface that the sqlite-based store implements.
- Provides the CRUD interactions needed for this application.
- Implement atomic transactions to prevent race conditions and easy rollback on errors.
- SQLite instead of JSON file just to overcome issues with race conditions and messy schemas, etc.
  - Use better-sqlite3 for DB driver.
- No migrations because it's overkill for an app that is very unlikely to change in scope.
  - If scope expands in future, it would be very easy to add the first migration and mock it's completed state in migration meta (like SequelizeMeta if Sequelize was used).
  - Instead setup DB schema in via a runSchemaUpdates function on app startup with CREATE IF NOT EXISTS

### Error Handling

- Fastify catches both synchronous throws and async rejects in route handlers automatically, routing them to its error handler.
- Throw `fastify.httpErrors.<method>(message)` in service/handler code — these are `http-errors` instances that carry the correct status code and are serialized by Fastify's default error handler as `{ error, message, statusCode }`.
- `reply.notFound()` / `reply.badRequest()` for inline responses. `throw fastify.httpErrors.notFound('message')` for service-layer throws.
- `fastify.httpErrors` is decorated onto the instance by `@fastify/sensible` — access it through the Fastify instance, never import directly from the module.
- Custom global `setErrorHandler` is NOT needed — Fastify's default + `@fastify/sensible` gives us the shape we want out of the box.
- Zod validation errors (via `fastify-type-provider-zod`) return 400 automatically — no custom handling needed.
- `parseId()` from `src/utils/id.ts` throws a plain `Error` — utilities stay framework-agnostic. Route handlers catch this and convert to `fastify.httpErrors.badRequest(...)` via the plugin-decorated `httpErrors` instance, returning a 400 to the client.

### RESTful Design

- Return the JSON objects directly, don't wrap.
- Errors to be returned via Fastify's default error handler pattern (`{ error, message, statusCode }`).
- Input validation on all requests.
  - Use Zod for the request validation via `fastify-type-provider-zod`.
  - Zod provider handles response serialization automatically.

## Design

Well architected TODO app with basic CRUD functionality. Running on Fastify with a SQLite persistence layer.

### Model

Zod first approach to standardize the types across the stack.

Due to the low risk nature of this app and the lack of any PII. There will be no DTO layer isolating business models from boundary types.

Model Name: todos

Fields:

- id - uuid auto with prefix `todo-` - helps future log reading to know what a UUID belongs to.
  - generated by a TS model constructor, using a shared generateUuid wrapper - not via SQL
- title - text - required
- description - text - default null
- dueDate - date - default null
- isCompleted - bool - default false
- completedOn - date - default null
- createdAt - date - auto NOW

### Routes

- POST /todos - create new to-do - returns full body of created todo
- GET /todos - get all to-do - include all fields
- GET /todos?completed=false&orderBy=dueDate&orderDir=asc - query param support for list filtering
- GET /todos?page=1&limit=10 - pagination for list filtering - simple pagination chosen over cursor pagination just to simplify things
- GET /todos/{todos.id} - get one to-do
- PATCH /todos/{todos.id} - update one to-do, overwriting only fields specified - completed/incompleted via this route, saves on writing extra code.
- DELETE /todos/{todos.id} - delete on to-do

### Docker

- Dockerfile for running application in prod.
- Use node lts alpine image for lightweight.
- Name dockerfile stages so caching works correctly. `FROM node:lts-alpine AS build` and `FROM build AS worker`.
- Docker compose script to mount volume and easy startup.

## Plan

1. Scaffolding and Project Setup
- New TS project
- Docker
- Vitest
- Env.ts and other infra setup
- id.ts for typed UUIDs

2. Repo Interface - no DB

3. Integration Tests
- Red light

4. DB and SQLite Repo impl

5. Service and Biz logic

6. Module wiring - tests go green

7. Project Retro and README write up
