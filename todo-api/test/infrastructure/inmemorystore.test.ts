import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStore } from '../../src/infrastructure/inmemorystore'

describe('InMemoryStore', () => {
  let store: InMemoryStore

  beforeEach(() => {
    store = new InMemoryStore()
  })

  describe('get', () => {
    it('returns null for a key that does not exist', async () => {
      const result = await store.get('ns', 'missing')
      expect(result).toBeNull()
    })

    it('returns null for a namespace that does not exist', async () => {
      const result = await store.get('nonexistent', 'key')
      expect(result).toBeNull()
    })

    it('returns the value for a key that exists', async () => {
      await store.set('ns', 'key', { id: '1', title: 'Hello' })
      const result = await store.get('ns', 'key')
      expect(result).toEqual({ id: '1', title: 'Hello' })
    })

    it('preserves the type of stored values', async () => {
      await store.set('ns', 'str', 'hello')
      await store.set('ns', 'num', 42)
      await store.set('ns', 'bool', true)

      expect(await store.get('ns', 'str')).toBe('hello')
      expect(await store.get('ns', 'num')).toBe(42)
      expect(await store.get('ns', 'bool')).toBe(true)
    })

    it('isolates values across namespaces', async () => {
      await store.set('ns-a', 'key', 'value-a')
      await store.set('ns-b', 'key', 'value-b')

      expect(await store.get('ns-a', 'key')).toBe('value-a')
      expect(await store.get('ns-b', 'key')).toBe('value-b')
    })
  })

  describe('set', () => {
    it('creates the namespace if it does not exist', async () => {
      await store.set('new-ns', 'key', { id: '1' })
      const result = await store.get('new-ns', 'key')
      expect(result).toEqual({ id: '1' })
    })

    it('overwrites an existing key', async () => {
      await store.set('ns', 'key', { id: '1', title: 'old' })
      await store.set('ns', 'key', { id: '1', title: 'new' })

      const result = await store.get('ns', 'key')
      expect(result).toEqual({ id: '1', title: 'new' })
    })

    it('stores complex objects', async () => {
      const todo = {
        id: 'todo-abc',
        title: 'Buy milk',
        description: '2%',
        dueDate: '2025-01-01T00:00:00.000Z',
        isCompleted: false,
        completedOn: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      await store.set('todos', todo.id, todo)
      const result = await store.get('todos', todo.id)
      expect(result).toEqual(todo)
    })

    it('stores null values', async () => {
      await store.set('ns', 'key', null)
      const result = await store.get('ns', 'key')
      expect(result).toBeNull()
    })
  })

  describe('del', () => {
    it('removes a key from the namespace', async () => {
      await store.set('ns', 'key', 'value')
      await store.del('ns', 'key')

      const result = await store.get('ns', 'key')
      expect(result).toBeNull()
    })

    it('does not throw when deleting a non-existent key', async () => {
      await expect(store.del('ns', 'missing')).resolves.toBeUndefined()
    })

    it('does not throw when deleting from a non-existent namespace', async () => {
      await expect(store.del('nonexistent', 'key')).resolves.toBeUndefined()
    })

    it('leaves other keys in the namespace intact', async () => {
      await store.set('ns', 'key-1', 'value-1')
      await store.set('ns', 'key-2', 'value-2')
      await store.set('ns', 'key-3', 'value-3')

      await store.del('ns', 'key-2')

      expect(await store.get('ns', 'key-1')).toBe('value-1')
      expect(await store.get('ns', 'key-2')).toBeNull()
      expect(await store.get('ns', 'key-3')).toBe('value-3')
    })
  })

  describe('list', () => {
    it('returns an empty array for a non-existent namespace', async () => {
      const result = await store.list('nonexistent')
      expect(result).toEqual([])
    })

    it('returns all values in a namespace', async () => {
      await store.set('ns', 'a', { id: 'a' })
      await store.set('ns', 'b', { id: 'b' })
      await store.set('ns', 'c', { id: 'c' })

      const result = await store.list('ns')
      expect(result).toHaveLength(3)
      expect(result).toContainEqual({ id: 'a' })
      expect(result).toContainEqual({ id: 'b' })
      expect(result).toContainEqual({ id: 'c' })
    })

    describe('orderBy', () => {
      it('sorts ascending by a numeric field', async () => {
        await store.set('ns', 'c', { name: 'c', priority: 3 })
        await store.set('ns', 'a', { name: 'a', priority: 1 })
        await store.set('ns', 'b', { name: 'b', priority: 2 })

        const result = await store.list('ns', { orderBy: 'priority', orderDir: 'asc' })
        expect(result.map((item: any) => item.name)).toEqual(['a', 'b', 'c'])
      })

      it('sorts descending by a numeric field', async () => {
        await store.set('ns', 'c', { name: 'c', priority: 3 })
        await store.set('ns', 'a', { name: 'a', priority: 1 })
        await store.set('ns', 'b', { name: 'b', priority: 2 })

        const result = await store.list('ns', { orderBy: 'priority', orderDir: 'desc' })
        expect(result.map((item: any) => item.name)).toEqual(['c', 'b', 'a'])
      })

      it('sorts ascending by a string field', async () => {
        await store.set('ns', 'c', { name: 'charlie' })
        await store.set('ns', 'a', { name: 'alice' })
        await store.set('ns', 'b', { name: 'bob' })

        const result = await store.list('ns', { orderBy: 'name', orderDir: 'asc' })
        expect(result.map((item: any) => item.name)).toEqual(['alice', 'bob', 'charlie'])
      })
    })

    describe('pagination', () => {
      it('returns the first page', async () => {
        for (let i = 0; i < 5; i++) {
          await store.set('ns', `item-${i}`, { id: i })
        }

        const result = await store.list('ns', { page: 1, limit: 2 })
        expect(result).toHaveLength(2)
      })

      it('returns the second page', async () => {
        for (let i = 0; i < 5; i++) {
          await store.set('ns', `item-${i}`, { id: i })
        }

        const result = await store.list('ns', { page: 2, limit: 2 })
        expect(result).toHaveLength(2)
      })

      it('returns remaining items on the last page', async () => {
        for (let i = 0; i < 5; i++) {
          await store.set('ns', `item-${i}`, { id: i })
        }

        const result = await store.list('ns', { page: 3, limit: 2 })
        expect(result).toHaveLength(1)
      })

      it('returns an empty array when page is beyond available items', async () => {
        await store.set('ns', 'item-0', { id: 0 })

        const result = await store.list('ns', { page: 2, limit: 1 })
        expect(result).toEqual([])
      })
    })

    describe('combined options', () => {
      it('applies orderBy and pagination together', async () => {
        await store.set('ns', 'c', { name: 'c', priority: 3 })
        await store.set('ns', 'a', { name: 'a', priority: 1 })
        await store.set('ns', 'b', { name: 'b', priority: 2 })
        await store.set('ns', 'd', { name: 'd', priority: 4 })

        const result = await store.list('ns', { orderBy: 'priority', orderDir: 'asc', page: 1, limit: 2 })
        expect(result).toHaveLength(2)
        expect(result.map((item: any) => item.name)).toEqual(['a', 'b'])
      })

      it('applies orderBy desc with pagination', async () => {
        await store.set('ns', 'c', { name: 'c', priority: 3 })
        await store.set('ns', 'a', { name: 'a', priority: 1 })
        await store.set('ns', 'b', { name: 'b', priority: 2 })
        await store.set('ns', 'd', { name: 'd', priority: 4 })

        const result = await store.list('ns', { orderBy: 'priority', orderDir: 'desc', page: 1, limit: 2 })
        expect(result).toHaveLength(2)
        expect(result.map((item: any) => item.name)).toEqual(['d', 'c'])
      })
    })
  })
})
