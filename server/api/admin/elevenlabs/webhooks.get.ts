export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  const query = getQuery(event)
  const type = query.type as string | undefined
  const limit = Math.min(Number(query.limit) || 50, 100)

  try {
    const kv = hubKV()
    
    // Get webhook logs from KV storage
    const keys = await kv.list({
      prefix: type ? `elevenlabs_webhook_${type}:` : 'elevenlabs_webhook_'
    })
    
    // Sort by timestamp (newest first) and limit results
    const sortedKeys = keys.keys
      .map(key => ({
        key: key.name,
        timestamp: parseInt(key.name.split(':')[1]) || 0
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
    
    // Fetch webhook data
    const webhooks = await Promise.all(
      sortedKeys.map(async ({ key }) => {
        try {
          const data = await kv.getItem(key)
          return data ? JSON.parse(data) : null
        } catch (error) {
          console.error(`Failed to parse webhook data for key ${key}:`, error)
          return null
        }
      })
    )
    
    return {
      webhooks: webhooks.filter(Boolean),
      total: keys.keys.length,
      hasMore: keys.keys.length > limit
    }
  } catch (error) {
    console.error('Failed to fetch webhook logs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch webhook logs'
    })
  }
})