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
    await storage.removeItem(`patreon_session:${sessionId}`)

    console.log('🗑️ Deleted Patreon session:', sessionId.substring(0, 8) + '...')

    return {
      success: true
    }
  } catch (error: any) {
    console.error('❌ Failed to delete session:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete session'
    })
  }
})