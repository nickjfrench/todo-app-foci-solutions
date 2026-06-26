import { createApp } from './app'
import { env } from './config/env'

const server = await createApp({
  serverOptions: { logger: true },
})

server.listen({
  port: env.PORT,
  host: '0.0.0.0',
}, (err, address) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
  server.log.info(`Server listening at ${address}`)
})
