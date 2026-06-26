import { FastifyPluginAsync } from 'fastify'
import routes from './todo.routes'

/**
 * Todos module entry point.
 *
 * Pulls the TodoService from the Fastify instance (decorated by
 * todos.plugin.ts) and registers the routes plugin, passing the
 * service via options.
 */
const todos: FastifyPluginAsync = async (fastify) => {
  const service = fastify.todoService
  fastify.register(routes, { service })
}

export default todos
