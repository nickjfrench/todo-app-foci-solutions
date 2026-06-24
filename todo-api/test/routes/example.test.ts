import { test, expect } from 'vitest'
import { build } from '../helper'

test('example is loaded', async () => {
  const app = await build()

  const res = await app.inject({
    url: '/example',
  })

  expect(res.payload).toBe('this is an example')
})
