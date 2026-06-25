import { describe, it, expect } from 'vitest'
import {
  TodoSchema,
  CreateTodoInput,
  UpdateTodoInput,
  ListTodosQuery,
  createTodo,
  type Todo,
} from '../../../src/routes/todos/todo.model'

describe('CreateTodoInput', () => {
  it('accepts title only', () => {
    const result = CreateTodoInput.parse({ title: 'Buy milk' })
    expect(result).toEqual({
      title: 'Buy milk',
      description: null,
      dueDate: null,
    })
  })

  it('accepts title with optional fields', () => {
    const result = CreateTodoInput.parse({
      title: 'Buy milk',
      description: '2%',
      dueDate: '2025-01-01T00:00:00.000Z',
    })
    expect(result.title).toBe('Buy milk')
    expect(result.description).toBe('2%')
    expect(result.dueDate).toBe('2025-01-01T00:00:00.000Z')
  })

  it('rejects missing title', () => {
    expect(() => CreateTodoInput.parse({})).toThrow()
  })

  it('rejects empty title', () => {
    expect(() => CreateTodoInput.parse({ title: '' })).toThrow()
  })

  it('rejects invalid dueDate format', () => {
    expect(() =>
      CreateTodoInput.parse({ title: 'Test', dueDate: 'not-a-date' })
    ).toThrow()
  })
})

describe('UpdateTodoInput', () => {
  it('accepts empty object (no-op update)', () => {
    const result = UpdateTodoInput.parse({})
    expect(result).toEqual({})
  })

  it('accepts partial update - isCompleted only', () => {
    const result = UpdateTodoInput.parse({ isCompleted: true })
    expect(result.isCompleted).toBe(true)
  })

  it('accepts partial update - title only', () => {
    const result = UpdateTodoInput.parse({ title: 'Updated title' })
    expect(result.title).toBe('Updated title')
  })

  it('accepts partial update - multiple fields', () => {
    const result = UpdateTodoInput.parse({
      title: 'New title',
      isCompleted: false,
      dueDate: '2025-06-01T00:00:00.000Z',
    })
    expect(result.title).toBe('New title')
    expect(result.isCompleted).toBe(false)
    expect(result.dueDate).toBe('2025-06-01T00:00:00.000Z')
  })

  it('rejects empty string title', () => {
    expect(() => UpdateTodoInput.parse({ title: '' })).toThrow()
  })
})

describe('ListTodosQuery', () => {
  it('accepts all query params', () => {
    const result = ListTodosQuery.parse({
      completed: 'true',
      orderBy: 'dueDate',
      orderDir: 'asc',
      page: '2',
      limit: '10',
    })
    expect(result.completed).toBe(true)
    expect(result.orderBy).toBe('dueDate')
    expect(result.orderDir).toBe('asc')
    expect(result.page).toBe(2)
    expect(result.limit).toBe(10)
  })

  it('accepts empty object (all defaults)', () => {
    const result = ListTodosQuery.parse({})
    expect(result.completed).toBeUndefined()
    expect(result.orderBy).toBe('createdAt')
    expect(result.orderDir).toBe('asc')
    expect(result.page).toBe(1)
    expect(result.limit).toBe(100)
  })

  it('accepts completed=false', () => {
    const result = ListTodosQuery.parse({ completed: 'false' })
    expect(result.completed).toBe(false)
  })

  it('rejects invalid orderBy value', () => {
    expect(() => ListTodosQuery.parse({ orderBy: 'invalid' })).toThrow()
  })

  it('rejects invalid orderDir value', () => {
    expect(() => ListTodosQuery.parse({ orderDir: 'invalid' })).toThrow()
  })

  it('rejects page less than 1', () => {
    expect(() => ListTodosQuery.parse({ page: '0' })).toThrow()
  })

  it('rejects limit greater than 100', () => {
    expect(() => ListTodosQuery.parse({ limit: '101' })).toThrow()
  })
})

describe('createTodo', () => {
  it('generates a prefixed UUID', () => {
    const todo = createTodo({ title: 'Test' })
    expect(todo.id).toMatch(/^todo-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('sets createdAt to current time', () => {
    const before = new Date().toISOString()
    const todo = createTodo({ title: 'Test' })
    const after = new Date().toISOString()
    expect(Date.parse(todo.createdAt)).toBeGreaterThanOrEqual(Date.parse(before))
    expect(Date.parse(todo.createdAt)).toBeLessThanOrEqual(Date.parse(after))
  })

  it('applies default values for optional fields', () => {
    const todo = createTodo({ title: 'Test' })
    expect(todo.description).toBeNull()
    expect(todo.dueDate).toBeNull()
    expect(todo.isCompleted).toBe(false)
    expect(todo.completedOn).toBeNull()
  })

  it('preserves provided optional fields', () => {
    const todo = createTodo({
      title: 'Test',
      description: 'A test todo',
      dueDate: '2025-12-31T23:59:59.000Z',
    })
    expect(todo.description).toBe('A test todo')
    expect(todo.dueDate).toBe('2025-12-31T23:59:59.000Z')
  })

  it('produces a valid Todo object', () => {
    const todo = createTodo({ title: 'Test' })
    const result = TodoSchema.parse(todo)
    expect(result.id).toBe(todo.id)
    expect(result.title).toBe('Test')
  })
})

describe('TodoSchema', () => {
  it('validates a complete todo object', () => {
    const todo: Todo = {
      id: 'todo-550e8400-e29b-41d4-a716-446655440000',
      title: 'Buy milk',
      description: '2%',
      dueDate: '2025-01-01T00:00:00.000Z',
      isCompleted: true,
      completedOn: '2024-12-31T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
    }
    const result = TodoSchema.parse(todo)
    expect(result).toEqual(todo)
  })

  it('rejects todo with missing title', () => {
    expect(() =>
      TodoSchema.parse({
        id: 'todo-550e8400-e29b-41d4-a716-446655440000',
        description: null,
        dueDate: null,
        isCompleted: false,
        completedOn: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      })
    ).toThrow()
  })

  it('rejects todo with missing createdAt', () => {
    expect(() =>
      TodoSchema.parse({
        id: 'todo-550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        description: null,
        dueDate: null,
        isCompleted: false,
        completedOn: null,
      })
    ).toThrow()
  })

  it('applies defaults for nullish fields', () => {
    const result = TodoSchema.parse({
      id: 'todo-550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      createdAt: '2024-01-01T00:00:00.000Z',
    })
    expect(result.description).toBeNull()
    expect(result.dueDate).toBeNull()
    expect(result.isCompleted).toBe(false)
    expect(result.completedOn).toBeNull()
  })
})
