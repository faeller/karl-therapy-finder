export default defineEventHandler(async (event) => {
  try {
    const storage = hubKV()
    
    // Get current date for monthly key
    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    // Get all funding history keys (we store by YYYY-MM format)
    const allKeys = await storage.getKeys('funding_history:')
    
    // Sort keys chronologically
    const sortedKeys = allKeys.sort()
    
    // Fetch all history records
    const historyPromises = sortedKeys.map(async (key) => {
      const data = await storage.getItem(key)
      const monthKey = key.replace('funding_history:', '')
      return {
        month: monthKey,
        data: typeof data === 'string' ? JSON.parse(data) : data
      }
    })
    
    const history = await Promise.all(historyPromises)
    
    // Calculate running totals
    let runningTotal = 0
    const historyWithRunningTotals = history.map((record) => {
      const monthlyReceived = record.data?.received || 0
      runningTotal += monthlyReceived
      
      return {
        ...record,
        data: {
          ...record.data,
          runningTotal
        }
      }
    })
    
    // Calculate overall statistics
    const totalReceived = history.reduce((sum, record) => sum + (record.data?.received || 0), 0)
    const totalRequired = history.reduce((sum, record) => sum + (record.data?.required || 0), 0)
    const monthsTracked = history.length
    const averageMonthlyReceived = monthsTracked > 0 ? totalReceived / monthsTracked : 0
    
    return {
      history: historyWithRunningTotals,
      summary: {
        totalReceived,
        totalRequired,
        monthsTracked,
        averageMonthlyReceived,
        currentMonth: currentMonthKey
      }
    }

  } catch (error: any) {
    console.error('❌ Failed to get funding history:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get funding history'
    })
  }
})