import { InMemoryStore } from '../types/persistence'

declare module 'fastify' {
  export interface FastifyInstance {
    inMemoryStore: InMemoryStore
  }
}
