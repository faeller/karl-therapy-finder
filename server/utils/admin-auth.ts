import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.KARL_JWT_SECRET || crypto.randomBytes(32).toString('hex')

export function verifyAdminToken(event: any): boolean {
  try {
    // Check for token in cookie or Authorization header
    const token = getCookie(event, 'karl-admin-token') || 
                 getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!token) {
      return false
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    return decoded.admin === true
  } catch (error) {
    return false
  }
}

export function requireAdmin(event: any) {
  if (!verifyAdminToken(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Admin authentication required'
    })
  }
}