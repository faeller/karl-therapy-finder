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
const TOKEN_SECRET = process.env.KARL_JWT_SECRET

// Validate token secret
if (!TOKEN_SECRET || TOKEN_SECRET === 'your-random-jwt-secret-64-chars-long') {
  throw new Error('Token secret not configured or using default placeholder')
}

// Simple token generation for Cloudflare Workers compatibility
function generateAdminToken(): string {
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(16).toString('hex')
  const payload = `admin:${timestamp}:${randomBytes}`
  
  // Create HMAC signature
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET)
  hmac.update(payload)
  const signature = hmac.digest('hex')
  
  // Combine payload and signature
  return Buffer.from(`${payload}:${signature}`).toString('base64')
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

  // Generate admin token
  const token = generateAdminToken()

  // Set httpOnly cookie with proper settings for Cloudflare
  setCookie(event, 'karl-admin-token', token, {
    httpOnly: true,
    secure: true, // Always secure for production deployment
    sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/' // Ensure cookie is available site-wide, let domain auto-detect
  })

  return {
    success: true,
    message: 'Login erfolgreich',
    token
  }
})