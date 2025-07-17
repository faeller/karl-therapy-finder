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

    // Get request body
    const body = await readBody(event)
    const { type, description, metadata } = body

    if (!type || !description) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing type or description'
      })
    }

    // Validate type
    const validTypes = ['ai_call', 'email_sent', 'email_received']
    if (!validTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid usage type'
      })
    }

    // Get current month key
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    
    // Update usage count
    const usageKey = `usage:${userEmail}:${monthKey}`
    const currentUsage = await hubKV().getItem(usageKey) || {
      aiCalls: { used: 0 },
      emailSending: { used: 0 },
      emailReceiving: { used: 0 }
    }

    // Increment the appropriate counter
    switch (type) {
      case 'ai_call':
        currentUsage.aiCalls.used++
        break
      case 'email_sent':
        currentUsage.emailSending.used++
        break
      case 'email_received':
        currentUsage.emailReceiving.used++
        break
    }

    // Save updated usage
    await hubKV().setItem(usageKey, currentUsage)

    // Add to history
    const historyKey = `usage_history:${userEmail}`
    const currentHistory = await hubKV().getItem(historyKey) || []
    
    const historyEntry = {
      id: crypto.randomUUID(),
      type,
      description,
      date: now.toISOString(),
      status: 'success',
      metadata: metadata || {}
    }

    currentHistory.unshift(historyEntry)
    
    // Keep only last 100 entries
    const trimmedHistory = currentHistory.slice(0, 100)
    await hubKV().setItem(historyKey, trimmedHistory)

    return {
      success: true,
      data: {
        id: historyEntry.id,
        usage: currentUsage
      }
    }
  } catch (error) {
    console.error('Error tracking usage:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to track usage'
    })
  }
})