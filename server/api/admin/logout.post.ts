export default defineEventHandler(async (event) => {
  // Clear the admin token cookie with matching settings
  setCookie(event, 'karl-admin-token', '', {
    httpOnly: true,
    secure: true, // Always secure for production deployment
    sameSite: 'lax', // Match login cookie settings
    maxAge: 0, // Expire immediately
    path: '/' // Ensure cookie is cleared site-wide, let domain auto-detect
  })

  return {
    success: true,
    message: 'Logged out successfully'
  }
})