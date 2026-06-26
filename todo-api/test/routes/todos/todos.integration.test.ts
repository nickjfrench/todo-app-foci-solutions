import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { build, buildWithStore, InMemoryStore } from '../../helper'

describe('POST /todos', () => {
  test('creates a todo with title only and returns 201', async () => {
    const app = await build()

    const res = await app.inject({
      method: 'POST',
      url: '/todos',
      body: { title: 'Buy milk' },
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.payload)
    expect(body.id).toMatch(/^todo-[0-9a-f-]+$/)
    expect(body.title).toBe('Buy milk')
    expect(body.description).toBeNull()
    expect(body.dueDate).toBeNull()
    expect(body.isCompleted).toBe(false)
    expect(body.completedOn).toBeNull()
    expect(body.createdAt).toBeDefined()
  })

  test('creates a todo with all optional fields', async () => {
    const app = await build()

    const res = await app.inject({
      method: 'POST',
      url: '/todos',
      body: {
        title: 'File taxes',
        description: 'Q4 2025',
        dueDate: '2026-01-15T00:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.payload)
    expect(body.title).toBe('File taxes')
    expect(body.description).toBe('Q4 2025')
    expect(body.dueDate).toBe('2026-01-15T00:00:00.000Z')
  })

  test('returns 400 when title is missing', async () => {
    const app = await build()

    const res = await app.inject({
      method: 'POST',
      url: '/todos',
      body: { description: 'no title' },
    })

    expect(res.statusCode).toBe(400)
  })

  test('returns 400 when title is empty', async () => {
    const app = await build()

    const res = await app.inject({
      method: 'POST',
      url: '/todos',
      body: { title: '' },
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('GET /todos', () => {
  const store = new InMemoryStore()

  beforeEach(async () => {
    const app = await buildWithStore(store)

    await app.inject({
      method: 'POST',
      url: '/todos',
      body: { title: 'Alpha', dueDate: '2026-01-01T00:00:00.000Z' },
    })
    await app.inject({
      method: 'POST',
      url: '/todos',
      body: { title: 'Beta', dueDate: '2026-02-01T00:00:00.000Z' },
    })

    // Mark both as complete so completed=true filter has data
    const todos = JSON.parse(
      (await app.inject({ method: 'GET', url: '/todos' })).payload,
    )
    for (const todo of todos) {
      await app.inject({
        method: 'PATCH',
        url: `/todos/${todo.id}`,
        body: { isCompleted: true },
      })
    }
  })

  afterEach(async () => {
    await store.clear()
  })

  test('returns all todos', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({ method: 'GET', url: '/todos' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
  })

  test('returns empty array when no todos exist', async () => {
    const emptyStore = new InMemoryStore()
    const app = await buildWithStore(emptyStore)

    const res = await app.inject({ method: 'GET', url: '/todos' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual([])
  })

  test('filters by completed=false', async () => {
    const app = await buildWithStore(store)

    // Create an incomplete todo in the shared store
    await app.inject({
      method: 'POST',
      url: '/todos',
      body: { title: 'Incomplete task' },
    })

    const res = await app.inject({ method: 'GET', url: '/todos?completed=false' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Incomplete task')
  })

  test('filters by completed=true', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({ method: 'GET', url: '/todos?completed=true' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body).toHaveLength(2)
    expect(body.every((t: any) => t.isCompleted === true)).toBe(true)
  })

  test('orders by dueDate ascending', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({
      method: 'GET',
      url: '/todos?orderBy=dueDate&orderDir=asc',
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body[0].title).toBe('Alpha')
    expect(body[1].title).toBe('Beta')
  })

  test('orders by dueDate descending', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({
      method: 'GET',
      url: '/todos?orderBy=dueDate&orderDir=desc',
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body[0].title).toBe('Beta')
    expect(body[1].title).toBe('Alpha')
  })

  test('orders by title ascending', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({
      method: 'GET',
      url: '/todos?orderBy=title&orderDir=asc',
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body[0].title).toBe('Alpha')
    expect(body[1].title).toBe('Beta')
  })

  test('applies pagination', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({ method: 'GET', url: '/todos?page=1&limit=1' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body).toHaveLength(1)
  })

  test('returns empty array on page beyond data', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({ method: 'GET', url: '/todos?page=99&limit=10' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual([])
  })
})

describe('GET /todos/:id', () => {
  test('returns a single todo by id', async () => {
    const app = await build()

    const createRes = await app.inject({
      method: 'POST',
      url: '/todos',
      body: { title: 'Find me' },
    })
    const todo = JSON.parse(createRes.payload)

    const res = await app.inject({ method: 'GET', url: `/todos/${todo.id}` })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body.id).toBe(todo.id)
    expect(body.title).toBe('Find me')
  })

  test('returns 404 for non-existent id with structured error body', async () => {
    const app = await build()

    const res = await app.inject({
      method: 'GET',
      url: '/todos/todo-00000000-0000-0000-0000-000000000000',
    })
    expect(res.statusCode).toBe(404)
    const body = JSON.parse(res.payload)
    expect(body.error).toBe('Not Found')
    expect(body.message).toContain('not found')
  })


  test('returns 400 for invalid id format with structured error body', async () => {
    const app = await build()

    const res = await app.inject({
      method: 'GET',
      url: '/todos/not-a-valid-id',
    })
    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.payload)
    expect(body.error).toBe('Bad Request')
    expect(body.message).toContain('Invalid')
  })
})

describe('PATCH /todos/:id', () => {
  const store = new InMemoryStore()
  let todoId: string

  beforeEach(async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({
      method: 'POST',
      url: '/todos',
      body: { title: 'Original title', dueDate: '2026-06-01T00:00:00.000Z' },
    })
    todoId = JSON.parse(res.payload).id
  })

  test('updates the title', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({
      method: 'PATCH',
      url: `/todos/${todoId}`,
      body: { title: 'Updated title' },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body.title).toBe('Updated title')
    expect(body.dueDate).toBe('2026-06-01T00:00:00.000Z')
  })

  test('marks todo as complete and sets completedOn', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({
      method: 'PATCH',
      url: `/todos/${todoId}`,
      body: { isCompleted: true },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body.isCompleted).toBe(true)
    expect(body.completedOn).toBeDefined()
  })

  test('marks todo as incomplete and clears completedOn', async () => {
    const app = await buildWithStore(store)

    // Mark complete first
    await app.inject({
      method: 'PATCH',
      url: `/todos/${todoId}`,
      body: { isCompleted: true },
    })

    // Now mark incomplete
    const res = await app.inject({
      method: 'PATCH',
      url: `/todos/${todoId}`,
      body: { isCompleted: false },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.payload)
    expect(body.isCompleted).toBe(false)
    expect(body.completedOn).toBeNull()
  })

  test('returns 404 for non-existent id with structured error body', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({
      method: 'PATCH',
      url: '/todos/todo-00000000-0000-0000-0000-000000000000',
      body: { title: 'nope' },
    })
    expect(res.statusCode).toBe(404)
    const body = JSON.parse(res.payload)
    expect(body.error).toBe('Not Found')
    expect(body.message).toContain('not found')
  })

  test('returns 400 for invalid id format with structured error body', async () => {
    const app = await buildWithStore(store)

    const res = await app.inject({
      method: 'PATCH',
      url: '/todos/bad-id',
      body: { title: 'nope' },
    })
    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.payload)
    expect(body.error).toBe('Bad Request')
    expect(body.message).toContain('Invalid')
  })
})

describe('DELETE /todos/:id', () => {
  test('deletes a todo and returns 204', async () => {
    const app = await build()

    const createRes = await app.inject({
      method: 'POST',
      url: '/todos',
      body: { title: 'Delete me' },
    })
    const todo = JSON.parse(createRes.payload)

    const res = await app.inject({
      method: 'DELETE',
      url: `/todos/${todo.id}`,
    })
    expect(res.statusCode).toBe(204)

    const getRes = await app.inject({
      method: 'GET',
      url: `/todos/${todo.id}`,
    })
    expect(getRes.statusCode).toBe(404)
  })

  test('returns 404 for non-existent id with structured error body', async () => {
    const app = await build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/todos/todo-00000000-0000-0000-0000-000000000000',
    })
    expect(res.statusCode).toBe(404)
    const body = JSON.parse(res.payload)
    expect(body.error).toBe('Not Found')
    expect(body.message).toContain('not found')
  })


  test('returns 400 for invalid id format with structured error body', async () => {
    const app = await build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/todos/not-valid',
    })
    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.payload)
    expect(body.error).toBe('Bad Request')
    expect(body.message).toContain('Invalid')
  })
})
