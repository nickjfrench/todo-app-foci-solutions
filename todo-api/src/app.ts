import sensible from './plugins/sensible.plugin'
import inMemoryStore from './plugins/in-memory-store.plugin'
import todosPlugin from './plugins/todos.plugin'
import health from './routes/health'
import root from './routes/root'
import todos from './routes/todos'
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'

export interface AppOptions extends FastifyServerOptions {
}

const options: AppOptions = {}

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  // Support plugins
  fastify.register(sensible)
  fastify.register(inMemoryStore)

  // Domain plugins
  fastify.register(todosPlugin)

  // Routes
  fastify.register(health)
  fastify.register(root)
  fastify.register(todos)
}

export default app
export { app, options }
