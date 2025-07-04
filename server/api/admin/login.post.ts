import jwt from 'jsonwebtoken'
import crypto from 'crypto'

interface LoginRequest {
  password: string
}

interface LoginResponse {
  success: boolean
  message: string
  token?: string
}

// Admin password (must be set via environment variable)
const ADMIN_PASSWORD = process.env.KARL_ADMIN_PASSWORD
const JWT_SECRET = process.env.KARL_JWT_SECRET

// Validate JWT secret
if (!JWT_SECRET || JWT_SECRET === 'your-random-jwt-secret-64-chars-long') {
  throw new Error('JWT secret not configured or using default placeholder')
}

export default defineEventHandler(async (event): Promise<LoginResponse> => {
  const body = await readBody(event) as LoginRequest
  const { password } = body

  if (!password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password is required'
    })
  }

  // Check if admin password is configured
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'your-secure-admin-password') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Admin password not configured or using default placeholder'
    })
  }

  // Check password
  if (password !== ADMIN_PASSWORD) {
    return {
      success: false,
      message: 'Ungültiges Passwort'
    }
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      admin: true, 
      timestamp: Date.now() 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  // Set httpOnly cookie
  setCookie(event, 'karl-admin-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 // 24 hours
  })

  return {
    success: true,
    message: 'Login erfolgreich',
    token
  }
})