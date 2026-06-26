import { z } from 'zod'
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { TodoService } from './todo.service'

export type TodoPluginOptions = { service: TodoService }
import { parseId } from '../../utils/id'
import {
  CreateTodoInput,
  UpdateTodoInput,
  ListTodosQuery,
  TodoSchema,
} from './todo.model'
import type { TodoFilter } from './todo.repository'
import { ResourceNotFoundError, InvalidInputError } from '../../errors'

/**
 * Format a typed error as a structured JSON response.
 * Returns the reply chain so it can be returned from a handler.
 */
function handleError(
  reply: FastifyReply,
  err: Error,
): FastifyReply {
  if (err instanceof ResourceNotFoundError) {
    return reply.status(404).send({
      error: 'Not Found',
      message: err.message,
    })
  }
  if (err instanceof InvalidInputError) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: err.message,
    })
  }
  // Unknown error — let the global handler deal with it
  throw err
}

const routes: FastifyPluginAsync<TodoPluginOptions> = async (fastify, opts) => {
  const service = opts.service

  // POST /todos — create a new todo
  fastify.post(
    '/todos',
    {
      schema: {
        body: CreateTodoInput,
        response: { 201: TodoSchema },
      },
    },
    async function(
      request: FastifyRequest<{ Body: z.infer<typeof CreateTodoInput> }>,
      reply: FastifyReply,
    ) {
      try {
        const todo = await service.create(request.body)
        reply.code(201)
        return todo
      } catch (err) {
        if (err instanceof Error) return handleError(reply, err)
        throw err
      }
    },
  )

  // GET /todos — list todos with filtering, sorting, pagination
  fastify.get(
    '/todos',
    {
      schema: {
        querystring: ListTodosQuery,
        response: { 200: TodoSchema.array() },
      },
    },
    async function(
      request: FastifyRequest<{ Querystring: z.infer<typeof ListTodosQuery> }>,
      reply: FastifyReply,
    ) {
      try {
        const filter: TodoFilter = {
          ...request.query,
          completed: request.query.completed ?? undefined,
        }
        return service.list(filter)
      } catch (err) {
        if (err instanceof Error) return handleError(reply, err)
        throw err
      }
    },
  )

  // GET /todos/:id — get a single todo
  fastify.get(
    '/todos/:id',
    {
      schema: {
        response: { 200: TodoSchema },
      },
    },
    async function(
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) {
      try {
        const id = parseId('todo', request.params.id)
        const todo = await service.getById(id)
        return todo
      } catch (err) {
        if (err instanceof Error) return handleError(reply, err)
        throw err
      }
    },
  )

  // PATCH /todos/:id — partial update
  fastify.patch(
    '/todos/:id',
    {
      schema: {
        body: UpdateTodoInput,
        response: { 200: TodoSchema },
      },
    },
    async function(
      request: FastifyRequest<
        { Params: { id: string }; Body: z.infer<typeof UpdateTodoInput> }
      >,
      reply: FastifyReply,
    ) {
      try {
        const id = parseId('todo', request.params.id)
        const partial = request.body
        const todo = await service.update(id, {
          title: partial.title ?? undefined,
          description: partial.description ?? undefined,
          dueDate: partial.dueDate ?? undefined,
          isCompleted: partial.isCompleted ?? undefined,
        })
        return todo
      } catch (err) {
        if (err instanceof Error) return handleError(reply, err)
        throw err
      }
    },
  )

  // DELETE /todos/:id — delete a todo (204 No Content)
  fastify.delete(
    '/todos/:id',
    async function(
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) {
      try {
        const id = parseId('todo', request.params.id)
        await service.remove(id)
        return reply.code(204).send()
      } catch (err) {
        if (err instanceof Error) return handleError(reply, err)
        throw err
      }
    },
  )
}

export default routes
