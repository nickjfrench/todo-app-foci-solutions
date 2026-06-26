import { ITodoRepository, TodoFilter } from './todo.repository'
import type { InMemoryStore } from '../../types/persistence'
import type { Todo } from './todo.model'

/**
 * In-memory implementation of ITodoRepository using InMemoryStore.
 *
 * Used for integration tests — provides the same interface as the
 * SQLite implementation so the service layer never knows the difference.
 */
export class InMemoryTodoRepository implements ITodoRepository {
  constructor(private store: InMemoryStore) {}

  async create(todo: Todo): Promise<Todo> {
    await this.store.set('todos', todo.id, todo)
    return todo
  }

  async findById(id: string): Promise<Todo | null> {
    return this.store.get<Todo>('todos', id)
  }

  async findMany(filter: TodoFilter): Promise<Todo[]> {
    let items = await this.store.list<Todo>('todos')

    // Filter by completion status
    if (filter.completed !== undefined) {
      items = items.filter((t) => t.isCompleted === filter.completed)
    }

    // Sort
    if (filter.orderBy) {
      const dir = filter.orderDir === 'desc' ? -1 : 1
      items.sort((a, b) => {
        const valA = a[filter.orderBy! as keyof Todo]
        const valB = b[filter.orderBy! as keyof Todo]

        // Handle null values: nulls sort last (asc) / first (desc)
        if (valA === null && valB === null) return 0
        if (valA === null) return dir
        if (valB === null) return -dir

        if (valA < valB) return -1 * dir
        if (valA > valB) return 1 * dir
        return 0
      })
    }

    // Pagination
    if (filter.page !== undefined && filter.limit !== undefined) {
      const start = (filter.page - 1) * filter.limit
      items = items.slice(start, start + filter.limit)
    }

    return items
  }

  async update(id: string, partial: Partial<Todo>): Promise<Todo | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    // Filter out undefined values so they don't overwrite existing fields.
    // Route handlers coerce null -> undefined, which spread would clobber.
    const nonUndefined = Object.fromEntries(
      Object.entries(partial).filter(([, v]) => v !== undefined),
    ) as Partial<Todo>

    const updated: Todo = { ...existing, ...nonUndefined }
    await this.store.set('todos', id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id)
    if (!existing) return false
    await this.store.del('todos', id)
    return true
  }
}
