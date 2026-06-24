import { type FastifyPluginAsync, type FastifyReply, type FastifyRequest } from 'fastify'

const health: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.get('/health', async function (_request: FastifyRequest, reply: FastifyReply) {
    reply.code(200)
    return { status: 'ok', timestamp: new Date().toISOString() }
  })
}

export default health
