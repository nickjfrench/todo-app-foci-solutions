import { InMemoryStore as InMemoryStoreType } from '../types/persistence'

export class InMemoryStore implements InMemoryStoreType {
  private storage = new Map<string, Map<string, any>>()

  async get<T>(namespace: string, key: string): Promise<T | null> {
    const namespaceMap = this.storage.get(namespace)
    return (namespaceMap?.get(key) as T | null) ?? null
  }

  async set<T>(namespace: string, key: string, value: T): Promise<void> {
    if (!this.storage.has(namespace)) {
      this.storage.set(namespace, new Map())
    }
    this.storage.get(namespace)!.set(key, value)
  }

  async del(namespace: string, key: string): Promise<void> {
    this.storage.get(namespace)?.delete(key)
  }

  async list<T>(namespace: string, options?: { orderBy?: string; orderDir?: 'asc' | 'desc'; page?: number; limit?: number }): Promise<T[]> {
    const namespaceMap = this.storage.get(namespace)
    if (!namespaceMap) return []

    let items = Array.from(namespaceMap.values()) as T[]

    if (options) {
      if (options.orderBy) {
        const direction = options.orderDir === 'desc' ? -1 : 1
        items.sort((a, b) => {
          const valA = (a as any)[options.orderBy!]
          const valB = (b as any)[options.orderBy!]
          if (valA < valB) return -1 * direction
          if (valA > valB) return 1 * direction
          return 0
        })
      }

      if (options.page !== undefined && options.limit !== undefined) {
        const start = (options.page - 1) * options.limit
        const end = start + options.limit
        items = items.slice(start, end)
      }
    }

    return items
  }
}

export default InMemoryStore
