import type { Todo } from './todo.model'
import type { Id } from '../../utils/id'

/**
 * Filter criteria for listing todos. Mirrors the query parameters
 * accepted by `GET /todos`.
 */
export interface TodoFilter {
  completed?: boolean
  orderBy?: 'dueDate' | 'createdAt' | 'title'
  orderDir?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * Repository interface (port) for Todo persistence.
 *
 * Implementations (adapters) can be swapped without touching business logic.
 * Current implementations:
 * - InMemoryTodoRepository — in-memory Map, used for testing
 * - SqliteTodoRepository — SQLite-backed, used in production (step 4)
 */
export interface ITodoRepository {
  /** Persist a new todo. Returns the todo as stored. */
  create(todo: Todo): Promise<Todo>

  /** Find a single todo by its ID. Returns `null` if not found. */
  findById(id: Id<'todo'>): Promise<Todo | null>

  /** Find todos matching the given filter criteria. Empty filter returns all. */
  findMany(filter: TodoFilter): Promise<Todo[]>

  /**
   * Update a todo with partial fields. Returns the updated todo,
   * or `null` if the todo does not exist.
   */
  update(id: Id<'todo'>, partial: Partial<Todo>): Promise<Todo | null>

  /** Delete a todo by ID. Returns `true` if deleted, `false` if not found. */
  delete(id: Id<'todo'>): Promise<boolean>
}
