// This file contains code that we reuse between our tests.
import { afterEach } from 'vitest'
import { FastifyInstance } from 'fastify'

// ─── Force in-memory persistence for all tests ──────────────────────────
//
// app.ts switches on env.PERSISTENCE_METHOD (parsed at module-load time
// from process.env). We set it here *before* importing App so the switch
// hits INMEMORY regardless of .env or CI environment.
import { PERSISTENCE_METHOD } from '../src/types/persistence'
process.env.PERSISTENCE_METHOD = PERSISTENCE_METHOD.INMEMORY

import { createApp } from '../src/app'
import { InMemoryStore } from '../src/infrastructure/in-memory-store'
import type { InMemoryStore as InMemoryStoreType } from '../src/types/persistence'

// Automatically build and tear down our instance
async function build (): Promise<FastifyInstance> {
  const fastify = await createApp()
  afterEach(() => fastify.close())
  return fastify
}

/**
 * Build an app that shares a single InMemoryStore across multiple builds.
 *
 * Useful when a test (or beforeEach) needs to call build() more than once
 * and have state persist between calls.
 *
 * Pre-decorates `inMemoryStore` so the persistence plugin reuses it
 * (hasDecorator check) rather than creating a fresh one.
 */
async function buildWithStore(store: InMemoryStoreType): Promise<FastifyInstance> {
  const fastify = await createApp({
    preDecorate: (fastify) => {
      fastify.decorate('inMemoryStore', store)
    },
  })
  afterEach(() => fastify.close())
  return fastify
}

export {
  build,
  buildWithStore,
  InMemoryStore,
}
