import { FastifyPluginOptions } from 'fastify'
import { TodoService } from '../routes/todos/todo.service'

/**
 * Plugin options passed from a module's index.ts to its routes plugin.
 *
 * Pattern: each module's index.ts constructs its service and passes it
 * to the routes plugin via `fastify.register(routes, { service })`.
 *
 * The routes plugin accesses `opts.service` — typed here so TypeScript
 * knows exactly what's available.
 *
 * Usage:
 *   // routes/todos/todo.routes.ts
 *   import { TodoPluginOptions } from '../../types/plugin-options'
 *   const routes: FastifyPluginAsync<TodoPluginOptions> = async (fastify, opts) => {
 *     const service = opts.service  // fully typed
 *   }
 */
export interface TodoPluginOptions extends FastifyPluginOptions {
  service: TodoService
}
