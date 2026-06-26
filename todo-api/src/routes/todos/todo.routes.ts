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
    async function(request: FastifyRequest<{ Body: z.infer<typeof CreateTodoInput> }>, reply: FastifyReply) {
      const todo = await service.create(request.body)
      reply.code(201)
      return todo
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
    async function(request: FastifyRequest<{ Querystring: z.infer<typeof ListTodosQuery> }>) {
      const filter: TodoFilter = { ...request.query, completed: request.query.completed ?? undefined }
      return service.list(filter)
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
    async function(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
      try {
        const id = parseId('todo', request.params.id as string)
        const todo = await service.getById(id)
        return todo
      } catch (err) {
        if (err instanceof Error && err.message.includes('not found')) {
          return reply.notFound(err.message)
        }
        return reply.badRequest((err as Error).message)
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
    async function(request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof UpdateTodoInput> }>, reply: FastifyReply) {
      try {
        const id = parseId('todo', request.params.id as string)
        const partial = request.body
        const todo = await service.update(id, {
          title: partial.title ?? undefined,
          description: partial.description ?? undefined,
          dueDate: partial.dueDate ?? undefined,
          isCompleted: partial.isCompleted ?? undefined,
        })
        return todo
      } catch (err) {
        if (err instanceof Error && err.message.includes('not found')) {
          return reply.notFound(err.message)
        }
        return reply.badRequest((err as Error).message)
      }
    },
  )

  // DELETE /todos/:id — delete a todo
  fastify.delete(
    '/todos/:id',
    async function(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
      try {
        const id = parseId('todo', request.params.id as string)
        await service.remove(id)
        reply.code(204)
        return null
      } catch (err) {
        if (err instanceof Error && err.message.includes('not found')) {
          return reply.notFound(err.message)
        }
        return reply.badRequest((err as Error).message)
      }
    },
  )
}

export default routes
