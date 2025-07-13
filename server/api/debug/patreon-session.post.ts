export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tokens } = body

  if (!tokens || !tokens.access_token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tokens provided'
    })
  }

  try {
    // Generate a secure session ID
    const sessionId = crypto.randomUUID()
    
    // Store tokens in KV with 30-minute expiry for debug sessions
    const expirationTtl = 30 * 60 // 30 minutes in seconds
    
    const sessionData = {
      tokens,
      createdAt: Date.now(),
      expiresAt: Date.now() + (expirationTtl * 1000)
    }

    // Store in Cloudflare KV via NuxtHub
    const storage = hubKV()
    await storage.setItem(`patreon_debug_session:${sessionId}`, JSON.stringify(sessionData), {
      ttl: expirationTtl
    })

    console.log('🔐 Created debug Patreon session:', sessionId.substring(0, 8) + '...')

    return {
      sessionId,
      expiresAt: sessionData.expiresAt
    }
  } catch (error: any) {
    console.error('❌ Failed to create debug session:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create debug session'
    })
  }
})