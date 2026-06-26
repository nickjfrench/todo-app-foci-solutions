import fp from 'fastify-plugin'
import { InMemoryTodoRepository } from '../routes/todos/todo.in-memory.repository'
import { TodoService } from '../routes/todos/todo.service'

/**
 * Wire up the TodoService from the InMemoryTodoRepository + InMemoryStore.
 *
 * This plugin owns the full dependency chain (store → repo → service).
 * Feature modules pull the service, not the repository.
 */
export default fp(async (fastify) => {
  const repo = new InMemoryTodoRepository(fastify.inMemoryStore)
  const service = new TodoService(repo)
  fastify.decorate('todoService', service)
}, { dependencies: ['inMemoryStore'] })
