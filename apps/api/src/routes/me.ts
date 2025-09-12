import type { FastifyInstance } from 'fastify'
import { authGuard } from '../auth.js'

type MeResponse = { id: number; email: string }

export default async function meRoutes(app: FastifyInstance) {
  app.get(
    '/v1/me',
    { preHandler: authGuard },
    async (req): Promise<MeResponse> => {
      // authGuard guarantees req.user is set for this route
      if (!req.user) {
        // Defensive check for type-narrowing; should never happen due to preHandler
        throw new Error('Unauthorized')
      }
      const { id, email } = req.user
      return { id, email }
    }
  )
}
