# Todo API for Foci Solutions Job Application

Todo App submission for Foci Solutions job application.

I chose to implement an API Server in TypeScript.

I also implemented filtering, sorting, pagination, input validation, response serialization, and docker containerization for prod, dev, and testing.

Architecture and decisions made are listed below the Run Code section.

## LLM Disclaimer

AI was used for some idea bouncing, troubleshooting, and implementation, but I was using Local LLM models that were very limited in their capabilities. This was not a one shot thing with Opus.

You can see via my commits and PRs that I take a very deliberate approach to how I involve AI. My workflow is as follows:

1. SPEC.md hand written with all of my requirements, architectural decisions, and notes for it to follow.
2. Pass SPEC into AI and iterate further with it to flesh out things I missed.
3. Second pass to ensure AI discussion aligns with project needs and my expectations.
4. Split SPEC into phases for AI to approach things. These were:
   a. Infra and Project Scaffolding
   b. Model and Repo Pattern
   c. Integration tests - all red
   d. Logic and wiring
   e. Iterate with more manual involvement till all green - limit AI here so it doesn't cheat tests.
5. After each stage, I opened a PR and reviewed all code. Making comments as I read. Then iterated with some AI and some manual till I was happy. I also control the git commits so I can read at each point to make sure I agree before bloating git history.
6. Merge and iterate.

## Routes

Server runs on port `3000`. Follows proper RESTful requirements.

```
GET /todos - list all todos
- supports optional query params:
  - completed=true/false
  - orderBy=dueDate|createdAt|title
  - orderDir=asc/desc
  - page=1 - page number (default: 1)
  - limit=10 - max results per page (default: 100, max: 100)
  
GET /todos/{id}

POST /todos - returns full model
{
    "title": "Name of todo",
    "description": "optional",
    "dueDate": "optional - iso datetime"
}

PATCH /todos/{id} - returns full model
{
    "title": "updated title",
    "description": "updated description",
    "dueDate": "updated iso datetime",
    "isCompleted": true
}

DELETE /todos/{id}
```

## Tests

I focused on integration tests over unit testing just for speed and quick tests for main functionality.

All CRUD functionality, sorting, filtering, and basic input validation are defined.

`todo-api/test/routes/todos/todos.integration.test.ts`.

I also wrote test cases for the basic InMemoryStore implementation.

`todo-api/test/infrastructure/in-memory-store.test.ts`

Run via Makefile or docker compose (see below) from project root.

```
make test
```

## Run Code

### Envs

`todo-api/src/config/env.ts` defines production defaults so setting up `.env.example` is not needed.

However, if you want to change anything, then copy `.env.example` to `.env` and change values. This file is loaded via docker-compose. 

### Docker

Dockerfile and docker-compose is setup for dev and production via a Dockerfile build targets and docker-compose overrides.

#### Using Make

A Makefile was created for ergonomics. Use the following commands if `make` is installed on your machine. Otherwise, run them directly (see next section).

```bash
# start prod
make up

# start dev
make dev

# run tests
make test
```

#### Without Make

```bash
# run prod
docker compose up

# run dev
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# run test
docker compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit
```

## Architecture and Decisions

### Assumptions

I made several assumptions, primarily to justify a slightly overkill architecture.

- I went with the assumption that in the real world this project would most likely grow beyond the simple Todo feature (such as DBs, user access, etc.) and spent a little extra time to build an architecture that would support additional features easily without refactor. 
  - The project ask also outlined good architecture, testing, and code quality, which hints at the fact you expect a slightly overengineered solution. Within reason of course.
- I assumed that the stakeholders would prefer something that was more modern and built natively with TypeScript, instead of bolted on like Express.
- I assumed that industry provability was also important to stakeholders, therefore chose a framework that was still well recognized. Instead of something more obscure like `Hono`. This would make it easier to hire talent too.
- I also assumed that the stakeholders were not enterprise (not really something an enterprise would ask for) and therefore stayed away from C# or Java, which would have typically meant more boilerplate and setup.

### Architecture

I chose an architecture that pulls the good parts of Hexagonal architecture into something better suiting this project's scope and time constraints. The core ideas I adopted:

- Usecase/feature grouping of logic. 
- Repository pattern to abstract the data access logic from business logic.
- Directional control of data. Service sits on top of Model, rather than putting CRUD actions directly onto the model itself and interacting with that everywhere (similar to how people use Sequelize ORM).

I then combined this with best practices for Fastify, primarily their plugin concept. 

This plugin system provides a way to encapsulate code and ensure dependencies are very deliberate. Infrastructure dependencies were attached to our `todo.service` via constructor-based Dependency Injection, allowing features to share connection pools, atomicity locks, and queue in the future.

### Persistence 

- Repository pattern used for persistence layer with a factory pattern to automatically setup correct method based on the env `PERSISTENCE_METHOD`.
- Only an in-memory method was implemented.
  - This means that server restarts will wipe DB.
- Sqlite was planned but due to time constraints, I cut it from scope.
  - Adding would mean defining a new plugin, implementing todo repo for sqlite, and installing `better-sqlite3` as the driver.

## Retrospective and Next Steps

This project took longer than expected, but I would not compromise on this architecture design if I was to repeat this process. I believe it best demonstrates my architecture and design skills, as well as my careful approach to ensure things were defined well before we hit spaghetti code.

### Challenges

I hit several snags that resulted in longer completion time than expected.

- I went with Fastify + TypeScript as TS was mentioned in the interview for upcoming projects and Fastify is a more modern solution compared to Express. However, I have more experience in Express and would have had less issues if I wanted to stay in TS/JS.
  - I would only choose Express if: a) legacy requirements or b) larger complex app needs a more custom architecture (express is basically completely unopinionated).
  - If I was picking again, I would choose FastAPI via Python. I am much more familiar with that framework for simple APIs.
- Fastify's plugin autoload for /routes and /plugins was also causing me a bunch of issues with TS when building to /dist. Routes in sub-folders were basically getting ignored. So I removed it completely, and went with a declarative approach.
- Fought with Fastify's Zod type provider. Their built-in `@fastify/type-provider-zod` has a bug with latest major version of Zod. Had to switch to third part `fastify-type-provider-zod`.

### Next Steps (if we were to continue)

- Implement SQLite or Supabase to test SQL functionality.
  - Easy enough to do with the existing Repository pattern separation.
- Integrate a Note/Doc feature to attach to Todos. Useful for brainstorming and fleshing out the todo.
  - Features are encapsulated into their own Fastify plugins under /routes, it would just be a matter of defining a new module, implementing the Repository pattern, and setting up directional dependencies. Note/Doc feature would depend on a Todo interface or something similar.

