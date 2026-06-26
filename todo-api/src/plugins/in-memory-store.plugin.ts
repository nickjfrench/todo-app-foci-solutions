import fp from 'fastify-plugin'
import { InMemoryStore } from '../infrastructure/in-memory-store'

export default fp(async (fastify) => {
  if (!fastify.hasDecorator('inMemoryStore')) {
    const store = new InMemoryStore()
    fastify.decorate('inMemoryStore', store)
  }
}, { name: 'inMemoryStore' })
