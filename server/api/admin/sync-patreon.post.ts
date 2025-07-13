export default defineEventHandler(async (event) => {
  try {
    const storage = hubKV()
    
    // Check for cache first (5-minute cache)
    const cacheKey = 'funding_sync_cache'
    const cachedData = await storage.getItem(cacheKey)
    
    if (cachedData) {
      const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData
      const cacheAge = Date.now() - new Date(parsed.cachedAt).getTime()
      
      // Return cached data if less than 5 minutes old
      if (cacheAge < 5 * 60 * 1000) {
        console.log('🔄 Returning cached Patreon funding data')
        return {
          success: true,
          data: parsed.data,
          patreonData: parsed.patreonData,
          cached: true,
          cacheAge: Math.round(cacheAge / 1000)
        }
      }
    }
    
    // Get Patreon configuration
    const configData = await storage.getItem('patreon_campaign_config')
    if (!configData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Patreon not configured'
      })
    }

    const config = typeof configData === 'string' ? JSON.parse(configData) : configData

    if (!config.accessToken || config.status !== 'connected') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Patreon not connected'
      })
    }

    // Use the shared sync function
    const syncResult = await performPatreonSync(config, storage)

    // Cache the result for 5 minutes
    const now = new Date()
    const cacheData = {
      data: syncResult.data,
      patreonData: syncResult.patreonData,
      cachedAt: now.toISOString()
    }
    await storage.setItem(cacheKey, JSON.stringify(cacheData), { ttl: 300 }) // 5 minutes TTL

    return {
      success: true,
      data: syncResult.data,
      patreonData: syncResult.patreonData,
      cached: false
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Failed to sync Patreon funding:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to sync Patreon funding: ' + (error.message || 'Unknown error')
    })
  }
})