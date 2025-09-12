import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by authGuard preHandler */
    user?: { id: number; email: string }
  }
}
