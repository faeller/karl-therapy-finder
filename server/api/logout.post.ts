export default defineEventHandler(async (event) => {
  try {
    // Get sessionId from HttpOnly cookie
    const sessionId = getCookie(event, 'patreon_session')
    
    if (sessionId) {
      // Delete session from KV
      const storage = hubKV()
      await storage.removeItem(`patreon_session:${sessionId}`)
      console.log('🗑️ Deleted Patreon session on logout:', sessionId.substring(0, 8) + '...')
    }

    // Clear the cookie
    setCookie(event, 'patreon_session', '', { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'lax', 
      maxAge: 0, 
      path: '/' 
    })

    // Redirect to home page
    return sendRedirect(event, '/therapists')
  } catch (error: any) {
    console.error('❌ Failed to logout:', error)
    // Even if logout fails, redirect to home
    return sendRedirect(event, '/therapists')
  }
})