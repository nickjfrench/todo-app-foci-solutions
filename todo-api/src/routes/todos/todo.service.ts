import type { Id } from '../../utils/id'
import type { TodoFilter } from './todo.repository'
import { ITodoRepository } from './todo.repository'
import { createTodo, type Todo } from './todo.model'

/**
 * Todo service — owns business logic.
 *
 * Depends on ITodoRepository (port) so the same service works with
 * both InMemoryTodoRepository (tests) and SqliteTodoRepository (prod).
 */
export class TodoService {
  constructor(private repo: ITodoRepository) {}

  async create(input: { title: string; description?: string | null; dueDate?: string | null }): Promise<Todo> {
    return this.repo.create(createTodo(input))
  }

  async getById(id: Id<'todo'>): Promise<Todo> {
    const todo = await this.repo.findById(id)
    if (!todo) throw new Error(`Todo ${id} not found`)
    return todo
  }

  async list(filter: TodoFilter): Promise<Todo[]> {
    return this.repo.findMany(filter)
  }

  async update(id: Id<'todo'>, partial: Partial<Todo>): Promise<Todo> {
    if (partial.isCompleted === true) {
      partial.completedOn = new Date().toISOString()
    } else if (partial.isCompleted === false) {
      partial.completedOn = null
    }
    
    const result = await this.repo.update(id, partial)
    if (!result) throw new Error(`Todo ${id} not found`)
    return result
  }

  async remove(id: Id<'todo'>): Promise<boolean> {
    const deleted = await this.repo.delete(id)
    if (!deleted) throw new Error(`Todo ${id} not found`)
    return true
  }
}
