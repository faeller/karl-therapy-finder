export default defineEventHandler(async (event) => {
  try {
    // Get sessionId from HttpOnly cookie
    const sessionId = getCookie(event, 'patreon_session')
    
    if (sessionId) {
      // Delete session from KV
      const storage = hubKV()
      await storage.removeItem(`patreon_session:${sessionId}`)
      console.log('🗑️ Deleted Patreon session:', sessionId.substring(0, 8) + '...')
    }

    // Clear the cookie
    setCookie(event, 'patreon_session', '', { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'lax', 
      maxAge: 0, 
      path: '/' 
    })

    return {
      success: true
    }
  } catch (error: any) {
    console.error('❌ Failed to logout:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to logout'
    })
  }
})