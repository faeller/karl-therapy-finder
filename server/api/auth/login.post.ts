export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  // Simple hardcoded admin credentials
  const ADMIN_EMAIL = process.env.KARL_ADMIN_EMAIL || 'admin@karl-helps.org'
  const ADMIN_PASSWORD = process.env.KARL_ADMIN_PASSWORD

  if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'your-secure-admin-password') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Admin credentials not configured'
    })
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    try {
      await setUserSession(event, {
        user: {
          email: ADMIN_EMAIL,
          role: 'admin'
        }
      })
      
      console.log('Session set successfully for admin login')
      
      // Verify session was set
      const session = await getUserSession(event)
      console.log('Session verification after login:', session)

      return {
        success: true,
        message: 'Login erfolgreich'
      }
    } catch (error) {
      console.error('Failed to set user session:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create session'
      })
    }
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Ungültige Anmeldedaten'
  })
})