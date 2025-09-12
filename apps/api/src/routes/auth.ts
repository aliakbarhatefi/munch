import type { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import argon2 from 'argon2'

import {
  LoginSchema,
  RegisterSchema,
  RefreshSchema,
  hashPassword,
  verifyPassword,
  signAccess,
  signRefresh,
  verifyRefresh,
} from '../auth.js'
import { query } from '../db.js'

async function hashRt(rt: string) {
  return argon2.hash(rt, { type: argon2.argon2id })
}

export default async function authRoutes(app: FastifyInstance) {
  // REGISTER
  app.post('/v1/auth/register', async (req, reply) => {
    const p = RegisterSchema.safeParse(req.body)
    if (!p.success) {
      return reply
        .code(400)
        .send({ code: 'BAD_REQUEST', message: 'Invalid payload' })
    }

    const email = p.data.email.trim().toLowerCase()
    const password = p.data.password

    const { rows: exists } = await query(
      'select id from owner where lower(email)=$1',
      [email]
    )
    if (exists.length) {
      return reply
        .code(409)
        .send({ code: 'CONFLICT', message: 'Email already in use' })
    }

    const password_hash = await hashPassword(password)
    const { rows } = await query(
      'insert into owner(email, password_hash) values ($1,$2) returning id',
      [email, password_hash]
    )

    return reply.send({ ok: true, ownerId: rows[0].id })
  })

  // LOGIN
  app.post('/v1/auth/login', async (req, reply) => {
    const p = LoginSchema.safeParse(req.body)
    if (!p.success) {
      return reply
        .code(400)
        .send({ code: 'BAD_REQUEST', message: 'Invalid payload' })
    }

    const email = p.data.email.trim().toLowerCase()
    const password = p.data.password

    const { rows } = await query(
      'select id, password_hash from owner where lower(email)=$1',
      [email]
    )
    if (!rows.length) {
      return reply
        .code(401)
        .send({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
    }

    const ok = await verifyPassword(rows[0].password_hash, password)
    if (!ok) {
      return reply
        .code(401)
        .send({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
    }

    const refreshRaw = crypto.randomBytes(48).toString('base64url')
    const refreshHash = await hashRt(refreshRaw)

    const { rows: s } = await query(
      'insert into session(owner_id, refresh_token_hash, user_agent, ip) values ($1,$2,$3,$4) returning id',
      [rows[0].id, refreshHash, req.headers['user-agent'] ?? null, req.ip]
    )

    const accessToken = signAccess({ sub: rows[0].id, email })
    const refreshToken = signRefresh({ sub: rows[0].id, sessionId: s[0].id })

    return reply.send({ accessToken, refreshToken })
  })

  // REFRESH
  app.post('/v1/auth/refresh', async (req, reply) => {
    const p = RefreshSchema.safeParse(req.body)
    if (!p.success) {
      return reply
        .code(400)
        .send({ code: 'BAD_REQUEST', message: 'Invalid payload' })
    }

    let payload: { sub: number; sessionId: number }
    try {
      payload = verifyRefresh(p.data.refreshToken)
    } catch {
      return reply
        .code(401)
        .send({ code: 'UNAUTHORIZED', message: 'Invalid refresh token' })
    }

    await query(
      'update session set revoked_at=now() where id=$1 and owner_id=$2',
      [payload.sessionId, payload.sub]
    )

    const newRaw = crypto.randomBytes(48).toString('base64url')
    const newHash = await hashRt(newRaw)

    const { rows: s2 } = await query(
      'insert into session(owner_id, refresh_token_hash, user_agent, ip) values ($1,$2,$3,$4) returning id',
      [payload.sub, newHash, req.headers['user-agent'] ?? null, req.ip]
    )

    // (Optional) fetch email to populate here; left blank to mirror current behavior
    const accessToken = signAccess({ sub: payload.sub, email: '' })
    const newRefresh = signRefresh({ sub: payload.sub, sessionId: s2[0].id })

    return reply.send({ accessToken, refreshToken: newRefresh })
  })

  // LOGOUT
  app.post('/v1/auth/logout', async (req, reply) => {
    const p = RefreshSchema.safeParse(req.body)
    if (!p.success) {
      return reply
        .code(400)
        .send({ code: 'BAD_REQUEST', message: 'Invalid payload' })
    }

    try {
      const { sessionId, sub } = verifyRefresh(p.data.refreshToken)
      await query(
        'update session set revoked_at=now() where id=$1 and owner_id=$2',
        [sessionId, sub]
      )
    } catch {
      // idempotent
    }

    return reply.send({ ok: true })
  })
}
