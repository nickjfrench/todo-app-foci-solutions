export enum PERSISTENCE_METHOD {
  INMEMORY = "in_memory",
  SQLITE = "sqlite",
}

export interface InMemoryStore {
  get<T>(namespace: string, key: string): Promise<T | null>
  set<T>(namespace: string, key: string, value: T): Promise<void>
  del(namespace: string, key: string): Promise<void>
  list<T>(namespace: string, options?: { orderBy?: string; orderDir?: 'asc' | 'desc'; page?: number; limit?: number }): Promise<T[]>
}
