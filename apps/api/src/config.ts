import dotenv from 'dotenv'
dotenv.config()

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env: ${name}`)
  return v
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: required('DATABASE_URL'),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  JWT_SECRET: required('JWT_SECRET'),
  REFRESH_TOKEN_SECRET: required('REFRESH_TOKEN_SECRET'),
  JWT_EXP_MIN: Number(process.env.JWT_EXP_MIN ?? 15),
  REFRESH_EXP_DAYS: Number(process.env.REFRESH_EXP_DAYS ?? 30),
}
