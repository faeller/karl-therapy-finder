export default defineEventHandler(async (event) => {
  try {
    // Authentication is handled by admin middleware
    const body = await readBody(event)
    const { month, received, required, source = 'manual' } = body
    
    if (!month || received === undefined || required === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Month, received, and required fields are required'
      })
    }
    
    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/
    if (!monthRegex.test(month)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Month must be in YYYY-MM format'
      })
    }
    
    const storage = hubKV()
    const historyKey = `funding_history:${month}`
    
    // Get existing record if any
    const existingData = await storage.getItem(historyKey)
    const existing = existingData ? (typeof existingData === 'string' ? JSON.parse(existingData) : existingData) : null
    
    const recordData = {
      month,
      received: Number(received),
      required: Number(required),
      source, // 'manual', 'patreon', etc.
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString()
    }
    
    // Store the record
    await storage.setItem(historyKey, JSON.stringify(recordData))
    
    console.log(`💰 Updated funding record for ${month}: €${received} received / €${required} required`)
    
    return {
      success: true,
      data: recordData
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Failed to record funding data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to record funding data'
    })
  }
})