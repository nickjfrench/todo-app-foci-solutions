// This file contains code that we reuse between our tests.
import * as path from 'node:path'
import { afterEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import App from '../dist/app.js'

// Fill in this config with all the configurations
// needed for testing the application
function config () {
  return {
    // any fastify server options go here
  }
}

// Automatically build and tear down our instance
async function build (): Promise<FastifyInstance> {
  const fastify = Fastify(config())

  // Register our application — fastify-plugin ensures all decorators
  // are exposed for testing purposes
  await fastify.register(App)

  // Tear down our app after we are done
  afterEach(() => fastify.close())

  return fastify
}

export {
  config,
  build
}
