export default defineNuxtRouteMiddleware(async (to, from) => {
  // Check if user is on client side
  if (process.server) {
    return
  }

  try {
    // Check for Patreon debug session (matching admin page pattern)
    const sessionId = localStorage.getItem('patreon_debug_session')
    const sessionExpiry = localStorage.getItem('patreon_debug_session_expires')
    
    if (!sessionId || !sessionExpiry || Date.now() >= parseInt(sessionExpiry)) {
      return navigateTo(`/login?access_required=true&error=patreon_auth_required&return_to=${encodeURIComponent(to.path)}`)
    }

    // Verify admin access via API (this will check the session and admin email)
    const adminData = await $fetch('/api/admin/verify', {
      headers: {
        'Authorization': `Bearer ${sessionId}`
      }
    })

    if (!adminData.isAdmin) {
      return navigateTo(`/login?access_required=true&error=access_denied&return_to=${encodeURIComponent(to.path)}`)
    }

    // Session is valid and user is admin, allow access
    return
  } catch (error) {
    console.error('Admin auth middleware error:', error)
    return navigateTo(`/login?access_required=true&error=auth_failed&return_to=${encodeURIComponent(to.path)}`)
  }
})