import { verifyAdminSession } from '../../utils/adminAuth'
import { cleanupExpiredVoiceRecordings } from '../../utils/voiceRecordingCleanup'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    // Run cleanup
    const result = await cleanupExpiredVoiceRecordings()
    
    return {
      success: true,
      message: `Cleanup completed: ${result.deletedCount} expired voice recordings deleted`,
      deletedCount: result.deletedCount
    }
    
  } catch (error) {
    console.error('Voice recording cleanup error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to cleanup voice recordings'
    })
  }
})