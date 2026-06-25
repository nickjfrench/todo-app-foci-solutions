import fp from 'fastify-plugin'
import { InMemoryStore } from '../infrastructure/inmemorystore'

export default fp(async (fastify) => {
  const store = new InMemoryStore()
  fastify.decorate('inMemoryStore', store)
})
