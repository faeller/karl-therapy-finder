export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'sessionId')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID required'
    })
  }

  try {
    // Retrieve session data from KV
    const storage = hubKV()
    const sessionData = await storage.getItem(`patreon_debug_session:${sessionId}`)

    if (!sessionData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found or expired'
      })
    }

    const parsedData = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData
    
    // Check if session is still valid
    if (Date.now() > parsedData.expiresAt) {
      // Clean up expired session
      await storage.removeItem(`patreon_debug_session:${sessionId}`)
      throw createError({
        statusCode: 410,
        statusMessage: 'Session expired'
      })
    }

    const tokens = parsedData.tokens

    console.log('🔍 Fetching Patreon user identity via debug session')

    // Fetch user identity with memberships using stored tokens
    const response = await $fetch('https://www.patreon.com/api/oauth2/v2/identity', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      query: {
        'include': 'memberships,memberships.currently_entitled_tiers,memberships.campaign',
        'fields[user]': 'email,full_name,image_url,is_email_verified',
        'fields[member]': 'patron_status,is_follower,last_charge_date,last_charge_status,lifetime_support_cents,currently_entitled_amount_cents,pledge_relationship_start',
        'fields[tier]': 'title,amount_cents,description,created_at',
        'fields[campaign]': 'summary,creation_name,patron_count'
      }
    })

    console.log('✅ Patreon identity fetch successful via debug session')

    // Extract user data
    const userData = response.data
    const included = response.included || []

    // Process user information
    const user = {
      id: userData.id,
      email: userData.attributes.email,
      full_name: userData.attributes.full_name,
      image_url: userData.attributes.image_url,
      is_email_verified: userData.attributes.is_email_verified
    }

    // Process memberships
    const memberships = []
    
    if (userData.relationships?.memberships?.data) {
      for (const membershipRef of userData.relationships.memberships.data) {
        const membership = included.find(item => 
          item.type === 'member' && item.id === membershipRef.id
        )
        
        if (membership) {
          const campaign = included.find(item => 
            item.type === 'campaign' && 
            item.id === membership.relationships?.campaign?.data?.id
          )

          // Get entitled tiers
          const entitledTiers = []
          if (membership.relationships?.currently_entitled_tiers?.data) {
            for (const tierRef of membership.relationships.currently_entitled_tiers.data) {
              const tier = included.find(item => 
                item.type === 'tier' && item.id === tierRef.id
              )
              if (tier) {
                entitledTiers.push({
                  id: tier.id,
                  title: tier.attributes.title,
                  amount_cents: tier.attributes.amount_cents,
                  currency: 'USD', // Default to USD since currency field is not available on tier
                  description: tier.attributes.description,
                  created_at: tier.attributes.created_at
                })
              }
            }
          }

          memberships.push({
            campaign_id: campaign?.id || 'unknown',
            patron_status: membership.attributes.patron_status,
            is_follower: membership.attributes.is_follower,
            last_charge_date: membership.attributes.last_charge_date,
            last_charge_status: membership.attributes.last_charge_status,
            lifetime_support_cents: membership.attributes.lifetime_support_cents || 0,
            currently_entitled_amount_cents: membership.attributes.currently_entitled_amount_cents || 0,
            pledge_relationship_start: membership.attributes.pledge_relationship_start,
            tiers: entitledTiers
          })
        }
      }
    }

    return {
      user,
      memberships,
      sessionExpiresAt: parsedData.expiresAt
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Patreon identity fetch error via debug session:', error)
    
    if (error.data) {
      console.error('❌ Patreon error details:', error.data)
    }
    
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.data?.errors?.[0]?.detail || error.message || 'Failed to fetch identity'
    })
  }
})