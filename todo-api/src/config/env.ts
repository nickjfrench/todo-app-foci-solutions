import { z } from 'zod'

const envSchema = z.object({
  // Production default for safety
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().default(3000),
})

export const env = envSchema.parse(process.env)
