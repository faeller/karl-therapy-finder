export default defineEventHandler(async (event) => {
  try {
    // Authentication is handled by middleware
    const adminUser = event.context.adminUser
    if (!adminUser) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Admin user context not found'
      })
    }

    const storage = hubKV()
    
    // Remove Patreon configuration
    await storage.removeItem('patreon_campaign_config')

    console.log('🔌 Patreon campaign disconnected by admin:', adminUser.email)

    return {
      success: true,
      message: 'Patreon campaign disconnected'
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Failed to disconnect Patreon:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to disconnect Patreon'
    })
  }
})