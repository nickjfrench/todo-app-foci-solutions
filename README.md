# To-Do API for Foci Solutions Job Application

To-Do App submission for Foci Solutions job application.

I chose to implement an API Server in TypeScript.

I also implemented filtering, sorting, pagination, input validation, response serialization, and docker containerization for production, development, and testing.

Architecture and decisions made are listed below the Run Code section.

## Tech Stack

- `TypeScript` as the programming language.
- `Fastify` as the API framework.
- `Zod` for input validation and schema serialization.
- `Vitest` as the test framework.

## LLM Disclaimer

AI was used for some idea bouncing, troubleshooting, and implementation, but I was using Local LLM models that were very limited in their capabilities. This was not a one shot thing with Opus.

You can see via my commits and PRs that I take a very deliberate approach to how I involve AI. My workflow is as follows:

1. SPEC.md hand written with all of my requirements, architectural decisions, and notes for it to follow.
2. Pass SPEC into AI and iterate further with it to flesh out things I missed.
3. Second pass to ensure AI discussion aligns with project needs and my expectations.
4. Split SPEC into phases for AI to approach things. These were:
   a. Infrastructure and project scaffolding
   b. Model and repo pattern
   c. Integration tests - all red
   d. Logic and wiring
   e. Iterate with more manual involvement till all green - limitted AI here so it doesn't cheat tests.
5. After each stage, I opened a PR and reviewed all the code, while writing comments. Then, I iterated with the help of AI, until I was happy. I also controlled the git commits so I could review at each step, so that I wasn't overinflating the commit history.

## Routes

Server runs on port `3000` with no auth. Follows proper RESTful requirements.

```
GET /todos - list all To-Do's
- supports optional query params:
  - completed=true/false
  - orderBy=dueDate|createdAt|title
  - orderDir=asc|desc
  - page=1 - page number (default: 1)
  - limit=10 - max results per page (default: 100, max: 100)
  
GET /todos/{id} - list a single To-Do

POST /todos - returns full model
Request Body: {
    "title": "Name of To-Do - required",
    "description": "optional",
    "dueDate": "optional - iso datetime"
}

PATCH /todos/{id} - returns full model
Request Body: {
    "title": "updated title",
    "description": "updated description",
    "dueDate": "updated iso datetime",
    "isCompleted": true
}

DELETE /todos/{id}
```

## Tests

For speed and to allow for quicker iteration, I focused on integration tests over unit testing.

All CRUD functionality, sorting, filtering, and basic input validation are defined here:

`todo-api/test/routes/todos/todos.integration.test.ts`.

I also wrote test cases for the basic InMemoryStore implementation, defined here:

`todo-api/test/infrastructure/in-memory-store.test.ts`

Run tests via Makefile or docker compose (see below) from project root.

```
make test
```

## Run Server

### Envs

`todo-api/src/config/env.ts` defines production defaults so setting up `.env.example` is not needed.

However, if you want to change anything, then copy `.env.example` to `.env` and change values. This file is loaded via docker-compose. 

### Docker

Dockerfile and docker-compose is setup for development and production via a Dockerfile build targets and docker-compose overrides.

#### Using Make

A Makefile was created for ergonomics. Use the following commands, if `make` is installed on your machine. Otherwise, run them directly (see next section).

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

- I went with the assumption that in the real world this project would most likely grow beyond the simple "To-Do feature" (such as DBs, user access, etc.) and spent a little extra time to build an architecture that would support additional features easily without refactor. 
  - The project ask also outlined good architecture, testing, and code quality, which hints at the fact you expect a slightly overengineered solution, within reason of course.
- I assumed that the stakeholders would prefer something that was more modern and built natively with TypeScript, instead of bolted-on types like Express.
- I assumed that industry familiarity was also important to stakeholders, therefore I chose to use `Fastify` as my framework, instead of something more obscure like `Hono`. 
- I also assumed that the stakeholders were not enterprise organisations and therefore stayed away from C# or Java, which would have typically meant more boilerplate and setup. 

### Architecture

I chose an architecture that pulls the good parts of Hexagonal architecture into something better suiting this project's scope and time constraints. The core ideas I adopted:

- Usecase/feature grouping of logic. 
- Repository pattern to abstract the data access logic from business logic.
- Directional control of data. Service sits on top of Model, rather than putting CRUD actions directly onto the model itself and interacting with that everywhere (similar to how people use Sequelize ORM).

I then combined this with best practices for Fastify, primarily their plugin concept. 

This plugin system provides a way to encapsulate code and ensure dependencies are very deliberate. Infrastructure dependencies were attached to our `todo.service.ts` via constructor-based Dependency Injection, allowing future features to share connection pools, atomicity locks, and queues.

### Persistence 

- Repository pattern used for the persistence layer with a factory pattern to dynamically setup the correct persistence method based on the environment variable `PERSISTENCE_METHOD`.
- Only an in-memory method was implemented.
  - This means that server restarts will wipe the data store.
- I was planning to implement SQLite for persistence, but due to time constraints, I cut it from the scope.
  - Adding SQLite would mean defining a new plugin, implementing To-Do repo for SQLite, and installing `better-sqlite3` as the driver.

## Retrospective and Next Steps

This project took longer than I expected it would take me, but I would not compromise on this architecture design if I was to repeat this process. I believe it best demonstrates my architecture and design skills, as well as my careful approach to ensure things were defined well before we hit spaghetti code.

### Challenges

I hit several snags that resulted in longer completion time than I wanted.

- I went with Fastify and TypeScript, as TypeScript was mentioned in the interview as the language for upcoming projects and Fastify is a more modern solution compared to Express. However, I do have more experience in Express and believe I probably would have completed this in less time.
  - I would only choose Express if: a) legacy requirements or b) larger complex app required a more custom architecture (with Express being more unopionated).
  - However, if I was repeating this challenge, I would choose FastAPI via Python, as I am much more familiar with that framework for simple APIs.
- Fastify's plugin autoload for /routes and /plugins caused me some issues with TypeScript when compiling to JavaScript. Routes in sub-folders were getting ignored, so I removed autoload completely, and went with a declarative approach.
- Fastify's built-in `@fastify/type-provider-zod` was causing me challenges with the latest major version of Zod, so I had to switch to the third party version `fastify-type-provider-zod`.

### Next Steps For This Project 

- Implement SQLite or Supabase to test SQL functionality.
  - Easy enough to do with the existing Repository pattern separation.
- Integrate a Note/Doc feature to attach to To-Do's. Useful for brainstorming and fleshing out a To-Do item.
  - Features are encapsulated into their own Fastify plugins under /routes and it would simply be a matter of defining a new module, implementing the Repository pattern, and setting up directional dependencies. This Note/Doc feature would depend on a To-Do interface or something similar.
