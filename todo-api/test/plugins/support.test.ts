import { test, expect } from 'vitest'

import Fastify from 'fastify'
import Support from '../../src/plugins/support'

test('support works standalone', async () => {
  const fastify = Fastify()
  await fastify.register(Support)
  await fastify.ready()

  expect(fastify.someSupport()).toBe('hugs')
})
