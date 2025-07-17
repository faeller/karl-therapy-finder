export default defineEventHandler(async (event) => {
  // Check authentication
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const sessionId = authHeader.substring(7)
  
  try {
    // Get session data from KV
    const sessionData = await hubKV().getItem(`patreon_debug_session:${sessionId}`)
    if (!sessionData) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Session not found'
      })
    }

    const parsedData = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData
    
    // Check if session is still valid
    if (Date.now() > parsedData.expiresAt) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Session expired'
      })
    }

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

    // Get usage history from KV (last 30 days)
    const historyKey = `usage_history:${userEmail}`
    const historyData = await hubKV().getItem(historyKey) || []
    
    // Filter to last 30 days and sort by date (newest first)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const filteredHistory = historyData
      .filter((entry: any) => new Date(entry.date) >= thirtyDaysAgo)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50) // Limit to 50 entries

    return {
      success: true,
      data: filteredHistory
    }
  } catch (error) {
    console.error('Error fetching usage history:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch usage history'
    })
  }
})