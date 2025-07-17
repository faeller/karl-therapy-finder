export default defineNuxtRouteMiddleware(async (to, from) => {
  // Check if user is on client side
  if (process.server) {
    return
  }

  try {
    // Verify admin access via API (this will check the HttpOnly cookie and admin email)
    const adminData = await $fetch('/api/admin/verify', {
      method: 'GET'
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