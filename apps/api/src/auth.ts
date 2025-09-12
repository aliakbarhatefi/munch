import jwt from 'jsonwebtoken'
import argon2 from 'argon2'
import { z } from 'zod'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ENV } from './config.js'

/** ----- Password hashing / verification ----- */
export async function hashPassword(pw: string): Promise<string> {
  return argon2.hash(pw, { type: argon2.argon2id })
}
export async function verifyPassword(
  hash: string,
  pw: string
): Promise<boolean> {
  return argon2.verify(hash, pw)
}

/** ----- JWT payloads & type guards ----- */
export type AccessPayload = {
  sub: number // owner id
  email: string
  iat?: number
  exp?: number
}

export type RefreshPayload = {
  sub: number // owner id
  sessionId: number
  iat?: number
  exp?: number
}

function isAccessPayload(p: unknown): p is AccessPayload {
  const v = p as Record<string, unknown>
  return (
    !!v &&
    typeof v.sub === 'number' &&
    typeof v.email === 'string' &&
    typeof v.iat === 'number' &&
    typeof v.exp === 'number'
  )
}

function isRefreshPayload(p: unknown): p is RefreshPayload {
  const v = p as Record<string, unknown>
  return (
    !!v &&
    typeof v.sub === 'number' &&
    typeof v.sessionId === 'number' &&
    typeof v.iat === 'number' &&
    typeof v.exp === 'number'
  )
}

/** ----- JWT sign/verify helpers ----- */
export function signAccess(
  payload: Omit<AccessPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: `${ENV.JWT_EXP_MIN}m` })
}

export function signRefresh(
  payload: Omit<RefreshPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, ENV.REFRESH_TOKEN_SECRET, {
    expiresIn: `${ENV.REFRESH_EXP_DAYS}d`,
  })
}

export function verifyAccess(token: string): AccessPayload {
  const dec = jwt.verify(token, ENV.JWT_SECRET)
  if (typeof dec === 'string' || !isAccessPayload(dec)) {
    throw new Error('Invalid access token payload')
  }
  return dec
}

export function verifyRefresh(token: string): RefreshPayload {
  const dec = jwt.verify(token, ENV.REFRESH_TOKEN_SECRET)
  if (typeof dec === 'string' || !isRefreshPayload(dec)) {
    throw new Error('Invalid refresh token payload')
  }
  return dec
}

/** ----- Zod schemas ----- */
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})
export const LoginSchema = RegisterSchema
export const RefreshSchema = z.object({ refreshToken: z.string().min(20) })

/** ----- Auth guard (Fastify preHandler) ----- */
export async function authGuard(req: FastifyRequest, reply: FastifyReply) {
  const hdr = req.headers.authorization
  if (!hdr?.startsWith('Bearer ')) {
    return reply
      .code(401)
      .send({ code: 'UNAUTHORIZED', message: 'Missing bearer token' })
  }
  try {
    const token = hdr.slice('Bearer '.length)
    const payload = verifyAccess(token)
    // req.user is augmented in src/types/fastify.d.ts
    req.user = { id: payload.sub, email: payload.email }
  } catch {
    return reply
      .code(401)
      .send({ code: 'UNAUTHORIZED', message: 'Invalid/expired token' })
  }
}
