// Simple rate limiting utilities

interface RateLimitEntry {
  count: number
  resetTime: number
  hourlyCount: number
  hourlyResetTime: number
}

// In-memory store (in production, consider Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 30,
  maxRequestsPerHour: 200,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
}

// Localhost/development IPs that should never be rate limited
const DEVELOPMENT_IPS = new Set([
  '127.0.0.1',
  '::1',
  'localhost',
  '192.168.',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.'
])

// Get client IP address
export function getClientIP(event: any): string {
  // Try to get IP from various headers
  const headers = event.node?.req?.headers || {}
  
  // Check common proxy headers
  const forwardedFor = headers['x-forwarded-for']
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = headers['x-real-ip']
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = headers['cf-connecting-ip']
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to connection IP
  const remoteAddress = event.node?.req?.connection?.remoteAddress ||
                       event.node?.req?.socket?.remoteAddress ||
                       'unknown'
  
  return remoteAddress
}

// Check if IP is a development/local IP
function isDevelopmentIP(ip: string): boolean {
  if (ip === 'unknown' || DEVELOPMENT_IPS.has(ip)) {
    return true
  }
  
  // Check for private IP ranges
  for (const prefix of DEVELOPMENT_IPS) {
    if (ip.startsWith(prefix)) {
      return true
    }
  }
  
  return false
}

// Check rate limits
export function checkRateLimit(ip: string, endpoint: string): { allowed: boolean; error?: string; retryAfter?: number } {
  const now = Date.now()
  const key = `${ip}:${endpoint}`
  
  // Never rate limit development IPs
  if (isDevelopmentIP(ip)) {
    return { allowed: true }
  }
  
  // Cleanup old entries on every request
  cleanupRateLimitStore()
  
  const entry = rateLimitStore.get(key) || { 
    count: 0, 
    resetTime: now + 60000,
    hourlyCount: 0,
    hourlyResetTime: now + 3600000
  }
  
  // Reset minute counter if time window expired
  if (now > entry.resetTime) {
    entry.count = 0
    entry.resetTime = now + 60000
  }
  
  // Reset hourly counter if time window expired
  if (now > entry.hourlyResetTime) {
    entry.hourlyCount = 0
    entry.hourlyResetTime = now + 3600000
  }
  
  entry.count++
  entry.hourlyCount++
  
  // Check minute limits first
  if (entry.count > RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    rateLimitStore.set(key, entry)
    
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      allowed: false,
      error: 'Rate limit exceeded. Too many requests per minute.',
      retryAfter
    }
  }
  
  // Check hourly limits
  if (entry.hourlyCount > RATE_LIMIT_CONFIG.maxRequestsPerHour) {
    rateLimitStore.set(key, entry)
    
    const retryAfter = Math.ceil((entry.hourlyResetTime - now) / 1000)
    return {
      allowed: false,
      error: 'Rate limit exceeded. Too many requests per hour.',
      retryAfter
    }
  }
  
  rateLimitStore.set(key, entry)
  return { allowed: true }
}

// Security middleware - simple rate limiting only
export function securityMiddleware(event: any): { allowed: boolean; error?: string; status?: number; retryAfter?: number } {
  const ip = getClientIP(event)
  const endpoint = event.node?.req?.url?.split('?')[0] || 'unknown'
  
  // Check rate limits
  const rateCheck = checkRateLimit(ip, endpoint)
  if (!rateCheck.allowed) {
    console.warn(`🚫 Rate limit exceeded: ${ip} on ${endpoint}`)
    return {
      allowed: false,
      error: rateCheck.error,
      status: 429,
      retryAfter: rateCheck.retryAfter
    }
  }
  
  return { allowed: true }
}

// Cleanup function to prevent memory leaks
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  
  // Clean rate limit store - remove entries where both time windows have expired
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime && now > entry.hourlyResetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Cleanup is called on every request to avoid Cloudflare Workers global scope restrictions