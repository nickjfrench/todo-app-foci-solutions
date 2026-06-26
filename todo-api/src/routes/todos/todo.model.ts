import { z } from 'zod'
import { generateId } from '../../utils/id'

// ─── Todo Model ────────────────────────────────────────────────────────────

/**
 * Full Todo shape. Used for the canonical model returned by the API.
 *
 * `id` is a branded `Id<'todo'>` at the TypeScript level. At runtime it is
 * always a `"todo-<uuid>"` string — the format is enforced by `createTodo()`
 * (constructor) and `parseId()` (route input).
 */
export const TodoSchema = z.object({
  id: z.string(),          // runtime value is "todo-<uuid>"; branded via Id<'todo'>
  title: z.string().min(1),
  description: z.string().nullish().default(null),
  dueDate: z.iso.datetime().nullish().default(null),
  isCompleted: z.boolean().default(false),
  completedOn: z.iso.datetime().nullish().default(null),
  createdAt: z.iso.datetime(),
})

/**
 * Todo entity type inferred from the Zod schema.
 *
 * Note: the `id` field is typed as `string` here. Route handlers and the
 * service layer use the branded `Id<'todo'>` type for compile-time safety.
 */
export type Todo = z.infer<typeof TodoSchema>

// ─── Input Schemas ─────────────────────────────────────────────────────────

/** POST /todos body — `title` is required; everything else optional. */
export const CreateTodoInput = z.object({
  title: z.string().min(1),
  description: z.string().nullish().default(null),
  dueDate: z.iso.datetime().nullish().default(null),
})

/** PATCH /todos/:id body — all fields optional (partial update). */
export const UpdateTodoInput = z.object({
  title: z.string().min(1).nullish(),
  description: z.string().nullish(),
  dueDate: z.iso.datetime().nullish(),
  isCompleted: z.boolean().nullish(),
})

// ─── Query Schema ──────────────────────────────────────────────────────────

/** GET /todos query parameters — filtering, sorting, pagination. */
export const ListTodosQuery = z.object({
  completed: z.stringbool().nullish(),
  orderBy: z.enum(['dueDate', 'createdAt', 'title']).default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
})

export type ListTodosQuery = z.infer<typeof ListTodosQuery>

// ─── Constructor ───────────────────────────────────────────────────────────

/**
 * Construct a new Todo from user-supplied input.
 *
 * Generates a prefixed UUID, sets `createdAt` to NOW, and applies all
 * field defaults. The returned object is a fully-formed Todo ready for
 * persistence.
 *
 * @param input - User input validated by `CreateTodoInput`.
 * @returns A complete Todo entity.
 */
export function createTodo(input: z.infer<typeof CreateTodoInput>): Todo {
  return {
    id: generateId('todo'),
    title: input.title,
    description: input.description ?? null,
    dueDate: input.dueDate ?? null,
    isCompleted: false,
    completedOn: null,
    createdAt: new Date().toISOString(),
  }
}
