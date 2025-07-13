export async function performPatreonSync(config: any, storage: any) {
  try {
    // Check if token is expired and refresh if needed
    const now = new Date()
    const expiresAt = new Date(config.tokenExpiresAt)
    const isExpired = now >= expiresAt

    if (isExpired && config.refreshToken) {
      console.log('🔄 Access token expired, refreshing...')
      
      // Get credentials from config or runtime if not stored
      let clientId = config.clientId
      let clientSecret = config.clientSecret
      
      if (!clientId || !clientSecret) {
        const runtimeConfig = useRuntimeConfig()
        clientId = clientId || runtimeConfig.public.patreonClientId
        clientSecret = clientSecret || runtimeConfig.patreonClientSecret
      }
      
      if (!clientId || !clientSecret) {
        throw new Error('Missing Patreon OAuth credentials for token refresh')
      }
      
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
            client_id: clientId,
            client_secret: clientSecret
          })
        })

        // Update stored configuration with new tokens
        config.accessToken = refreshResponse.access_token
        config.refreshToken = refreshResponse.refresh_token
        config.tokenExpiresAt = new Date(Date.now() + (refreshResponse.expires_in * 1000)).toISOString()
        config.lastRefreshed = new Date().toISOString()

        await storage.setItem('patreon_campaign_config', JSON.stringify(config))
        console.log('✅ Patreon access token refreshed automatically')
        
      } catch (refreshError) {
        console.error('❌ Failed to refresh Patreon token:', refreshError)
        throw new Error('Token refresh failed: ' + (refreshError.message || 'Unknown error'))
      }
    }
    // Check if we have a campaign ID to work with
    if (!config.campaign?.id) {
      // If no campaign, try to fetch campaigns first
      const campaignsResponse = await $fetch('https://www.patreon.com/api/oauth2/v2/campaigns', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'User-Agent': 'KARL-Therapy-Finder'
        },
        query: {
          'fields[campaign]': 'created_at,creation_name,patron_count,summary,url,vanity'
        }
      })

      const campaigns = campaignsResponse.data
      if (!campaigns || campaigns.length === 0) {
        throw new Error('No campaigns found for this Patreon account')
      }

      // Use the first campaign and update config
      const campaign = campaigns[0]
      config.campaign = {
        id: campaign.id,
        name: campaign.attributes.creation_name,
        patronCount: campaign.attributes.patron_count,
        url: campaign.attributes.url,
        vanity: campaign.attributes.vanity
      }
      
      await storage.setItem('patreon_campaign_config', JSON.stringify(config))
      console.log('✅ Updated campaign config with fetched campaign data')
    }

    // Fetch detailed campaign data including members for accurate revenue calculation
    const [campaignResponse, membersResponse] = await Promise.all([
      // Get campaign basic info
      $fetch(`https://www.patreon.com/api/oauth2/v2/campaigns/${config.campaign.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'User-Agent': 'KARL-Therapy-Finder'
        },
        query: {
          'fields[campaign]': 'created_at,creation_name,patron_count,published_at,summary,url,vanity,is_monthly,pay_per_name'
        }
      }),
      
      // Get active members to calculate actual revenue
      $fetch(`https://www.patreon.com/api/oauth2/v2/campaigns/${config.campaign.id}/members`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'User-Agent': 'KARL-Therapy-Finder'
        },
        query: {
          'fields[member]': 'currently_entitled_amount_cents,patron_status,last_charge_status,is_follower',
          'page[count]': '100' // Get up to 100 members per page
        }
      })
    ])

    const campaign = campaignResponse.data
    const members = membersResponse.data || []

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Calculate total monthly revenue from active paying members
    const activeMembers = members.filter(member => 
      member.attributes.patron_status === 'active_patron' && 
      member.attributes.last_charge_status === 'Paid' &&
      !member.attributes.is_follower &&
      member.attributes.currently_entitled_amount_cents > 0
    )
    
    const totalRevenueCents = activeMembers.reduce((sum, member) => {
      return sum + (member.attributes.currently_entitled_amount_cents || 0)
    }, 0)
    
    const monthlyRevenue = totalRevenueCents / 100 // Convert cents to euros
    const activePatronCount = activeMembers.length
    const totalPatronCount = campaign.attributes.patron_count || 0

    console.log(`📊 Patreon Revenue Analysis:`)
    console.log(`  - Total members: ${members.length}`)
    console.log(`  - Active paying patrons: ${activePatronCount}`)
    console.log(`  - Total patron count: ${totalPatronCount}`)
    console.log(`  - Monthly revenue: €${monthlyRevenue.toFixed(2)}`)

    // Get current month
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Monthly costs breakdown (as per previous conversations)
    const costs = {
      phoneNumber: 7,      // €7 for phone number
      domain: 0.83,        // €10/year = €0.83/month for domain
      calling: 5,          // €5 for calling service
      hosting: 4           // €4 for hosting
    }
    const totalMonthlyCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0)

    const recordData = {
      month: currentMonthKey,
      received: monthlyRevenue,
      required: totalMonthlyCosts,
      source: 'patreon_sync',
      updatedAt: now.toISOString(),
      patreonData: {
        campaignId: config.campaign.id,
        patronCount: totalPatronCount,
        activePatronCount: activePatronCount,
        monthlyRevenueCents: totalRevenueCents,
        monthlyRevenueEur: monthlyRevenue,
        isMonthly: campaign.attributes.is_monthly,
        payPerName: campaign.attributes.pay_per_name,
        lastSyncAt: now.toISOString()
      },
      costBreakdown: costs
    }

    // Store the updated record
    const historyKey = `funding_history:${currentMonthKey}`
    await storage.setItem(historyKey, JSON.stringify(recordData))

    console.log(`💰 Synced Patreon funding for ${currentMonthKey}: €${monthlyRevenue.toFixed(2)} (${activePatronCount} active patrons)`)

    return {
      success: true,
      data: recordData,
      patreonData: recordData.patreonData
    }

  } catch (error: any) {
    console.error('❌ Patreon sync failed:', error)
    throw error
  }
}