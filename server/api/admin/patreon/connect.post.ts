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

    const body = await readBody(event)
    const { clientId, clientSecret, redirectUri } = body

    if (!clientId || !clientSecret) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Client ID and Client Secret are required'
      })
    }

    // SECURITY: Validate redirect URI against whitelist to prevent OAuth hijacking
    if (redirectUri) {
      const config = useRuntimeConfig()
      const allowedRedirectUris = config.patreonAllowedRedirectUris?.split(',').map(uri => uri.trim()) || []
      
      if (!allowedRedirectUris.includes(redirectUri)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid redirect URI. Must be in the allowed redirect URIs list.'
        })
      }
    }

    // Store Patreon OAuth configuration
    const storage = hubKV()
    const patreonConfig = {
      clientId,
      clientSecret,
      redirectUri: redirectUri || 'https://karl-helps.org/admin/patreon/callback',
      connectedBy: adminUser.email,
      connectedAt: new Date().toISOString(),
      status: 'configured' // 'configured', 'connected', 'error'
    }

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

    console.log('🔗 Patreon OAuth configuration saved for admin:', adminUser.email)

    return {
      success: true,
      authUrl,
      config: {
        clientId,
        redirectUri: patreonConfig.redirectUri,
        status: 'configured'
      }
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Failed to configure Patreon OAuth:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to configure Patreon OAuth'
    })
  }
})