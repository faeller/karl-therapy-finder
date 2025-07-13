export default defineEventHandler(async (event) => {
  try {
    // Monthly costs breakdown
    const costs = {
      phoneNumber: 7,      // 7€/month for KARL Phone Number
      domain: 10 / 12,     // 10€/year = 0.83€/month
      calling: 5,          // 5€/month for calling infrastructure
      hosting: 4          // 4€/month for hosting costs
    }

    const totalMonthlyCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0)
    
    // Get current month and year for display
    const now = new Date()
    const currentMonth = now.toLocaleDateString('de-DE', { 
      month: 'long', 
      year: 'numeric' 
    })
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Get funding data for current month from KV storage
    const storage = hubKV()
    const historyKey = `funding_history:${currentMonthKey}`
    const currentMonthData = await storage.getItem(historyKey)
    
    let monthlyFunding = 0
    if (currentMonthData) {
      const data = typeof currentMonthData === 'string' ? JSON.parse(currentMonthData) : currentMonthData
      monthlyFunding = data.received || 0
    }

    // Check if Patreon is connected and determine sync/data behavior
    let patreonData = null
    let syncTriggered = false
    const patreonConfig = await storage.getItem('patreon_campaign_config')
    const isPatreonConnected = patreonConfig ? 
      (typeof patreonConfig === 'string' ? JSON.parse(patreonConfig) : patreonConfig).status === 'connected' : 
      false
    
    if (currentMonthData) {
      const data = typeof currentMonthData === 'string' ? JSON.parse(currentMonthData) : currentMonthData
      
      // If Patreon is disconnected but we have Patreon-sourced data, reset it
      if (!isPatreonConnected && data.source?.includes('patreon')) {
        console.log('🔌 Patreon disconnected, resetting funding data to 0')
        monthlyFunding = 0
      } else if (isPatreonConnected) {
        // Check if we should sync (data older than 5 minutes and from Patreon, OR Patreon reconnected with 0€)
        const lastUpdated = new Date(data.updatedAt || '2000-01-01')
        const dataAge = Date.now() - lastUpdated.getTime()
        
        // Immediate sync if Patreon is connected but funding is 0 and source is 'none' (fresh reconnection)
        if (data.source === 'none' && monthlyFunding === 0) {
          syncTriggered = true
        }
        // Regular sync for older data
        else if (dataAge > 5 * 60 * 1000 && (data.source?.includes('patreon') || data.source === 'none')) {
          syncTriggered = true
        }
      }
    } else if (isPatreonConnected) {
      // No data exists, but Patreon is connected - try to sync
      syncTriggered = true
    }

    // Check if we should trigger an automatic sync (every 10 minutes)
    if (syncTriggered && isPatreonConnected) {
      const lastSyncKey = 'patreon_last_auto_sync'
      const lastSyncData = await storage.getItem(lastSyncKey)
      const lastSyncTime = lastSyncData ? new Date(lastSyncData as string) : new Date(0)
      const timeSinceLastSync = Date.now() - lastSyncTime.getTime()
      
      
      // Only sync if it's been more than 10 minutes (600,000 ms)
      if (timeSinceLastSync > 10 * 60 * 1000) {
        try {
          console.log('🔄 Triggering automatic Patreon funding sync (10+ minutes elapsed)...')
          
          if (patreonConfig) {
            const config = typeof patreonConfig === 'string' ? JSON.parse(patreonConfig) : patreonConfig
            
            if (config.accessToken) {
              // Call the sync logic directly instead of making HTTP request
              const syncResult = await performPatreonSync(config, storage)
              
              if (syncResult.success) {
                // Update with fresh data
                monthlyFunding = syncResult.data.received || 0
                patreonData = syncResult.patreonData
                
                // Update last sync timestamp
                await storage.setItem(lastSyncKey, now.toISOString())
                console.log('✅ Automatic funding sync completed successfully')
              }
            }
          }
        } catch (syncError) {
          // Silently continue if sync fails, but log the error
          console.warn('⚠️  Automatic Patreon sync failed:', syncError.message || syncError)
        }
      }
    }

    // If Patreon is disconnected, clear any stale Patreon data
    if (!isPatreonConnected) {
      patreonData = null
    }

    const isCovered = monthlyFunding >= totalMonthlyCosts

    // Store/update current month's data - only if data changed or doesn't exist
    const newRecordData = {
      month: currentMonthKey,
      received: monthlyFunding,
      required: totalMonthlyCosts,
      source: isPatreonConnected && monthlyFunding > 0 ? 'patreon' : 'none',
      updatedAt: now.toISOString()
    }
    
    // Only update if data has changed or doesn't exist
    let shouldUpdateRecord = false
    if (!currentMonthData) {
      shouldUpdateRecord = true
    } else {
      const existingData = typeof currentMonthData === 'string' ? JSON.parse(currentMonthData) : currentMonthData
      if (existingData.received !== monthlyFunding || existingData.source !== newRecordData.source) {
        shouldUpdateRecord = true
      }
    }
    
    if (shouldUpdateRecord) {
      await storage.setItem(historyKey, JSON.stringify(newRecordData))
    }

    return {
      costs: {
        phoneNumber: costs.phoneNumber,
        domain: costs.domain,
        calling: costs.calling,
        hosting: costs.hosting,
        total: totalMonthlyCosts
      },
      funding: {
        received: monthlyFunding,
        required: totalMonthlyCosts,
        isCovered,
        deficit: Math.max(0, totalMonthlyCosts - monthlyFunding)
      },
      period: {
        month: currentMonth,
        monthKey: currentMonthKey,
        timestamp: now.toISOString()
      },
      patreon: patreonData ? {
        patronCount: patreonData.patronCount,
        activePatronCount: patreonData.activePatronCount,
        monthlyRevenueEur: patreonData.monthlyRevenueEur,
        lastSyncAt: patreonData.lastSyncAt,
        isMonthly: patreonData.isMonthly
      } : null,
      fundingEnabled: isPatreonConnected,
      syncTriggered
    }

  } catch (error: any) {
    console.error('❌ Failed to get funding status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get funding status'
    })
  }
})