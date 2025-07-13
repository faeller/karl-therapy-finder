export default defineEventHandler(async (event) => {
  try {
    // Authentication is handled by middleware - admin user info is in event.context.adminUser
    const adminUser = event.context.adminUser
    if (!adminUser) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Admin user context not found'
      })
    }

    const config = useRuntimeConfig()
    
    // Use the existing Patreon OAuth credentials from environment
    const clientId = config.public.patreonClientId
    const clientSecret = config.patreonClientSecret
    
    if (!clientId || !clientSecret) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Patreon OAuth credentials not configured in environment'
      })
    }

    // Get the host for dynamic redirect URI
    const host = getHeader(event, 'host') || 'karl-helps.org'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const redirectUri = `${protocol}://${host}/admin/patreon/callback`
    
    // Store Patreon OAuth configuration
    const patreonConfig = {
      clientId,
      clientSecret,
      redirectUri,
      connectedBy: adminUser.email,
      connectedAt: new Date().toISOString(),
      status: 'configured' // 'configured', 'connected', 'error'
    }

    const storage = hubKV()
    await storage.setItem('patreon_campaign_config', JSON.stringify(patreonConfig))

    // Generate OAuth authorization URL
    const state = crypto.randomUUID()
    await storage.setItem(`patreon_oauth_state:${state}`, JSON.stringify({
      adminEmail: adminUser.email,
      createdAt: new Date().toISOString()
    }), { ttl: 600 }) // 10 minute expiry

    const scopes = ['identity', 'campaigns', 'campaigns.members']
    const authUrl = `https://www.patreon.com/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(patreonConfig.redirectUri)}&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `state=${encodeURIComponent(state)}`

    console.log('🔗 Patreon OAuth login initiated for admin:', adminUser.email)

    // Return the auth URL instead of redirecting
    return {
      success: true,
      authUrl
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Failed to initiate Patreon login:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to initiate Patreon login'
    })
  }
})