import crypto from 'crypto'

const TOKEN_SECRET = process.env.KARL_JWT_SECRET || crypto.randomBytes(32).toString('hex')

// Validate custom admin token
function validateAdminToken(token: string): boolean {
  try {
    // Decode base64 token
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    const parts = decoded.split(':')
    
    if (parts.length !== 4) return false
    
    const [type, timestamp, randomBytes, signature] = parts
    
    // Check if it's an admin token
    if (type !== 'admin') return false
    
    // Check if token is not too old (24 hours)
    const tokenTime = parseInt(timestamp)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (now - tokenTime > maxAge) return false
    
    // Verify signature
    const payload = `${type}:${timestamp}:${randomBytes}`
    const hmac = crypto.createHmac('sha256', TOKEN_SECRET)
    hmac.update(payload)
    const expectedSignature = hmac.digest('hex')
    
    return signature === expectedSignature
  } catch (error) {
    return false
  }
}

export function verifyAdminToken(event: any): boolean {
  try {
    // Check for token in cookie or Authorization header
    const token = getCookie(event, 'karl-admin-token') || 
                 getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!token) {
      return false
    }

    return validateAdminToken(token)
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