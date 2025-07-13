export default defineEventHandler(async (event) => {
  // Only apply this middleware to routes starting with /api/admin/
  if (!event.path.startsWith('/api/admin/')) {
    return
  }

  const config = useRuntimeConfig()
  const adminEmail = config.karlAdminPatreonEmail
  if (!adminEmail) {
    throw createError({ statusCode: 500, statusMessage: 'Admin email not configured' })
  }

  // Get sessionId from Authorization header (more secure than query params)
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Authorization header is missing or invalid' })
  }
  const sessionId = authHeader.substring(7) // Remove "Bearer "

  // Get session data from KV
  const storage = hubKV()
  const sessionData = await storage.getItem(`patreon_debug_session:${sessionId}`)
  if (!sessionData) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
  }

  const parsedData = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData
  
  // Check if session is still valid
  if (Date.now() > parsedData.expiresAt) {
    await storage.removeItem(`patreon_debug_session:${sessionId}`)
    throw createError({ statusCode: 410, statusMessage: 'Session expired' })
  }

  // Fetch fresh user data from Patreon using the stored tokens for maximum security
  const tokens = parsedData.tokens
  try {
    const response = await $fetch('https://www.patreon.com/api/oauth2/v2/identity', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      query: {
        'fields[user]': 'email,full_name,is_email_verified'
      }
    })

    const userData = response.data
    const userEmail = userData.attributes.email

    // Verify the user is the admin
    if (userEmail !== adminEmail) {
      throw createError({ statusCode: 403, statusMessage: 'Access denied' })
    }

    // Store user info in event context for potential use by endpoints
    event.context.adminUser = {
      id: userData.id,
      email: userEmail,
      full_name: userData.attributes.full_name,
      is_email_verified: userData.attributes.is_email_verified
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('❌ Admin auth failed during Patreon verification:', error)
    throw createError({ statusCode: 401, statusMessage: 'Authentication failed' })
  }

  // If all checks pass, the request can proceed to the actual API handler
})