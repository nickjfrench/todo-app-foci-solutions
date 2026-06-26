import sensible from './plugins/sensible.plugin'
import { createPersistencePlugin } from './plugins/persistence.plugin'
import todosPlugin from './plugins/todos.plugin'
import health from './routes/health'
import root from './routes/root'
import todos from './routes/todos'
import Fastify, { FastifyInstance, FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

export interface AppOptions extends FastifyServerOptions {
}

const options: AppOptions = {}

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  // Support plugins
  fastify.register(sensible)

  // Infrastructure — raw store (in-memory or SQLite)
  fastify.register(createPersistencePlugin())

  // Domain plugins — each wires its own repo + service on top of the store
  fastify.register(todosPlugin)

  // Routes
  fastify.register(health)
  fastify.register(root)
  fastify.register(todos)
}

/**
 * Create a fully-wired Fastify instance with all compilers and plugins.
 *
 * Shared between server.ts (production) and test/helper.ts (tests).
 * Accepts an optional preDecorate callback so tests can inject shared stores.
 */
export async function createApp(opts?: {
  /** Fastify server options. Defaults to no logger. */
  serverOptions?: FastifyServerOptions
  /** Decorate the instance before plugins are registered (e.g. shared InMemoryStore). */
  preDecorate?: (fastify: FastifyInstance) => void | Promise<void>
}): Promise<FastifyInstance> {
  const fastify = Fastify(opts?.serverOptions ?? {})

  // Wire up Zod as the request validator and response serializer
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  // Allow tests to pre-decorate shared state before plugins run
  if (opts?.preDecorate) {
    await opts.preDecorate(fastify)
  }

  await fastify.register(app)
  return fastify
}

export default app
export { app, options }
