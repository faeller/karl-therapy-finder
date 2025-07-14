import { verifyAdminSession } from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const recordingId = getRouterParam(event, 'id')
    
    if (!recordingId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Recording ID is required'
      })
    }
    
    // Delete voice recording from KV
    const kv = hubKV()
    const voiceRecordingKey = `voice_recording:${recordingId}`
    
    // Check if recording exists before deletion
    const recordingData = await kv.getItem(voiceRecordingKey)
    if (!recordingData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Voice recording not found'
      })
    }
    
    // Delete the recording
    await kv.removeItem(voiceRecordingKey)
    
    console.log(`Voice recording deleted: ${recordingId}`)
    
    return {
      success: true,
      message: 'Voice recording deleted successfully'
    }
    
  } catch (error) {
    console.error('Voice recording deletion error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete voice recording'
    })
  }
})