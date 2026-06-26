// This file contains code that we reuse between our tests.
import { afterEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import App from '../src/app'
import { InMemoryStore } from '../src/infrastructure/in-memory-store'
import type { InMemoryStore as InMemoryStoreType } from '../src/types/persistence'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

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
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  await fastify.register(App)

  // Tear down our app after we are done
  afterEach(() => fastify.close())

  return fastify
}

/**
 * Build an app that shares a single InMemoryStore across multiple builds.
 *
 * Useful when a test (or beforeEach) needs to call build() more than once
 * and have state persist between calls.
 */
async function buildWithStore(store: InMemoryStoreType): Promise<FastifyInstance> {
  const fastify = Fastify(config())
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  fastify.decorate('inMemoryStore', store)
  await fastify.register(App)
  afterEach(() => fastify.close())
  return fastify
}

export {
  config,
  build,
  buildWithStore,
  InMemoryStore,
}
