import { test, expect } from 'vitest'
import { build } from '../helper'

test('GET /health returns ok status', async () => {
  const app = await build()

  const res = await app.inject({
    method: 'GET',
    url: '/health',
  })

  expect(res.statusCode).toBe(200)
  const body = JSON.parse(res.payload)
  expect(body.status).toBe('ok')
  expect(body.timestamp).toBeDefined()
})
