export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing or invalid authorization header'
    })
  }

  const accessToken = authHeader.replace('Bearer ', '')

  try {
    console.log('🔍 Fetching Patreon user identity')

    // Fetch user identity with memberships
    const response = await $fetch('https://www.patreon.com/api/oauth2/v2/identity', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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

    console.log('✅ Patreon identity fetch successful')

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
      memberships
    }
  } catch (error: any) {
    console.error('❌ Patreon identity fetch error:', error)
    
    if (error.data) {
      console.error('❌ Patreon error details:', error.data)
    }
    
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.data?.errors?.[0]?.detail || error.message || 'Failed to fetch identity'
    })
  }
})