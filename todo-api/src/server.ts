import Fastify from 'fastify'
import app from './app'
import { env } from './config/env'
import { serializerCompiler, validatorCompiler } from '@fastify/type-provider-zod'

const server = Fastify({ logger: true })

// Wire up Zod as the request validator and response serializer
server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.register(app)

server.listen({ 
  port: env.PORT, 
  host: '0.0.0.0'
}, (err, address) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
  server.log.info(`Server listening at ${address}`)
})
