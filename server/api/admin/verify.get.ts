export default defineEventHandler(async (event) => {
  try {
    // Authentication is handled by middleware - admin user info is in event.context.adminUser
    const adminUser = event.context.adminUser

    if (!adminUser) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Admin user context not found'
      })
    }

    return {
      isAdmin: true,
      user: adminUser
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Admin verification failed:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Admin verification failed'
    })
  }
})