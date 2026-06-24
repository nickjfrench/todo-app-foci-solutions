import Fastify from 'fastify'
import app from './app'
import { env } from './config/env'

const server = Fastify({ logger: true })

server.register(app)

server.listen({ 
  port: Number(env.PORT) || 3000, 
  host: '0.0.0.0'
}, (err, address) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
  server.log.info(`Server listening at ${address}`)
})
