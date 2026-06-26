import fp from 'fastify-plugin'
import { env } from '../config/env'
import { PERSISTENCE_METHOD } from '../types/persistence'
import { InMemoryStore } from '../infrastructure/in-memory-store'

/**
 * Factory that returns a Fastify plugin for the configured raw store.
 *
 * This plugin is purely infrastructure — it knows nothing about domains
 * (todos, notes, etc.). Feature plugins depend on it and build their own
 * repository + service chains on top.
 *
 * To add a new backend:
 *   1. Add a value to PERSISTENCE_METHOD enum
 *   2. Add a case here that creates the store and decorates it
 *   3. Feature plugins (e.g. todos.plugin.ts) add their own case to pick
 *      the matching repository adapter
 *
 * Test helpers can pre-decorate `inMemoryStore` before registering this plugin
 * to share state across multiple app builds.
 */
export function createPersistencePlugin() {
  return fp(async (fastify) => {
    switch (env.PERSISTENCE_METHOD) {
      case PERSISTENCE_METHOD.INMEMORY: {
        if (!fastify.hasDecorator('inMemoryStore')) {
          fastify.decorate('inMemoryStore', new InMemoryStore())
        }
        break
      }

      // TODO: Uncomment when SQLite implementation is ready (SPEC step 4)
      // Requires: src/plugins/sqlite.plugin.ts with a decorate('sqliteDb', db).
      // case PERSISTENCE_METHOD.SQLITE:
      //   fastify.register(sqlitePlugin)
      //   break

      default:
        fastify.log.warn(
          `Unknown PERSISTENCE_METHOD "${env.PERSISTENCE_METHOD}", falling back to in-memory`,
        )
        if (!fastify.hasDecorator('inMemoryStore')) {
          fastify.decorate('inMemoryStore', new InMemoryStore())
        }
    }
  }, { name: 'persistence' })
}
