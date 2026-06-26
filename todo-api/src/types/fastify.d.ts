import { InMemoryStore } from '../types/persistence'
import type { TodoService } from '../routes/todos/todo.service'

declare module 'fastify' {
  export interface FastifyInstance {
    inMemoryStore: InMemoryStore
    todoService: TodoService
  }
}
