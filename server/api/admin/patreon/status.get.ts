export default defineEventHandler(async (event) => {
  try {
    // Authentication is handled by middleware
    const storage = hubKV()
    
    // Get Patreon configuration
    const configData = await storage.getItem('patreon_campaign_config')
    
    if (!configData) {
      return {
        connected: false,
        status: 'not_configured'
      }
    }

    const config = typeof configData === 'string' ? JSON.parse(configData) : configData

    // Check if we have a valid access token
    if (!config.accessToken || config.status !== 'connected') {
      return {
        connected: false,
        status: config.status || 'configured',
        clientId: config.clientId ? config.clientId.substring(0, 8) + '...' : null
      }
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(config.tokenExpiresAt)
    const isExpired = now >= expiresAt

    if (isExpired) {
      // Try to refresh the token
      try {
        const refreshResponse = await $fetch('https://www.patreon.com/api/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'KARL-Therapy-Finder'
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: config.refreshToken,
            client_id: config.clientId,
            client_secret: config.clientSecret
          })
        })

        // Update stored configuration with new tokens
        const updatedConfig = {
          ...config,
          accessToken: refreshResponse.access_token,
          refreshToken: refreshResponse.refresh_token,
          tokenExpiresAt: new Date(Date.now() + (refreshResponse.expires_in * 1000)).toISOString(),
          lastRefreshed: new Date().toISOString()
        }

        await storage.setItem('patreon_campaign_config', JSON.stringify(updatedConfig))
        
        console.log('🔄 Patreon access token refreshed')
        
        return {
          connected: true,
          status: 'connected',
          campaign: config.campaign,
          user: config.user,
          campaignError: config.campaignError,
          tokenExpiresAt: updatedConfig.tokenExpiresAt
        }

      } catch (refreshError) {
        console.error('❌ Failed to refresh Patreon token:', refreshError)
        
        // Update status to indicate token refresh failed
        const errorConfig = {
          ...config,
          status: 'token_expired',
          lastError: new Date().toISOString()
        }
        await storage.setItem('patreon_campaign_config', JSON.stringify(errorConfig))
        
        return {
          connected: false,
          status: 'token_expired',
          campaign: config.campaign
        }
      }
    }

    return {
      connected: true,
      status: 'connected',
      campaign: config.campaign,
      user: config.user,
      campaignError: config.campaignError,
      tokenExpiresAt: config.tokenExpiresAt,
      connectedAt: config.connectedAt
    }

  } catch (error: any) {
    console.error('❌ Failed to get Patreon status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get Patreon status'
    })
  }
})