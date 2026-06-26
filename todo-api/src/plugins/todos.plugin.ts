import fp from 'fastify-plugin'
import { env } from '../config/env'
import { PERSISTENCE_METHOD } from '../types/persistence'
import { InMemoryTodoRepository } from '../routes/todos/todo.in-memory.repository'
import { TodoService } from '../routes/todos/todo.service'

/**
 * Wire up the TodoService using the configured persistence backend.
 *
 * Depends on the persistence plugin (which decorates the raw store).
 * This plugin owns the domain chain: store → repository → service.
 *
 * To add a new backend: add a case to the switch matching the enum value.
 */
export default fp(async (fastify) => {
  switch (env.PERSISTENCE_METHOD) {
    case PERSISTENCE_METHOD.INMEMORY: {
      const repo = new InMemoryTodoRepository(fastify.inMemoryStore)
      const service = new TodoService(repo)
      fastify.decorate('todoService', service)
      break
    }

    // TODO: Uncomment when SQLite implementation is ready (SPEC step 4)
    // Requires: src/routes/todos/todo.sqlite.repository.ts
    // case PERSISTENCE_METHOD.SQLITE:
    //   const sqliteRepo = new SqliteTodoRepository(fastify.sqliteDb)
    //   const sqliteService = new TodoService(sqliteRepo)
    //   fastify.decorate('todoService', sqliteService)
    //   break

    default:
      // Fall back to in-memory if the enum value is unknown
      const repo = new InMemoryTodoRepository(fastify.inMemoryStore)
      const service = new TodoService(repo)
      fastify.decorate('todoService', service)
  }
}, { dependencies: ['persistence'] })
