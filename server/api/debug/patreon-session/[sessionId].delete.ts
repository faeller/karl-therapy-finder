export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'sessionId')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID required'
    })
  }

  try {
    // Delete session from KV
    const storage = hubKV()
    await storage.removeItem(`patreon_debug_session:${sessionId}`)

    console.log('🗑️ Deleted debug Patreon session:', sessionId.substring(0, 8) + '...')

    return {
      success: true
    }
  } catch (error: any) {
    console.error('❌ Failed to delete debug session:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete session'
    })
  }
})