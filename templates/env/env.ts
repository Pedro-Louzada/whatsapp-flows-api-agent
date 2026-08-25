import z from 'zod'

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3333),
  PRIVATE_PEM: z.string(),
  PUBLIC_PEM: z.string(),
  NODE_ENV: z.string(),
  VERSION_FLOWS_API: z.string(),
  // one BASE_URL (+ credentials) per external system this Flow talks to, e.g.:
  // EXAMPLE_SYSTEM_BASE_URL: z.string().url(),
})

export type Env = z.infer<typeof envSchema>
