import { z } from 'zod'
import { PERSISTENCE_METHOD } from '../types/persistence'

const envSchema = z.object({
  // Production default for safety
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().default(3000),

  PERSISTENCE_METHOD: z.enum(PERSISTENCE_METHOD).default(PERSISTENCE_METHOD.INMEMORY),
})

export const env = envSchema.parse(process.env)
