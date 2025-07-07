export default defineEventHandler(async (event) => {
  try {
    await clearUserSession(event)
    console.log('Session cleared successfully')
    
    return {
      success: true,
      message: 'Logged out successfully'
    }
  } catch (error) {
    console.error('Failed to clear session:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to logout'
    })
  }
})