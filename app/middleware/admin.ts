export default defineNuxtRouteMiddleware(async (to) => {
  // Only apply to admin routes
  if (!to.path.startsWith('/admin')) return

  // Skip login page
  if (to.path === '/admin/login') return

  // Skip middleware during SSR to prevent hydration mismatches
  if (process.server) return

  try {
    const session = await $fetch('/api/auth/session')
    
    if (!session.loggedIn || session.user?.role !== 'admin') {
      return navigateTo('/admin/login')
    }
  } catch (error) {
    console.error('Admin middleware auth check failed:', error)
    return navigateTo('/admin/login')
  }
})