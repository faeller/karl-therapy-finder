export default defineEventHandler(async (event) => {
  // Clear the admin token cookie
  setCookie(event, 'karl-admin-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0 // Expire immediately
  })

  return {
    success: true,
    message: 'Logged out successfully'
  }
})