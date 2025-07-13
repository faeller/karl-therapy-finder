export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { code, state } = body

    if (!code || !state) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Authorization code and state are required'
      })
    }

    const storage = hubKV()
    
    // Verify state parameter
    const stateData = await storage.getItem(`patreon_oauth_state:${state}`)
    if (!stateData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired state parameter'
      })
    }

    // Get Patreon configuration
    const configData = await storage.getItem('patreon_campaign_config')
    if (!configData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Patreon configuration not found'
      })
    }

    const config = typeof configData === 'string' ? JSON.parse(configData) : configData

    // Exchange authorization code for access token
    const tokenResponse = await $fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'KARL-Therapy-Finder'
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri
      })
    })

    // Fetch campaign information with detailed error handling
    let campaignResponse
    try {
      console.log('🔍 Fetching Patreon campaigns with token:', tokenResponse.access_token ? 'present' : 'missing')
      
      campaignResponse = await $fetch('https://www.patreon.com/api/oauth2/v2/campaigns', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenResponse.access_token}`,
          'User-Agent': 'KARL-Therapy-Finder'
        },
        query: {
          'fields[campaign]': 'created_at,creation_name,patron_count,summary,url,vanity'
        }
      })
    } catch (campaignError: any) {
      console.error('❌ Patreon campaigns API error:', {
        status: campaignError.status || campaignError.statusCode,
        statusText: campaignError.statusText || campaignError.statusMessage,
        data: campaignError.data,
        response: campaignError.response,
        message: campaignError.message
      })
      
      // Try to get user info instead to verify token works
      try {
        console.log('🔄 Trying identity endpoint instead...')
        const identityResponse = await $fetch('https://www.patreon.com/api/oauth2/v2/identity', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`,
            'User-Agent': 'KARL-Therapy-Finder'
          },
          query: {
            'fields[user]': 'email,first_name,full_name,image_url'
          }
        })
        
        console.log('✅ Identity fetch successful:', identityResponse.data?.attributes?.email)
        
        // Store connection without campaign data for now
        const connectedConfig = {
          ...config,
          status: 'connected',
          connectedAt: new Date().toISOString(),
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          tokenExpiresAt: new Date(Date.now() + (tokenResponse.expires_in * 1000)).toISOString(),
          user: {
            email: identityResponse.data?.attributes?.email,
            name: identityResponse.data?.attributes?.full_name || identityResponse.data?.attributes?.first_name
          },
          campaignError: 'No campaign access - user may not have a campaign or insufficient permissions'
        }

        await storage.setItem('patreon_campaign_config', JSON.stringify(connectedConfig))
        
        // Reset sync timestamp to allow immediate sync after reconnection
        await storage.removeItem('patreon_last_auto_sync')
        
        await storage.removeItem(`patreon_oauth_state:${state}`)

        return {
          success: true,
          user: connectedConfig.user,
          warning: 'Connected but no campaign access - check if account has a campaign'
        }
        
      } catch (identityError: any) {
        console.error('❌ Identity API also failed:', identityError)
        throw createError({
          statusCode: 400,
          statusMessage: `Patreon API access failed: ${campaignError.message || 'Unknown error'}`
        })
      }
    }

    const campaign = campaignResponse.data?.[0]
    if (!campaign) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No campaign found for this Patreon account'
      })
    }

    // Store the connected campaign data
    const connectedConfig = {
      ...config,
      status: 'connected',
      connectedAt: new Date().toISOString(),
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiresAt: new Date(Date.now() + (tokenResponse.expires_in * 1000)).toISOString(),
      campaign: {
        id: campaign.id,
        name: campaign.attributes.creation_name,
        patronCount: campaign.attributes.patron_count,
        url: campaign.attributes.url,
        vanity: campaign.attributes.vanity
      }
    }

    await storage.setItem('patreon_campaign_config', JSON.stringify(connectedConfig))

    // Reset sync timestamp to allow immediate sync after reconnection
    await storage.removeItem('patreon_last_auto_sync')

    // Clean up state
    await storage.removeItem(`patreon_oauth_state:${state}`)

    console.log('✅ Patreon campaign connected:', campaign.attributes.creation_name)

    return {
      success: true,
      campaign: connectedConfig.campaign
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Failed to process Patreon OAuth callback:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process Patreon OAuth callback'
    })
  }
})