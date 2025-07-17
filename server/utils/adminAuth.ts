import type { H3Event } from 'h3'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  is_email_verified: boolean
}

export async function verifyAdminSession(event: H3Event): Promise<AdminUser> {
  const config = useRuntimeConfig()
  const adminEmail = config.karlAdminPatreonEmail
  
  if (!adminEmail) {
    throw createError({ statusCode: 500, statusMessage: 'Admin email not configured' })
  }

  // Get sessionId from HttpOnly cookie
  const sessionId = getCookie(event, 'patreon_session')
  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Session cookie is missing' })
  }

  // Get session data from KV
  const storage = hubKV()
  const sessionData = await storage.getItem(`patreon_session:${sessionId}`)
  if (!sessionData) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
  }

  const parsedData = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData
  
  // Check if session is still valid
  if (Date.now() > parsedData.expiresAt) {
    await storage.removeItem(`patreon_session:${sessionId}`)
    throw createError({ statusCode: 410, statusMessage: 'Session expired' })
  }

  // Fetch fresh user data from Patreon
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

    const adminUser: AdminUser = {
      id: userData.id,
      email: userEmail,
      full_name: userData.attributes.full_name,
      is_email_verified: userData.attributes.is_email_verified
    }

    // Store user info in event context
    event.context.adminUser = adminUser

    return adminUser

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('❌ Admin auth failed during Patreon verification:', error)
    throw createError({ statusCode: 401, statusMessage: 'Authentication failed' })
  }
}