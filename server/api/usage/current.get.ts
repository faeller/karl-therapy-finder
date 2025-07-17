export default defineEventHandler(async (event) => {
  // Check authentication via HttpOnly cookie
  const sessionId = getCookie(event, 'patreon_session')
  if (!sessionId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session cookie is missing'
    })
  }
  
  try {
    // Get session data from KV
    console.log('🔍 Looking for session:', sessionId.substring(0, 8) + '...')
    const sessionData = await hubKV().getItem(`patreon_session:${sessionId}`)
    
    if (!sessionData) {
      console.log('❌ Session not found in KV')
      throw createError({
        statusCode: 401,
        statusMessage: 'Session not found'
      })
    }

    const parsedData = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData
    
    // Check if session is still valid
    if (Date.now() > parsedData.expiresAt) {
      console.log('❌ Session expired:', new Date(parsedData.expiresAt))
      throw createError({
        statusCode: 401,
        statusMessage: 'Session expired'
      })
    }
    
    console.log('✅ Session found and valid')

    // Get user email from tokens by calling Patreon API
    const tokens = parsedData.tokens
    const userResponse = await $fetch('https://www.patreon.com/api/oauth2/v2/identity', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      query: {
        'fields[user]': 'email'
      }
    })

    const userEmail = userResponse.data.attributes.email
    if (!userEmail) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User email not found'
      })
    }

    // Get current month key
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    
    // Get usage data from KV
    const usageKey = `usage:${userEmail}:${monthKey}`
    const usageData = await hubKV().getItem(usageKey) || {
      aiCalls: { used: 0 },
      emailSending: { used: 0 },
      emailReceiving: { used: 0 }
    }

    // Calculate reset date (next month's first day)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const resetDate = nextMonth.toISOString().split('T')[0]

    // Return usage data with reset dates
    return {
      success: true,
      data: {
        aiCalls: {
          used: usageData.aiCalls?.used || 0,
          resetDate
        },
        emailSending: {
          used: usageData.emailSending?.used || 0,
          resetDate,
          status: 'planned' as const
        },
        emailReceiving: {
          used: usageData.emailReceiving?.used || 0,
          resetDate,
          status: 'planned' as const
        }
      }
    }
  } catch (error) {
    console.error('Error fetching usage data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch usage data'
    })
  }
})